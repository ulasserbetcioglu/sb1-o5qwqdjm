-- Drop existing policies
DROP POLICY IF EXISTS "customer_users_access_policy" ON customer_users;
DROP POLICY IF EXISTS "Companies can create customer_users" ON customer_users;
DROP POLICY IF EXISTS "Companies can view customer_users" ON customer_users;
DROP POLICY IF EXISTS "Customers can view own customer_users" ON customer_users;
DROP POLICY IF EXISTS "Admin can manage customer_users" ON customer_users;

-- Create simplified non-recursive policies
CREATE POLICY "customer_users_select_policy"
ON customer_users FOR SELECT
TO authenticated
USING (
  -- Admin can view all
  auth.jwt() ->> 'email' LIKE '%@admin%'
  -- Users can view their own connections
  OR user_id = auth.uid()
  -- Companies can view their customer connections
  OR EXISTS (
    SELECT 1 FROM customers c
    JOIN companies comp ON c.company_id = comp.id
    WHERE c.id = customer_users.customer_id
    AND comp.user_id = auth.uid()
  )
);

CREATE POLICY "customer_users_insert_policy"
ON customer_users FOR INSERT
TO authenticated
WITH CHECK (
  -- Admin can insert
  auth.jwt() ->> 'email' LIKE '%@admin%'
  -- Companies can create for their customers
  OR EXISTS (
    SELECT 1 FROM customers c
    JOIN companies comp ON c.company_id = comp.id
    WHERE c.id = customer_id
    AND comp.user_id = auth.uid()
  )
);

CREATE POLICY "customer_users_delete_policy"
ON customer_users FOR DELETE
TO authenticated
USING (
  -- Admin can delete
  auth.jwt() ->> 'email' LIKE '%@admin%'
  -- Companies can delete their customer connections
  OR EXISTS (
    SELECT 1 FROM customers c
    JOIN companies comp ON c.company_id = comp.id
    WHERE c.id = customer_id
    AND comp.user_id = auth.uid()
  )
);

-- Drop and recreate the view to avoid recursion
DROP VIEW IF EXISTS customer_users_with_email;

CREATE VIEW customer_users_with_email AS
SELECT 
  cu.id,
  cu.user_id,
  cu.customer_id,
  cu.created_at,
  u.email
FROM customer_users cu
JOIN auth.users u ON u.id = cu.user_id
WHERE (
  -- Companies can view their customer users
  EXISTS (
    SELECT 1 FROM customers c
    JOIN companies comp ON c.company_id = comp.id
    WHERE c.id = cu.customer_id
    AND comp.user_id = auth.uid()
  )
  -- Users can view their own data
  OR cu.user_id = auth.uid()
  -- Admins can view all
  OR auth.jwt() ->> 'email' LIKE '%@admin%'
);

-- Grant necessary permissions
GRANT ALL ON customer_users TO authenticated;
GRANT SELECT ON customer_users_with_email TO authenticated;