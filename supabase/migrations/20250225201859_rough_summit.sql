-- Drop existing policies
DROP POLICY IF EXISTS "customer_users_select" ON customer_users;
DROP POLICY IF EXISTS "customer_users_insert" ON customer_users;
DROP POLICY IF EXISTS "customer_users_delete" ON customer_users;
DROP POLICY IF EXISTS "customers_select" ON customers;
DROP POLICY IF EXISTS "customers_insert" ON customers;
DROP POLICY IF EXISTS "customers_update" ON customers;
DROP POLICY IF EXISTS "customers_delete" ON customers;
DROP POLICY IF EXISTS "customers_public_insert" ON customers;

-- Create non-recursive policy for customer_users
CREATE POLICY "customer_users_access"
ON customer_users FOR ALL
TO authenticated
USING (
  -- Admin access
  auth.jwt() ->> 'email' LIKE '%@admin%'
  -- User's own data
  OR user_id = auth.uid()
  -- Company access (non-recursive)
  OR EXISTS (
    SELECT 1 
    FROM companies c
    JOIN customers cust ON cust.company_id = c.id
    WHERE cust.id = customer_users.customer_id
    AND c.user_id = auth.uid()
  )
);

-- Create non-recursive policies for customers
CREATE POLICY "customers_access"
ON customers FOR ALL
TO authenticated
USING (
  -- Admin access
  auth.jwt() ->> 'email' LIKE '%@admin%'
  -- Company access
  OR company_id IN (
    SELECT id 
    FROM companies 
    WHERE user_id = auth.uid()
  )
  -- Customer's own access (non-recursive)
  OR EXISTS (
    SELECT 1 
    FROM customer_users cu 
    WHERE cu.customer_id = customers.id 
    AND cu.user_id = auth.uid()
  )
);

-- Allow public registration
CREATE POLICY "customers_public_insert"
ON customers FOR INSERT
TO public
WITH CHECK (true);

-- Recreate the view without recursive checks
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