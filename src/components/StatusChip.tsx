import Chip from '@mui/material/Chip';
import { formatStatus, statusBackground, statusText } from '../lib/reportUtils';

export default function StatusChip({ status }: { status: string }) {
  return (
    <Chip
      label={formatStatus(status)}
      size="small"
      sx={{ bgcolor: statusBackground(status), color: statusText(status), fontWeight: 700 }}
    />
  );
}
