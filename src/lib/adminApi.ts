import { supabase } from './supabase';
import type { Report, ReportStatus, ReportStatusHistory } from './types';
import { STATUS_TRANSITIONS } from './reportUtils';

export interface UpdateStatusResult {
  ok: boolean;
  error?: string;
  previousStatus?: string;
  newStatus?: string;
}

export async function updateReportStatus(
  reportId: string,
  newStatus: ReportStatus,
  note?: string,
): Promise<UpdateStatusResult> {
  const { data, error } = await supabase.rpc('update_report_status', {
    p_report_id: reportId,
    p_new_status: newStatus,
    p_note: note ?? null,
  });
  if (error) {
    return { ok: false, error: friendlyRpcError(error.message, newStatus) };
  }
  const row = (data as { ok: boolean; previous_status: string; new_status: string } | null) ?? null;
  if (!row || !row.ok) return { ok: false, error: 'Could not update the report status.' };
  return { ok: true, previousStatus: row.previous_status, newStatus: row.new_status };
}

function friendlyRpcError(message: string, newStatus: ReportStatus): string {
  if (/not authorized|administrators only/i.test(message)) {
    return 'You are not authorised to perform this action.';
  }
  if (/rejection reason is required/i.test(message)) {
    return 'A rejection reason is required.';
  }
  if (/Report not found/i.test(message)) {
    return 'This report could not be found.';
  }
  if (/Invalid target status/i.test(message)) {
    return 'That status is not valid.';
  }
  if (/can only/i.test(message)) {
    return message.replace(/^ERROR:\s*/, '');
  }
  void newStatus;
  return 'Could not update the report status. Please try again.';
}

export function isTransitionAllowed(from: ReportStatus, to: ReportStatus): boolean {
  return (STATUS_TRANSITIONS[from] ?? []).includes(to);
}

export interface ReportListPage {
  reports: Report[];
  total: number;
}

export async function fetchAdminReports(opts: {
  page: number;
  pageSize: number;
  search?: string;
  status?: ReportStatus | 'all';
  category?: string | 'all';
  dateRange?: 'today' | '7d' | '30d' | 'all' | { from: string; to: string };
  sort?: 'newest' | 'oldest' | 'updated';
}): Promise<ReportListPage & { error?: string }> {
  const { page, pageSize } = opts;
  const search = (opts.search ?? '').trim();
  const status = opts.status ?? 'all';
  const category = opts.category ?? 'all';
  const sort = opts.sort ?? 'newest';
  const dateRange = opts.dateRange ?? 'all';

  let query = supabase.from('reports').select('*', { count: 'exact' });

  if (status !== 'all') query = query.eq('status', status);
  if (category !== 'all') query = query.eq('fault_category', category);

  const term = search.replace(/[,()"*\\%_]/g, ' ').trim();
  if (term) {
    query = query.or(
      `reference_number.ilike.%${term}%,description.ilike.%${term}%,fault_category.ilike.%${term}%,location_description.ilike.%${term}%`,
    );
  }

  if (dateRange !== 'all') {
    let from: string;
    let to: string | undefined;
    const now = new Date();
    if (dateRange === 'today') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      from = start.toISOString();
    } else if (dateRange === '7d' || dateRange === '30d') {
      const days = dateRange === '7d' ? 7 : 30;
      const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      from = start.toISOString();
    } else {
      from = new Date(dateRange.from).toISOString();
      const toDate = new Date(dateRange.to);
      toDate.setHours(23, 59, 59, 999);
      to = toDate.toISOString();
    }
    query = query.gte('created_at', from);
    if (to) query = query.lte('created_at', to);
  }

  const ascending = sort === 'oldest';
  const orderCol = sort === 'updated' ? 'updated_at' : 'created_at';
  query = query.order(orderCol, { ascending }).range((page - 1) * pageSize, page * pageSize - 1);

  const { data, error, count } = await query;
  if (error) {
    console.error('admin reports fetch failed', error);
    return { reports: [], total: 0, error: 'Could not load reports. Please try again.' };
  }
  return { reports: (data ?? []) as Report[], total: count ?? 0 };
}

export interface ReportStatusCounts {
  total: number;
  submitted: number;
  under_review: number;
  in_progress: number;
  resolved: number;
  rejected: number;
}

export async function fetchStatusCounts(): Promise<ReportStatusCounts & { error?: string }> {
  const { data, error } = await supabase
    .from('reports')
    .select('status');
  if (error) {
    return {
      total: 0, submitted: 0, under_review: 0, in_progress: 0, resolved: 0, rejected: 0,
      error: 'Could not load report statistics.',
    };
  }
  const rows = (data ?? []) as { status: string }[];
  const counts: ReportStatusCounts = {
    total: rows.length,
    submitted: 0, under_review: 0, in_progress: 0, resolved: 0, rejected: 0,
  };
  for (const row of rows) {
    const key = row.status as ReportStatus;
    if (key in counts) counts[key] += 1;
  }
  return counts;
}

export async function fetchActivitySeries(days = 30): Promise<{ date: string; count: number }[] | { error: string }> {
  const since = new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000);
  const iso = since.toISOString();
  const { data, error } = await supabase
    .from('reports')
    .select('created_at')
    .gte('created_at', iso)
    .order('created_at', { ascending: true });
  if (error) return { error: 'Could not load reporting activity.' };
  const rows = (data ?? []) as { created_at: string }[];
  const buckets = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    buckets.set(key, 0);
  }
  for (const row of rows) {
    const key = row.created_at.slice(0, 10);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  const series = Array.from(buckets.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
  return series;
}

export async function fetchReportWithHistory(reportId: string): Promise<{
  report: Report | null;
  history: ReportStatusHistory[];
  submitterName: string | null;
  submitterEmail: string | null;
  error?: string;
}> {
  const [repRes, histRes] = await Promise.all([
    supabase.from('reports').select('*').eq('id', reportId).maybeSingle(),
    supabase
      .from('report_status_history')
      .select('*')
      .eq('report_id', reportId)
      .order('created_at', { ascending: true }),
  ]);

  if (repRes.error) {
    return { report: null, history: [], submitterName: null, submitterEmail: null, error: 'Could not load this report.' };
  }
  const report = (repRes.data as Report | null) ?? null;

  let submitterName: string | null = null;
  let submitterEmail: string | null = null;
  if (report?.user_id) {
    const { data: prof } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', report.user_id)
      .maybeSingle();
    submitterName = (prof as { full_name: string | null } | null)?.full_name ?? null;
    // Email is not stored in profiles; attempt via auth admin API is not available to client.
    // We surface the name only, and leave email null (frontend cannot read auth.users.email).
    void submitterEmail;
  }

  return {
    report,
    history: (histRes.data ?? []) as ReportStatusHistory[],
    submitterName,
    submitterEmail: null,
  };
}

export async function fetchAllReportsForMap(): Promise<{ reports: Report[]; error?: string }> {
  // Fetch only the columns needed for the map, up to a reasonable cap.
  const { data, error } = await supabase
    .from('reports')
    .select('id, reference_number, photo_url, latitude, longitude, location_description, fault_category, description, status, created_at')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)
    .order('created_at', { ascending: false })
    .limit(2000);
  if (error) return { reports: [], error: 'Could not load the map data.' };
  return { reports: (data ?? []) as unknown as Report[] };
}
