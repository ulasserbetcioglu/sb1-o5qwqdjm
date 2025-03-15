-- Drop existing policies
DROP POLICY IF EXISTS "companies_access_policy" ON companies;
DROP POLICY IF EXISTS "public_companies_view_policy" ON companies;
DROP POLICY IF EXISTS "operators_access_policy" ON operators;

-- Create policy for companies table
CREATE POLICY "companies_access_policy"
ON companies FOR ALL
TO authenticated
USING (
  -- Admin can access all companies
  auth.jwt() ->> 'email' LIKE '%@admin%'
  -- Companies can access their own data
  OR user_id = auth.uid()
);

-- Create policy for public access to approved companies
CREATE POLICY "public_companies_view_policy"
ON companies FOR SELECT
TO public
USING (
  status = 'approved'
  AND is_active = true
);

-- Create policy for operators table
CREATE POLICY "operators_access_policy"
ON operators FOR ALL
TO authenticated
USING (
  -- Admin can access all operators
  auth.jwt() ->> 'email' LIKE '%@admin%'
  -- Companies can access their operators
  OR company_id IN (
    SELECT id FROM companies
    WHERE user_id = auth.uid()
  )
  -- Operators can access their own data
  OR user_id = auth.uid()
);

-- Grant necessary permissions
GRANT SELECT ON companies TO public;
GRANT ALL ON companies TO authenticated;
GRANT ALL ON operators TO authenticated;