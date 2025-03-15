/*
  # Update Biocidal Products Documentation Schema

  1. Changes
    - Drop existing tables with dependencies
    - Recreate biocidal_products table with updated schema
    - Add necessary indexes and policies
    
  2. Security
    - Enable RLS
    - Add policies for admin access and viewing
*/

-- Drop dependent tables first
DROP TABLE IF EXISTS public.biocidal_product_documents CASCADE;
DROP TABLE IF EXISTS public.biocidal_products CASCADE;

-- Create biocidal products table
CREATE TABLE public.biocidal_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name text NOT NULL,
  manufacturer text NOT NULL,
  product_type text NOT NULL,
  active_ingredients text[] NOT NULL DEFAULT '{}',
  active_ingredient_amounts text[] NOT NULL DEFAULT '{}',
  license_date date NOT NULL,
  license_number text NOT NULL UNIQUE,
  license_expiry_date date NOT NULL,
  msds_url text,
  license_url text,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  is_active boolean DEFAULT true NOT NULL
);

-- Enable RLS
ALTER TABLE public.biocidal_products ENABLE ROW LEVEL SECURITY;

-- Admin can manage all products
CREATE POLICY "Admin can manage biocidal products"
  ON public.biocidal_products
  TO authenticated
  USING ((auth.jwt() ->> 'email'::text) LIKE '%@admin%')
  WITH CHECK ((auth.jwt() ->> 'email'::text) LIKE '%@admin%');

-- Companies and customers can view active products
CREATE POLICY "Companies and customers can view active products"
  ON public.biocidal_products
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Create indexes
CREATE INDEX idx_biocidal_products_product_name 
  ON public.biocidal_products(product_name);

CREATE INDEX idx_biocidal_products_manufacturer 
  ON public.biocidal_products(manufacturer);

CREATE INDEX idx_biocidal_products_license_number 
  ON public.biocidal_products(license_number);

CREATE INDEX idx_biocidal_products_license_expiry_date 
  ON public.biocidal_products(license_expiry_date);

CREATE INDEX idx_biocidal_products_is_active 
  ON public.biocidal_products(is_active);

-- Add comment
COMMENT ON TABLE public.biocidal_products IS 'Stores biocidal product information including licensing and documentation';

-- Recreate biocidal_product_documents table
CREATE TABLE public.biocidal_product_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.biocidal_products(id) ON DELETE CASCADE,
  document_type text NOT NULL CHECK (document_type = ANY (ARRAY['msds'::text, 'license'::text])),
  file_name text NOT NULL,
  file_url text NOT NULL,
  upload_date timestamptz DEFAULT now(),
  expiry_date date,
  uploaded_by uuid REFERENCES auth.users(id),
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS for documents
ALTER TABLE public.biocidal_product_documents ENABLE ROW LEVEL SECURITY;

-- Create document policies
CREATE POLICY "Admin can manage documents"
  ON public.biocidal_product_documents
  TO authenticated
  USING ((auth.jwt() ->> 'email'::text) LIKE '%@admin%')
  WITH CHECK ((auth.jwt() ->> 'email'::text) LIKE '%@admin%');

CREATE POLICY "Companies and customers can view active documents"
  ON public.biocidal_product_documents
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Create document indexes
CREATE INDEX idx_biocidal_product_documents_product_id
  ON public.biocidal_product_documents(product_id);

CREATE INDEX idx_biocidal_product_documents_document_type
  ON public.biocidal_product_documents(document_type);

CREATE INDEX idx_biocidal_product_documents_expiry_date
  ON public.biocidal_product_documents(expiry_date);

CREATE INDEX idx_biocidal_product_documents_is_active
  ON public.biocidal_product_documents(is_active);

-- Create unique index to prevent duplicate active documents of same type for a product
CREATE UNIQUE INDEX idx_unique_document_type_per_product
  ON public.biocidal_product_documents(product_id, document_type)
  WHERE (is_active = true);

-- Add trigger to deactivate old documents when new ones are added
CREATE OR REPLACE FUNCTION deactivate_old_documents()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = true THEN
    UPDATE public.biocidal_product_documents
    SET is_active = false
    WHERE product_id = NEW.product_id
      AND document_type = NEW.document_type
      AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_deactivate_old_documents
  BEFORE INSERT OR UPDATE ON public.biocidal_product_documents
  FOR EACH ROW
  WHEN (NEW.is_active = true)
  EXECUTE FUNCTION deactivate_old_documents();