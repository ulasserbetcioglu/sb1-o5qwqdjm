/*
  # Fix customer view and add password management

  1. Changes
    - Drop and recreate customer_users_with_email view with proper security
    - Add function for password management
    - Add necessary permissions

  2. Security
    - View access restricted based on user role
    - Password management function secured with SECURITY DEFINER
*/

-- Drop existing view if it exists
DROP VIEW IF EXISTS customer_users_with_email;

-- Create a secure view for customer users with email
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

-- Create function for companies to update customer passwords
CREATE OR REPLACE FUNCTION update_customer_password(
  customer_id uuid,
  new_password text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_company_id uuid;
BEGIN
  -- Get the user_id for the customer
  SELECT cu.user_id INTO v_user_id
  FROM customer_users cu
  WHERE cu.customer_id = $1;

  -- Get the company_id for the customer
  SELECT c.company_id INTO v_company_id
  FROM customers c
  WHERE c.id = $1;

  -- Check if the requesting user has permission
  IF NOT EXISTS (
    SELECT 1 FROM companies
    WHERE id = v_company_id
    AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  -- Update the password
  IF v_user_id IS NOT NULL THEN
    PERFORM auth.users.update_user(
      v_user_id,
      ARRAY[new_password]::text[]
    );
  ELSE
    RAISE EXCEPTION 'Customer user not found';
  END IF;
END;
$$;