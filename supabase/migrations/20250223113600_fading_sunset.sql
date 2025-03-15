/*
  # Fix Customer Users RLS Policies

  1. Changes
    - Add proper RLS policies for customer_users table
    - Allow companies to create customer_users entries
    - Allow customers to view their own entries
    - Allow admins to manage all entries

  2. Security
    - Enable RLS on customer_users table
    - Add policies for different user roles
    - Ensure proper access control
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Customers can view own connections" ON customer_users;
DROP POLICY IF EXISTS "Companies can view customer connections" ON customer_users;

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

-- Customers can view their own connections
CREATE POLICY "Customers can view own customer_users"
ON customer_users FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.id = auth.uid()
    AND (u.raw_user_meta_data->>'is_customer')::boolean = true
    AND u.id = user_id
  )
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