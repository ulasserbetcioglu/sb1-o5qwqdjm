/*
  # Customer Authentication Setup

  1. Changes
    - Add customer_auth table to manage customer authentication
    - Add RLS policies for customer authentication
    - Add helper functions for customer management

  2. Security
    - Enable RLS on all tables
    - Add policies for customer access
    - Add policies for company access
*/

-- Create customer_auth table
CREATE TABLE IF NOT EXISTS customer_auth (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, customer_id)
);

-- Enable RLS
ALTER TABLE customer_auth ENABLE ROW LEVEL SECURITY;

-- Companies can create customer auth entries
CREATE POLICY "Companies can create customer auth"
ON customer_auth FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM customers c
    JOIN companies comp ON c.company_id = comp.id
    WHERE c.id = customer_id
    AND comp.user_id = auth.uid()
    AND comp.status = 'approved'
  )
);

-- Companies can view their customer auth
CREATE POLICY "Companies can view customer auth"
ON customer_auth FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM customers c
    JOIN companies comp ON c.company_id = comp.id
    WHERE c.id = customer_id
    AND comp.user_id = auth.uid()
  )
);

-- Customers can view their own auth
CREATE POLICY "Customers can view own auth"
ON customer_auth FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
);

-- Admin can manage all customer auth
CREATE POLICY "Admin can manage customer auth"
ON customer_auth FOR ALL
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

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customer_auth_user_id ON customer_auth(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_auth_customer_id ON customer_auth(customer_id);

-- Helper function to check if a user is a customer
CREATE OR REPLACE FUNCTION is_customer(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM customer_auth
    WHERE user_id = $1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;