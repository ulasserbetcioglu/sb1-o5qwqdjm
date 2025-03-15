/*
  # Create Definition Tables

  1. New Tables
    - service_types: İlaçlama hizmet türleri
    - unit_types: Ölçü birimleri
    - package_types: Hizmet paketleri
    - document_types: Evrak türleri
    - staff_types: Personel türleri

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Add unique constraints for codes within company scope
    - Add indexes for faster lookups
*/

-- Create service types table
CREATE TABLE IF NOT EXISTS service_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  name text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE
);

ALTER TABLE service_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Companies can view own service types"
  ON service_types FOR SELECT TO authenticated
  USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

CREATE POLICY "Companies can create service types"
  ON service_types FOR INSERT TO authenticated
  WITH CHECK (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

CREATE POLICY "Companies can update own service types"
  ON service_types FOR UPDATE TO authenticated
  USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()))
  WITH CHECK (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

CREATE POLICY "Companies can delete own service types"
  ON service_types FOR DELETE TO authenticated
  USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

ALTER TABLE service_types
ADD CONSTRAINT unique_service_type_code_per_company UNIQUE (company_id, code);

CREATE INDEX IF NOT EXISTS idx_service_types_code ON service_types(code);

-- Create unit types table
CREATE TABLE IF NOT EXISTS unit_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  name text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE
);

ALTER TABLE unit_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Companies can view own unit types"
  ON unit_types FOR SELECT TO authenticated
  USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

CREATE POLICY "Companies can create unit types"
  ON unit_types FOR INSERT TO authenticated
  WITH CHECK (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

CREATE POLICY "Companies can update own unit types"
  ON unit_types FOR UPDATE TO authenticated
  USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()))
  WITH CHECK (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

CREATE POLICY "Companies can delete own unit types"
  ON unit_types FOR DELETE TO authenticated
  USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

ALTER TABLE unit_types
ADD CONSTRAINT unique_unit_type_code_per_company UNIQUE (company_id, code);

CREATE INDEX IF NOT EXISTS idx_unit_types_code ON unit_types(code);

-- Create package types table
CREATE TABLE IF NOT EXISTS package_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  name text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE
);

ALTER TABLE package_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Companies can view own package types"
  ON package_types FOR SELECT TO authenticated
  USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

CREATE POLICY "Companies can create package types"
  ON package_types FOR INSERT TO authenticated
  WITH CHECK (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

CREATE POLICY "Companies can update own package types"
  ON package_types FOR UPDATE TO authenticated
  USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()))
  WITH CHECK (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

CREATE POLICY "Companies can delete own package types"
  ON package_types FOR DELETE TO authenticated
  USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

ALTER TABLE package_types
ADD CONSTRAINT unique_package_type_code_per_company UNIQUE (company_id, code);

CREATE INDEX IF NOT EXISTS idx_package_types_code ON package_types(code);

-- Create document types table
CREATE TABLE IF NOT EXISTS document_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  name text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE
);

ALTER TABLE document_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Companies can view own document types"
  ON document_types FOR SELECT TO authenticated
  USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

CREATE POLICY "Companies can create document types"
  ON document_types FOR INSERT TO authenticated
  WITH CHECK (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

CREATE POLICY "Companies can update own document types"
  ON document_types FOR UPDATE TO authenticated
  USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()))
  WITH CHECK (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

CREATE POLICY "Companies can delete own document types"
  ON document_types FOR DELETE TO authenticated
  USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

ALTER TABLE document_types
ADD CONSTRAINT unique_document_type_code_per_company UNIQUE (company_id, code);

CREATE INDEX IF NOT EXISTS idx_document_types_code ON document_types(code);

-- Create staff types table
CREATE TABLE IF NOT EXISTS staff_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  name text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE
);

ALTER TABLE staff_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Companies can view own staff types"
  ON staff_types FOR SELECT TO authenticated
  USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

CREATE POLICY "Companies can create staff types"
  ON staff_types FOR INSERT TO authenticated
  WITH CHECK (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

CREATE POLICY "Companies can update own staff types"
  ON staff_types FOR UPDATE TO authenticated
  USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()))
  WITH CHECK (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

CREATE POLICY "Companies can delete own staff types"
  ON staff_types FOR DELETE TO authenticated
  USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

ALTER TABLE staff_types
ADD CONSTRAINT unique_staff_type_code_per_company UNIQUE (company_id, code);

CREATE INDEX IF NOT EXISTS idx_staff_types_code ON staff_types(code);