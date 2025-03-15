/*
  # Add branches table and functionality

  1. New Tables
    - `branches`
      - `id` (uuid, primary key)
      - `customer_id` (uuid, references customers)
      - `name` (text)
      - `address` (text)
      - `phone` (text)
      - `email` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `branches` table
    - Add policies for companies to manage their customer branches
*/

-- Create branches table
CREATE TABLE IF NOT EXISTS branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  address text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

-- Companies can view branches of their customers
CREATE POLICY "Companies can view customer branches"
  ON branches
  FOR SELECT
  TO authenticated
  USING (
    customer_id IN (
      SELECT c.id FROM customers c
      JOIN companies comp ON c.company_id = comp.id
      WHERE comp.user_id = auth.uid()
    )
  );

-- Companies can create branches for their customers
CREATE POLICY "Companies can create customer branches"
  ON branches
  FOR INSERT
  TO authenticated
  WITH CHECK (
    customer_id IN (
      SELECT c.id FROM customers c
      JOIN companies comp ON c.company_id = comp.id
      WHERE comp.user_id = auth.uid()
    )
  );

-- Companies can update branches of their customers
CREATE POLICY "Companies can update customer branches"
  ON branches
  FOR UPDATE
  TO authenticated
  USING (
    customer_id IN (
      SELECT c.id FROM customers c
      JOIN companies comp ON c.company_id = comp.id
      WHERE comp.user_id = auth.uid()
    )
  )
  WITH CHECK (
    customer_id IN (
      SELECT c.id FROM customers c
      JOIN companies comp ON c.company_id = comp.id
      WHERE comp.user_id = auth.uid()
    )
  );

-- Companies can delete branches of their customers
CREATE POLICY "Companies can delete customer branches"
  ON branches
  FOR DELETE
  TO authenticated
  USING (
    customer_id IN (
      SELECT c.id FROM customers c
      JOIN companies comp ON c.company_id = comp.id
      WHERE comp.user_id = auth.uid()
    )
  );

-- Create trigger to update customer branch count
CREATE OR REPLACE FUNCTION update_customer_branch_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE customers
    SET branch_count = branch_count + 1
    WHERE id = NEW.customer_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE customers
    SET branch_count = branch_count - 1
    WHERE id = OLD.customer_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_branch_count
AFTER INSERT OR DELETE ON branches
FOR EACH ROW
EXECUTE FUNCTION update_customer_branch_count();