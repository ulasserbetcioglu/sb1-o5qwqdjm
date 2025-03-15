-- Drop existing policies
DROP POLICY IF EXISTS "Companies manage field staff" ON field_staff;
DROP POLICY IF EXISTS "Staff view own data" ON field_staff;
DROP POLICY IF EXISTS "Admin manage all staff" ON field_staff;

-- Recreate policies without referencing auth.users table
CREATE POLICY "Companies manage field staff"
ON field_staff FOR ALL
TO authenticated
USING (
  company_id IN (
    SELECT id FROM companies
    WHERE user_id = auth.uid()
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
);

-- Grant necessary permissions
GRANT ALL ON field_staff TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

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
BEGIN
  -- Verify permissions
  IF NOT EXISTS (
    SELECT 1 
    FROM field_staff fs
    JOIN companies c ON c.id = fs.company_id
    WHERE fs.id = p_staff_id
    AND c.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  -- Get the user_id and update password
  UPDATE auth.users u
  SET encrypted_password = crypt(p_new_password, gen_salt('bf'))
  FROM field_staff fs
  WHERE fs.id = p_staff_id
  AND u.id = fs.user_id;
END;
$$;