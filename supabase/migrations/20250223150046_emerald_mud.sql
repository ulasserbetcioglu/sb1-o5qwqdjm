-- Drop existing policies
DROP POLICY IF EXISTS "Companies manage field staff" ON field_staff;
DROP POLICY IF EXISTS "Staff view own data" ON field_staff;
DROP POLICY IF EXISTS "Admin manage all staff" ON field_staff;

-- Recreate policies without referencing auth.users table
CREATE POLICY "Companies manage field staff"
ON field_staff FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM companies
    WHERE companies.id = field_staff.company_id
    AND companies.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM companies
    WHERE companies.id = field_staff.company_id
    AND companies.user_id = auth.uid()
  )
);

CREATE POLICY "Staff view own data"
ON field_staff FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
);

CREATE POLICY "Admin manage all staff"
ON field_staff FOR ALL
TO authenticated
USING (
  auth.jwt() ->> 'email' LIKE '%@admin%'
)
WITH CHECK (
  auth.jwt() ->> 'email' LIKE '%@admin%'
);

-- Create function to change field staff password
CREATE OR REPLACE FUNCTION change_field_staff_password(
  p_staff_id uuid,
  p_new_password text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_company_id uuid;
BEGIN
  -- Get the company_id and verify permissions
  SELECT company_id, user_id INTO v_company_id, v_user_id
  FROM field_staff
  WHERE id = p_staff_id;

  IF NOT EXISTS (
    SELECT 1 FROM companies
    WHERE id = v_company_id
    AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Field staff user not found';
  END IF;

  -- Update the user's password
  UPDATE auth.users
  SET encrypted_password = crypt(p_new_password, gen_salt('bf'))
  WHERE id = v_user_id;
END;
$$;