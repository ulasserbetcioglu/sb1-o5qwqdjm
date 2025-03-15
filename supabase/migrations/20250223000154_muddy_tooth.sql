/*
  # Create companies and profiles tables

  1. New Tables
    - `companies`
      - `id` (uuid, primary key)
      - `created_at` (timestamp)
      - `company_name` (text)
      - `contact_name` (text)
      - `email` (text, unique)
      - `phone` (text)
      - `address` (text)
      - `status` (text) - pending, approved, rejected
      - `rejection_reason` (text)
      - `user_id` (uuid, references auth.users)

  2. Security
    - Enable RLS on `companies` table
    - Add policies for:
      - Public can create new companies
      - Authenticated users can read their own company data
      - Admin can read and update all companies
*/

CREATE TABLE companies (
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

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Allow public to create new company registrations
CREATE POLICY "Public can create new companies" 
ON companies FOR INSERT 
TO public 
WITH CHECK (true);

-- Allow users to read their own company data
CREATE POLICY "Users can view own company" 
ON companies FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Allow admin to read all companies
CREATE POLICY "Admin can view all companies" 
ON companies FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.email LIKE '%@admin%'
  )
);

-- Allow admin to update companies
CREATE POLICY "Admin can update companies" 
ON companies FOR UPDATE
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.email LIKE '%@admin%'
  )
);