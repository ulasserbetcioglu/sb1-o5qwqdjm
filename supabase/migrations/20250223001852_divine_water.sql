/*
  # Create companies table with proper permissions

  1. Tables
    - `companies`
      - `id` (uuid, primary key)
      - `created_at` (timestamptz)
      - `company_name` (text)
      - `contact_name` (text)
      - `email` (text, unique)
      - `phone` (text)
      - `address` (text)
      - `status` (text)
      - `rejection_reason` (text)
      - `user_id` (uuid, foreign key)

  2. Security
    - Enable RLS on companies table
    - Policies for:
      - Public insert access for registration
      - Users can view their own company
      - Admins can view and update all companies
*/

CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  company_name text NOT NULL,
  contact_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text NOT NULL,
  address text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  rejection_reason text,
  user_id uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can create new companies" ON companies;
DROP POLICY IF EXISTS "Users can view own company" ON companies;
DROP POLICY IF EXISTS "Admin can view all companies" ON companies;
DROP POLICY IF EXISTS "Admin can update companies" ON companies;

-- Create new policies
CREATE POLICY "Public can create new companies" 
ON companies FOR INSERT 
TO public 
WITH CHECK (true);

CREATE POLICY "Users can view own company" 
ON companies FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Admin can view all companies" 
ON companies FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email LIKE '%@admin%'
  )
);

CREATE POLICY "Admin can update companies" 
ON companies FOR UPDATE
TO authenticated 
USING (
  EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email LIKE '%@admin%'
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email LIKE '%@admin%'
  )
);