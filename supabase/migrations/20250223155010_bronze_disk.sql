/*
  # Create Operators Table and Policies

  1. New Tables
    - `operators`
      - `id` (uuid, primary key)
      - `company_id` (uuid, references companies)
      - `name` (text)
      - `email` (text)
      - `phone` (text)
      - `status` (text)
      - `is_active` (boolean)
      - `user_id` (uuid, references auth.users)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `operators` table
    - Add policies for company access
    - Add policies for operator self-access
    - Add policies for admin access
*/

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
  WHERE op.id = p_operator_id
  AND (
    -- Company admin access
    EXISTS (
      SELECT 1 FROM companies c
      WHERE c.id = op.company_id
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
    RAISE EXCEPTION 'Permission denied or operator not found';
  END IF;

  -- Update password using auth.admin_update_user_by_id
  PERFORM auth.admin_update_user_by_id(
    v_user_id,
    JSONB_BUILD_OBJECT('password', p_new_password)
  );
END;
$$;

-- Grant necessary permissions
GRANT ALL ON operators TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION change_operator_password TO authenticated;