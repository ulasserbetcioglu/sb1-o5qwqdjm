-- Drop existing function if it exists
DROP FUNCTION IF EXISTS change_customer_password;

-- Create improved function to change customer password
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
  -- Get customer details and verify permissions
  SELECT 
    cu.user_id,
    c.company_id
  INTO 
    v_user_id,
    v_company_id
  FROM customers c
  LEFT JOIN customer_users cu ON cu.customer_id = c.id
  WHERE c.id = p_customer_id
  ORDER BY cu.created_at DESC
  LIMIT 1;

  -- Check if customer exists
  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Customer not found';
  END IF;

  -- Check if customer has a user account
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Customer does not have a user account yet. Please create login credentials first.';
  END IF;

  -- Verify company permission
  IF NOT EXISTS (
    SELECT 1 FROM companies
    WHERE id = v_company_id
    AND user_id = auth.uid()
    AND status = 'approved'
    AND is_active = true
  ) AND NOT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND email LIKE '%@admin%'
  ) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  -- Update password using auth.users table directly
  UPDATE auth.users
  SET encrypted_password = crypt(p_new_password, gen_salt('bf'))
  WHERE id = v_user_id;

  -- Return success
  RETURN;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to update password: %', SQLERRM;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION change_customer_password TO authenticated;