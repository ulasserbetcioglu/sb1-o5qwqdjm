-- Drop existing policies if they exist
DROP POLICY IF EXISTS "field_staff_access_policy" ON field_staff;
DROP POLICY IF EXISTS "Companies manage field staff" ON field_staff;
DROP POLICY IF EXISTS "Staff view own data" ON field_staff;
DROP POLICY IF EXISTS "Admin manage all staff" ON field_staff;
DROP POLICY IF EXISTS "Allow field staff access" ON field_staff;

-- Enable RLS
ALTER TABLE field_staff ENABLE ROW LEVEL SECURITY;

-- Create a single comprehensive policy
CREATE POLICY "field_staff_access_policy"
ON field_staff FOR ALL
TO authenticated
USING (
  -- Companies can access their field staff
  company_id IN (
    SELECT id FROM companies
    WHERE user_id = auth.uid()
  )
  -- Staff can access their own data
  OR user_id = auth.uid()
  -- Admins can access all
  OR auth.jwt() ->> 'email' LIKE '%@admin%'
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
DECLARE
  v_user_id uuid;
BEGIN
  -- Get user_id and verify permissions in a single query
  SELECT fs.user_id INTO v_user_id
  FROM field_staff fs
  WHERE fs.id = p_staff_id
  AND (
    -- Company admin access
    EXISTS (
      SELECT 1 FROM companies c
      WHERE c.id = fs.company_id
      AND c.user_id = auth.uid()
    )
    -- System admin access
    OR EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND email LIKE '%@admin%'
    )
  );

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Permission denied or staff not found';
  END IF;

  -- Update password using auth.admin_update_user_by_id
  PERFORM auth.admin_update_user_by_id(
    v_user_id,
    JSONB_BUILD_OBJECT('password', p_new_password)
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION change_field_staff_password TO authenticated;