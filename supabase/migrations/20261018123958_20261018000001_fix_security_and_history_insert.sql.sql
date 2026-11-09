-- Fix: Set search_path on SECURITY DEFINER functions to prevent search_path injection
ALTER FUNCTION update_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION generate_reference_number() SET search_path = public, pg_temp;

-- Fix: Add INSERT policy on report_status_history so citizens can create the initial
-- "Report received" entry when submitting a new report. Only the report owner can insert.
DROP POLICY IF EXISTS "insert_own_report_history" ON report_status_history;
CREATE POLICY "insert_own_report_history" ON report_status_history FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM reports
      WHERE reports.id = report_status_history.report_id
      AND reports.user_id = auth.uid()
    )
  );

-- Grant execute on the reference number generator to authenticated users only
REVOKE EXECUTE ON FUNCTION generate_reference_number() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION generate_reference_number() TO authenticated;
