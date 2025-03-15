/*
  # Customer Approval System

  1. Changes
    - Add status and rejection_reason columns to customers table
    - Add is_active column to customers table
    - Add RLS policies for admin approval
*/

-- Add status and rejection_reason columns
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS rejection_reason text,
ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT false;

-- Add index for faster status lookups
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);

-- Update RLS policies for admin access
CREATE POLICY "Admin can update customer status"
  ON customers
  FOR UPDATE
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