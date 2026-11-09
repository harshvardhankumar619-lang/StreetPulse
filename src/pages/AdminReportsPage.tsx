import { useCallback, useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Pagination from '@mui/material/Pagination';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ClearIcon from '@mui/icons-material/Clear';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import StatusChip from '../components/StatusChip';
import { fetchAdminReports } from '../lib/adminApi';
import type { Report, ReportStatus } from '../lib/types';
import { FAULT_CATEGORIES } from '../lib/types';
import { formatCategory, formatDate, locationLabel, STATUS_VALUES, STATUS_LABELS } from '../lib/reportUtils';

const PAGE_SIZE = 10;
const DATE_RANGES = [
  { value: 'all', label: 'All time' },
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
] as const;
const SORTS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'updated', label: 'Recently Updated' },
] as const;

type DateRangeValue = typeof DATE_RANGES[number]['value'] | 'custom';

export default function AdminReportsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = (searchParams.get('status') as ReportStatus | 'all') ?? 'all';

  const [reports, setReports] = useState<Report[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ReportStatus | 'all'>(initialStatus);
  const [category, setCategory] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRangeValue>('all');
  const [sort, setSort] = useState<string>('newest');
  const [page, setPage] = useState(1);

  const rangeParam: 'today' | '7d' | '30d' | 'all' | { from: string; to: string } | undefined =
    dateRange === 'custom' ? undefined : (dateRange === 'all' ? 'all' : dateRange);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const res = await fetchAdminReports({
      page,
      pageSize: PAGE_SIZE,
      search,
      status,
      category,
      dateRange: rangeParam,
      sort: sort as 'newest' | 'oldest' | 'updated',
    });
    if (res.error) setError(res.error);
    setReports(res.reports);
    setTotal(res.total);
    setLoading(false);
  }, [page, search, status, category, rangeParam, sort]);

  useEffect(() => { void load(); }, [load]);

  // Sync the status param from the URL (for sidebar links to Resolved/Rejected)
  useEffect(() => {
    const s = (searchParams.get('status') as ReportStatus | 'all') ?? 'all';
    if (STATUS_VALUES.includes(s as ReportStatus) || s === 'all') {
      setStatus(s);
      setPage(1);
    }
  }, [searchParams]);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const updateStatusParam = (value: ReportStatus | 'all') => {
    setStatus(value);
    setPage(1);
    const params = new URLSearchParams(searchParams);
    if (value === 'all') params.delete('status'); else params.set('status', value);
    setSearchParams(params, { replace: true });
  };

  const handleSearchChange = (value: string) => { setSearch(value); setPage(1); };
  const handleSortChange = (value: string) => { setSort(value); setPage(1); };
  const handleCategoryChange = (value: string) => { setCategory(value); setPage(1); };
  const handleDateChange = (value: string) => { setDateRange(value as DateRangeValue); setPage(1); };

  return (
    <AdminLayout>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: 'secondary.main', fontSize: { xs: '1.5rem', md: '1.9rem' } }}>All Reports</Typography>
        <Typography variant="body2" color="text.secondary">Review, investigate and manage reported streetlight faults.</Typography>
      </Box>

      {/* Search + filters */}
      <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', mb: 2.5 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField
            placeholder="Search reference, description, category, location…"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            size="small"
            sx={{ flex: 1 }}
            slotProps={{
              input: {
                startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'text.disabled', fontSize: 20 }} /></InputAdornment>,
                endAdornment: search ? (
                  <InputAdornment position="end">
                    <Box component="button" onClick={() => handleSearchChange('')} sx={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: 'text.disabled' }}>
                      <ClearIcon sx={{ fontSize: 18 }} />
                    </Box>
                  </InputAdornment>
                ) : null,
              },
            }}
          />
          <TextField select size="small" label="Status" value={status} onChange={(e) => updateStatusParam(e.target.value as ReportStatus | 'all')} sx={{ minWidth: 150 }}>
            <MenuItem value="all">All</MenuItem>
            {STATUS_VALUES.map((s) => <MenuItem key={s} value={s}>{STATUS_LABELS[s]}</MenuItem>)}
          </TextField>
          <TextField select size="small" label="Category" value={category} onChange={(e) => handleCategoryChange(e.target.value)} sx={{ minWidth: 170 }}>
            <MenuItem value="all">All categories</MenuItem>
            {FAULT_CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </TextField>
          <TextField select size="small" label="Date" value={dateRange} onChange={(e) => handleDateChange(e.target.value)} sx={{ minWidth: 140 }}>
            {DATE_RANGES.map((d) => <MenuItem key={d.value} value={d.value}>{d.label}</MenuItem>)}
          </TextField>
          <TextField select size="small" label="Sort" value={sort} onChange={(e) => handleSortChange(e.target.value)} sx={{ minWidth: 170 }}>
            {SORTS.map((s) => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
          </TextField>
        </Stack>
      </Paper>

      {error && (
        <Alert severity="error" action={<Button color="inherit" size="small" startIcon={<RefreshIcon />} onClick={() => void load()}>Retry</Button>} sx={{ mb: 2.5 }}>
          {error}
        </Alert>
      )}

      {/* Results */}
      {loading ? (
        <Stack spacing={1}>{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} variant="rectangular" height={64} sx={{ borderRadius: 2 }} />)}</Stack>
      ) : reports.length === 0 ? (
        <Paper elevation={0} sx={{ p: { xs: 4, md: 6 }, borderRadius: 2, border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
          <LightbulbOutlinedIcon sx={{ fontSize: 46, color: 'text.disabled', mb: 1 }} />
          <Typography variant="subtitle1" sx={{ color: 'secondary.main', mb: 0.5 }}>No matching reports</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Try adjusting your search or filters.</Typography>
          <Button variant="outlined" size="small" onClick={() => { handleSearchChange(''); updateStatusParam('all'); handleCategoryChange('all'); handleDateChange('all'); }}>Clear filters</Button>
        </Paper>
      ) : (
        <>
          {/* Desktop table */}
          <TableContainer component={Paper} elevation={0} sx={{ display: { xs: 'none', md: 'block' }, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: 'grey.50' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: 'secondary.main' }}>Report ID</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'secondary.main' }}>Photo</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'secondary.main' }}>Issue</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'secondary.main' }}>Location</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'secondary.main' }}>Submitted</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'secondary.main' }}>Status</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: 'secondary.main' }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{report.reference_number}</TableCell>
                    <TableCell sx={{ py: 1 }}>
                      {report.photo_url ? (
                        <Box component="img" src={report.photo_url} alt="" sx={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 1 }} />
                      ) : (
                        <Box sx={{ width: 44, height: 44, borderRadius: 1, bgcolor: 'grey.100', display: 'grid', placeItems: 'center', color: 'text.disabled' }}>
                          <LightbulbOutlinedIcon fontSize="small" />
                        </Box>
                      )}
                    </TableCell>
                    <TableCell sx={{ maxWidth: 220 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'secondary.main' }}>{formatCategory(report.fault_category)}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {report.description ?? '—'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 180 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{locationLabel(report)}</Typography>
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(report.created_at)}</TableCell>
                    <TableCell><StatusChip status={report.status} /></TableCell>
                    <TableCell align="right">
                      <IconButton component={RouterLink} to={`/admin/reports/${report.id}`} size="small" sx={{ color: 'primary.dark' }}>
                        <VisibilityOutlinedIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Mobile cards */}
          <Stack spacing={1.5} sx={{ display: { xs: 'flex', md: 'none' } }}>
            {reports.map((report) => (
              <Paper key={report.id} elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                  <Box
                    component={report.photo_url ? 'img' : 'div'}
                    src={report.photo_url ?? undefined}
                    alt=""
                    sx={{ width: 48, height: 48, borderRadius: 1, objectFit: 'cover', flexShrink: 0, bgcolor: 'grey.100', display: report.photo_url ? 'block' : 'grid', placeItems: report.photo_url ? undefined : 'center', color: 'text.disabled' }}
                  >
                    {!report.photo_url && <LightbulbOutlinedIcon fontSize="small" />}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>{report.reference_number}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{formatCategory(report.fault_category)} · {locationLabel(report)}</Typography>
                    <Typography variant="caption" color="text.disabled">{formatDate(report.created_at)}</Typography>
                  </Box>
                </Stack>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1.5 }}>
                  <StatusChip status={report.status} />
                  <Button component={RouterLink} to={`/admin/reports/${report.id}`} size="small" endIcon={<ArrowForwardIcon />} sx={{ color: 'primary.dark' }}>View</Button>
                </Stack>
              </Paper>
            ))}
          </Stack>

          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 2.5 }}>
            <Typography variant="caption" color="text.secondary">
              {loading ? 'Loading…' : `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} of ${total}`}
            </Typography>
            {pageCount > 1 && (
              <Pagination count={pageCount} page={page} onChange={(_, v) => setPage(v)} color="primary" shape="rounded" size="small" />
            )}
          </Stack>
        </>
      )}
    </AdminLayout>
  );
}
