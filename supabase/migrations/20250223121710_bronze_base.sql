/*
  # Fix customer view error handling

  1. Changes
    - Recreate customer_users_with_email view with proper error handling
    - Add necessary permissions and security checks

  2. Security
    - View access restricted based on user role
    - Row-level security enforced through view definition
*/

-- Drop existing view if it exists
DROP VIEW IF EXISTS customer_users_with_email;

-- Create a secure view for customer users with email
CREATE VIEW customer_users_with_email AS
SELECT DISTINCT ON (cu.customer_id)
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
)
ORDER BY cu.customer_id, cu.created_at DESC;

-- Grant necessary permissions
GRANT SELECT ON customer_users_with_email TO authenticated;