import { useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import CircularProgress from '@mui/material/CircularProgress';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';

function initials(name: string | undefined, email: string | undefined): string {
  if (name) {
    const parts = name.trim().split(' ');
    return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
  }
  return (email?.[0] ?? '?').toUpperCase();
}

export default function AccountPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const currentName = (user?.user_metadata?.full_name as string | undefined) ?? '';
  const email = user?.email ?? '';

  const [name, setName] = useState(currentName);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [signingOut, setSigningOut] = useState(false);
  const [reportCount, setReportCount] = useState(0);
  const [resolvedCount, setResolvedCount] = useState(0);

  useEffect(() => {
    (async () => {
      const { count } = await supabase.from('reports').select('*', { count: 'exact', head: true });
      setReportCount(count ?? 0);
      const { count: resolved } = await supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'resolved');
      setResolvedCount(resolved ?? 0);
    })();
  }, []);

  const handleSave = async () => {
    if (name.trim() === currentName.trim()) return;
    setSaving(true);
    setSaveError('');
    setSaveSuccess(false);
    const { error } = await supabase.auth.updateUser({ data: { full_name: name.trim() } });
    setSaving(false);
    if (error) {
      console.error('profile update failed', error);
      setSaveError('Could not save your changes. Please try again.');
    } else {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
    navigate('/');
  };

  const changed = name.trim() !== currentName.trim();

  return (
    <Box sx={{ bgcolor: 'grey.100', minHeight: '100vh' }}>
      <Navbar />
      <Container maxWidth="sm" sx={{ py: { xs: 3, md: 5 } }}>
        <Typography variant="h3" sx={{ color: 'secondary.main', fontWeight: 700, mb: 0.5, fontSize: { xs: '1.7rem', md: '2.2rem' } }}>My Account</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>Manage your account information.</Typography>

        {/* Stats */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 6 }}>
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
              <Typography variant="h3" sx={{ color: 'secondary.main', fontWeight: 700, fontSize: '2rem' }}>{reportCount}</Typography>
              <Typography variant="body2" color="text.secondary">Reports Submitted</Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 6 }}>
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
              <Typography variant="h3" sx={{ color: 'success.main', fontWeight: 700, fontSize: '2rem' }}>{resolvedCount}</Typography>
              <Typography variant="body2" color="text.secondary">Resolved Reports</Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Avatar + summary */}
        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', mb: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
            <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main', color: 'secondary.main', fontWeight: 700, fontSize: '1.3rem' }}>
              {initials(currentName, email)}
            </Avatar>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'secondary.main' }}>{currentName || email}</Typography>
              {currentName && <Typography variant="body2" color="text.secondary">{email}</Typography>}
            </Box>
          </Stack>

          <Divider sx={{ mb: 3 }} />

          <Typography variant="overline" sx={{ color: 'text.disabled', fontWeight: 700, display: 'block', mb: 2 }}>Profile</Typography>

          <Stack spacing={2.5}>
            <TextField
              label="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              inputProps={{ maxLength: 80 }}
              helperText="This is how you'll be greeted in the app."
            />
            <TextField
              label="Email address"
              value={email}
              fullWidth
              disabled
              helperText="Email address cannot be changed here."
            />
          </Stack>

          {saveError && <Alert severity="error" sx={{ mt: 2 }}>{saveError}</Alert>}
          {saveSuccess && <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mt: 2 }}>Profile updated successfully.</Alert>}

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSave}
              disabled={saving || !changed}
              sx={{ fontWeight: 700 }}
            >
              {saving ? <CircularProgress size={20} sx={{ color: 'secondary.main' }} /> : 'Save Changes'}
            </Button>
          </Box>
        </Paper>

        {/* Account creation */}
        {user?.created_at && (
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', mb: 3 }}>
            <Typography variant="overline" sx={{ color: 'text.disabled', fontWeight: 700, display: 'block', mb: 1 }}>Account</Typography>
            <Typography variant="body2" color="text.secondary">
              Member since {new Date(user.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </Typography>
          </Paper>
        )}

        {/* Quick actions */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
          <Button variant="contained" color="primary" startIcon={<ReportProblemOutlinedIcon />} component={RouterLink} to="/report" fullWidth sx={{ fontWeight: 700 }}>
            Report a New Issue
          </Button>
          <Button variant="outlined" endIcon={<ArrowForwardIcon />} component={RouterLink} to="/reports" fullWidth sx={{ fontWeight: 600 }}>
            View My Reports
          </Button>
        </Stack>

        {/* Sign out */}
        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'error.light' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'secondary.main', mb: 0.5 }}>Sign out</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>You will be returned to the home page.</Typography>
          <Button variant="outlined" color="error" onClick={handleSignOut} disabled={signingOut} sx={{ fontWeight: 600 }}>
            {signingOut ? <CircularProgress size={18} sx={{ color: 'error.main' }} /> : 'Sign Out'}
          </Button>
        </Paper>
      </Container>
    </Box>
  );
}
