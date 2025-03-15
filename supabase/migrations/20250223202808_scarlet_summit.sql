-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Companies can manage applications" ON applications;
DROP POLICY IF EXISTS "Field staff can view assigned applications" ON applications;
DROP POLICY IF EXISTS "Field staff can update assigned applications" ON applications;
DROP POLICY IF EXISTS "Customers can view applications" ON applications;

-- Enable RLS
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Create simplified policies for applications
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

-- Grant necessary permissions
GRANT ALL ON applications TO authenticated;
GRANT ALL ON application_services TO authenticated;
GRANT ALL ON application_equipment TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;