-- Drop the existing function
DROP FUNCTION IF EXISTS change_field_staff_password;

-- Create a new function that uses Supabase's auth.admin_update_user_by_id function
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

  -- Use Supabase's auth.admin_update_user_by_id function
  PERFORM auth.admin_update_user_by_id(
    v_user_id,
    JSONB_BUILD_OBJECT('password', p_new_password)
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION change_field_staff_password TO authenticated;