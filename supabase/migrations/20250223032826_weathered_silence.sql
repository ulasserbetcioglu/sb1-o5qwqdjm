/*
  # Add customer registration functionality

  1. New Columns
    - Add status column to customers table
    - Add rejection_reason column to customers table
    - Add is_active column to customers table

  2. Security
    - Add RLS policies for customer access
*/

-- Add status and rejection_reason columns if they don't exist
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS rejection_reason text,
ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT false;

-- Add index for faster status lookups
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);

-- Enable RLS for customers
CREATE POLICY "Customers can view own data"
  ON customers
  FOR SELECT
  TO authenticated
  USING (
    email = auth.jwt() ->> 'email'
  );

-- Companies can update their customer status
CREATE POLICY "Companies can update customer status"
  ON customers
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

-- Add auth.users metadata for customer type
ALTER TABLE auth.users
ADD COLUMN IF NOT EXISTS is_customer boolean DEFAULT false;