import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import CameraAltOutlinedIcon from '@mui/icons-material/CameraAltOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import TrackChangesOutlinedIcon from '@mui/icons-material/TrackChangesOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import Navbar from '../components/Navbar';
import { useAuth } from '../lib/auth';

const STEPS = [
  {
    number: '01',
    icon: <CameraAltOutlinedIcon sx={{ fontSize: 32 }} />,
    title: 'Capture the Problem',
    description: 'Take or upload a photograph of the faulty streetlight. A clear photo helps authorities understand exactly what needs to be fixed.',
  },
  {
    number: '02',
    icon: <LocationOnOutlinedIcon sx={{ fontSize: 32 }} />,
    title: 'Pinpoint the Location',
    description: 'Capture GPS coordinates or select the exact location on a map. You can adjust the pin if the automatic location isn\'t accurate.',
  },
  {
    number: '03',
    icon: <TrackChangesOutlinedIcon sx={{ fontSize: 32 }} />,
    title: 'Track the Report',
    description: 'Receive a unique reference number and follow your report\'s status through to resolution — from submission to fixed.',
  },
];

const FAQS = [
  {
    q: 'Why does the website need my location?',
    a: 'Your location helps authorities find the exact streetlight you are reporting. Without precise coordinates, it is much harder for maintenance teams to identify which light needs attention. You can also place a pin manually on the map if you prefer not to share your GPS location automatically.',
  },
  {
    q: 'Can I report a fault without a photograph?',
    a: 'A photograph is required for each report. It helps authorities assess the type and severity of the fault before sending a maintenance team, making the process more efficient.',
  },
  {
    q: 'How do I track my report after submitting?',
    a: 'After submitting, you will receive a unique reference number. Sign in to your account and visit "My Reports" to see the current status of all your submissions.',
  },
  {
    q: 'What do the different statuses mean?',
    a: '"Submitted" means your report has been received. "Under Review" means it is being assessed. "In Progress" means maintenance work has started. "Resolved" means the fault has been fixed.',
  },
  {
    q: 'What types of faults can I report?',
    a: 'You can report streetlights that are not working, flickering, physically damaged, or remaining on during daylight hours. Use the "Other" category for anything that does not fit these descriptions.',
  },
];

export default function HomePage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [expandedFaq, setExpandedFaq] = useState<string | false>(false);

  const handleReport = () => {
    navigate(session ? '/report' : '/signin?redirect=/report');
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <Navbar />

      {/* Hero */}
      <Box
        sx={{
          position: 'relative',
          minHeight: { xs: '85vh', md: '88vh' },
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
          bgcolor: 'secondary.main',
        }}
      >
        {/* Background image */}
        <Box
          component="img"
          src="/hero-streetlight.webp"
          alt="Streetlight illuminating a road at dusk"
          sx={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            opacity: 0.25,
          }}
        />
        {/* Gradient overlay */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, rgba(16,28,44,0.97) 0%, rgba(16,28,44,0.7) 60%, rgba(16,28,44,0.4) 100%)',
          }}
        />

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, py: { xs: 8, md: 10 } }}>
          <Grid container spacing={4} alignItems="center">
            <Grid size={{ xs: 12, md: 7 }}>
              <Typography
                variant="overline"
                sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: '0.15em', mb: 2, display: 'block' }}
              >
                A better-lit community
              </Typography>
              <Typography
                variant="h1"
                sx={{
                  color: '#FAFAF7',
                  fontSize: { xs: '2.4rem', sm: '3rem', md: '3.8rem' },
                  mb: 3,
                  lineHeight: 1.15,
                }}
              >
                See a faulty streetlight?{' '}
                <Box component="span" sx={{ color: 'primary.main' }}>
                  Help get it noticed.
                </Box>
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: 'rgba(250,250,247,0.75)',
                  fontSize: { xs: '1rem', md: '1.15rem' },
                  mb: 4,
                  maxWidth: 520,
                  lineHeight: 1.7,
                }}
              >
                Report faulty streetlights with a photo and precise location. Help authorities identify problems and track them through to resolution.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  endIcon={<ArrowForwardIcon />}
                  onClick={handleReport}
                  sx={{ fontSize: '1rem', fontWeight: 700 }}
                >
                  Report a Fault
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => scrollTo('how-it-works')}
                  sx={{
                    color: '#FAFAF7',
                    borderColor: 'rgba(250,250,247,0.4)',
                    '&:hover': { borderColor: '#FAFAF7', bgcolor: 'rgba(255,255,255,0.06)' },
                  }}
                >
                  How It Works
                </Button>
              </Stack>
              <Typography
                variant="caption"
                sx={{ color: 'rgba(250,250,247,0.4)', mt: 3, display: 'block' }}
              >
                Photograph · Pin the location · Track the resolution
              </Typography>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* How It Works */}
      <Box id="how-it-works" sx={{ py: { xs: 8, md: 12 }, bgcolor: '#FAFAF7' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 8 } }}>
            <Typography
              variant="overline"
              sx={{ color: 'primary.dark', fontWeight: 700, letterSpacing: '0.15em', mb: 1, display: 'block' }}
            >
              Simple process
            </Typography>
            <Typography variant="h2" sx={{ color: 'secondary.main', mb: 2, fontSize: { xs: '1.8rem', md: '2.5rem' } }}>
              How It Works
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 500, mx: 'auto' }}>
              Three straightforward steps, designed to be done on your phone while standing at the fault.
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {STEPS.map((step, i) => (
              <Grid key={step.number} size={{ xs: 12, md: 4 }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 4,
                    height: '100%',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 3,
                    position: 'relative',
                    transition: 'box-shadow 0.2s, border-color 0.2s',
                    '&:hover': {
                      boxShadow: '0 8px 32px rgba(16,28,44,0.10)',
                      borderColor: 'primary.light',
                    },
                  }}
                >
                  <Typography
                    variant="h4"
                    sx={{ color: 'primary.main', fontWeight: 800, mb: 2, opacity: 0.6 }}
                  >
                    {step.number}
                  </Typography>
                  <Box sx={{ color: 'secondary.main', mb: 2 }}>{step.icon}</Box>
                  <Typography variant="h5" sx={{ color: 'secondary.main', mb: 1.5, fontSize: '1.15rem' }}>
                    {step.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
                    {step.description}
                  </Typography>
                  {i < STEPS.length - 1 && (
                    <Box
                      sx={{
                        display: { xs: 'none', md: 'block' },
                        position: 'absolute',
                        right: -20,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'primary.main',
                        zIndex: 1,
                      }}
                    >
                      <ArrowForwardIcon />
                    </Box>
                  )}
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Why it matters */}
      <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: 'secondary.main' }}>
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography
                variant="overline"
                sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: '0.15em', mb: 1, display: 'block' }}
              >
                Why it matters
              </Typography>
              <Typography variant="h2" sx={{ color: '#FAFAF7', mb: 3, fontSize: { xs: '1.8rem', md: '2.2rem' } }}>
                Accurate reports help authorities act faster
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(250,250,247,0.7)', mb: 3, lineHeight: 1.8 }}>
                A precise photograph and exact GPS location mean maintenance teams can identify the right streetlight without an additional site visit. Reports with clear details are typically assessed and assigned much more quickly than vague descriptions.
              </Typography>
              <Stack spacing={2}>
                {[
                  { icon: <CameraAltOutlinedIcon />, text: 'A photograph shows the type and severity of the fault at a glance.' },
                  { icon: <LocationOnOutlinedIcon />, text: 'GPS coordinates pinpoint the exact light among hundreds on a street.' },
                  { icon: <VerifiedOutlinedIcon />, text: 'Your reference number lets you hold the process accountable.' },
                ].map((item) => (
                  <Box key={item.text} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <Box sx={{ color: 'primary.main', mt: 0.3, flexShrink: 0 }}>{item.icon}</Box>
                    <Typography variant="body2" sx={{ color: 'rgba(250,250,247,0.7)', lineHeight: 1.7 }}>
                      {item.text}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  bgcolor: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 3,
                }}
              >
                <Typography
                  variant="overline"
                  sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: '0.12em', mb: 2, display: 'block' }}
                >
                  How tracking works
                </Typography>
                {[
                  { status: 'Submitted', desc: 'Your report is received and logged with a unique reference number.' },
                  { status: 'Under Review', desc: 'An officer reviews the report and confirms the fault details.' },
                  { status: 'In Progress', desc: 'A maintenance team has been dispatched to address the fault.' },
                  { status: 'Resolved', desc: 'The fault has been repaired and the report is closed.' },
                ].map((item, i) => (
                  <Box key={item.status} sx={{ display: 'flex', gap: 2, mb: i < 3 ? 3 : 0 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          bgcolor: i === 0 ? 'primary.main' : 'rgba(255,255,255,0.3)',
                          mt: 0.5,
                          flexShrink: 0,
                        }}
                      />
                      {i < 3 && <Box sx={{ width: 1, flex: 1, bgcolor: 'rgba(255,255,255,0.1)', my: 0.5 }} />}
                    </Box>
                    <Box sx={{ pb: i < 3 ? 2 : 0 }}>
                      <Typography variant="subtitle2" sx={{ color: '#FAFAF7', mb: 0.3 }}>
                        {item.status}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(250,250,247,0.6)' }}>
                        {item.desc}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* FAQ */}
      <Box id="faq" sx={{ py: { xs: 8, md: 12 }, bgcolor: '#F0F3F6' }}>
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography
              variant="overline"
              sx={{ color: 'primary.dark', fontWeight: 700, letterSpacing: '0.15em', mb: 1, display: 'block' }}
            >
              Got questions?
            </Typography>
            <Typography variant="h2" sx={{ color: 'secondary.main', fontSize: { xs: '1.8rem', md: '2.2rem' } }}>
              Frequently Asked Questions
            </Typography>
          </Box>

          <Stack spacing={1.5}>
            {FAQS.map((faq) => (
              <Accordion
                key={faq.q}
                expanded={expandedFaq === faq.q}
                onChange={(_e, isExpanded) => setExpandedFaq(isExpanded ? faq.q : false)}
                elevation={0}
                sx={{
                  border: '1px solid',
                  borderColor: expandedFaq === faq.q ? 'primary.main' : 'divider',
                  borderRadius: '10px !important',
                  '&:before': { display: 'none' },
                  transition: 'border-color 0.2s',
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{ px: 3, py: 0.5 }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'secondary.main' }}>
                    {faq.q}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 3, pb: 3 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                    {faq.a}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Stack>
        </Container>
      </Box>

      {/* CTA Banner */}
      <Box sx={{ py: { xs: 8, md: 10 }, bgcolor: 'primary.main' }}>
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          <LightbulbOutlinedIcon sx={{ fontSize: 40, color: 'secondary.main', mb: 2, opacity: 0.7 }} />
          <Typography variant="h3" sx={{ color: 'secondary.main', mb: 2, fontSize: { xs: '1.6rem', md: '2rem' } }}>
            Spotted a faulty streetlight?
          </Typography>
          <Typography variant="body1" sx={{ color: 'secondary.light', mb: 4, maxWidth: 480, mx: 'auto' }}>
            It takes less than two minutes to submit a report. Your observation could make a street safer for everyone.
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<ReportProblemOutlinedIcon />}
            onClick={handleReport}
            sx={{
              bgcolor: 'secondary.main',
              color: '#FAFAF7',
              '&:hover': { bgcolor: 'secondary.dark' },
              fontWeight: 700,
              px: 5,
            }}
          >
            Report a Fault Now
          </Button>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ bgcolor: 'secondary.dark', py: 5 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="flex-start">
            <Grid size={{ xs: 12, md: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <Box sx={{ width: 28, height: 28, bgcolor: 'primary.main', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <LightbulbOutlinedIcon sx={{ fontSize: 16, color: 'secondary.main' }} />
                </Box>
                <Typography variant="h6" sx={{ color: '#FAFAF7', fontWeight: 700 }}>StreetPulse</Typography>
              </Box>
              <Typography variant="body2" sx={{ color: 'rgba(250,250,247,0.5)', lineHeight: 1.7, maxWidth: 260 }}>
                A civic-tech platform for reporting and tracking streetlight faults in your community.
              </Typography>
            </Grid>
            <Grid size={{ xs: 6, md: 2 }}>
              <Typography variant="subtitle2" sx={{ color: '#FAFAF7', mb: 1.5, fontWeight: 600 }}>Navigate</Typography>
              <Stack spacing={1}>
                {[{ label: 'Home', to: '/' }, { label: 'How It Works', to: '/#how-it-works' }, { label: 'FAQ', to: '/#faq' }].map((l) => (
                  <Typography key={l.label} component={RouterLink} to={l.to} variant="body2" sx={{ color: 'rgba(250,250,247,0.55)', textDecoration: 'none', '&:hover': { color: 'primary.main' }, transition: 'color 0.2s' }}>
                    {l.label}
                  </Typography>
                ))}
              </Stack>
            </Grid>
            <Grid size={{ xs: 6, md: 2 }}>
              <Typography variant="subtitle2" sx={{ color: '#FAFAF7', mb: 1.5, fontWeight: 600 }}>Account</Typography>
              <Stack spacing={1}>
                {[{ label: 'Sign In', to: '/signin' }, { label: 'Sign Up', to: '/signup' }, { label: 'My Reports', to: '/reports' }].map((l) => (
                  <Typography key={l.label} component={RouterLink} to={l.to} variant="body2" sx={{ color: 'rgba(250,250,247,0.55)', textDecoration: 'none', '&:hover': { color: 'primary.main' }, transition: 'color 0.2s' }}>
                    {l.label}
                  </Typography>
                ))}
              </Stack>
            </Grid>
          </Grid>
          <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', my: 4 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="caption" sx={{ color: 'rgba(250,250,247,0.35)' }}>
              © {new Date().getFullYear()} StreetPulse. All rights reserved.
            </Typography>
            <Stack direction="row" spacing={3}>
              {['Privacy Policy', 'Help'].map((l) => (
                <Typography key={l} variant="caption" sx={{ color: 'rgba(250,250,247,0.35)', cursor: 'pointer', '&:hover': { color: 'primary.main' } }}>
                  {l}
                </Typography>
              ))}
            </Stack>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
