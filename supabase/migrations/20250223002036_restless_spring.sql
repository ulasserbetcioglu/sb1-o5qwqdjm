/*
  # Update company registration permissions

  1. Changes
    - Drop existing policies and recreate them with proper permissions
    - Add explicit policies for admin access
    - Fix policy conditions for better security

  2. Security
    - Enable RLS on companies table
    - Add policies for:
      - Public company creation
      - User viewing own company
      - Admin viewing all companies
      - Admin updating companies
*/

-- Create companies table if it doesn't exist
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

-- Create new policies with proper permissions
CREATE POLICY "Public can create new companies" 
ON companies FOR INSERT 
TO public 
WITH CHECK (true);

CREATE POLICY "Users can view own company" 
ON companies FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Admin can view all companies" 
ON companies FOR ALL
TO authenticated 
USING (
  auth.jwt() ->> 'email' LIKE '%@admin%'
);

-- Grant necessary permissions
GRANT ALL ON companies TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;