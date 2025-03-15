-- Create a function to change field staff password
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
BEGIN
  -- Get user_id and verify permissions in a single query
  SELECT fs.user_id INTO v_user_id
  FROM field_staff fs
  WHERE fs.id = p_staff_id
  AND (
    -- Company admin access
    EXISTS (
      SELECT 1 FROM companies c
      WHERE c.id = fs.company_id
      AND c.user_id = auth.uid()
    )
    -- System admin access
    OR EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND email LIKE '%@admin%'
    )
  );

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Permission denied or staff not found';
  END IF;

  -- Update password using auth.users
  UPDATE auth.users
  SET encrypted_password = crypt(p_new_password, gen_salt('bf'))
  WHERE id = v_user_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION change_field_staff_password TO authenticated;