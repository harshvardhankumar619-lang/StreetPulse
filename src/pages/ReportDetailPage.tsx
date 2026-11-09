import { useCallback, useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import ImageNotSupportedOutlinedIcon from '@mui/icons-material/ImageNotSupportedOutlined';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Link as RouterLink, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import StatusChip from '../components/StatusChip';
import LocationMap from '../components/LocationMap';
import { supabase } from '../lib/supabase';
import type { Report, ReportStatusHistory } from '../lib/types';
import { formatCategory, formatDate, formatStatus } from '../lib/reportUtils';

const STATUS_FLOW = [
  { key: 'submitted', label: 'Submitted', desc: 'Report received and logged.' },
  { key: 'under_review', label: 'Under Review', desc: 'A team member is reviewing the details.' },
  { key: 'in_progress', label: 'In Progress', desc: 'Maintenance team has been dispatched.' },
  { key: 'resolved', label: 'Resolved', desc: 'The fault has been fixed.' },
];

export default function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<Report | null>(null);
  const [history, setHistory] = useState<ReportStatusHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [imgError, setImgError] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    const [repRes, histRes] = await Promise.all([
      supabase.from('reports').select('*').eq('id', id).maybeSingle(),
      supabase.from('report_status_history').select('*').eq('report_id', id).order('created_at', { ascending: true }),
    ]);
    if (repRes.error) {
      console.error('report detail fetch failed', repRes.error);
      setError('We could not load this report. Please try again.');
    } else {
      setReport(repRes.data as Report | null);
    }
    setHistory((histRes.data ?? []) as ReportStatusHistory[]);
    setLoading(false);
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  const handleCopy = () => {
    if (!report?.reference_number) return;
    navigator.clipboard.writeText(report.reference_number).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const currentStatusIndex = report ? STATUS_FLOW.findIndex((s) => s.key === report.status) : -1;
  const isRejected = report?.status === 'rejected';
  const hasLocation = report?.latitude !== null && report?.latitude !== undefined && report?.longitude !== null && report?.longitude !== undefined;

  if (loading) {
    return (
      <Box sx={{ bgcolor: 'grey.100', minHeight: '100vh' }}>
        <Navbar />
        <Container maxWidth="md" sx={{ py: 5 }}>
          <Skeleton width={140} height={32} sx={{ mb: 3 }} />
          <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2, mb: 2 }} />
          <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
        </Container>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ bgcolor: 'grey.100', minHeight: '100vh' }}>
        <Navbar />
        <Container maxWidth="md" sx={{ py: 5 }}>
          <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => void load()}>Retry</Button>} sx={{ mb: 3 }}>{error}</Alert>
          <Button component={RouterLink} to="/reports" startIcon={<ArrowBackIcon />} sx={{ color: 'text.secondary' }}>My Reports</Button>
        </Container>
      </Box>
    );
  }

  if (!report) {
    return (
      <Box sx={{ bgcolor: 'grey.100', minHeight: '100vh' }}>
        <Navbar />
        <Container maxWidth="md" sx={{ py: 5, textAlign: 'center' }}>
          <Typography variant="h5" sx={{ color: 'secondary.main', mb: 2 }}>Report not found</Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>This report may have been removed or you may not have access to it.</Typography>
          <Button variant="contained" component={RouterLink} to="/reports" startIcon={<ArrowBackIcon />}>Back to My Reports</Button>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: 'grey.100', minHeight: '100vh' }}>
      <Navbar />
      <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
        {/* Back */}
        <Button component={RouterLink} to="/reports" startIcon={<ArrowBackIcon />} sx={{ color: 'text.secondary', mb: 3 }}>
          My Reports
        </Button>

        {/* Header */}
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1.5} sx={{ mb: 4 }}>
          <Box>
            <Typography variant="h4" sx={{ color: 'secondary.main', fontWeight: 700, textTransform: 'capitalize', mb: 0.5 }}>
              {formatCategory(report.fault_category)}
            </Typography>
            <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
              <Typography variant="body2" sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>
                Ref: {report.reference_number}
              </Typography>
              <Tooltip title={copied ? 'Copied!' : 'Copy reference number'} arrow>
                <Button size="small" startIcon={<ContentCopyIcon sx={{ fontSize: '0.9rem' }} />} onClick={handleCopy} sx={{ color: copied ? 'success.main' : 'primary.dark', minWidth: 0, px: 1, py: 0 }}>
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </Tooltip>
            </Stack>
          </Box>
          <StatusChip status={report.status} />
        </Stack>

        <Grid container spacing={3}>
          {/* Left column */}
          <Grid size={{ xs: 12, md: 5 }}>
            {/* Photo */}
            <Paper elevation={0} sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider', mb: 3 }}>
              {report.photo_url && !imgError ? (
                <>
                  <Box component="img" src={report.photo_url} alt="Fault photograph" onError={() => setImgError(true)} sx={{ width: '100%', display: 'block', maxHeight: 320, objectFit: 'cover' }} />
                  <Box sx={{ px: 2, py: 1, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button size="small" endIcon={<OpenInNewIcon sx={{ fontSize: '0.85rem' }} />} href={report.photo_url} target="_blank" rel="noopener noreferrer" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                      View full size
                    </Button>
                  </Box>
                </>
              ) : (
                <Box sx={{ height: 200, display: 'grid', placeItems: 'center', color: 'text.disabled', flexDirection: 'column' }}>
                  <ImageNotSupportedOutlinedIcon sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="body2">No photo available</Typography>
                </Box>
              )}
            </Paper>

            {/* Info */}
            <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', mb: { xs: 3, md: 0 } }}>
              {report.location_description && (
                <>
                  <Typography variant="overline" sx={{ color: 'text.disabled', fontWeight: 700, display: 'block', mb: 0.5 }}>Location</Typography>
                  <Typography variant="body2" sx={{ color: 'text.primary', mb: 2 }}>{report.location_description}</Typography>
                </>
              )}
              {hasLocation && (
                <>
                  <Typography variant="overline" sx={{ color: 'text.disabled', fontWeight: 700, display: 'block', mb: 0.5 }}>Coordinates</Typography>
                  <Typography variant="body2" sx={{ color: 'text.primary', fontFamily: 'monospace', mb: 2 }}>
                    {(report.latitude as number).toFixed(6)}, {(report.longitude as number).toFixed(6)}
                  </Typography>
                </>
              )}
              <Typography variant="overline" sx={{ color: 'text.disabled', fontWeight: 700, display: 'block', mb: 0.5 }}>Submitted</Typography>
              <Typography variant="body2" color="text.primary">
                {formatDate(report.created_at, true)}
              </Typography>
              {report.updated_at !== report.created_at && (
                <>
                  <Typography variant="overline" sx={{ color: 'text.disabled', fontWeight: 700, display: 'block', mt: 2, mb: 0.5 }}>Last updated</Typography>
                  <Typography variant="body2" color="text.primary">{formatDate(report.updated_at, true)}</Typography>
                </>
              )}
            </Paper>
          </Grid>

          {/* Right column */}
          <Grid size={{ xs: 12, md: 7 }}>
            {/* Map preview */}
            {hasLocation && (
              <Paper elevation={0} sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider', mb: 3 }}>
                <LocationMap lat={report.latitude as number} lng={report.longitude as number} interactive={false} height={220} />
              </Paper>
            )}

            {/* Description */}
            {report.description && (
              <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', mb: 3 }}>
                <Typography variant="overline" sx={{ color: 'text.disabled', fontWeight: 700 }}>Description</Typography>
                <Typography variant="body1" sx={{ mt: 1, lineHeight: 1.8 }}>{report.description}</Typography>
              </Paper>
            )}

            {/* Timeline */}
            <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', mb: history.length > 0 ? 3 : 0 }}>
              <Typography variant="overline" sx={{ color: 'text.disabled', fontWeight: 700, mb: 2.5, display: 'block' }}>Report Progress</Typography>

              {isRejected ? (
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                  <CancelOutlinedIcon sx={{ color: 'error.main', fontSize: 26 }} />
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: 'error.main', fontWeight: 700 }}>Report Rejected</Typography>
                    <Typography variant="body2" color="text.secondary">This report could not be processed. Contact support if you believe this is an error.</Typography>
                  </Box>
                </Box>
              ) : (
                <Stack spacing={0}>
                  {STATUS_FLOW.map((step, index) => {
                    const reached = index <= currentStatusIndex;
                    const isCurrent = index === currentStatusIndex;
                    const isLast = index === STATUS_FLOW.length - 1;
                    return (
                      <Box key={step.key} sx={{ display: 'flex', gap: 2 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          {reached ? (
                            isCurrent ? <CheckCircleIcon sx={{ color: 'primary.main', fontSize: 24 }} /> : <CheckCircleOutlinedIcon sx={{ color: 'success.main', fontSize: 24 }} />
                          ) : (
                            <RadioButtonUncheckedIcon sx={{ color: 'text.disabled', fontSize: 24 }} />
                          )}
                          {!isLast && <Box sx={{ width: 2, flex: 1, bgcolor: reached ? 'success.main' : 'divider', my: 0.5, minHeight: 28 }} />}
                        </Box>
                        <Box sx={{ pb: isLast ? 0 : 2 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: reached ? 'secondary.main' : 'text.disabled' }}>{step.label}</Typography>
                          <Typography variant="body2" color="text.secondary">{step.desc}</Typography>
                        </Box>
                      </Box>
                    );
                  })}
                </Stack>
              )}
            </Paper>

            {/* Status history */}
            {history.length > 0 && (
              <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="overline" sx={{ color: 'text.disabled', fontWeight: 700, mb: 2, display: 'block' }}>Update History</Typography>
                <Stack spacing={2}>
                  {history.map((entry) => (
                    <Box key={entry.id} sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main', mt: 0.7, flexShrink: 0 }} />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
                          {formatStatus(entry.status)}{entry.note ? ` — ${entry.note}` : ''}
                        </Typography>
                        <Typography variant="caption" color="text.disabled">{formatDate(entry.created_at, true)}</Typography>
                      </Box>
                    </Box>
                  ))}
                </Stack>
              </Paper>
            )}
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
