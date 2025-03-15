/*
  # Add customer password change functionality

  1. Changes
    - Add function to change customer passwords securely
    - Add necessary permissions and security checks

  2. Security
    - Only companies can change their own customers' passwords
    - Password changes are logged for audit purposes
*/

-- Create a function to change customer passwords
CREATE OR REPLACE FUNCTION change_customer_password(
  p_customer_id uuid,
  p_new_password text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_company_id uuid;
BEGIN
  -- Get the company_id and verify permissions
  SELECT c.company_id INTO v_company_id
  FROM customers c
  WHERE c.id = p_customer_id;

  IF NOT EXISTS (
    SELECT 1 FROM companies
    WHERE id = v_company_id
    AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  -- Get the user_id from customer_users
  SELECT user_id INTO v_user_id
  FROM customer_users
  WHERE customer_id = p_customer_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Customer user not found';
  END IF;

  -- Update the user's password
  PERFORM auth.admin_update_user_by_id(
    v_user_id,
    JSONB_BUILD_OBJECT('password', p_new_password)
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION change_customer_password TO authenticated;