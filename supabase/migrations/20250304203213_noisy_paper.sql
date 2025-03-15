-- Add logo_url columns to companies and customers tables
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS logo_url text;

ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS logo_url text;

-- Create storage bucket for logos if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy to allow authenticated users to upload logos
CREATE POLICY "Authenticated users can upload logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'logos'
  AND (
    -- Companies can upload their own logo
    (storage.foldername(name))[1] = 'companies'
    AND EXISTS (
      SELECT 1 FROM companies
      WHERE user_id = auth.uid()
      AND id = (storage.foldername(name))[2]::uuid
    )
    -- Companies can upload their customers' logos
    OR (
      (storage.foldername(name))[1] = 'customers'
      AND EXISTS (
        SELECT 1 FROM customers c
        JOIN companies comp ON comp.id = c.company_id
        WHERE comp.user_id = auth.uid()
        AND c.id = (storage.foldername(name))[2]::uuid
      )
    )
  )
);

-- Create policy to allow reading logos
CREATE POLICY "Anyone can read logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'logos');