import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import LogoutIcon from '@mui/icons-material/Logout';
import AdminLayout from '../components/AdminLayout';
import { useAuth } from '../lib/auth';
import { formatDate } from '../lib/reportUtils';

export default function AdminProfilePage() {
  const { user, profile, signOut } = useAuth();

  const rows: { label: string; value: string }[] = [
    { label: 'Name', value: profile?.full_name || 'Not set' },
    { label: 'Email', value: user?.email ?? 'Unknown' },
    { label: 'Role', value: profile?.role === 'admin' ? 'Authority administrator' : 'Citizen' },
    { label: 'Account created', value: user?.created_at ? formatDate(user.created_at) : 'Unknown' },
  ];

  return (
    <AdminLayout>
      <Box sx={{ maxWidth: 640, mx: 'auto' }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, lineHeight: 1.2 }}>
          Your profile
        </Typography>

        <Paper variant="outlined" sx={{ borderRadius: 3, p: { xs: 2, sm: 3 } }}>
          <Stack divider={<Box sx={{ borderTop: '1px solid', borderColor: 'divider' }} />} spacing={2}>
            {rows.map((row) => (
              <Stack key={row.label} direction={{ xs: 'column', sm: 'row' }} spacing={0.5} sx={{ py: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 180 }}>
                  {row.label}
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500, wordBreak: 'break-word' }}>
                  {row.value}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Paper>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 2, lineHeight: 1.5 }}>
          Your role is managed by the system administrators and cannot be changed from this page.
        </Typography>

        <Button
          variant="outlined"
          color="error"
          startIcon={<LogoutIcon />}
          onClick={() => void signOut()}
          sx={{ mt: 3, textTransform: 'none', borderRadius: 2 }}
        >
          Sign out
        </Button>
      </Box>
    </AdminLayout>
  );
}
