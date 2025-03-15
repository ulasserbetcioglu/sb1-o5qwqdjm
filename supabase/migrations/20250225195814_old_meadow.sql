-- Drop existing policies
DROP POLICY IF EXISTS "Public can view approved and active companies" ON companies;
DROP POLICY IF EXISTS "Admin can view all companies" ON companies;

-- Create simplified policies for companies table
CREATE POLICY "companies_access_policy"
ON companies FOR ALL
TO authenticated
USING (
  -- Company owners can access their own company
  user_id = auth.uid()
  -- Admins can access all companies
  OR auth.jwt() ->> 'email' LIKE '%@admin%'
);

-- Create policy for public access to approved and active companies
CREATE POLICY "public_companies_view_policy"
ON companies FOR SELECT
TO public
USING (
  status = 'approved'
  AND is_active = true
);

-- Grant necessary permissions
GRANT SELECT ON companies TO public;
GRANT ALL ON companies TO authenticated;