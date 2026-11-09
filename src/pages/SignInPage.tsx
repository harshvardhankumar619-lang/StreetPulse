import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import { Link as RouterLink, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function SignInPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname
    ?? searchParams.get('redirect')
    ?? '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message === 'Invalid login credentials'
        ? 'Incorrect email or password. Please try again.'
        : error.message);
      return;
    }
    navigate(from, { replace: true });
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'secondary.main',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        py: 6,
      }}
    >
      <Box component={RouterLink} to="/" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 4, textDecoration: 'none' }}>
        <Box sx={{ width: 36, height: 36, bgcolor: 'primary.main', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <LightbulbOutlinedIcon sx={{ fontSize: 20, color: 'secondary.main' }} />
        </Box>
        <Typography variant="h6" sx={{ color: '#FAFAF7', fontWeight: 700 }}>StreetPulse</Typography>
      </Box>

      <Paper
        elevation={0}
        sx={{ width: '100%', maxWidth: 420, p: { xs: 3, sm: 5 }, borderRadius: 3, border: '1px solid rgba(255,255,255,0.08)', bgcolor: 'rgba(255,255,255,0.04)' }}
      >
        <Typography variant="h4" sx={{ color: '#FAFAF7', mb: 1, fontWeight: 700 }}>Welcome back</Typography>
        <Typography variant="body2" sx={{ color: 'rgba(250,250,247,0.6)', mb: 4 }}>
          Sign in to track your reports and submit new ones.
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            label="Email address"
            type="email"
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            sx={{ mb: 2, ...darkInputStyles }}
          />
          <TextField
            label="Password"
            type="password"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            sx={{ mb: 3, ...darkInputStyles }}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            size="large"
            disabled={loading}
            sx={{ fontWeight: 700, mb: 3 }}
          >
            {loading ? <CircularProgress size={22} sx={{ color: 'secondary.main' }} /> : 'Sign In'}
          </Button>
        </Box>

        <Typography variant="body2" sx={{ color: 'rgba(250,250,247,0.5)', textAlign: 'center' }}>
          Don't have an account?{' '}
          <Typography
            component={RouterLink}
            to="/signup"
            variant="body2"
            sx={{ color: 'primary.main', textDecoration: 'none', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}
          >
            Create one
          </Typography>
        </Typography>
      </Paper>
    </Box>
  );
}

const darkInputStyles = {
  '& .MuiOutlinedInput-root': {
    color: '#FAFAF7',
    '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.4)' },
    '&.Mui-focused fieldset': { borderColor: 'primary.main' },
  },
  '& .MuiInputLabel-root': { color: 'rgba(250,250,247,0.6)' },
  '& .MuiInputLabel-root.Mui-focused': { color: 'primary.main' },
};
