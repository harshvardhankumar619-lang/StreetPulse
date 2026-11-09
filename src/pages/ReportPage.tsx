import React, { useState, useRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CameraAltOutlinedIcon from '@mui/icons-material/CameraAltOutlined';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import LocationMap from '../components/LocationMap';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';

const STEPS = ['Photograph', 'Location', 'Details & Submit'];

const FAULT_CATEGORIES = [
  'Streetlight not working',
  'Flickering light',
  'Damaged streetlight',
  'Light on during daylight',
  'Other',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
const MAX_DESC = 500;

interface FormData {
  photo: File | null;
  photoPreview: string;
  lat: number | null;
  lng: number | null;
  locationDescription: string;
  faultCategory: string;
  description: string;
  confirmed: boolean;
}

export default function ReportPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [activeStep, setActiveStep] = useState(0);
  const [form, setForm] = useState<FormData>({
    photo: null,
    photoPreview: '',
    lat: null,
    lng: null,
    locationDescription: '',
    faultCategory: '',
    description: '',
    confirmed: false,
  });
  const [photoError, setPhotoError] = useState('');
  const [locationError, setLocationError] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // ─── Photo handlers ───────────────────────────────────────────────
  const validateAndSetPhoto = (file: File) => {
    setPhotoError('');
    if (!ALLOWED_TYPES.includes(file.type)) {
      setPhotoError('Please upload a JPEG, PNG, or WebP image.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setPhotoError('File is too large. Maximum size is 10 MB.');
      return;
    }
    const url = URL.createObjectURL(file);
    setForm((f) => ({ ...f, photo: file, photoPreview: url }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndSetPhoto(file);
  };

  const removePhoto = () => {
    if (form.photoPreview) URL.revokeObjectURL(form.photoPreview);
    setForm((f) => ({ ...f, photo: null, photoPreview: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  // ─── Location handlers ────────────────────────────────────────────
  const requestGps = () => {
    setLocationError('');
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({ ...f, lat: pos.coords.latitude, lng: pos.coords.longitude }));
        setGpsLoading(false);
      },
      (err) => {
        setGpsLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationError('Location permission was denied. Please select the location manually on the map below.');
        } else {
          setLocationError('Could not retrieve your location. You can select it manually on the map below.');
        }
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  };

  const handleMapClick = (lat: number, lng: number) => {
    setLocationError('');
    setForm((f) => ({ ...f, lat, lng }));
  };

  // ─── Step navigation ──────────────────────────────────────────────
  const canProceedStep1 = !!form.photo && !photoError;
  const canProceedStep2 = form.lat !== null && form.lng !== null;

  const handleNext = () => {
    if (activeStep === 0 && !canProceedStep1) {
      setPhotoError('Please add a photograph before continuing.');
      return;
    }
    if (activeStep === 1 && !canProceedStep2) {
      setLocationError('Please capture or select a location before continuing.');
      return;
    }
    setActiveStep((s) => s + 1);
  };

  const handleBack = () => setActiveStep((s) => Math.max(0, s - 1));

  // ─── Submit ───────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!form.photo || !form.lat || !form.lng || !user) return;
    setSubmitError('');
    setSubmitting(true);

    try {
      // Upload photo
      const ext = form.photo.name.split('.').pop() ?? 'jpg';
      const filePath = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from('report-photos')
        .upload(filePath, form.photo, { upsert: false });

      if (uploadErr) throw new Error(`Photo upload failed: ${uploadErr.message}`);

      const { data: urlData } = supabase.storage.from('report-photos').getPublicUrl(filePath);
      const photoUrl = urlData.publicUrl;

      const { data: report, error: insertErr } = await supabase
        .from('reports')
        .insert({
          photo_url: photoUrl,
          latitude: form.lat,
          longitude: form.lng,
          location_description: form.locationDescription || null,
          fault_category: form.faultCategory || 'Other',
          description: form.description || null,
          status: 'submitted',
        })
        .select('id')
        .single();

      if (insertErr) throw new Error(`Failed to save report: ${insertErr.message}`);
      if (!report) throw new Error('Report was not saved. Please try again.');

      // Insert initial status history
      await supabase.from('report_status_history').insert({
        report_id: report.id,
        status: 'submitted',
        note: 'Report received',
      });

      navigate(`/success/${report.id}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F0F3F6', pb: 8 }}>
      {/* Top bar */}
      <Box sx={{ bgcolor: 'secondary.main', py: 2, px: { xs: 2, md: 4 } }}>
        <Container maxWidth="md" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Button
            component={RouterLink}
            to="/"
            startIcon={<ArrowBackIcon />}
            sx={{ color: 'rgba(250,250,247,0.7)', '&:hover': { color: '#FAFAF7' } }}
          >
            Back to Home
          </Button>
          <Typography variant="body2" sx={{ color: 'rgba(250,250,247,0.5)' }}>
            Step {activeStep + 1} of {STEPS.length}
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="md" sx={{ pt: 5 }}>
        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 5 }}>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel
                sx={{
                  '& .MuiStepLabel-label': { fontWeight: 600 },
                  '& .MuiStepIcon-root.Mui-active': { color: 'primary.main' },
                  '& .MuiStepIcon-root.Mui-completed': { color: 'success.main' },
                }}
              >
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* ── Step 1: Photo ── */}
        {activeStep === 0 && (
          <Paper elevation={0} sx={{ p: { xs: 3, md: 5 }, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h4" sx={{ color: 'secondary.main', mb: 1, fontWeight: 700 }}>
              Let's identify the problem.
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4 }}>
              A photograph helps authorities understand what needs attention.
            </Typography>

            {!form.photo ? (
              <Box
                sx={{
                  border: '2px dashed',
                  borderColor: photoError ? 'error.main' : 'divider',
                  borderRadius: 3,
                  p: { xs: 4, md: 6 },
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s, background 0.2s',
                  bgcolor: 'background.default',
                  '&:hover': { borderColor: 'primary.main', bgcolor: 'rgba(255,181,71,0.04)' },
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <CameraAltOutlinedIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>
                  Add a streetlight photo
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.disabled', mb: 3 }}>
                  JPEG, PNG or WebP · Up to 10 MB
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<CameraAltOutlinedIcon />}
                    onClick={(e) => { e.stopPropagation(); cameraInputRef.current?.click(); }}
                  >
                    Take Photo
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<FileUploadOutlinedIcon />}
                    onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  >
                    Upload Image
                  </Button>
                </Stack>
              </Box>
            ) : (
              <Box sx={{ position: 'relative' }}>
                <Box
                  component="img"
                  src={form.photoPreview}
                  alt="Selected fault photo"
                  sx={{ width: '100%', maxHeight: 400, objectFit: 'cover', borderRadius: 2, display: 'block' }}
                />
                <Box sx={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<FileUploadOutlinedIcon />}
                    onClick={() => fileInputRef.current?.click()}
                    sx={{ bgcolor: 'rgba(16,28,44,0.85)', color: '#FAFAF7', '&:hover': { bgcolor: 'secondary.main' } }}
                  >
                    Replace
                  </Button>
                  <IconButton
                    onClick={removePhoto}
                    sx={{ bgcolor: 'rgba(201,67,67,0.85)', color: '#FAFAF7', '&:hover': { bgcolor: 'error.main' } }}
                    size="small"
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Box>
                <Chip
                  icon={<CheckCircleOutlinedIcon />}
                  label="Photo added"
                  color="success"
                  size="small"
                  sx={{ mt: 1.5 }}
                />
              </Box>
            )}

            {/* Hidden inputs */}
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleFileChange} />

            {photoError && <Alert severity="error" sx={{ mt: 2 }}>{photoError}</Alert>}

            <Typography variant="caption" sx={{ color: 'text.disabled', mt: 3, display: 'block' }}>
              Examples: streetlight not working, damaged fixture, or another visible lighting fault.
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                endIcon={<ArrowForwardIcon />}
                onClick={handleNext}
                sx={{ fontWeight: 700 }}
              >
                Continue
              </Button>
            </Box>
          </Paper>
        )}

        {/* ── Step 2: Location ── */}
        {activeStep === 1 && (
          <Paper elevation={0} sx={{ p: { xs: 3, md: 5 }, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h4" sx={{ color: 'secondary.main', mb: 1, fontWeight: 700 }}>
              Where is the faulty streetlight?
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4 }}>
              Use your GPS location or select a point on the map. You can adjust the pin by clicking or dragging it.
            </Typography>

            <Button
              variant="contained"
              color="primary"
              size="large"
              startIcon={gpsLoading ? <CircularProgress size={18} sx={{ color: 'secondary.main' }} /> : <MyLocationIcon />}
              onClick={requestGps}
              disabled={gpsLoading}
              sx={{ mb: 3, fontWeight: 700 }}
              fullWidth
            >
              {gpsLoading ? 'Capturing location…' : 'Use My Current Location'}
            </Button>

            {locationError && <Alert severity="warning" sx={{ mb: 2 }}>{locationError}</Alert>}

            {/* Map — show default view if no location yet */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', mb: 1, display: 'block' }}>
                {form.lat && form.lng
                  ? 'Click anywhere on the map or drag the pin to adjust the location.'
                  : 'Click on the map to set a location manually.'}
              </Typography>
              <LocationMap
                lat={form.lat ?? 51.505}
                lng={form.lng ?? -0.09}
                onLocationChange={handleMapClick}
                interactive
                height={320}
              />
            </Box>

            {form.lat && form.lng && (
              <Paper
                elevation={0}
                sx={{ p: 2, bgcolor: '#F0F3F6', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}
              >
                <CheckCircleOutlinedIcon sx={{ color: 'success.main' }} />
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Location captured</Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600, color: 'secondary.main' }}>
                    {form.lat.toFixed(6)}° N, {form.lng.toFixed(6)}° E
                  </Typography>
                </Box>
              </Paper>
            )}

            <TextField
              label="Nearby landmark or street (optional)"
              fullWidth
              value={form.locationDescription}
              onChange={(e) => setForm((f) => ({ ...f, locationDescription: e.target.value }))}
              placeholder="e.g. Outside the post office on High Street"
              sx={{ mb: 1 }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ color: 'text.secondary' }}>
                Back
              </Button>
              <Button
                variant="contained"
                color="primary"
                size="large"
                endIcon={<ArrowForwardIcon />}
                onClick={handleNext}
                sx={{ fontWeight: 700 }}
              >
                Continue
              </Button>
            </Box>
          </Paper>
        )}

        {/* ── Step 3: Details & Review ── */}
        {activeStep === 2 && (
          <Paper elevation={0} sx={{ p: { xs: 3, md: 5 }, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h4" sx={{ color: 'secondary.main', mb: 1, fontWeight: 700 }}>
              A few final details.
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4 }}>
              Describe the problem and review your report before submitting.
            </Typography>

            <TextField
              select
              label="Type of issue"
              fullWidth
              value={form.faultCategory}
              onChange={(e) => setForm((f) => ({ ...f, faultCategory: e.target.value }))}
              sx={{ mb: 3 }}
            >
              {FAULT_CATEGORIES.map((c) => (
                <MenuItem key={c} value={c}>{c}</MenuItem>
              ))}
            </TextField>

            <TextField
              label="Describe the problem"
              fullWidth
              multiline
              rows={4}
              value={form.description}
              onChange={(e) => {
                if (e.target.value.length <= MAX_DESC) {
                  setForm((f) => ({ ...f, description: e.target.value }));
                }
              }}
              placeholder="e.g. The light has not been working for about a week. It goes dark immediately at dusk."
              helperText={`${form.description.length} / ${MAX_DESC} characters`}
              sx={{ mb: 4 }}
            />

            {/* Review card */}
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'secondary.main', mb: 2 }}>
              Review your report
            </Typography>
            <Paper
              elevation={0}
              sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 4 }}
            >
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                  <Box
                    component="img"
                    src={form.photoPreview}
                    alt="Fault preview"
                    sx={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 1.5, flexShrink: 0 }}
                  />
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.disabled' }}>Photograph</Typography>
                    <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500 }}>{form.photo?.name}</Typography>
                  </Box>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>Location</Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'text.primary' }}>
                    {form.lat?.toFixed(6)}° N, {form.lng?.toFixed(6)}° E
                  </Typography>
                  {form.locationDescription && (
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>{form.locationDescription}</Typography>
                  )}
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>Issue type</Typography>
                  <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500 }}>
                    {form.faultCategory || 'Not specified'}
                  </Typography>
                </Box>
                {form.description && (
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.disabled' }}>Description</Typography>
                    <Typography variant="body2" sx={{ color: 'text.primary' }}>{form.description}</Typography>
                  </Box>
                )}
              </Stack>
            </Paper>

            <FormControlLabel
              control={
                <Checkbox
                  checked={form.confirmed}
                  onChange={(e) => setForm((f) => ({ ...f, confirmed: e.target.checked }))}
                  color="primary"
                />
              }
              label={
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  I confirm that the information above is accurate to the best of my knowledge.
                </Typography>
              }
              sx={{ mb: 3 }}
            />

            {submitError && <Alert severity="error" sx={{ mb: 3 }}>{submitError}</Alert>}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ color: 'text.secondary' }}>
                Back
              </Button>
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={handleSubmit}
                disabled={submitting || !form.confirmed}
                sx={{ fontWeight: 700, px: 5 }}
              >
                {submitting ? <><CircularProgress size={20} sx={{ color: 'secondary.main', mr: 1 }} /> Submitting…</> : 'Submit Report'}
              </Button>
            </Box>
          </Paper>
        )}
      </Container>
    </Box>
  );
}
