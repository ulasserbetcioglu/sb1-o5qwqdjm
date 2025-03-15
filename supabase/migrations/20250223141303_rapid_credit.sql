/*
  # Field Staff Management System

  1. New Tables
    - `field_staff`
      - `id` (uuid, primary key)
      - `company_id` (uuid, references companies)
      - `staff_code` (text, unique per company)
      - `name` (text)
      - `email` (text)
      - `phone` (text)
      - `status` (text: pending/approved/rejected)
      - `is_active` (boolean)
      - `rejection_reason` (text, nullable)
      - `created_at` (timestamptz)
      - `user_id` (uuid, references auth.users)

  2. Security
    - Enable RLS on `field_staff` table
    - Add policies for companies to manage their staff
    - Add policies for staff to view their own data
    - Add policies for admin management
*/

-- Create field_staff table
CREATE TABLE field_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  staff_code text NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  is_active boolean NOT NULL DEFAULT false,
  rejection_reason text,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id),
  UNIQUE(company_id, staff_code),
  UNIQUE(company_id, email)
);

-- Enable RLS
ALTER TABLE field_staff ENABLE ROW LEVEL SECURITY;

-- Companies can view their own field staff
CREATE POLICY "Companies can view own field staff"
ON field_staff FOR SELECT
TO authenticated
USING (
  company_id IN (
    SELECT id FROM companies
    WHERE user_id = auth.uid()
  )
);

-- Companies can create field staff
CREATE POLICY "Companies can create field staff"
ON field_staff FOR INSERT
TO authenticated
WITH CHECK (
  company_id IN (
    SELECT id FROM companies
    WHERE user_id = auth.uid()
  )
);

-- Companies can update their field staff
CREATE POLICY "Companies can update own field staff"
ON field_staff FOR UPDATE
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

-- Companies can delete their field staff
CREATE POLICY "Companies can delete own field staff"
ON field_staff FOR DELETE
TO authenticated
USING (
  company_id IN (
    SELECT id FROM companies
    WHERE user_id = auth.uid()
  )
);

-- Field staff can view their own data
CREATE POLICY "Field staff can view own data"
ON field_staff FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
);

-- Admin can manage all field staff
CREATE POLICY "Admin can manage field staff"
ON field_staff FOR ALL
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
CREATE INDEX idx_field_staff_company_id ON field_staff(company_id);
CREATE INDEX idx_field_staff_staff_code ON field_staff(staff_code);
CREATE INDEX idx_field_staff_email ON field_staff(email);
CREATE INDEX idx_field_staff_status ON field_staff(status);