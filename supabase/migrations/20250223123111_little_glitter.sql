-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow public customer registration" ON customers;
DROP POLICY IF EXISTS "Companies can view own customers" ON customers;
DROP POLICY IF EXISTS "Companies can update own customers" ON customers;
DROP POLICY IF EXISTS "Companies can delete own customers" ON customers;
DROP POLICY IF EXISTS "Customers can view own data" ON customers;
DROP POLICY IF EXISTS "Admin can manage customers" ON customers;

-- Create simplified policies that avoid recursion

-- Allow public registration
CREATE POLICY "Allow public customer registration"
ON customers FOR INSERT
TO public
WITH CHECK (true);

-- Companies can manage their customers
CREATE POLICY "Companies can manage customers"
ON customers FOR ALL
TO authenticated
USING (
  company_id IN (
    SELECT id FROM companies
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  company_id IN (
    SELECT id FROM companies
    WHERE user_id = auth.uid()
  )
);

-- Customers can view their own data
CREATE POLICY "Customers can view own data"
ON customers FOR SELECT
TO authenticated
USING (
  email = auth.jwt() ->> 'email'
);

-- Admin can manage all customers
CREATE POLICY "Admin can manage customers"
ON customers FOR ALL
TO authenticated
USING (
  auth.jwt() ->> 'email' LIKE '%@admin%'
)
WITH CHECK (
  auth.jwt() ->> 'email' LIKE '%@admin%'
);