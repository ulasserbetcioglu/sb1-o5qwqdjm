/*
  # Add custom definition types support

  1. New Tables
    - `definition_types`
      - `id` (uuid, primary key)
      - `code` (text, unique per company)
      - `name` (text)
      - `description` (text)
      - `status` (text)
      - `created_at` (timestamptz)
      - `company_id` (uuid, references companies)

  2. Security
    - Enable RLS on `definition_types` table
    - Add policies for companies to manage their own definition types
    - Add unique constraint for code within company scope
*/

-- Create definition types table
CREATE TABLE IF NOT EXISTS definition_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  name text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE definition_types ENABLE ROW LEVEL SECURITY;

-- Companies can view their own definition types
CREATE POLICY "Companies can view own definition types"
  ON definition_types
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT id FROM companies
      WHERE user_id = auth.uid()
    )
  );

-- Companies can create definition types
CREATE POLICY "Companies can create definition types"
  ON definition_types
  FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT id FROM companies
      WHERE user_id = auth.uid()
    )
  );

-- Companies can update their own definition types
CREATE POLICY "Companies can update own definition types"
  ON definition_types
  FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT id FROM companies
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT id FROM companies
      WHERE user_id = auth.uid()
    )
  );

-- Companies can delete their own definition types
CREATE POLICY "Companies can delete own definition types"
  ON definition_types
  FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT id FROM companies
      WHERE user_id = auth.uid()
    )
  );

-- Add unique constraint for code within company scope
ALTER TABLE definition_types
ADD CONSTRAINT unique_definition_type_code_per_company UNIQUE (company_id, code);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_definition_types_code ON definition_types(code);