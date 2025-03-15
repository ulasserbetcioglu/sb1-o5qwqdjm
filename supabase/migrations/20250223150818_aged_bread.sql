-- Drop existing policies
DROP POLICY IF EXISTS "Allow field staff access" ON field_staff;
DROP POLICY IF EXISTS "Companies manage field staff" ON field_staff;
DROP POLICY IF EXISTS "Staff view own data" ON field_staff;
DROP POLICY IF EXISTS "Admin manage all staff" ON field_staff;

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
  OR EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND email LIKE '%@admin%'
  )
);

-- Grant necessary permissions
GRANT ALL ON field_staff TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;