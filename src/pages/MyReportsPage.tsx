import { useCallback, useEffect, useMemo, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Pagination from '@mui/material/Pagination';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';import Navbar from '../components/Navbar';
import ReportCard from '../components/ReportCard';
import { supabase } from '../lib/supabase';
import type { Report } from '../lib/types';
import { formatStatus } from '../lib/reportUtils';

const PAGE_SIZE = 10;
const STATUSES = ['all', 'submitted', 'under_review', 'in_progress', 'resolved', 'rejected'] as const;
type StatusFilter = typeof STATUSES[number];
const SORTS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'updated', label: 'Recently Updated' },
];

export default function MyReportsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = (searchParams.get('status') as StatusFilter) ?? 'all';

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<StatusFilter>(initialStatus);
  const [sort, setSort] = useState<string>('newest');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const { data, error: requestError } = await supabase.from('reports').select('*').order('created_at', { ascending: false });
    if (requestError) {
      console.error('my-reports fetch failed', requestError);
      setError('We could not load your reports. Please try again.');
      setReports([]);
    } else {
      setReports((data ?? []) as Report[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  // sync URL status param into filter on mount
  useEffect(() => {
    const paramStatus = searchParams.get('status') as StatusFilter | null;
    if (paramStatus && STATUSES.includes(paramStatus)) setFilter(paramStatus);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    let list = [...reports];
    if (filter !== 'all') list = list.filter((r) => r.status === filter);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (r) =>
          r.reference_number.toLowerCase().includes(q) ||
          r.fault_category.toLowerCase().includes(q) ||
          (r.description?.toLowerCase().includes(q) ?? false) ||
          (r.location_description?.toLowerCase().includes(q) ?? false),
      );
    }
    if (sort === 'oldest') list.reverse();
    else if (sort === 'updated') list.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    return list;
  }, [reports, filter, search, sort]);

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const hasReports = reports.length > 0;

  const handleFilter = (value: StatusFilter) => {
    setFilter(value);
    setPage(1);
    const params = new URLSearchParams(searchParams);
    if (value === 'all') params.delete('status'); else params.set('status', value);
    setSearchParams(params);
  };

  const handleSearch = (value: string) => { setSearch(value); setPage(1); };
  const handleSort = (value: string) => { setSort(value); setPage(1); };

  return (
    <Box sx={{ bgcolor: 'grey.100', minHeight: '100vh' }}>
      <Navbar />
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'flex-start' }} spacing={2} sx={{ mb: 4 }}>
          <Box>
            <Typography variant="h3" sx={{ color: 'secondary.main', fontWeight: 700, mb: 0.5, fontSize: { xs: '1.7rem', md: '2.2rem' } }}>My Reports</Typography>
            <Typography variant="body1" color="text.secondary">View your streetlight reports and follow their progress.</Typography>
          </Box>
          <Button variant="contained" color="primary" startIcon={<ReportProblemOutlinedIcon />} component={RouterLink} to="/report" sx={{ fontWeight: 700, alignSelf: { xs: 'stretch', sm: 'auto' } }}>
            Report a Fault
          </Button>
        </Stack>

        {/* Search + Sort */}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
          <TextField
            placeholder="Search by reference, category, description…"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            size="small"
            sx={{ flex: 1 }}
            slotProps={{
              input: {
                startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'text.disabled', fontSize: 20 }} /></InputAdornment>,
                endAdornment: search ? <InputAdornment position="end"><Box component="button" onClick={() => handleSearch('')} sx={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: 'text.disabled' }}><ClearIcon sx={{ fontSize: 18 }} /></Box></InputAdornment> : null,
              },
            }}
          />
          <TextField select size="small" value={sort} onChange={(e) => handleSort(e.target.value)} sx={{ minWidth: 180 }}>
            {SORTS.map((s) => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
          </TextField>
        </Stack>

        {/* Status filters */}
        <Stack direction="row" spacing={1} sx={{ mb: 4, flexWrap: 'wrap', rowGap: 1 }}>
          {STATUSES.map((s) => (
            <Chip
              key={s}
              label={s === 'all' ? 'All Reports' : formatStatus(s)}
              onClick={() => handleFilter(s)}
              variant={filter === s ? 'filled' : 'outlined'}
              color={filter === s ? 'primary' : 'default'}
              size="small"
              sx={{ fontWeight: filter === s ? 700 : 400, borderColor: filter === s ? 'primary.main' : 'divider' }}
            />
          ))}
        </Stack>

        {error && (
          <Alert severity="error" action={<Button color="inherit" size="small" startIcon={<RefreshIcon />} onClick={() => void load()}>Retry</Button>} sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Stack spacing={2}>{[1, 2, 3, 4].map((item) => <Skeleton key={item} variant="rectangular" height={112} sx={{ borderRadius: 2 }} />)}</Stack>
        ) : paginated.length === 0 ? (
          <Paper elevation={0} sx={{ p: { xs: 4, md: 6 }, borderRadius: 3, border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
            <LightbulbOutlinedIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h5" sx={{ color: 'secondary.main', mb: 1 }}>
              {!hasReports ? 'No reports yet' : 'No matching reports'}
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              {!hasReports
                ? 'When you notice a faulty streetlight, report it here and track its progress.'
                : 'Try adjusting your search or filter to find what you\'re looking for.'}
            </Typography>
            {!hasReports ? (
              <Button variant="contained" startIcon={<ReportProblemOutlinedIcon />} component={RouterLink} to="/report">Report a Fault</Button>
            ) : (
              <Button variant="outlined" onClick={() => { handleSearch(''); handleFilter('all'); }}>Clear filters</Button>
            )}
          </Paper>
        ) : (
          <>
            <Stack spacing={2}>{paginated.map((r) => <ReportCard key={r.id} report={r} />)}</Stack>
            {pageCount > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', pt: 4 }}>
                <Pagination count={pageCount} page={page} onChange={(_, v) => setPage(v)} color="primary" shape="rounded" />
              </Box>
            )}
          </>
        )}
      </Container>
    </Box>
  );
}
