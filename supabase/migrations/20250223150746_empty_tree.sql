-- Drop existing policies
DROP POLICY IF EXISTS "Allow field staff access" ON field_staff;

-- Create new policy for field staff access
CREATE POLICY "Allow field staff access"
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

-- Create view for field staff with company info
CREATE OR REPLACE VIEW field_staff_view AS
SELECT 
  fs.*,
  c.company_name,
  c.company_code
FROM field_staff fs
JOIN companies c ON c.id = fs.company_id;

-- Grant access to the view
GRANT SELECT ON field_staff_view TO authenticated;

-- Create policy for view access
CREATE POLICY "Allow field staff view access"
ON field_staff_view FOR SELECT
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