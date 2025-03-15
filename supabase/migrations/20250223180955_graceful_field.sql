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
BEGIN
  -- Get operator details and verify permissions
  SELECT 
    op.user_id,
    op.company_id
  INTO 
    v_user_id,
    v_company_id
  FROM operators op
  WHERE op.id = p_operator_id;

  -- Check if operator exists
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Operator not found';
  END IF;

  -- Verify company permission
  IF NOT EXISTS (
    SELECT 1 FROM companies c
    WHERE c.id = v_company_id
    AND c.user_id = auth.uid()
  ) AND NOT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND email LIKE '%@admin%'
  ) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  -- Update password using auth.admin_update_user_by_id
  PERFORM auth.admin_update_user_by_id(
    v_user_id,
    jsonb_build_object('password', p_new_password)
  );

  -- Return success
  RETURN;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error details
    RAISE NOTICE 'Error changing operator password: %', SQLERRM;
    RAISE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION change_operator_password TO authenticated;