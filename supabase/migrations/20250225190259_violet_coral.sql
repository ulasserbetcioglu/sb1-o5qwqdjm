-- Add rejection_reason column to operators table
ALTER TABLE operators
ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Drop existing table and recreate with all columns
DROP TABLE IF EXISTS operators CASCADE;

CREATE TABLE operators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  status text NOT NULL DEFAULT 'pending',
  is_active boolean NOT NULL DEFAULT false,
  rejection_reason text,
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
    AND status = 'approved'
    AND is_active = true
  )
  -- Operators can access their own data
  OR user_id = auth.uid()
  -- Admins can access all
  OR auth.jwt() ->> 'email' LIKE '%@admin%'
);

-- Grant necessary permissions
GRANT ALL ON operators TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;