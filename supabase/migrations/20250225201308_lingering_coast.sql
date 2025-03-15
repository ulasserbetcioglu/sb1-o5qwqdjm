-- Drop existing policies
DROP POLICY IF EXISTS "customers_access_policy" ON customers;
DROP POLICY IF EXISTS "public_customer_registration" ON customers;

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Create separate policies for different operations
CREATE POLICY "customers_select"
ON customers FOR SELECT
TO authenticated
USING (
  -- Admin can view all
  auth.jwt() ->> 'email' LIKE '%@admin%'
  -- Companies can view their customers
  OR company_id IN (
    SELECT id FROM companies
    WHERE user_id = auth.uid()
  )
  -- Customers can view their own data
  OR id IN (
    SELECT customer_id FROM customer_users
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "customers_insert"
ON customers FOR INSERT
TO authenticated
WITH CHECK (
  -- Admin can insert
  auth.jwt() ->> 'email' LIKE '%@admin%'
  -- Companies can insert customers
  OR company_id IN (
    SELECT id FROM companies
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "customers_update"
ON customers FOR UPDATE
TO authenticated
USING (
  -- Admin can update
  auth.jwt() ->> 'email' LIKE '%@admin%'
  -- Companies can update their customers
  OR company_id IN (
    SELECT id FROM companies
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  -- Admin can update
  auth.jwt() ->> 'email' LIKE '%@admin%'
  -- Companies can update their customers
  OR company_id IN (
    SELECT id FROM companies
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "customers_delete"
ON customers FOR DELETE
TO authenticated
USING (
  -- Admin can delete
  auth.jwt() ->> 'email' LIKE '%@admin%'
  -- Companies can delete their customers
  OR company_id IN (
    SELECT id FROM companies
    WHERE user_id = auth.uid()
  )
);

-- Create policy for public registration
CREATE POLICY "customers_public_insert"
ON customers FOR INSERT
TO public
WITH CHECK (true);

-- Grant necessary permissions
GRANT ALL ON customers TO authenticated;
GRANT INSERT ON customers TO public;