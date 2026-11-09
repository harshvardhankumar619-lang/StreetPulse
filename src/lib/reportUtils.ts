import type { Report, ReportStatus } from './types';

export const STATUS_LABELS: Record<ReportStatus, string> = {
  submitted: 'Submitted',
  under_review: 'Under Review',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  rejected: 'Rejected',
};

export const STATUS_VALUES: ReportStatus[] = [
  'submitted',
  'under_review',
  'in_progress',
  'resolved',
  'rejected',
];

export const STATUS_FILTERS = ['all', ...STATUS_VALUES] as const;
export type StatusFilter = typeof STATUS_FILTERS[number];

// Allowed admin status transitions: from -> set of allowed targets
export const STATUS_TRANSITIONS: Record<ReportStatus, ReportStatus[]> = {
  submitted: ['under_review', 'rejected'],
  under_review: ['in_progress', 'rejected'],
  in_progress: ['resolved', 'rejected'],
  resolved: ['rejected'],
  rejected: ['under_review'],
};

export function availableTransitions(current: ReportStatus): ReportStatus[] {
  return STATUS_TRANSITIONS[current] ?? [];
}

export function formatStatus(status: string): string {
  return STATUS_LABELS[status as ReportStatus] ?? status.replace(/_/g, ' ');
}

export function formatDate(value: string, includeTime = false): string {
  return new Date(value).toLocaleString('en-GB', includeTime
    ? { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatCategory(value: string): string {
  return value.replace(/_/g, ' ');
}

export function locationLabel(report: Pick<Report, 'location_description' | 'latitude' | 'longitude'>): string {
  if (report.location_description) return report.location_description;
  if (report.latitude !== null && report.longitude !== null) {
    return `${report.latitude.toFixed(4)}, ${report.longitude.toFixed(4)}`;
  }
  return 'Location not provided';
}

export function statusBackground(status: string): string {
  const colors: Record<string, string> = {
    submitted: 'rgba(16,28,44,0.08)',
    under_review: 'rgba(255,181,71,0.18)',
    in_progress: 'rgba(25,118,210,0.12)',
    resolved: 'rgba(22,132,91,0.12)',
    rejected: 'rgba(201,67,67,0.12)',
  };
  return colors[status] ?? colors.submitted;
}

export function statusText(status: string): string {
  const colors: Record<string, string> = {
    submitted: '#101C2C',
    under_review: '#B66A08',
    in_progress: '#1565C0',
    resolved: '#16845B',
    rejected: '#C94343',
  };
  return colors[status] ?? colors.submitted;
}
