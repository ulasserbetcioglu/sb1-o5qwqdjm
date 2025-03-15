-- First check if the table exists, if not create it
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'field_staff') THEN
    CREATE TABLE field_staff (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
      staff_code text NOT NULL,
      name text NOT NULL,
      email text NOT NULL,
      phone text NOT NULL,
      status text NOT NULL DEFAULT 'pending',
      is_active boolean NOT NULL DEFAULT false,
      rejection_reason text,
      created_at timestamptz DEFAULT now(),
      user_id uuid REFERENCES auth.users(id),
      UNIQUE(company_id, staff_code),
      UNIQUE(company_id, email)
    );
  END IF;
END $$;

-- Enable RLS if not already enabled
ALTER TABLE field_staff ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Companies can view own field staff" ON field_staff;
DROP POLICY IF EXISTS "Companies can create field staff" ON field_staff;
DROP POLICY IF EXISTS "Companies can update own field staff" ON field_staff;
DROP POLICY IF EXISTS "Companies can delete own field staff" ON field_staff;
DROP POLICY IF EXISTS "Field staff can view own data" ON field_staff;
DROP POLICY IF EXISTS "Admin can manage field staff" ON field_staff;

-- Create new policies
CREATE POLICY "Companies can manage field staff"
ON field_staff FOR ALL
TO authenticated
USING (
  company_id IN (
    SELECT id FROM companies
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  company_id IN (
    SELECT id FROM companies
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Field staff can view own data"
ON field_staff FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
);

CREATE POLICY "Admin can manage field staff"
ON field_staff FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.email LIKE '%@admin%'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.email LIKE '%@admin%'
  )
);

-- Add indexes if they don't exist
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_field_staff_company_id') THEN
    CREATE INDEX idx_field_staff_company_id ON field_staff(company_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_field_staff_staff_code') THEN
    CREATE INDEX idx_field_staff_staff_code ON field_staff(staff_code);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_field_staff_email') THEN
    CREATE INDEX idx_field_staff_email ON field_staff(email);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_field_staff_status') THEN
    CREATE INDEX idx_field_staff_status ON field_staff(status);
  END IF;
END $$;