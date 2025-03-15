-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Companies can create customer_users" ON customer_users;
DROP POLICY IF EXISTS "Companies can view customer_users" ON customer_users;
DROP POLICY IF EXISTS "Customers can view own customer_users" ON customer_users;
DROP POLICY IF EXISTS "Admin can manage customer_users" ON customer_users;

-- Enable RLS
ALTER TABLE customer_users ENABLE ROW LEVEL SECURITY;

-- Create simplified policies for customer_users
CREATE POLICY "customer_users_access_policy"
ON customer_users FOR ALL
TO authenticated
USING (
  -- Companies can access their customer users
  customer_id IN (
    SELECT c.id FROM customers c
    JOIN companies comp ON c.company_id = comp.id
    WHERE comp.user_id = auth.uid()
  )
  -- Customers can access their own data
  OR user_id = auth.uid()
  -- Admins can access all
  OR auth.jwt() ->> 'email' LIKE '%@admin%'
);

-- Create secure view for customer users with email
CREATE OR REPLACE VIEW customer_users_with_email AS
SELECT 
  cu.*,
  u.email
FROM customer_users cu
JOIN auth.users u ON u.id = cu.user_id
WHERE (
  -- Companies can view their customer users
  cu.customer_id IN (
    SELECT c.id FROM customers c
    JOIN companies comp ON c.company_id = comp.id
    WHERE comp.user_id = auth.uid()
  )
  -- Customers can view their own data
  OR cu.user_id = auth.uid()
  -- Admins can view all
  OR auth.jwt() ->> 'email' LIKE '%@admin%'
);

-- Grant necessary permissions
GRANT ALL ON customer_users TO authenticated;
GRANT SELECT ON customer_users_with_email TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;