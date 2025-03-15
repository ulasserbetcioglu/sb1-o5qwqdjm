-- Add policy to allow public read access to approved and active companies
CREATE POLICY "Public can view approved and active companies"
ON companies FOR SELECT
TO public
USING (
  status = 'approved'
  AND is_active = true
);

-- Grant SELECT permission on companies table to public
GRANT SELECT ON companies TO public;