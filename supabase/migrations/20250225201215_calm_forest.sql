-- Drop existing policies and view
DROP POLICY IF EXISTS "customer_users_policy" ON customer_users;
DROP POLICY IF EXISTS "customer_users_select_policy" ON customer_users;
DROP POLICY IF EXISTS "customer_users_insert_policy" ON customer_users;
DROP POLICY IF EXISTS "customer_users_delete_policy" ON customer_users;
DROP VIEW IF EXISTS customer_users_with_email;

-- Enable RLS
ALTER TABLE customer_users ENABLE ROW LEVEL SECURITY;

-- Create separate policies for different operations
CREATE POLICY "customer_users_select"
ON customer_users FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR auth.jwt() ->> 'email' LIKE '%@admin%'
  OR customer_id IN (
    SELECT c.id FROM customers c
    WHERE c.company_id IN (
      SELECT id FROM companies
      WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "customer_users_insert"
ON customer_users FOR INSERT
TO authenticated
WITH CHECK (
  auth.jwt() ->> 'email' LIKE '%@admin%'
  OR customer_id IN (
    SELECT c.id FROM customers c
    WHERE c.company_id IN (
      SELECT id FROM companies
      WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "customer_users_delete"
ON customer_users FOR DELETE
TO authenticated
USING (
  auth.jwt() ->> 'email' LIKE '%@admin%'
  OR customer_id IN (
    SELECT c.id FROM customers c
    WHERE c.company_id IN (
      SELECT id FROM companies
      WHERE user_id = auth.uid()
    )
  )
);

-- Create basic view without RLS checks (policies will handle access control)
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
GRANT ALL ON customer_users TO authenticated;
GRANT SELECT ON customer_users_with_email TO authenticated;