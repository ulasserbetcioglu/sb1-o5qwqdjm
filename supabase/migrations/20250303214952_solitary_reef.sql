-- Drop existing policy if it exists
DROP POLICY IF EXISTS "definitions_access_policy" ON definitions;

-- Create definitions table for equipment types
CREATE TABLE IF NOT EXISTS definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL,
  code text NOT NULL,
  name text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, type, code)
);

-- Enable RLS
ALTER TABLE definitions ENABLE ROW LEVEL SECURITY;

-- Create policy for definitions
CREATE POLICY "definitions_access_policy"
ON definitions FOR ALL
TO authenticated
USING (
  -- Admin access
  auth.jwt() ->> 'email' LIKE '%@admin%'
  -- Company access
  OR company_id IN (
    SELECT id FROM companies
    WHERE user_id = auth.uid()
  )
  -- Operator access
  OR company_id IN (
    SELECT company_id FROM operators
    WHERE user_id = auth.uid()
  )
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_definitions_company_id ON definitions(company_id);
CREATE INDEX IF NOT EXISTS idx_definitions_type ON definitions(type);
CREATE INDEX IF NOT EXISTS idx_definitions_code ON definitions(code);

-- Grant necessary permissions
GRANT ALL ON definitions TO authenticated;