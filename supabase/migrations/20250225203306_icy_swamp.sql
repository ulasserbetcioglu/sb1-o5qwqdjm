-- Drop existing policies
DROP POLICY IF EXISTS "customers_base_access" ON customers;
DROP POLICY IF EXISTS "customer_users_base_access" ON customer_users;
DROP POLICY IF EXISTS "customers_public_insert" ON customers;

-- Create simplified policy for customers
CREATE POLICY "customers_policy"
ON customers FOR ALL
TO authenticated
USING (
  -- Admin access
  auth.jwt() ->> 'email' LIKE '%@admin%'
  -- Company access (direct)
  OR EXISTS (
    SELECT 1 FROM companies
    WHERE id = customers.company_id
    AND user_id = auth.uid()
  )
  -- Customer access (direct)
  OR EXISTS (
    SELECT 1 FROM customer_users
    WHERE customer_id = customers.id
    AND user_id = auth.uid()
  )
);

-- Create simplified policy for customer_users
CREATE POLICY "customer_users_policy"
ON customer_users FOR ALL
TO authenticated
USING (
  -- Admin access
  auth.jwt() ->> 'email' LIKE '%@admin%'
  -- Direct user access
  OR user_id = auth.uid()
  -- Company access (direct)
  OR EXISTS (
    SELECT 1 FROM companies c
    JOIN customers cust ON cust.company_id = c.id
    WHERE cust.id = customer_users.customer_id
    AND c.user_id = auth.uid()
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