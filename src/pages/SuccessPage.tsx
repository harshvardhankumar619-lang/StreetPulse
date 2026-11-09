import { useEffect, useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Link as RouterLink, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { supabase } from '../lib/supabase';
import type { Report } from '../lib/types';

export default function SuccessPage() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const { data } = await supabase.from('reports').select('*').eq('id', id).maybeSingle();
    setReport(data as Report | null);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleCopy = () => {
    if (report?.reference_number) {
      navigator.clipboard.writeText(report.reference_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <Box sx={{ bgcolor: '#F0F3F6', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CheckCircleIcon sx={{ fontSize: 60, color: 'text.disabled' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: '#F0F3F6', minHeight: '100vh' }}>
      <Navbar />
      <Container maxWidth="sm" sx={{ py: { xs: 4, md: 8 } }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 4, md: 6 },
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            textAlign: 'center',
          }}
        >
          {/* Animated check */}
          <Box
            sx={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              bgcolor: 'rgba(22,132,91,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3,
              animation: 'pop 0.5s ease-out',
              '@keyframes pop': {
                '0%': { transform: 'scale(0)' },
                '60%': { transform: 'scale(1.1)' },
                '100%': { transform: 'scale(1)' },
              },
            }}
          >
            <CheckCircleIcon
              sx={{
                fontSize: 40,
                color: 'success.main',
                animation: 'drawCheck 0.4s ease-out 0.2s both',
                '@keyframes drawCheck': {
                  '0%': { opacity: 0, transform: 'scale(0.5)' },
                  '100%': { opacity: 1, transform: 'scale(1)' },
                },
              }}
            />
          </Box>

          <Typography variant="h3" sx={{ color: 'secondary.main', fontWeight: 700, mb: 1.5, fontSize: { xs: '1.5rem', md: '2rem' } }}>
            Your report has been submitted.
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4 }}>
            Thank you for helping your community. Save your reference number to track this report later.
          </Typography>

          {/* Reference number */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="overline" sx={{ color: 'text.disabled', fontWeight: 700, display: 'block', mb: 1 }}>
              Your reference number
            </Typography>
            <Paper
              elevation={0}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1.5,
                px: 3,
                py: 2,
                bgcolor: 'secondary.main',
                borderRadius: 2,
              }}
            >
              <Typography
                variant="h5"
                sx={{
                  color: '#FAFAF7',
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                }}
              >
                {report?.reference_number ?? '—'}
              </Typography>
              <Button
                size="small"
                onClick={handleCopy}
                startIcon={<ContentCopyIcon />}
                sx={{
                  color: copied ? 'success.main' : 'primary.main',
                  fontWeight: 600,
                  minWidth: 'auto',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
                }}
              >
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </Paper>
          </Box>

          {/* Status */}
          <Stack direction="row" spacing={1} justifyContent="center" alignItems="center" sx={{ mb: 5 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>Current status:</Typography>
            <Chip
              label={report?.status?.replace(/_/g, ' ') ?? 'Submitted'}
              size="small"
              sx={{
                bgcolor: 'rgba(16,28,44,0.08)',
                color: 'secondary.main',
                fontWeight: 600,
                textTransform: 'capitalize',
              }}
            />
          </Stack>

          {/* Actions */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button
              variant="contained"
              color="primary"
              size="large"
              endIcon={<ArrowForwardIcon />}
              component={RouterLink}
              to={`/reports/${report?.id}`}
              sx={{ fontWeight: 700 }}
            >
              View My Report
            </Button>
            <Button
              variant="outlined"
              size="large"
              startIcon={<ReportProblemOutlinedIcon />}
              component={RouterLink}
              to="/report"
              sx={{ fontWeight: 600, borderColor: 'divider', color: 'secondary.main', '&:hover': { borderColor: 'secondary.main' } }}
            >
              Report Another Fault
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
