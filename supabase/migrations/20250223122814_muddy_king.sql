-- Update RLS policies for customers table

-- First, enable RLS if not already enabled
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Companies can view own customers" ON customers;
DROP POLICY IF EXISTS "Companies can create customers" ON customers;
DROP POLICY IF EXISTS "Companies can update own customers" ON customers;
DROP POLICY IF EXISTS "Companies can delete own customers" ON customers;
DROP POLICY IF EXISTS "Customers can view own data" ON customers;
DROP POLICY IF EXISTS "Admin can update customer status" ON customers;

-- Create new policies

-- Allow public registration
CREATE POLICY "Allow public customer registration"
ON customers FOR INSERT
TO public
WITH CHECK (true);

-- Companies can view their own customers
CREATE POLICY "Companies can view own customers"
ON customers FOR SELECT
TO authenticated
USING (
  company_id IN (
    SELECT id FROM companies
    WHERE user_id = auth.uid()
  )
);

-- Companies can update their own customers
CREATE POLICY "Companies can update own customers"
ON customers FOR UPDATE
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

-- Companies can delete their own customers
CREATE POLICY "Companies can delete own customers"
ON customers FOR DELETE
TO authenticated
USING (
  company_id IN (
    SELECT id FROM companies
    WHERE user_id = auth.uid()
  )
);

-- Customers can view their own data
CREATE POLICY "Customers can view own data"
ON customers FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT customer_id FROM customer_users
    WHERE user_id = auth.uid()
  )
);

-- Admin can manage all customers
CREATE POLICY "Admin can manage customers"
ON customers FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.email LIKE '%@admin%'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.email LIKE '%@admin%'
  )
);