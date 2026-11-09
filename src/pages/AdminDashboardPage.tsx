import { useCallback, useEffect, useMemo, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { Link as RouterLink } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import StatusChip from '../components/StatusChip';
import { supabase } from '../lib/supabase';
import type { Report } from '../lib/types';
import { fetchStatusCounts, fetchActivitySeries, type ReportStatusCounts } from '../lib/adminApi';
import { formatCategory, formatDate, locationLabel, statusBackground, STATUS_VALUES, STATUS_LABELS } from '../lib/reportUtils';

const STAT_CARDS: { key: keyof ReportStatusCounts; label: string; filter: string; color: string; icon: React.ReactNode }[] = [
  { key: 'total', label: 'Total Reports', filter: 'all', color: '#101C2C', icon: <LightbulbOutlinedIcon /> },
  { key: 'under_review', label: 'Pending Review', filter: 'under_review', color: '#B66A08', icon: <HourglassEmptyIcon /> },
  { key: 'in_progress', label: 'In Progress', filter: 'in_progress', color: '#1565C0', icon: <HourglassEmptyIcon /> },
  { key: 'resolved', label: 'Resolved', filter: 'resolved', color: '#16845B', icon: <CheckCircleOutlineIcon /> },
  { key: 'rejected', label: 'Rejected', filter: 'rejected', color: '#C94343', icon: <CancelOutlinedIcon /> },
];

export default function AdminDashboardPage() {
  const [counts, setCounts] = useState<ReportStatusCounts | null>(null);
  const [activity, setActivity] = useState<{ date: string; count: number }[] | null>(null);
  const [activityError, setActivityError] = useState('');
  const [recent, setRecent] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const [countsRes, activityRes, recentRes] = await Promise.all([
      fetchStatusCounts(),
      fetchActivitySeries(30),
      supabase.from('reports').select('*').order('created_at', { ascending: false }).limit(6),
    ]);
    if (countsRes.error) setError(countsRes.error);
    setCounts(countsRes);
    if ('error' in activityRes) {
      setActivityError(activityRes.error as string);
      setActivity(null);
    } else {
      setActivity(activityRes as { date: string; count: number }[]);
    }
    setRecent((recentRes.data ?? []) as Report[]);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const maxActivity = useMemo(() => {
    if (!activity || activity.length === 0) return 1;
    return Math.max(1, ...activity.map((d) => d.count));
  }, [activity]);

  const totalForDistribution = counts?.total ?? 0;

  return (
    <AdminLayout>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: 'secondary.main', fontSize: { xs: '1.5rem', md: '1.9rem' } }}>
          Overview
        </Typography>
        <Typography variant="body2" color="text.secondary">A live summary of reported streetlight faults across the system.</Typography>
      </Box>

      {error && (
        <Alert severity="error" action={<Button color="inherit" size="small" startIcon={<RefreshIcon />} onClick={() => void load()}>Retry</Button>} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Summary cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {STAT_CARDS.map((card) => {
          const value = counts ? counts[card.key] : null;
          const target = card.filter === 'all' ? '/admin/reports' : `/admin/reports?status=${card.filter}`;
          return (
            <Grid key={card.key} size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
              <Paper
                component={RouterLink}
                to={target}
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  textDecoration: 'none',
                  display: 'block',
                  height: '100%',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  '&:hover': { borderColor: 'primary.main', boxShadow: '0 4px 16px rgba(16,28,44,0.06)' },
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
                  <Box sx={{ width: 34, height: 34, borderRadius: 1.25, display: 'grid', placeItems: 'center', bgcolor: statusBackground(card.filter === 'all' ? 'submitted' : card.filter), color: card.color }}>
                    {card.icon}
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{card.label}</Typography>
                </Stack>
                {loading || value === null ? (
                  <Skeleton variant="text" width={60} height={44} />
                ) : (
                  <Typography variant="h3" sx={{ fontWeight: 700, color: 'secondary.main', fontSize: '2rem', lineHeight: 1.1 }}>{value}</Typography>
                )}
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      <Grid container spacing={3}>
        {/* Status distribution */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'secondary.main', mb: 0.5 }}>Report Status Distribution</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2.5 }}>Proportion of reports by current status.</Typography>
            {loading ? (
              <Stack spacing={1.5}>{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} height={22} sx={{ borderRadius: 1 }} />)}</Stack>
            ) : totalForDistribution === 0 ? (
              <Box sx={{ py: 4, textAlign: 'center', color: 'text.disabled' }}>
                <LightbulbOutlinedIcon sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="body2">No reports yet.</Typography>
              </Box>
            ) : (
              <Stack spacing={1.5}>
                {STATUS_VALUES.map((status) => {
                  const count = (counts as ReportStatusCounts)[status] ?? 0;
                  const pct = totalForDistribution > 0 ? Math.round((count / totalForDistribution) * 100) : 0;
                  return (
                    <Box key={status}>
                      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{STATUS_LABELS[status]}</Typography>
                        <Typography variant="caption" color="text.secondary">{count} · {pct}%</Typography>
                      </Stack>
                      <Box sx={{ height: 8, borderRadius: 1, bgcolor: 'grey.100', overflow: 'hidden' }}>
                        <Box sx={{ height: '100%', width: `${pct}%`, bgcolor: statusBackground(status) === 'rgba(16,28,44,0.08)' ? '#101C2C' : statusBackground(status).replace(/0\.\d+\)$/, '0.6)'), borderRadius: 1, transition: 'width 0.4s' }} />
                      </Box>
                    </Box>
                  );
                })}
              </Stack>
            )}
          </Paper>
        </Grid>

        {/* Reporting activity */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'secondary.main', mb: 0.5 }}>Reporting Activity</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2.5 }}>Reports submitted over the last 30 days.</Typography>
            {activityError ? (
              <Alert severity="warning" sx={{ mb: 1 }}>{activityError}</Alert>
            ) : loading || !activity ? (
              <Skeleton variant="rectangular" height={180} sx={{ borderRadius: 1 }} />
            ) : activity.every((d) => d.count === 0) ? (
              <Box sx={{ py: 4, textAlign: 'center', color: 'text.disabled' }}>
                <Typography variant="body2">No reports submitted in the last 30 days.</Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.5, height: 180, overflowX: 'auto', pb: 1 }}>
                {activity.map((d) => {
                  const h = Math.max(2, (d.count / maxActivity) * 160);
                  return (
                    <Tooltip key={d.date} title={`${formatDate(d.date)}: ${d.count} report${d.count !== 1 ? 's' : ''}`} arrow>
                      <Box sx={{ flex: 1, minWidth: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                        <Box sx={{ width: '100%', height: h, bgcolor: d.count > 0 ? 'primary.main' : 'grey.200', borderRadius: '3px 3px 0 0', minHeight: 2, transition: 'height 0.3s' }} />
                      </Box>
                    </Tooltip>
                  );
                })}
              </Box>
            )}
            {!loading && activity && activity.some((d) => d.count > 0) && (
              <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.disabled">{formatDate(activity[0].date)}</Typography>
                <Typography variant="caption" color="text.disabled">{formatDate(activity[activity.length - 1].date)}</Typography>
              </Stack>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Recent reports */}
      <Box sx={{ mt: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'secondary.main' }}>Recently Submitted Reports</Typography>
          <Button component={RouterLink} to="/admin/reports" endIcon={<ArrowForwardIcon />} size="small" sx={{ color: 'primary.dark' }}>View all</Button>
        </Stack>

        {loading ? (
          <Stack spacing={1.5}>{[1, 2, 3].map((i) => <Skeleton key={i} variant="rectangular" height={72} sx={{ borderRadius: 2 }} />)}</Stack>
        ) : recent.length === 0 ? (
          <Paper elevation={0} sx={{ p: 5, borderRadius: 2, border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
            <LightbulbOutlinedIcon sx={{ fontSize: 44, color: 'text.disabled', mb: 1 }} />
            <Typography variant="subtitle1" sx={{ color: 'secondary.main', mb: 0.5 }}>No reports yet</Typography>
            <Typography variant="body2" color="text.secondary">New citizen reports will appear here.</Typography>
          </Paper>
        ) : (
          <Stack spacing={1.5}>
            {recent.map((report) => (
              <Paper key={report.id} elevation={0} sx={{ p: 1.75, borderRadius: 2, border: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  component={report.photo_url ? 'img' : 'div'}
                  src={report.photo_url ?? undefined}
                  alt=""
                  sx={{
                    width: 52, height: 52, borderRadius: 1.5, objectFit: 'cover', flexShrink: 0,
                    bgcolor: 'grey.100', display: report.photo_url ? 'block' : 'grid', placeItems: report.photo_url ? undefined : 'center',
                    color: 'text.disabled',
                  }}
                >
                  {!report.photo_url && <LightbulbOutlinedIcon fontSize="small" />}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: 'secondary.main' }}>
                    {report.reference_number}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {formatCategory(report.fault_category)} · {locationLabel(report)} · {formatDate(report.created_at)}
                  </Typography>
                </Box>
                <Stack direction="row" alignItems="center" spacing={1} flexShrink={0}>
                  <StatusChip status={report.status} />
                  <IconButton component={RouterLink} to={`/admin/reports/${report.id}`} size="small" sx={{ color: 'primary.dark' }}>
                    <VisibilityOutlinedIcon fontSize="small" />
                  </IconButton>
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}
      </Box>
    </AdminLayout>
  );
}
