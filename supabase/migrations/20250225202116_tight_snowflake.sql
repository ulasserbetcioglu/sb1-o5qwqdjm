-- Drop existing policies
DROP POLICY IF EXISTS "customer_users_access" ON customer_users;
DROP POLICY IF EXISTS "customers_access" ON customers;
DROP POLICY IF EXISTS "customers_public_insert" ON customers;

-- Create simplified policy for customer_users
CREATE POLICY "customer_users_access"
ON customer_users FOR ALL
TO authenticated
USING (
  -- Admin access
  auth.jwt() ->> 'email' LIKE '%@admin%'
  -- User's own data
  OR user_id = auth.uid()
  -- Company access through direct join
  OR EXISTS (
    SELECT 1 
    FROM companies c
    WHERE c.user_id = auth.uid()
    AND EXISTS (
      SELECT 1 
      FROM customers cust 
      WHERE cust.company_id = c.id 
      AND cust.id = customer_users.customer_id
    )
  )
);

-- Create simplified policy for customers
CREATE POLICY "customers_access"
ON customers FOR ALL
TO authenticated
USING (
  -- Admin access
  auth.jwt() ->> 'email' LIKE '%@admin%'
  -- Company access through direct lookup
  OR EXISTS (
    SELECT 1 
    FROM companies c
    WHERE c.user_id = auth.uid()
    AND c.id = customers.company_id
  )
  -- Customer's own access through direct lookup
  OR EXISTS (
    SELECT 1 
    FROM customer_users cu 
    WHERE cu.user_id = auth.uid()
    AND cu.customer_id = customers.id
  )
);

-- Create separate policy for public customer registration
CREATE POLICY "customers_public_insert"
ON customers FOR INSERT
TO public
WITH CHECK (true);

-- Recreate view with minimal dependencies
DROP VIEW IF EXISTS customer_users_with_email;
CREATE VIEW customer_users_with_email AS
SELECT 
  cu.id,
  cu.user_id,
  cu.customer_id,
  cu.created_at,
  u.email
FROM customer_users cu
JOIN auth.users u ON u.id = cu.user_id;

-- Grant necessary permissions
GRANT ALL ON customers TO authenticated;
GRANT INSERT ON customers TO public;
GRANT ALL ON customer_users TO authenticated;
GRANT SELECT ON customer_users_with_email TO authenticated;