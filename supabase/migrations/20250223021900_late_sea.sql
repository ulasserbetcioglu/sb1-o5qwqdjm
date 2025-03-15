/*
  # Create Equipment Types Table

  1. New Tables
    - `equipment_types`
      - `id` (uuid, primary key)
      - `code` (text, unique per company)
      - `name` (text)
      - `description` (text)
      - `status` (text, default 'active')
      - `created_at` (timestamp)
      - `company_id` (uuid, references companies)

  2. Security
    - Enable RLS on `equipment_types` table
    - Add policies for companies to manage their own equipment types
    - Add unique constraint for code within company scope
    - Add index for faster lookups

  3. Changes
    - Create new table for equipment types
    - Set up all necessary security policies
    - Add constraints and indexes
*/

-- Create equipment types table
CREATE TABLE IF NOT EXISTS equipment_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  name text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE equipment_types ENABLE ROW LEVEL SECURITY;

-- Companies can view their own equipment types
CREATE POLICY "Companies can view own equipment types"
  ON equipment_types
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT id FROM companies
      WHERE user_id = auth.uid()
    )
  );

-- Companies can create equipment types
CREATE POLICY "Companies can create equipment types"
  ON equipment_types
  FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT id FROM companies
      WHERE user_id = auth.uid()
    )
  );

-- Companies can update their own equipment types
CREATE POLICY "Companies can update own equipment types"
  ON equipment_types
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

-- Companies can delete their own equipment types
CREATE POLICY "Companies can delete own equipment types"
  ON equipment_types
  FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT id FROM companies
      WHERE user_id = auth.uid()
    )
  );

-- Add unique constraint for code within company scope
ALTER TABLE equipment_types
ADD CONSTRAINT unique_equipment_type_code_per_company UNIQUE (company_id, code);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_equipment_types_code ON equipment_types(code);