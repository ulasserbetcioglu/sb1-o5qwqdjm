/*
  # Customer Self Registration System

  1. Changes
    - Add customer_users table to manage customer authentication
    - Add RLS policies for customer access
    - Add constraints and indexes
*/

-- Create customer_users table
CREATE TABLE IF NOT EXISTS customer_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, customer_id)
);

-- Enable RLS
ALTER TABLE customer_users ENABLE ROW LEVEL SECURITY;

-- Customers can view their own connections
CREATE POLICY "Customers can view own connections"
  ON customer_users
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Companies can view their customer connections
CREATE POLICY "Companies can view customer connections"
  ON customer_users
  FOR SELECT
  TO authenticated
  USING (
    customer_id IN (
      SELECT c.id FROM customers c
      JOIN companies comp ON c.company_id = comp.id
      WHERE comp.user_id = auth.uid()
    )
  );

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_customer_users_user_id ON customer_users(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_users_customer_id ON customer_users(customer_id);