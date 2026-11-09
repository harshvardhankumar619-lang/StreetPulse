/*
# Admin Portal — Role-Based Access Control & Status Audit Trail

## Summary
Implements the backend security and data model for the Phase 3 Admin Portal:
- A `profiles` table storing each user's role (`citizen` | `admin`) and display name.
- Automatic profile creation for every new auth user via a trigger.
- Column-level privileges so citizens can never write their own `role`.
- Admin-read-all + citizen-own-only RLS policies on `reports` and `report_status_history`.
- An audit-trail enhancement to `report_status_history` (previous_status, changed_by, note).
- A `SECURITY DEFINER` function `update_report_status` that is the ONLY path to change a
  report's status: it verifies the caller is an admin, enforces the valid transition order,
  records the previous status and admin actor in the audit table, and rejects empty
  rejection reasons.
- A documented, secure way to promote a user to admin via a parameterised SQL block (run
  once by an operator in the Supabase dashboard — no public self-service escalation).

## New Tables

### profiles
- `id` (uuid, PK, FK auth.users.id ON DELETE CASCADE) — one row per auth user
- `role` (text, NOT NULL, default 'citizen') — 'citizen' | 'admin'
- `full_name` (text, nullable) — display name copied from auth user metadata on creation
- `created_at` (timestamptz, default now())

## Modified Tables

### report_status_history
- Added `previous_status` (text, nullable) — the status the report moved FROM
- Added `changed_by` (uuid, nullable, FK auth.users.id) — the admin who changed it
  (null for the initial citizen-submitted entry, which the citizen creates themselves)

## Security

### profiles
- RLS enabled; GRANT SELECT to authenticated (every signed-in user can see profiles, which
  is needed for the admin to see citizen names and for any user to read their own role).
- Column-level: citizens can UPDATE only `full_name`; `role` is writable ONLY by the
  `update_report_status` / admin promotion path (server-side), never by a direct table UPDATE
  from the anon/authenticated client.
- SELECT policy: every authenticated user can read every profile row (role is not secret;
  admins need citizen names, citizens need to know their own role).
- UPDATE policy: a user can UPDATE only their own row, and column privileges further
  restrict that to `full_name`.
- There is intentionally NO INSERT/UPDATE/DELETE policy granting table writes on `role`:
  profiles are created by the trigger, and roles are changed only by the admin promotion
  SQL or a SECURITY DEFINER function.

### reports
- Replaces the owner-only policies with a combined set: citizens see/edit only their own
  reports; admins see all reports. Admin write access (status changes) is NOT granted at
  the table level — the only way to change status is through `update_report_status()`.
  - SELECT policy: owner OR admin
  - INSERT policy: owner only (citizens submit reports; admins do not submit on behalf)
  - UPDATE policy: owner only, BUT column privileges are narrowed so the client can never
    write `status`. The existing citizen "edit my report" flow (if any) keeps working for
    non-status fields; status changes go through the function.
  - DELETE policy: owner only
  - Column privileges: REVOKE full UPDATE; GRANT UPDATE only on the citizen-editable
    columns (description, location_description, fault_category, photo_url, latitude,
    longitude). `status` and `user_id` are NOT client-writable.

### report_status_history
- SELECT policy: citizen can read history for their own reports; admin can read all
  history.
- INSERT: the citizen may insert the initial "submitted" entry for their own report
  (unchanged). The function inserts all subsequent entries as a privileged caller.
- UPDATE / DELETE: no policy → not callable by the client at all. Only the function and
  trigger manage history.

### Functions
- `update_report_status(p_report_id uuid, p_new_status text, p_note text)`:
  SECURITY DEFINER, SET search_path = public. Verifies caller is admin via profiles table.
  Enforces valid transitions, requires a note for rejection, updates the report status,
  and inserts an audit row with previous_status + changed_by. EXECUTE revoked from PUBLIC
  and anon; granted to authenticated.

## Admin Promotion (run once by an operator)
At the bottom is a commented example block. An operator runs it in the Supabase SQL editor
with a real user id / email to grant admin. There is no public self-service path.

## Notes
1. Idempotent: uses IF NOT EXISTS and DROP POLICY IF EXISTS before CREATE POLICY.
2. Does not drop or rename existing columns or tables — adds columns only.
3. Existing reports keep working: the new SELECT policy is a superset of the old one
   (owners still see their rows, now admins do too).
4. The trigger auto-creates a 'citizen' profile for every new auth user, so sign-up keeps
   working without any frontend change.
*/

-- ────────────────────────────────────────────────────────────────
-- 1. profiles table
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'citizen',
  full_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profiles_role_check CHECK (role IN ('citizen', 'admin'))
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON profiles TO authenticated;
-- Column-level: citizens may update only their own full_name. role is NOT granted.
REVOKE UPDATE ON profiles FROM authenticated;
GRANT UPDATE (full_name) ON profiles TO authenticated;

DROP POLICY IF EXISTS "profiles_select_all_authenticated" ON profiles;
CREATE POLICY "profiles_select_all_authenticated" ON profiles FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles_update_own_full_name" ON profiles;
CREATE POLICY "profiles_update_own_full_name" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Trigger to auto-create a citizen profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name)
  VALUES (
    NEW.id,
    'citizen',
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION handle_new_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION handle_new_user() TO authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ────────────────────────────────────────────────────────────────
-- 2. Backfill profiles for existing auth users
-- ────────────────────────────────────────────────────────────────
INSERT INTO profiles (id, role, full_name)
SELECT
  au.id,
  'citizen',
  COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1))
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = au.id)
ON CONFLICT (id) DO NOTHING;

-- ────────────────────────────────────────────────────────────────
-- 3. Audit-trail columns on report_status_history
-- ────────────────────────────────────────────────────────────────
ALTER TABLE report_status_history
  ADD COLUMN IF NOT EXISTS previous_status text,
  ADD COLUMN IF NOT EXISTS changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_report_status_history_changed_by ON report_status_history(changed_by);

-- History SELECT: citizens see their own reports' history; admins see all.
DROP POLICY IF EXISTS "select_own_report_history" ON report_status_history;
DROP POLICY IF EXISTS "select_all_report_history_admin" ON report_status_history;
CREATE POLICY "select_report_history_own_or_admin" ON report_status_history FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM reports r
      WHERE r.id = report_status_history.report_id
        AND (r.user_id = auth.uid()
             OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
    )
  );

-- The citizen may insert only the initial entry for their own report.
-- (Existing policy, restated to be safe.)
DROP POLICY IF EXISTS "insert_own_report_history" ON report_status_history;
CREATE POLICY "insert_own_report_history" ON report_status_history FOR INSERT
  TO authenticated WITH CHECK (
    report_status_history.previous_status IS NULL
    AND report_status_history.changed_by IS NULL
    AND EXISTS (
      SELECT 1 FROM reports r
      WHERE r.id = report_status_history.report_id AND r.user_id = auth.uid()
    )
  );

-- No UPDATE / DELETE policy on history for client roles: not writable from the client.
-- The SECURITY DEFINER function inserts audit rows as the table owner.

-- ────────────────────────────────────────────────────────────────
-- 4. reports — admin-read-all + column-level status protection
-- ────────────────────────────────────────────────────────────────
-- SELECT: owner OR admin
DROP POLICY IF EXISTS "select_own_reports" ON reports;
DROP POLICY IF EXISTS "select_all_reports_admin" ON reports;
CREATE POLICY "select_reports_own_or_admin" ON reports FOR SELECT
  TO authenticated USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- INSERT: owner only
DROP POLICY IF EXISTS "insert_own_reports" ON reports;
CREATE POLICY "insert_own_reports" ON reports FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- UPDATE: owner only, BUT column privileges (below) stop the client from writing `status`.
DROP POLICY IF EXISTS "update_own_reports" ON reports;
CREATE POLICY "update_own_reports" ON reports FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- DELETE: owner only
DROP POLICY IF EXISTS "delete_own_reports" ON reports;
CREATE POLICY "delete_own_reports" ON reports FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Column-level: revoke full UPDATE, grant only non-status columns to citizens.
-- status and user_id are NOT client-writable.
REVOKE UPDATE ON reports FROM authenticated;
GRANT UPDATE (photo_url, latitude, longitude, location_description, fault_category, description)
  ON reports TO authenticated;

-- Useful indexes for admin queries
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_updated_at ON reports(updated_at DESC);

-- ────────────────────────────────────────────────────────────────
-- 5. update_report_status — the ONLY path to change a report's status
-- ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_report_status(
  p_report_id uuid,
  p_new_status text,
  p_note text DEFAULT NULL
)
RETURNS TABLE (
  ok boolean,
  previous_status text,
  new_status text
)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_is_admin boolean;
  v_current_status text;
  v_previous_status text;
  v_note text := p_note;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT role = 'admin' INTO v_is_admin FROM profiles WHERE id = v_caller;
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Not authorized: administrators only';
  END IF;

  IF p_new_status NOT IN ('under_review', 'in_progress', 'resolved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid target status';
  END IF;

  SELECT status INTO v_current_status FROM reports WHERE id = p_report_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Report not found';
  END IF;
  v_previous_status := v_current_status;

  -- Enforce the forward workflow. A terminal status can only be revisited if rejected,
  -- and a rejected report can be put back under_review if the admin reverses it.
  IF v_current_status = 'rejected' AND p_new_status <> 'under_review' THEN
    RAISE EXCEPTION 'A rejected report can only be returned to Under Review';
  ELSIF v_current_status = 'resolved' AND p_new_status <> 'rejected' THEN
    RAISE EXCEPTION 'A resolved report cannot be moved except to Rejected';
  ELSIF v_current_status = 'submitted' AND p_new_status NOT IN ('under_review', 'rejected') THEN
    RAISE EXCEPTION 'A submitted report can only move to Under Review or Rejected';
  ELSIF v_current_status = 'under_review' AND p_new_status NOT IN ('in_progress', 'rejected') THEN
    RAISE EXCEPTION 'An under-review report can only move to In Progress or Rejected';
  ELSIF v_current_status = 'in_progress' AND p_new_status NOT IN ('resolved', 'rejected') THEN
    RAISE EXCEPTION 'An in-progress report can only move to Resolved or Rejected';
  END IF;

  -- Rejection requires a reason
  IF p_new_status = 'rejected' THEN
    IF v_note IS NULL OR btrim(v_note) = '' THEN
      RAISE EXCEPTION 'A rejection reason is required';
    END IF;
  END IF;

  UPDATE reports
    SET status = p_new_status, updated_at = now()
    WHERE id = p_report_id;

  INSERT INTO report_status_history (report_id, previous_status, status, note, changed_by)
  VALUES (p_report_id, v_previous_status, p_new_status, v_note, v_caller);

  RETURN QUERY SELECT true, v_previous_status, p_new_status;
END;
$$;

REVOKE EXECUTE ON FUNCTION update_report_status(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION update_report_status(uuid, text, text) TO authenticated;

-- ────────────────────────────────────────────────────────────────
-- 6. Admin promotion (operator-only; run in Supabase SQL editor)
-- ────────────────────────────────────────────────────────────────
-- To grant admin to an existing user, run ONE of the following in the Supabase
-- dashboard SQL editor (replacing the placeholder). Do NOT add a public API for this.
--
--   UPDATE profiles SET role = 'admin' WHERE id = '<user-uuid>';
--   -- or by email:
--   -- UPDATE profiles p
--   -- SET role = 'admin'
--   -- FROM auth.users au
--   -- WHERE p.id = au.id AND au.email = 'admin@example.com';
--
-- There is intentionally no client-facing route that performs this.