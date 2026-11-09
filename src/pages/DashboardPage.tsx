import { useCallback, useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import { Link as RouterLink } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ReportCard from '../components/ReportCard';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import type { Report } from '../lib/types';

export default function DashboardPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const { data, error: requestError } = await supabase.from('reports').select('*').order('created_at', { ascending: false });
    if (requestError) {
      console.error('dashboard reports request failed', requestError);
      setError('We could not load your reports. Please try again.');
      setReports([]);
    } else {
      setReports((data ?? []) as Report[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const counts = useMemo(() => ({
    total: reports.length,
    underReview: reports.filter((report) => report.status === 'under_review').length,
    inProgress: reports.filter((report) => report.status === 'in_progress').length,
    resolved: reports.filter((report) => report.status === 'resolved').length,
  }), [reports]);

  const userName = (user?.user_metadata?.full_name as string | undefined) ?? user?.email?.split('@')[0] ?? 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const stats = [
    { label: 'Total Reports', value: counts.total, filter: 'all' },
    { label: 'Under Review', value: counts.underReview, filter: 'under_review' },
    { label: 'In Progress', value: counts.inProgress, filter: 'in_progress' },
    { label: 'Resolved', value: counts.resolved, filter: 'resolved' },
  ];

  return (
    <Box sx={{ bgcolor: 'grey.100', minHeight: '100vh' }}>
      <Navbar />
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'flex-start' }} spacing={2} sx={{ mb: 4 }}>
          <Box>
            <Typography variant="h3" sx={{ color: 'secondary.main', fontWeight: 700, mb: 0.5, fontSize: { xs: '1.7rem', md: '2.2rem' } }}>
              {greeting}, {userName}
            </Typography>
            <Typography variant="body1" color="text.secondary">Here&apos;s an overview of your streetlight reports.</Typography>
          </Box>
          <Button variant="contained" color="primary" size="large" startIcon={<ReportProblemOutlinedIcon />} component={RouterLink} to="/report" sx={{ fontWeight: 700, alignSelf: { xs: 'stretch', sm: 'auto' } }}>
            Report a Fault
          </Button>
        </Stack>

        <Grid container spacing={2} sx={{ mb: 4 }}>
          {stats.map((stat) => (
            <Grid key={stat.label} size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper component={RouterLink} to={`/reports?status=${stat.filter}`} elevation={0} sx={{ display: 'block', p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', textDecoration: 'none', '&:hover': { borderColor: 'primary.main', boxShadow: 2 } }}>
                {loading ? <Skeleton variant="text" width={70} height={48} /> : <Typography variant="h2" sx={{ color: 'secondary.main', fontWeight: 700, fontSize: '2.5rem' }}>{stat.value}</Typography>}
                <Typography variant="body2" color="text.secondary">{stat.label}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {error && <Alert severity="error" action={<Button color="inherit" size="small" startIcon={<RefreshIcon />} onClick={() => void load()}>Retry</Button>} sx={{ mb: 3 }}>{error}</Alert>}

        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h5" sx={{ color: 'secondary.main', fontWeight: 700 }}>Recent Reports</Typography>
          {reports.length > 0 && <Button component={RouterLink} to="/reports" endIcon={<ArrowForwardIcon />} sx={{ color: 'primary.dark' }}>View all</Button>}
        </Stack>

        {loading ? <Stack spacing={2}>{[1, 2, 3].map((item) => <Skeleton key={item} variant="rectangular" height={112} sx={{ borderRadius: 2 }} />)}</Stack> : reports.length === 0 && !error ? (
          <Paper elevation={0} sx={{ p: { xs: 4, md: 6 }, borderRadius: 3, border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
            <LightbulbOutlinedIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h5" sx={{ color: 'secondary.main', mb: 1 }}>Your first report starts here</Typography>
            <Typography color="text.secondary" sx={{ mb: 3, maxWidth: 430, mx: 'auto' }}>Help your community stay safer at night by reporting a faulty streetlight.</Typography>
            <Button variant="contained" startIcon={<ReportProblemOutlinedIcon />} component={RouterLink} to="/report">Report a Fault</Button>
          </Paper>
        ) : <Stack spacing={2}>{reports.slice(0, 5).map((report) => <ReportCard key={report.id} report={report} />)}</Stack>}
      </Container>
    </Box>
  );
}
