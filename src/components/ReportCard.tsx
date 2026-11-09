import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ImageNotSupportedOutlinedIcon from '@mui/icons-material/ImageNotSupportedOutlined';
import { Link as RouterLink } from 'react-router-dom';
import type { Report } from '../lib/types';
import { formatCategory, formatDate, locationLabel } from '../lib/reportUtils';
import StatusChip from './StatusChip';

export default function ReportCard({ report }: { report: Report }) {
  return (
    <Paper
      elevation={0}
      sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 2, border: '1px solid', borderColor: 'divider', display: 'flex', gap: 2, alignItems: 'center' }}
    >
      {report.photo_url ? (
        <Box component="img" src={report.photo_url} alt="" sx={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 1.5, flexShrink: 0 }} />
      ) : (
        <Box sx={{ width: 72, height: 72, borderRadius: 1.5, bgcolor: 'grey.100', color: 'text.disabled', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          <ImageNotSupportedOutlinedIcon />
        </Box>
      )}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'secondary.main', textTransform: 'capitalize', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {formatCategory(report.fault_category)}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {locationLabel(report)}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
          {report.reference_number} · Submitted {formatDate(report.created_at)}
        </Typography>
      </Box>
      <Stack alignItems={{ xs: 'flex-end', sm: 'center' }} spacing={0.75} flexShrink={0}>
        <StatusChip status={report.status} />
        <Button component={RouterLink} to={`/reports/${report.id}`} size="small" endIcon={<ArrowForwardIcon />} sx={{ color: 'primary.dark', minWidth: 0, px: 0 }}>
          <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>View Details</Box>
          <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>View</Box>
        </Button>
      </Stack>
    </Paper>
  );
}
