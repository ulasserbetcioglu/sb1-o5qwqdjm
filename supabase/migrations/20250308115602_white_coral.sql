/*
  # Biocidal Products and Documents Management

  1. New Tables
    - `biocidal_products`
      - `id` (uuid, primary key)
      - `report_id` (uuid, foreign key)
      - `product_name` (text)
      - `dosage` (text)
      - `created_at` (timestamptz)
      - `is_active` (boolean)

  2. Security
    - Enable RLS
    - Add policy for access control based on report access

  3. Indexes
    - report_id (foreign key lookup)
    - product_name (search)
    - is_active (filtering)
*/

-- Create biocidal products table if it doesn't exist
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS public.biocidal_products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id uuid NOT NULL,
    product_name text NOT NULL,
    dosage text NOT NULL,
    created_at timestamptz DEFAULT now(),
    is_active boolean DEFAULT true NOT NULL,
    FOREIGN KEY (report_id) REFERENCES inspection_reports(id) ON DELETE CASCADE
  );
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

-- Enable RLS if not already enabled
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'biocidal_products' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.biocidal_products ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Drop existing policy if it exists and create new one
DO $$ BEGIN
  DROP POLICY IF EXISTS "biocidal_products_access_policy" ON public.biocidal_products;
  
  CREATE POLICY "biocidal_products_access_policy"
    ON public.biocidal_products
    TO authenticated
    USING (
      report_id IN (
        SELECT inspection_reports.id 
        FROM inspection_reports
        WHERE inspection_reports.application_id IN (
          SELECT applications.id
          FROM applications
          WHERE (
            applications.company_id IN (
              SELECT companies.id
              FROM companies
              WHERE companies.user_id = auth.uid()
            ) OR
            applications.operator_id IN (
              SELECT operators.id
              FROM operators
              WHERE operators.user_id = auth.uid()
              AND operators.status = 'approved'
              AND operators.is_active = true
            ) OR
            applications.customer_id IN (
              SELECT customer_users.customer_id
              FROM customer_users
              WHERE customer_users.user_id = auth.uid()
            )
          )
        )
      )
    );
END $$;

-- Create indexes if they don't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_biocidal_products_report_id'
  ) THEN
    CREATE INDEX idx_biocidal_products_report_id 
      ON public.biocidal_products(report_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_biocidal_products_product_name'
  ) THEN
    CREATE INDEX idx_biocidal_products_product_name 
      ON public.biocidal_products(product_name);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_biocidal_products_is_active'
  ) THEN
    CREATE INDEX idx_biocidal_products_is_active 
      ON public.biocidal_products(is_active);
  END IF;
END $$;