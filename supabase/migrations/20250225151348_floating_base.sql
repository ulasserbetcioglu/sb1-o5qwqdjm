-- Drop existing function
DROP FUNCTION IF EXISTS change_operator_password;

-- Create improved function to change operator password
CREATE OR REPLACE FUNCTION change_operator_password(
  p_operator_id uuid,
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
  v_is_active boolean;
BEGIN
  -- Get operator details and verify permissions
  SELECT 
    op.user_id,
    op.company_id,
    op.is_active
  INTO 
    v_user_id,
    v_company_id,
    v_is_active
  FROM operators op
  WHERE op.id = p_operator_id;

  -- Check if operator exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Operator not found';
  END IF;

  -- Check if operator has a user account
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Operator does not have a user account yet. Please create login credentials first.';
  END IF;

  -- Check if operator is active
  IF NOT v_is_active THEN
    RAISE EXCEPTION 'Cannot change password for inactive operator';
  END IF;

  -- Verify company permission
  IF NOT EXISTS (
    SELECT 1 FROM companies c
    WHERE c.id = v_company_id
    AND c.user_id = auth.uid()
    AND c.status = 'approved'
    AND c.is_active = true
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
GRANT EXECUTE ON FUNCTION change_operator_password TO authenticated;

-- Grant necessary permissions for password update
GRANT UPDATE(encrypted_password) ON auth.users TO postgres;
GRANT EXECUTE ON FUNCTION gen_salt(text) TO postgres;
GRANT EXECUTE ON FUNCTION crypt(text, text) TO postgres;