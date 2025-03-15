-- Drop existing view if it exists
DROP VIEW IF EXISTS customer_users_with_email;

-- Create a secure view for customer users with email
CREATE OR REPLACE VIEW customer_users_with_email AS
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
  -- Customers can view their own data
  OR cu.user_id = auth.uid()
  -- Admins can view all
  OR EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.email LIKE '%@admin%'
  )
);

-- Grant necessary permissions
GRANT SELECT ON customer_users_with_email TO authenticated;