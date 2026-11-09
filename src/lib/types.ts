export type ReportStatus = 'submitted' | 'under_review' | 'in_progress' | 'resolved' | 'rejected';

export type UserRole = 'citizen' | 'admin';

export interface Report {
  id: string;
  reference_number: string;
  user_id: string;
  photo_url: string | null;
  latitude: number | null;
  longitude: number | null;
  location_description: string | null;
  fault_category: string;
  description: string | null;
  status: ReportStatus;
  created_at: string;
  updated_at: string;
}

export interface ReportStatusHistory {
  id: string;
  report_id: string;
  status: string;
  previous_status: string | null;
  note: string | null;
  changed_by: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string | null;
  created_at: string;
}

export interface AdminReportListResult {
  reports: Report[];
  total: number;
}

export const FAULT_CATEGORIES = [
  'Streetlight not working',
  'Flickering light',
  'Damaged streetlight',
  'Light on during daylight',
  'Other',
] as const;
