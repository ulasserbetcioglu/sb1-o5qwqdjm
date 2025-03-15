-- Create staff table
CREATE TABLE staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  status text NOT NULL DEFAULT 'active',
  is_active boolean NOT NULL DEFAULT true,
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, email)
);

-- Enable RLS
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

-- Create policy for access control
CREATE POLICY "staff_access_policy"
ON staff FOR ALL
TO authenticated
USING (
  -- Companies can access their staff
  company_id IN (
    SELECT id FROM companies
    WHERE user_id = auth.uid()
  )
  -- Staff can access their own data
  OR user_id = auth.uid()
  -- Admins can access all
  OR auth.jwt() ->> 'email' LIKE '%@admin%'
);

-- Create function to change staff password
CREATE OR REPLACE FUNCTION change_staff_password(
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
  v_is_active boolean;
BEGIN
  -- Get staff details and verify permissions
  SELECT 
    s.user_id,
    s.company_id,
    s.is_active
  INTO 
    v_user_id,
    v_company_id,
    v_is_active
  FROM staff s
  WHERE s.id = p_staff_id;

  -- Check if staff exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Staff not found';
  END IF;

  -- Check if staff has a user account
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Staff does not have a user account yet. Please create login credentials first.';
  END IF;

  -- Check if staff is active
  IF NOT v_is_active THEN
    RAISE EXCEPTION 'Cannot change password for inactive staff';
  END IF;

  -- Verify company permission
  IF NOT EXISTS (
    SELECT 1 FROM companies c
    WHERE c.id = v_company_id
    AND c.user_id = auth.uid()
    AND c.status = 'approved'
    AND c.is_active = true
  ) AND NOT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND email LIKE '%@admin%'
  ) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  -- Update password using auth.users table directly
  UPDATE auth.users
  SET encrypted_password = crypt(p_new_password, gen_salt('bf'))
  WHERE id = v_user_id;

  -- Return success
  RETURN;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to update password: %', SQLERRM;
END;
$$;

-- Grant necessary permissions
GRANT ALL ON staff TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION change_staff_password TO authenticated;