-- Drop existing policies and view
DROP POLICY IF EXISTS "customer_users_select_policy" ON customer_users;
DROP POLICY IF EXISTS "customer_users_insert_policy" ON customer_users;
DROP POLICY IF EXISTS "customer_users_delete_policy" ON customer_users;
DROP VIEW IF EXISTS customer_users_with_email;

-- Create a single comprehensive policy
CREATE POLICY "customer_users_policy"
ON customer_users FOR ALL
TO authenticated
USING (
  -- Admin access
  (auth.jwt() ->> 'email' LIKE '%@admin%')
  -- User's own data
  OR (user_id = auth.uid())
  -- Company access to their customers
  OR (
    customer_id IN (
      SELECT c.id 
      FROM customers c 
      WHERE c.company_id IN (
        SELECT id 
        FROM companies 
        WHERE user_id = auth.uid()
      )
    )
  )
);

-- Create simplified view
CREATE VIEW customer_users_with_email AS
SELECT 
  cu.*,
  u.email
FROM customer_users cu
JOIN auth.users u ON u.id = cu.user_id;

-- Grant permissions
GRANT ALL ON customer_users TO authenticated;
GRANT SELECT ON customer_users_with_email TO authenticated;