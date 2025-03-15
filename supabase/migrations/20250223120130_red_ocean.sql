/*
  # Fix customer users permissions - Final

  1. Changes
    - Drop and recreate customer_users table with proper structure
    - Add proper RLS policies
    - Add necessary indexes
    - Add view for customer users with email

  2. Security
    - Enable RLS
    - Add policies for proper access control
    - Ensure companies can manage their customer users
    - Ensure customers can view their own connections
*/

-- Drop existing table if it exists
DROP TABLE IF EXISTS customer_users CASCADE;

-- Create customer_users table
CREATE TABLE customer_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, customer_id)
);

-- Create a view that includes user email
CREATE OR REPLACE VIEW customer_users_with_email AS
SELECT 
  cu.*,
  u.email
FROM customer_users cu
JOIN auth.users u ON u.id = cu.user_id;

-- Enable RLS
ALTER TABLE customer_users ENABLE ROW LEVEL SECURITY;

-- Companies can create customer_users entries
CREATE POLICY "Companies can create customer_users"
ON customer_users FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM customers c
    JOIN companies comp ON c.company_id = comp.id
    WHERE c.id = customer_id
    AND comp.user_id = auth.uid()
  )
);

-- Companies can view their customer_users
CREATE POLICY "Companies can view customer_users"
ON customer_users FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM customers c
    JOIN companies comp ON c.company_id = comp.id
    WHERE c.id = customer_id
    AND comp.user_id = auth.uid()
  )
);

-- Companies can delete their customer_users
CREATE POLICY "Companies can delete customer_users"
ON customer_users FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM customers c
    JOIN companies comp ON c.company_id = comp.id
    WHERE c.id = customer_id
    AND comp.user_id = auth.uid()
  )
);

-- Customers can view their own connections
CREATE POLICY "Customers can view own customer_users"
ON customer_users FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
);

-- Admin can manage all customer_users
CREATE POLICY "Admin can manage customer_users"
ON customer_users FOR ALL
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
CREATE INDEX IF NOT EXISTS idx_customer_users_user_id ON customer_users(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_users_customer_id ON customer_users(customer_id);