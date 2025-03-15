-- Drop existing policies
DROP POLICY IF EXISTS "Allow public customer registration" ON customers;
DROP POLICY IF EXISTS "Companies can manage customers" ON customers;
DROP POLICY IF EXISTS "Customers can view own data" ON customers;
DROP POLICY IF EXISTS "Admin can manage customers" ON customers;

-- Create simplified policies for customers table
CREATE POLICY "customers_access_policy"
ON customers FOR ALL
TO authenticated
USING (
  -- Admin can access all customers
  auth.jwt() ->> 'email' LIKE '%@admin%'
  -- Companies can access their customers
  OR company_id IN (
    SELECT id FROM companies
    WHERE user_id = auth.uid()
  )
  -- Customers can access their own data
  OR id IN (
    SELECT customer_id FROM customer_users
    WHERE user_id = auth.uid()
  )
);

-- Create policy for public registration
CREATE POLICY "public_customer_registration"
ON customers FOR INSERT
TO public
WITH CHECK (true);

-- Grant necessary permissions
GRANT ALL ON customers TO authenticated;
GRANT INSERT ON customers TO public;