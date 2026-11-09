/*
# StreetPulse — Initial Schema

## Summary
Creates the core tables for the Smart Streetlight Fault Reporting System.

## New Tables

### reports
- `id` (uuid, primary key, auto-generated)
- `reference_number` (text, unique) — human-readable reference like ST-20261011-XXXX
- `user_id` (uuid, FK to auth.users) — report owner; defaults to auth.uid()
- `photo_url` (text) — URL of the uploaded fault photo in Supabase Storage
- `latitude` (double precision) — GPS latitude
- `longitude` (double precision) — GPS longitude
- `location_description` (text, optional) — nearby landmark / street description
- `fault_category` (text) — category of the fault
- `description` (text) — citizen's description of the problem
- `status` (text, default 'submitted') — submitted | under_review | in_progress | resolved | rejected
- `created_at` (timestamptz, auto)
- `updated_at` (timestamptz, auto)

### report_status_history
- `id` (uuid, primary key)
- `report_id` (uuid, FK to reports)
- `status` (text) — the new status value
- `note` (text, optional) — additional context
- `created_at` (timestamptz, auto)

## Security
- RLS enabled on both tables.
- Citizens can only see/edit/delete their own reports.
- Status history is read-only for citizens (insert/update/delete by admin only in future).
*/

-- reports table
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_number text UNIQUE NOT NULL,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  photo_url text,
  latitude double precision,
  longitude double precision,
  location_description text,
  fault_category text NOT NULL DEFAULT 'Other',
  description text,
  status text NOT NULL DEFAULT 'submitted',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_reports" ON reports;
CREATE POLICY "select_own_reports" ON reports FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_reports" ON reports;
CREATE POLICY "insert_own_reports" ON reports FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_reports" ON reports;
CREATE POLICY "update_own_reports" ON reports FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_reports" ON reports;
CREATE POLICY "delete_own_reports" ON reports FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- report_status_history table
CREATE TABLE IF NOT EXISTS report_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  status text NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE report_status_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_report_history" ON report_status_history;
CREATE POLICY "select_own_report_history" ON report_status_history FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM reports
      WHERE reports.id = report_status_history.report_id
      AND reports.user_id = auth.uid()
    )
  );

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_report_status_history_report_id ON report_status_history(report_id);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS reports_updated_at ON reports;
CREATE TRIGGER reports_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to generate a reference number
CREATE OR REPLACE FUNCTION generate_reference_number()
RETURNS TEXT AS $$
DECLARE
  ref TEXT;
  today TEXT;
  seq INT;
BEGIN
  today := TO_CHAR(NOW(), 'YYYYMMDD');
  SELECT COUNT(*) + 1 INTO seq
  FROM reports
  WHERE reference_number LIKE 'ST-' || today || '-%';
  ref := 'ST-' || today || '-' || LPAD(seq::TEXT, 4, '0');
  RETURN ref;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
