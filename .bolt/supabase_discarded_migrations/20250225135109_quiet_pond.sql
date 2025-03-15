-- Drop existing view if it exists
DROP VIEW IF EXISTS applications_with_details;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "applications_access_policy" ON applications;
DROP POLICY IF EXISTS "application_services_access_policy" ON application_services;
DROP POLICY IF EXISTS "application_equipment_access_policy" ON application_equipment;

-- Create view for applications with related data
CREATE VIEW applications_with_details AS
SELECT 
  a.*,
  c.company_name,
  c.company_code,
  cust.name as customer_name,
  cust.customer_code,
  b.name as branch_name,
  b.branch_code,
  o.name as operator_name
FROM applications a
LEFT JOIN companies c ON c.id = a.company_id
LEFT JOIN customers cust ON cust.id = a.customer_id
LEFT JOIN branches b ON b.id = a.branch_id
LEFT JOIN operators o ON o.id = a.assigned_to;

-- Grant access to the view
GRANT SELECT ON applications_with_details TO authenticated;

-- Create policy for applications
CREATE POLICY "applications_access_policy"
ON applications FOR ALL
TO authenticated
USING (
  -- Companies can access their applications
  company_id IN (
    SELECT id FROM companies
    WHERE user_id = auth.uid()
  )
  -- Operators can access their assigned applications
  OR assigned_to IN (
    SELECT id FROM operators
    WHERE user_id = auth.uid()
  )
  -- Customers can access their applications
  OR customer_id IN (
    SELECT customer_id FROM customer_users
    WHERE user_id = auth.uid()
  )
  -- Admins can access all
  OR EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND email LIKE '%@admin%'
  )
);

-- Create policy for application services
CREATE POLICY "application_services_access_policy"
ON application_services FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM applications a
    WHERE a.id = application_id
    AND (
      -- Companies can access their applications
      a.company_id IN (
        SELECT id FROM companies
        WHERE user_id = auth.uid()
      )
      -- Operators can access their assigned applications
      OR a.assigned_to IN (
        SELECT id FROM operators
        WHERE user_id = auth.uid()
      )
      -- Customers can access their applications
      OR a.customer_id IN (
        SELECT customer_id FROM customer_users
        WHERE user_id = auth.uid()
      )
      -- Admins can access all
      OR EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = auth.uid()
        AND email LIKE '%@admin%'
      )
    )
  )
);

-- Create policy for application equipment
CREATE POLICY "application_equipment_access_policy"
ON application_equipment FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM applications a
    WHERE a.id = application_id
    AND (
      -- Companies can access their applications
      a.company_id IN (
        SELECT id FROM companies
        WHERE user_id = auth.uid()
      )
      -- Operators can access their assigned applications
      OR a.assigned_to IN (
        SELECT id FROM operators
        WHERE user_id = auth.uid()
      )
      -- Customers can access their applications
      OR a.customer_id IN (
        SELECT customer_id FROM customer_users
        WHERE user_id = auth.uid()
      )
      -- Admins can access all
      OR EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = auth.uid()
        AND email LIKE '%@admin%'
      )
    )
  )
);

-- Grant necessary permissions
GRANT ALL ON applications TO authenticated;
GRANT ALL ON application_services TO authenticated;
GRANT ALL ON application_equipment TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;