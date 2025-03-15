/*
  # Update paid products table and policies

  This migration ensures the paid_products table exists and has the correct policies,
  dropping existing policies first to avoid conflicts.
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Companies can view own products" ON paid_products;
DROP POLICY IF EXISTS "Companies can create products" ON paid_products;
DROP POLICY IF EXISTS "Companies can update own products" ON paid_products;
DROP POLICY IF EXISTS "Companies can delete own products" ON paid_products;

-- Create or update the table
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

-- Recreate policies
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

-- Add unique constraint for code within company scope if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_product_code_per_company'
  ) THEN
    ALTER TABLE paid_products
    ADD CONSTRAINT unique_product_code_per_company UNIQUE (company_id, code);
  END IF;
END $$;

-- Add index for faster lookups if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_paid_products_code ON paid_products(code);