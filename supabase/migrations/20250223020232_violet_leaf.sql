/*
  # Add Paid Products and Materials

  1. New Tables
    - `paid_products`
      - `id` (uuid, primary key)
      - `code` (text, unique)
      - `name` (text)
      - `description` (text)
      - `unit` (text)
      - `price` (numeric)
      - `status` (text)
      - `created_at` (timestamptz)
      - `company_id` (uuid, foreign key)

  2. Security
    - Enable RLS on `paid_products` table
    - Add policies for companies to manage their own products
*/

CREATE TABLE IF NOT EXISTS paid_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  name text NOT NULL,
  description text,
  unit text NOT NULL,
  price numeric(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE paid_products ENABLE ROW LEVEL SECURITY;

-- Companies can view their own products
CREATE POLICY "Companies can view own products"
  ON paid_products
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT id FROM companies
      WHERE user_id = auth.uid()
    )
  );

-- Companies can create products
CREATE POLICY "Companies can create products"
  ON paid_products
  FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT id FROM companies
      WHERE user_id = auth.uid()
    )
  );

-- Companies can update their own products
CREATE POLICY "Companies can update own products"
  ON paid_products
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

-- Companies can delete their own products
CREATE POLICY "Companies can delete own products"
  ON paid_products
  FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT id FROM companies
      WHERE user_id = auth.uid()
    )
  );

-- Add unique constraint for code within company scope
ALTER TABLE paid_products
ADD CONSTRAINT unique_product_code_per_company UNIQUE (company_id, code);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_paid_products_code ON paid_products(code);