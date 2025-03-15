-- Create a function to change field staff passwords
CREATE OR REPLACE FUNCTION change_field_staff_password(
  p_staff_id uuid,
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
  SELECT company_id INTO v_company_id
  FROM field_staff
  WHERE id = p_staff_id;

  IF NOT EXISTS (
    SELECT 1 FROM companies
    WHERE id = v_company_id
    AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  -- Get the user_id from field_staff
  SELECT user_id INTO v_user_id
  FROM field_staff
  WHERE id = p_staff_id;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Field staff user not found';
  END IF;

  -- Update the user's password
  UPDATE auth.users
  SET encrypted_password = crypt(p_new_password, gen_salt('bf'))
  WHERE id = v_user_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION change_field_staff_password TO authenticated;