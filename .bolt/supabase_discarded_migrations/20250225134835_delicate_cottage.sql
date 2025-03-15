-- Drop existing policies if they exist
DROP POLICY IF EXISTS "field_staff_access_policy" ON field_staff;

-- Create field staff table if it doesn't exist
CREATE TABLE IF NOT EXISTS field_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  staff_code text NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  is_active boolean NOT NULL DEFAULT false,
  rejection_reason text,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id),
  UNIQUE(company_id, staff_code),
  UNIQUE(company_id, email)
);

-- Enable RLS
ALTER TABLE field_staff ENABLE ROW LEVEL SECURITY;

-- Create simplified policy for access control
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

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS change_field_staff_password;

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

  -- Update password using auth.users
  UPDATE auth.users
  SET encrypted_password = crypt(p_new_password, gen_salt('bf'))
  WHERE id = v_user_id;
END;
$$;

-- Drop existing indexes if they exist
DROP INDEX IF EXISTS idx_field_staff_company_id;
DROP INDEX IF EXISTS idx_field_staff_staff_code;
DROP INDEX IF EXISTS idx_field_staff_email;
DROP INDEX IF EXISTS idx_field_staff_status;

-- Create indexes for better performance
CREATE INDEX idx_field_staff_company_id ON field_staff(company_id);
CREATE INDEX idx_field_staff_staff_code ON field_staff(staff_code);
CREATE INDEX idx_field_staff_email ON field_staff(email);
CREATE INDEX idx_field_staff_status ON field_staff(status);

-- Grant necessary permissions
GRANT ALL ON field_staff TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION change_field_staff_password TO authenticated;