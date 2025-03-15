-- Drop existing policies
DROP POLICY IF EXISTS "customers_policy" ON customers;
DROP POLICY IF EXISTS "customer_users_policy" ON customer_users;
DROP POLICY IF EXISTS "customers_public_insert" ON customers;

-- Create admin policy for customers
CREATE POLICY "admin_customers_policy"
ON customers FOR ALL
TO authenticated
USING (auth.jwt() ->> 'email' LIKE '%@admin%');

-- Create company policy for customers
CREATE POLICY "company_customers_policy"
ON customers FOR ALL
TO authenticated
USING (
  company_id IN (
    SELECT id FROM companies
    WHERE user_id = auth.uid()
  )
);

-- Create customer policy for customers
CREATE POLICY "user_customers_policy"
ON customers FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT customer_id FROM customer_users
    WHERE user_id = auth.uid()
  )
);

-- Create admin policy for customer_users
CREATE POLICY "admin_customer_users_policy"
ON customer_users FOR ALL
TO authenticated
USING (auth.jwt() ->> 'email' LIKE '%@admin%');

-- Create company policy for customer_users
CREATE POLICY "company_customer_users_policy"
ON customer_users FOR ALL
TO authenticated
USING (
  customer_id IN (
    SELECT id FROM customers
    WHERE company_id IN (
      SELECT id FROM companies
      WHERE user_id = auth.uid()
    )
  )
);

-- Create user policy for customer_users
CREATE POLICY "user_customer_users_policy"
ON customer_users FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Allow public registration
CREATE POLICY "customers_public_insert"
ON customers FOR INSERT
TO public
WITH CHECK (true);

-- Grant necessary permissions
GRANT ALL ON customers TO authenticated;
GRANT INSERT ON customers TO public;
GRANT ALL ON customer_users TO authenticated;