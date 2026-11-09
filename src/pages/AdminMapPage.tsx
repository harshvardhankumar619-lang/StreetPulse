import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import ExpandIcon from '@mui/icons-material/Expand';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import { Link as RouterLink } from 'react-router-dom';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AdminLayout from '../components/AdminLayout';
import { fetchAllReportsForMap } from '../lib/adminApi';
import type { Report, ReportStatus } from '../lib/types';
import { formatCategory, formatDate, STATUS_VALUES, STATUS_LABELS, statusText } from '../lib/reportUtils';

const STATUS_COLORS: Record<ReportStatus, string> = {
  submitted: '#101C2C',
  under_review: '#FFB547',
  in_progress: '#1565C0',
  resolved: '#16845B',
  rejected: '#C94343',
};

const FILTERS: { value: ReportStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  ...STATUS_VALUES.map((s) => ({ value: s, label: STATUS_LABELS[s] })),
];

function statusIcon(color: string): L.DivIcon {
  return L.divIcon({
    className: 'streetpulse-marker',
    html: `<span style="display:block;width:16px;height:16px;border-radius:50%;background:${color};border:3px solid #FFFFFF;box-shadow:0 1px 4px rgba(0,0,0,0.35)"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

export default function AdminMapPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<ReportStatus | 'all'>('all');
  const [popup, setPopup] = useState<Report | null>(null);

  const filtered = useMemo(() => {
    if (filter === 'all') return reports;
    return reports.filter((r) => r.status === filter);
  }, [reports, filter]);

  // Load data
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError('');
      const res = await fetchAllReportsForMap();
      if (!mounted) return;
      if (res.error) setError(res.error);
      setReports(res.reports);
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { center: [20, 0], zoom: 2, zoomControl: true });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; layerRef.current = null; };
  }, []);

  // Update markers when filtered data changes
  useEffect(() => {
    if (!mapRef.current || !layerRef.current) return;
    layerRef.current.clearLayers();
    const bounds: L.LatLngExpression[] = [];
    for (const report of filtered) {
      if (report.latitude === null || report.longitude === null) continue;
      const lat = report.latitude as number;
      const lng = report.longitude as number;
      const marker = L.marker([lat, lng], { icon: statusIcon(STATUS_COLORS[report.status as ReportStatus]) });
      marker.on('click', () => setPopup(report));
      marker.addTo(layerRef.current);
      bounds.push([lat, lng]);
    }
    if (bounds.length > 0) {
      mapRef.current.fitBounds(L.latLngBounds(bounds).pad(0.15), { maxZoom: 16 });
    }
  }, [filtered]);

  const fitAll = () => {
    if (!mapRef.current || filtered.length === 0) return;
    const bounds = filtered
      .filter((r) => r.latitude !== null && r.longitude !== null)
      .map((r) => [r.latitude as number, r.longitude as number] as L.LatLngExpression);
    if (bounds.length > 0) mapRef.current.fitBounds(L.latLngBounds(bounds).pad(0.15), { maxZoom: 16 });
  };

  return (
    <AdminLayout>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'secondary.main', fontSize: { xs: '1.5rem', md: '1.9rem' } }}>Map View</Typography>
          <Typography variant="body2" color="text.secondary">All reported streetlight faults with valid GPS coordinates.</Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <IconButton onClick={fitAll} disabled={loading || filtered.length === 0} size="small" sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
            <ExpandIcon fontSize="small" />
          </IconButton>
          <Button onClick={fitAll} disabled={loading || filtered.length === 0} size="small" variant="outlined" sx={{ borderColor: 'divider', color: 'secondary.main' }}>Fit all</Button>
        </Stack>
      </Stack>

      {/* Filters */}
      <ToggleButtonGroup
        value={filter}
        exclusive
        size="small"
        onChange={(_, v: ReportStatus | 'all' | null) => v && setFilter(v)}
        sx={{ mb: 2, flexWrap: 'wrap', gap: 0.5 }}
      >
        {FILTERS.map((f) => (
          <ToggleButton key={f.value} value={f.value} sx={{ px: 1.5, py: 0.5, fontSize: '0.8rem', borderRadius: '8px !important', border: '1px solid rgba(0,0,0,0.12) !important', color: f.value === 'all' ? 'secondary.main' : statusText(f.value), fontWeight: 600 }}>
            {f.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      {error && (
        <Alert severity="error" action={<Button color="inherit" size="small" startIcon={<RefreshIcon />} onClick={() => window.location.reload()}>Retry</Button>} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '3fr 1fr' }, gap: 2, alignItems: 'flex-start' }}>
        {/* Map */}
        <Box sx={{ position: 'relative' }}>
          {loading && <Skeleton variant="rectangular" height={540} sx={{ borderRadius: 2, position: 'absolute', inset: 0, zIndex: 0 }} />}
          <Box
            ref={containerRef}
            sx={{
              width: '100%',
              height: { xs: 360, md: 540 },
              borderRadius: 2,
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'divider',
              '& .leaflet-container': { height: '100%', width: '100%' },
              opacity: loading ? 0 : 1,
              transition: 'opacity 0.2s',
            }}
          />
          {/* Legend */}
          <Paper elevation={0} sx={{ position: 'absolute', bottom: 12, left: 12, p: 1.5, borderRadius: 1.5, bgcolor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(4px)', border: '1px solid', borderColor: 'divider', zIndex: 400 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'secondary.main', display: 'block', mb: 0.75 }}>Legend</Typography>
            <Stack spacing={0.5}>
              {STATUS_VALUES.map((s) => (
                <Stack key={s} direction="row" alignItems="center" spacing={1}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: STATUS_COLORS[s], border: '2px solid #fff', boxShadow: '0 0 0 1px rgba(0,0,0,0.2)' }} />
                  <Typography variant="caption" color="text.secondary">{STATUS_LABELS[s]}</Typography>
                </Stack>
              ))}
            </Stack>
          </Paper>
        </Box>

        {/* Side panel / popup details */}
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', minHeight: 200 }}>
          {popup ? (
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, fontFamily: 'monospace', color: 'secondary.main' }}>{popup.reference_number}</Typography>
                <IconButton size="small" onClick={() => setPopup(null)} aria-label="Close details"><CloseIcon fontSize="small" /></IconButton>
              </Stack>
              <Box
                component={popup.photo_url ? 'img' : 'div'}
                src={popup.photo_url ?? undefined}
                alt=""
                sx={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 1.5, mb: 1.5, bgcolor: 'grey.100', display: popup.photo_url ? 'block' : 'grid', placeItems: popup.photo_url ? undefined : 'center', color: 'text.disabled' }}
              >
                {!popup.photo_url && <LightbulbOutlinedIcon />}
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'secondary.main' }}>{formatCategory(popup.fault_category)}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                {popup.location_description ?? 'No description'} · {formatDate(popup.created_at)}
              </Typography>
              {popup.description && (
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                  {popup.description}
                </Typography>
              )}
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1 }}>
                <Chip label={STATUS_LABELS[popup.status as ReportStatus]} size="small" sx={{ bgcolor: STATUS_COLORS[popup.status as ReportStatus] + '22', color: statusText(popup.status as ReportStatus), fontWeight: 700 }} />
                <Button component={RouterLink} to={`/admin/reports/${popup.id}`} size="small" endIcon={<ArrowForwardIcon fontSize="small" />} sx={{ color: 'primary.dark' }}>View Details</Button>
              </Stack>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4, color: 'text.disabled' }}>
              <LightbulbOutlinedIcon sx={{ fontSize: 36, mb: 1 }} />
              <Typography variant="body2" color="text.secondary">Select a marker on the map to view report details.</Typography>
              <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 1 }}>
                {loading ? 'Loading…' : `${filtered.length} report${filtered.length !== 1 ? 's' : ''} shown`}
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>

      {!loading && reports.length === 0 && !error && (
        <Paper elevation={0} sx={{ p: 4, borderRadius: 2, border: '1px solid', borderColor: 'divider', textAlign: 'center', mt: 2 }}>
          <LightbulbOutlinedIcon sx={{ fontSize: 44, color: 'text.disabled', mb: 1 }} />
          <Typography variant="subtitle1" color="secondary.main">No reports with coordinates</Typography>
          <Typography variant="body2" color="text.secondary">Reports without GPS coordinates remain visible in the All Reports table but do not appear on the map.</Typography>
        </Paper>
      )}
    </AdminLayout>
  );
}
