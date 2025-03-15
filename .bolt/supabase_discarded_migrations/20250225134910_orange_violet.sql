-- Drop existing table and policies if they exist
DROP TABLE IF EXISTS operators CASCADE;
DROP POLICY IF EXISTS "operators_access_policy" ON operators;

-- Create operators table
CREATE TABLE operators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  status text NOT NULL DEFAULT 'active',
  is_active boolean NOT NULL DEFAULT true,
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, email)
);

-- Enable RLS
ALTER TABLE operators ENABLE ROW LEVEL SECURITY;

-- Create policy for access control
CREATE POLICY "operators_access_policy"
ON operators FOR ALL
TO authenticated
USING (
  -- Companies can access their operators
  company_id IN (
    SELECT id FROM companies
    WHERE user_id = auth.uid()
  )
  -- Operators can access their own data
  OR user_id = auth.uid()
  -- Admins can access all
  OR auth.jwt() ->> 'email' LIKE '%@admin%'
);

-- Create function to change operator password
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
BEGIN
  -- Get user_id and verify permissions in a single query
  SELECT op.user_id INTO v_user_id
  FROM operators op
  JOIN companies c ON c.id = op.company_id
  WHERE op.id = p_operator_id
  AND (
    c.user_id = auth.uid()
    OR auth.jwt() ->> 'email' LIKE '%@admin%'
  );

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Permission denied or operator not found';
  END IF;

  -- Update password using auth.admin_update_user_by_id
  PERFORM auth.admin_update_user_by_id(
    v_user_id,
    jsonb_build_object('password', p_new_password)
  );
END;
$$;

-- Grant necessary permissions
GRANT ALL ON operators TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION change_operator_password TO authenticated;