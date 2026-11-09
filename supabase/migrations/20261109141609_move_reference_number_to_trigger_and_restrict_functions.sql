/*
# Assign report reference numbers in the database and restrict function access

1. Changes
- New trigger function `assign_report_reference` runs before each new report is saved and sets its reference number (ST-YYYYMMDD-NNNN).
- The trigger is attached to the `reports` table.
- The old `generate_reference_number` function is removed. The app no longer calls it, so nothing can request reference numbers directly.
- `handle_new_user` (creates a profile on sign-up) is no longer callable by any role. Database triggers still run it.
- `update_report_status` is no longer callable by anonymous visitors. Signed-in users can still call it, and it rejects anyone who is not an administrator.

2. Security
- Trigger functions do not need execute permission to run, so revoking it does not affect sign-up or report creation.
- The reference trigger runs as its owner so it can count existing reports regardless of the caller's row access.

3. Notes
- Reference numbers are assigned by counting existing reports for the day, as before. Two reports submitted in the same instant could in theory receive the same number.
*/

CREATE OR REPLACE FUNCTION public.assign_report_reference()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today text := to_char(now(), 'YYYYMMDD');
  v_seq integer;
BEGIN
  SELECT COUNT(*) + 1 INTO v_seq
  FROM reports
  WHERE reference_number LIKE 'ST-' || v_today || '-%';
  NEW.reference_number := 'ST-' || v_today || '-' || LPAD(v_seq::text, 4, '0');
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.assign_report_reference() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS assign_report_reference_before_insert ON reports;
CREATE TRIGGER assign_report_reference_before_insert
BEFORE INSERT ON reports
FOR EACH ROW
EXECUTE FUNCTION public.assign_report_reference();

DROP FUNCTION IF EXISTS public.generate_reference_number();

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.update_report_status(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_report_status(uuid, text, text) TO authenticated;
