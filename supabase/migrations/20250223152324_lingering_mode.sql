/*
  # Applications Management System

  1. New Tables
    - `applications`
      - `id` (uuid, primary key)
      - `company_id` (uuid): Company performing the application
      - `customer_id` (uuid): Customer receiving the application
      - `branch_id` (uuid): Branch where application is performed
      - `application_code` (text): Unique application code
      - `scheduled_date` (timestamptz): When the application is scheduled
      - `status` (text): Current status (scheduled, in_progress, completed, cancelled)
      - `notes` (text): Additional notes
      - `created_at` (timestamptz)
      - `created_by` (uuid): User who created the application
      - `assigned_to` (uuid): Field staff assigned to the application
      
    - `application_services`
      - `id` (uuid, primary key)
      - `application_id` (uuid): Reference to application
      - `service_type_id` (uuid): Type of service performed
      - `quantity` (numeric): Amount of service
      - `unit_type_id` (uuid): Unit of measurement
      - `notes` (text): Service-specific notes
      
    - `application_equipment`
      - `id` (uuid, primary key)
      - `application_id` (uuid): Reference to application
      - `equipment_id` (uuid): Equipment used
      - `quantity` (numeric): Amount of equipment used
      - `notes` (text): Equipment usage notes

  2. Security
    - RLS policies for all tables
    - Companies can manage their own applications
    - Field staff can view and update assigned applications
    - Customers can view their own applications
*/

-- Create applications table
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
  assigned_to uuid REFERENCES field_staff(id),
  UNIQUE(company_id, application_code)
);

-- Create application services table
CREATE TABLE application_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES applications(id) ON DELETE CASCADE NOT NULL,
  service_type_id uuid REFERENCES service_types(id) ON DELETE RESTRICT NOT NULL,
  quantity numeric NOT NULL,
  unit_type_id uuid REFERENCES unit_types(id) ON DELETE RESTRICT NOT NULL,
  notes text
);

-- Create application equipment table
CREATE TABLE application_equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES applications(id) ON DELETE CASCADE NOT NULL,
  equipment_id uuid REFERENCES branch_equipment(id) ON DELETE RESTRICT NOT NULL,
  quantity numeric NOT NULL,
  notes text
);

-- Enable RLS
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_equipment ENABLE ROW LEVEL SECURITY;

-- Companies can manage their applications
CREATE POLICY "Companies can manage applications"
ON applications FOR ALL
TO authenticated
USING (
  company_id IN (
    SELECT id FROM companies
    WHERE user_id = auth.uid()
  )
);

-- Field staff can view and update assigned applications
CREATE POLICY "Field staff can view assigned applications"
ON applications FOR SELECT
TO authenticated
USING (
  assigned_to IN (
    SELECT id FROM field_staff
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Field staff can update assigned applications"
ON applications FOR UPDATE
TO authenticated
USING (
  assigned_to IN (
    SELECT id FROM field_staff
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  assigned_to IN (
    SELECT id FROM field_staff
    WHERE user_id = auth.uid()
  )
  AND status IN ('in_progress', 'completed')
);

-- Customers can view their applications
CREATE POLICY "Customers can view applications"
ON applications FOR SELECT
TO authenticated
USING (
  customer_id IN (
    SELECT customer_id FROM customer_users
    WHERE user_id = auth.uid()
  )
);

-- Companies can manage application services
CREATE POLICY "Companies can manage application services"
ON application_services FOR ALL
TO authenticated
USING (
  application_id IN (
    SELECT id FROM applications
    WHERE company_id IN (
      SELECT id FROM companies
      WHERE user_id = auth.uid()
    )
  )
);

-- Field staff can view application services
CREATE POLICY "Field staff can view application services"
ON application_services FOR SELECT
TO authenticated
USING (
  application_id IN (
    SELECT id FROM applications
    WHERE assigned_to IN (
      SELECT id FROM field_staff
      WHERE user_id = auth.uid()
    )
  )
);

-- Customers can view application services
CREATE POLICY "Customers can view application services"
ON application_services FOR SELECT
TO authenticated
USING (
  application_id IN (
    SELECT id FROM applications
    WHERE customer_id IN (
      SELECT customer_id FROM customer_users
      WHERE user_id = auth.uid()
    )
  )
);

-- Companies can manage application equipment
CREATE POLICY "Companies can manage application equipment"
ON application_equipment FOR ALL
TO authenticated
USING (
  application_id IN (
    SELECT id FROM applications
    WHERE company_id IN (
      SELECT id FROM companies
      WHERE user_id = auth.uid()
    )
  )
);

-- Field staff can view application equipment
CREATE POLICY "Field staff can view application equipment"
ON application_equipment FOR SELECT
TO authenticated
USING (
  application_id IN (
    SELECT id FROM applications
    WHERE assigned_to IN (
      SELECT id FROM field_staff
      WHERE user_id = auth.uid()
    )
  )
);

-- Customers can view application equipment
CREATE POLICY "Customers can view application equipment"
ON application_equipment FOR SELECT
TO authenticated
USING (
  application_id IN (
    SELECT id FROM applications
    WHERE customer_id IN (
      SELECT customer_id FROM customer_users
      WHERE user_id = auth.uid()
    )
  )
);

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