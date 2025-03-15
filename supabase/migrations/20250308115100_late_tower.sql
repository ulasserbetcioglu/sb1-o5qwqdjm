/*
  # Add biocidal product documents management

  1. New Tables
    - `biocidal_product_documents`
      - `id` (uuid, primary key)
      - `product_id` (uuid, foreign key to biocidal_products)
      - `document_type` (text) - 'msds' or 'license'
      - `file_name` (text)
      - `file_url` (text)
      - `upload_date` (timestamptz)
      - `expiry_date` (date)
      - `uploaded_by` (uuid)
      - `is_active` (boolean)

  2. Security
    - Enable RLS on `biocidal_product_documents` table
    - Add policies for:
      - Admin can manage all documents
      - Companies and customers can view active documents
*/

-- Create biocidal product documents table
CREATE TABLE IF NOT EXISTS biocidal_product_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES biocidal_products(id) ON DELETE CASCADE,
  document_type text NOT NULL CHECK (document_type IN ('msds', 'license')),
  file_name text NOT NULL,
  file_url text NOT NULL,
  upload_date timestamptz DEFAULT now(),
  expiry_date date,
  uploaded_by uuid REFERENCES auth.users(id),
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE biocidal_product_documents ENABLE ROW LEVEL SECURITY;

-- Admin can manage all documents
CREATE POLICY "Admin can manage biocidal product documents"
  ON biocidal_product_documents
  TO authenticated
  USING ((auth.jwt() ->> 'email'::text) LIKE '%@admin%')
  WITH CHECK ((auth.jwt() ->> 'email'::text) LIKE '%@admin%');

-- Companies and customers can view active documents
CREATE POLICY "Companies and customers can view active documents"
  ON biocidal_product_documents
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_biocidal_product_documents_product_id ON biocidal_product_documents(product_id);
CREATE INDEX IF NOT EXISTS idx_biocidal_product_documents_document_type ON biocidal_product_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_biocidal_product_documents_is_active ON biocidal_product_documents(is_active);
CREATE INDEX IF NOT EXISTS idx_biocidal_product_documents_expiry_date ON biocidal_product_documents(expiry_date);

-- Create unique constraint to prevent duplicate document types per product
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_document_type_per_product 
ON biocidal_product_documents(product_id, document_type) 
WHERE is_active = true;

-- Add trigger to deactivate old documents when new ones are uploaded
CREATE OR REPLACE FUNCTION deactivate_old_documents()
RETURNS TRIGGER AS $$
BEGIN
  -- Deactivate old documents of the same type for the same product
  UPDATE biocidal_product_documents
  SET is_active = false
  WHERE product_id = NEW.product_id
    AND document_type = NEW.document_type
    AND id != NEW.id
    AND is_active = true;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_deactivate_old_documents
  BEFORE INSERT OR UPDATE ON biocidal_product_documents
  FOR EACH ROW
  WHEN (NEW.is_active = true)
  EXECUTE FUNCTION deactivate_old_documents();

-- Add comment
COMMENT ON TABLE biocidal_product_documents IS 'Stores MSDS and license documents for biocidal products';