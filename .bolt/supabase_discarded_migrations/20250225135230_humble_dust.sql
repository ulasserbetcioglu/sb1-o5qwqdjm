-- Drop existing policies if they exist
DROP POLICY IF EXISTS "applications_access_policy" ON applications;
DROP POLICY IF EXISTS "application_services_access_policy" ON application_services;
DROP POLICY IF EXISTS "application_equipment_access_policy" ON application_equipment;

-- Create applications table if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'applications') THEN
    CREATE TABLE applications (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
      customer_id uuid REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
      branch_id uuid REFERENCES branches(id) ON DELETE CASCADE NOT NULL,
      application_code text NOT NULL,
      scheduled_date timestamptz NOT NULL,
      status text NOT NULL DEFAULT 'scheduled',
      notes text,
      created_at timestamptz DEFAULT now(),
      created_by uuid REFERENCES auth.users(id),
      assigned_to uuid REFERENCES operators(id),
      UNIQUE(company_id, application_code)
    );
  END IF;

  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'application_services') THEN
    CREATE TABLE application_services (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      application_id uuid REFERENCES applications(id) ON DELETE CASCADE NOT NULL,
      service_type_id uuid REFERENCES service_types(id) ON DELETE RESTRICT NOT NULL,
      quantity numeric NOT NULL,
      unit_type_id uuid REFERENCES unit_types(id) ON DELETE RESTRICT NOT NULL,
      notes text
    );
  END IF;

  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'application_equipment') THEN
    CREATE TABLE application_equipment (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      application_id uuid REFERENCES applications(id) ON DELETE CASCADE NOT NULL,
      equipment_id uuid REFERENCES branch_equipment(id) ON DELETE RESTRICT NOT NULL,
      quantity numeric NOT NULL,
      notes text
    );
  END IF;
END $$;

-- Enable RLS
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_equipment ENABLE ROW LEVEL SECURITY;

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

-- Drop existing indexes if they exist
DROP INDEX IF EXISTS idx_applications_company_id;
DROP INDEX IF EXISTS idx_applications_customer_id;
DROP INDEX IF EXISTS idx_applications_branch_id;
DROP INDEX IF EXISTS idx_applications_assigned_to;
DROP INDEX IF EXISTS idx_applications_status;
DROP INDEX IF EXISTS idx_applications_scheduled_date;
DROP INDEX IF EXISTS idx_application_services_application_id;
DROP INDEX IF EXISTS idx_application_services_service_type_id;
DROP INDEX IF EXISTS idx_application_equipment_application_id;
DROP INDEX IF EXISTS idx_application_equipment_equipment_id;

-- Create indexes for better performance
CREATE INDEX idx_applications_company_id ON applications(company_id);
CREATE INDEX idx_applications_customer_id ON applications(customer_id);
CREATE INDEX idx_applications_branch_id ON applications(branch_id);
CREATE INDEX idx_applications_assigned_to ON applications(assigned_to);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_scheduled_date ON applications(scheduled_date);

CREATE INDEX idx_application_services_application_id ON application_services(application_id);
CREATE INDEX idx_application_services_service_type_id ON application_services(service_type_id);

CREATE INDEX idx_application_equipment_application_id ON application_equipment(application_id);
CREATE INDEX idx_application_equipment_equipment_id ON application_equipment(equipment_id);

-- Grant necessary permissions
GRANT ALL ON applications TO authenticated;
GRANT ALL ON application_services TO authenticated;
GRANT ALL ON application_equipment TO authenticated;