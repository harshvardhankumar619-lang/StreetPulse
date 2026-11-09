import { useCallback, useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CloseIcon from '@mui/icons-material/Close';
import ExpandOutlinedIcon from '@mui/icons-material/ExpandOutlined';
import ImageNotSupportedOutlinedIcon from '@mui/icons-material/ImageNotSupportedOutlined';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import RefreshIcon from '@mui/icons-material/Refresh';
import { Link as RouterLink, useParams } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import StatusChip from '../components/StatusChip';
import LocationMap from '../components/LocationMap';
import { fetchReportWithHistory, updateReportStatus } from '../lib/adminApi';
import type { Report, ReportStatus, ReportStatusHistory } from '../lib/types';
import { availableTransitions, formatCategory, formatDate, formatStatus, STATUS_LABELS, statusBackground, statusText } from '../lib/reportUtils';

const REJECTION_REASONS = [
  'Duplicate report',
  'Invalid photographic evidence',
  'Insufficient or incorrect information',
  'Report does not concern a streetlight fault',
];

export default function AdminReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<Report | null>(null);
  const [history, setHistory] = useState<ReportStatusHistory[]>([]);
  const [submitterName, setSubmitterName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [imgError, setImgError] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [actionError, setActionError] = useState('');

  const [pendingAction, setPendingAction] = useState<ReportStatus | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectNote, setRejectNote] = useState('');

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    setImgError(false);
    const res = await fetchReportWithHistory(id);
    if (res.error) setError(res.error);
    setReport(res.report);
    setHistory(res.history);
    setSubmitterName(res.submitterName);
    setLoading(false);
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  const hasLocation = report?.latitude !== null && report?.latitude !== undefined && report?.longitude !== null && report?.longitude !== undefined;

  const transitions = report ? availableTransitions(report.status) : [];

  const confirmAction = (target: ReportStatus) => {
    setActionError('');
    if (target === 'rejected') {
      setRejectReason('');
      setRejectNote('');
    }
    setPendingAction(target);
  };

  const closeDialog = () => {
    setPendingAction(null);
    setRejectReason('');
    setRejectNote('');
    setActionError('');
  };

  const performUpdate = async () => {
    if (!report || !pendingAction) return;
    setUpdating(true);
    setActionError('');

    let note: string | undefined;
    if (pendingAction === 'rejected') {
      const combined = [rejectReason, rejectNote].filter(Boolean).join(' — ').trim();
      if (!combined) {
        setActionError('Please select or enter a rejection reason.');
        setUpdating(false);
        return;
      }
      note = combined;
    } else {
      note = undefined;
    }

    const res = await updateReportStatus(report.id, pendingAction, note);
    if (!res.ok) {
      setActionError(res.error ?? 'Could not update the report status.');
      setUpdating(false);
      return;
    }
    setUpdating(false);
    closeDialog();
    await load();
  };

  if (loading) {
    return (
      <AdminLayout>
        <Skeleton width={120} height={32} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2, mb: 2 }} />
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 7 }}><Skeleton variant="rectangular" height={280} sx={{ borderRadius: 2 }} /></Grid>
          <Grid size={{ xs: 12, md: 5 }}><Skeleton variant="rectangular" height={280} sx={{ borderRadius: 2 }} /></Grid>
        </Grid>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <Alert severity="error" action={<Button color="inherit" size="small" startIcon={<RefreshIcon />} onClick={() => void load()}>Retry</Button>} sx={{ mb: 2 }}>{error}</Alert>
        <Button component={RouterLink} to="/admin/reports" startIcon={<ArrowBackIcon />} sx={{ color: 'text.secondary' }}>All Reports</Button>
      </AdminLayout>
    );
  }

  if (!report) {
    return (
      <AdminLayout>
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography variant="h5" sx={{ color: 'secondary.main', mb: 1 }}>Report not found</Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>This report may have been removed.</Typography>
          <Button variant="contained" component={RouterLink} to="/admin/reports" startIcon={<ArrowBackIcon />}>Back to All Reports</Button>
        </Box>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Button component={RouterLink} to="/admin/reports" startIcon={<ArrowBackIcon />} sx={{ color: 'text.secondary', mb: 2 }}>
        All Reports
      </Button>

      {/* Header */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1.5} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'secondary.main', fontFamily: 'monospace', fontSize: { xs: '1.3rem', md: '1.7rem' } }}>
            {report.reference_number}
          </Typography>
          <Stack direction="row" spacing={1.5} flexWrap="wrap" sx={{ mt: 0.5 }}>
            <Typography variant="body2" color="text.secondary">{formatCategory(report.fault_category)}</Typography>
            <Typography variant="body2" color="text.disabled">·</Typography>
            <Typography variant="body2" color="text.secondary">Submitted {formatDate(report.created_at, true)}</Typography>
          </Stack>
        </Box>
        <StatusChip status={report.status} />
      </Stack>

      <Grid container spacing={3}>
        {/* Left: evidence + map */}
        <Grid size={{ xs: 12, md: 7 }}>
          {/* Photo */}
          <Paper elevation={0} sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider', mb: 3 }}>
            {report.photo_url && !imgError ? (
              <Box sx={{ position: 'relative' }}>
                <Box component="img" src={report.photo_url} alt="Fault photograph" onError={() => setImgError(true)} sx={{ width: '100%', display: 'block', maxHeight: 420, objectFit: 'cover' }} />
                <Box sx={{ position: 'absolute', top: 12, right: 12 }}>
                  <IconButton onClick={() => setLightbox(true)} sx={{ bgcolor: 'rgba(16,28,44,0.7)', color: '#FAFAF7', '&:hover': { bgcolor: 'rgba(16,28,44,0.9)' } }} size="small">
                    <ExpandOutlinedIcon />
                  </IconButton>
                </Box>
              </Box>
            ) : (
              <Box sx={{ height: 220, display: 'grid', placeItems: 'center', color: 'text.disabled', flexDirection: 'column' }}>
                <ImageNotSupportedOutlinedIcon sx={{ fontSize: 44, mb: 1 }} />
                <Typography variant="body2">No photo available</Typography>
              </Box>
            )}
          </Paper>

          {/* Map */}
          {hasLocation ? (
            <Paper elevation={0} sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider', mb: 3 }}>
              <LocationMap lat={report.latitude as number} lng={report.longitude as number} interactive={false} height={300} />
              <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                  {(report.latitude as number).toFixed(6)}, {(report.longitude as number).toFixed(6)}
                </Typography>
                <Button
                  size="small"
                  endIcon={<OpenInNewIcon sx={{ fontSize: '0.85rem' }} />}
                  href={`https://www.openstreetmap.org/?mlat=${report.latitude}&mlon=${report.longitude}#map=18/${report.latitude}/${report.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ color: 'text.secondary', fontSize: '0.75rem' }}
                >
                  Open in external map
                </Button>
              </Box>
            </Paper>
          ) : (
            <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', mb: 3, textAlign: 'center', color: 'text.disabled' }}>
              <Typography variant="body2">No GPS coordinates provided for this report.</Typography>
            </Paper>
          )}

          {/* Description */}
          {report.description && (
            <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="overline" sx={{ color: 'text.disabled', fontWeight: 700 }}>Citizen Description</Typography>
              <Typography variant="body1" sx={{ mt: 1, lineHeight: 1.8 }}>{report.description}</Typography>
            </Paper>
          )}
        </Grid>

        {/* Right: info + status management + history */}
        <Grid size={{ xs: 12, md: 5 }}>
          {/* Status management */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'secondary.main', mb: 1.5 }}>Status Management</Typography>
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2, p: 1.5, borderRadius: 1.5, bgcolor: statusBackground(report.status) }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Current</Typography>
              <StatusChip status={report.status} />
            </Stack>

            {transitions.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No further status changes are available for this report.</Typography>
            ) : (
              <Stack spacing={1}>
                {transitions.map((target) => (
                  <Button
                    key={target}
                    variant="outlined"
                    onClick={() => confirmAction(target)}
                    sx={{
                      justifyContent: 'flex-start',
                      borderColor: 'divider',
                      color: 'secondary.main',
                      fontWeight: 600,
                      '&:hover': { borderColor: target === 'rejected' ? 'error.main' : 'primary.main', bgcolor: target === 'rejected' ? 'rgba(201,67,67,0.04)' : 'rgba(255,181,71,0.06)' },
                    }}
                  >
                    {target === 'rejected' ? <CancelOutlinedIcon sx={{ mr: 1, color: 'error.main' }} /> : <CheckCircleOutlineIcon sx={{ mr: 1, color: statusText(target) }} />}
                    {target === 'under_review' ? 'Mark as Under Review' :
                     target === 'in_progress' ? 'Start Resolution (In Progress)' :
                     target === 'resolved' ? 'Mark as Resolved' :
                     target === 'rejected' ? 'Reject Report' : STATUS_LABELS[target]}
                  </Button>
                ))}
              </Stack>
            )}
          </Paper>

          {/* Report info */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', mb: 3 }}>
            <Typography variant="overline" sx={{ color: 'text.disabled', fontWeight: 700 }}>Report Information</Typography>
            <Stack spacing={1.5} sx={{ mt: 1.5 }}>
              <Row label="Reference" value={report.reference_number} mono />
              <Row label="Category" value={formatCategory(report.fault_category)} />
              <Row label="Created" value={formatDate(report.created_at, true)} />
              <Row label="Last updated" value={formatDate(report.updated_at, true)} />
              <Row label="Current status" value={<StatusChip status={report.status} />} />
            </Stack>
          </Paper>

          {/* Citizen info */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', mb: 3 }}>
            <Typography variant="overline" sx={{ color: 'text.disabled', fontWeight: 700 }}>Citizen Information</Typography>
            <Stack spacing={1.5} sx={{ mt: 1.5 }}>
              <Row label="Submitted by" value={submitterName ?? 'Anonymous'} />
              <Row label="Submitted on" value={formatDate(report.created_at, true)} />
            </Stack>
          </Paper>

          {/* Status history / audit trail */}
          {history.length > 0 && (
            <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="overline" sx={{ color: 'text.disabled', fontWeight: 700 }}>Status History</Typography>
              <Stack spacing={2} sx={{ mt: 2 }}>
                {history.map((entry) => (
                  <Box key={entry.id} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                    <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: statusText(entry.status), mt: 0.7, flexShrink: 0 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatStatus(entry.status)}
                        {entry.previous_status && (
                          <Typography component="span" variant="caption" color="text.disabled" sx={{ ml: 1 }}>
                            from {formatStatus(entry.previous_status)}
                          </Typography>
                        )}
                      </Typography>
                      {entry.note && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                          {entry.note}
                        </Typography>
                      )}
                      <Typography variant="caption" color="text.disabled">{formatDate(entry.created_at, true)}</Typography>
                    </Box>
                  </Box>
                ))}
              </Stack>
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* Lightbox */}
      <Dialog open={lightbox} onClose={() => setLightbox(false)} maxWidth={false} fullWidth PaperProps={{ sx: { maxWidth: '90vw', maxHeight: '90vh', m: 2, borderRadius: 2, overflow: 'hidden' } }}>
        <Box sx={{ position: 'relative', bgcolor: 'secondary.main' }}>
          <IconButton onClick={() => setLightbox(false)} sx={{ position: 'absolute', top: 8, right: 8, color: '#FAFAF7', bgcolor: 'rgba(0,0,0,0.3)', zIndex: 1 }}>
            <CloseIcon />
          </IconButton>
          {report.photo_url && (
            <Box component="img" src={report.photo_url} alt="Fault photograph (full size)" sx={{ width: '100%', maxHeight: '88vh', objectFit: 'contain', display: 'block' }} />
          )}
        </Box>
      </Dialog>

      {/* Confirm action dialog */}
      <Dialog open={pendingAction !== null} onClose={closeDialog} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ fontWeight: 700, color: 'secondary.main' }}>
          {pendingAction === 'rejected' ? 'Reject Report' : 'Confirm Status Change'}
        </DialogTitle>
        <DialogContent>
          {actionError && <Alert severity="error" sx={{ mb: 2 }}>{actionError}</Alert>}
          {pendingAction === 'rejected' ? (
            <>
              <DialogContentText sx={{ mb: 2 }}>
                This report will be marked as <strong>Rejected</strong>. The citizen will see this status. A reason is required.
              </DialogContentText>
              <TextField select fullWidth label="Reason" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} sx={{ mb: 2 }}>
                {REJECTION_REASONS.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
              </TextField>
              <TextField fullWidth multiline rows={2} label="Additional note (optional)" value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} placeholder="Add any further explanation…" />
            </>
          ) : (
            <DialogContentText>
              Change this report's status from <strong>{STATUS_LABELS[report.status]}</strong> to <strong>{pendingAction ? STATUS_LABELS[pendingAction] : ''}</strong>?
            </DialogContentText>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={closeDialog} disabled={updating}>Cancel</Button>
          <Button
            variant="contained"
            color={pendingAction === 'rejected' ? 'error' : 'primary'}
            onClick={performUpdate}
            disabled={updating}
            sx={{ fontWeight: 700 }}
          >
            {updating ? 'Updating…' : pendingAction === 'rejected' ? 'Reject Report' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
}

function Row({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 600, color: 'secondary.main', fontFamily: mono ? 'monospace' : 'inherit', textAlign: 'right' }}>{value}</Typography>
    </Stack>
  );
}
