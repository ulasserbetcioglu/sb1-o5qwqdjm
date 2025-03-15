-- Drop existing policies if they exist
DROP POLICY IF EXISTS "applications_access_policy" ON applications;
DROP POLICY IF EXISTS "application_services_access_policy" ON application_services;
DROP POLICY IF EXISTS "application_equipment_access_policy" ON application_equipment;

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
  OR auth.jwt() ->> 'email' LIKE '%@admin%'
);

-- Create policy for application services
CREATE POLICY "application_services_access_policy"
ON application_services FOR ALL
TO authenticated
USING (
  application_id IN (
    SELECT id FROM applications
    WHERE (
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
      OR auth.jwt() ->> 'email' LIKE '%@admin%'
    )
  )
);

-- Create policy for application equipment
CREATE POLICY "application_equipment_access_policy"
ON application_equipment FOR ALL
TO authenticated
USING (
  application_id IN (
    SELECT id FROM applications
    WHERE (
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
      OR auth.jwt() ->> 'email' LIKE '%@admin%'
    )
  )
);