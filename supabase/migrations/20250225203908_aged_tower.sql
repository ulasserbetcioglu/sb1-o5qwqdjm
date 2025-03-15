-- Drop existing policies
DROP POLICY IF EXISTS "admin_customers_policy" ON customers;
DROP POLICY IF EXISTS "company_customers_policy" ON customers;
DROP POLICY IF EXISTS "user_customers_policy" ON customers;
DROP POLICY IF EXISTS "customers_public_insert" ON customers;
DROP POLICY IF EXISTS "admin_customer_users_policy" ON customer_users;
DROP POLICY IF EXISTS "company_customer_users_policy" ON customer_users;
DROP POLICY IF EXISTS "user_customer_users_policy" ON customer_users;

-- Create a single policy for customers
CREATE POLICY "customers_access_policy"
ON customers FOR ALL
TO authenticated
USING (
  -- Admin access
  auth.jwt() ->> 'email' LIKE '%@admin%'
  -- Company access
  OR company_id IN (
    SELECT id FROM companies
    WHERE user_id = auth.uid()
  )
  -- Customer access
  OR id IN (
    SELECT customer_id FROM customer_users
    WHERE user_id = auth.uid()
  )
);

-- Create a single policy for customer_users
CREATE POLICY "customer_users_access_policy"
ON customer_users FOR ALL
TO authenticated
USING (
  -- Admin access
  auth.jwt() ->> 'email' LIKE '%@admin%'
  -- Direct user access
  OR user_id = auth.uid()
  -- Company access
  OR customer_id IN (
    SELECT id FROM customers c
    WHERE c.company_id IN (
      SELECT id FROM companies
      WHERE user_id = auth.uid()
    )
  )
);

-- Allow public registration
CREATE POLICY "customers_public_insert"
ON customers FOR INSERT
TO public
WITH CHECK (true);

-- Grant necessary permissions
GRANT ALL ON customers TO authenticated;
GRANT INSERT ON customers TO public;
GRANT ALL ON customer_users TO authenticated;