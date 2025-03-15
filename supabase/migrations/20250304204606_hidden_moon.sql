-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can upload logos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read logos" ON storage.objects;

-- Create storage bucket for logos if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy to allow authenticated users to upload logos
CREATE POLICY "Allow logo uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'logos'
  AND (
    -- Companies can upload their own logo
    (CASE 
      WHEN name LIKE 'companies/%' THEN
        EXISTS (
          SELECT 1 FROM public.companies
          WHERE user_id = auth.uid()
          AND id::text = SPLIT_PART(name, '/', 2)
        )
      WHEN name LIKE 'customers/%' THEN
        EXISTS (
          SELECT 1 FROM public.customers c
          JOIN public.companies comp ON comp.id = c.company_id
          WHERE comp.user_id = auth.uid()
          AND c.id::text = SPLIT_PART(name, '/', 2)
        )
      ELSE false
    END)
  )
);

-- Create policy to allow logo deletions
CREATE POLICY "Allow logo deletions"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'logos'
  AND (
    -- Companies can delete their own logo
    (CASE 
      WHEN name LIKE 'companies/%' THEN
        EXISTS (
          SELECT 1 FROM public.companies
          WHERE user_id = auth.uid()
          AND id::text = SPLIT_PART(name, '/', 2)
        )
      WHEN name LIKE 'customers/%' THEN
        EXISTS (
          SELECT 1 FROM public.customers c
          JOIN public.companies comp ON comp.id = c.company_id
          WHERE comp.user_id = auth.uid()
          AND c.id::text = SPLIT_PART(name, '/', 2)
        )
      ELSE false
    END)
  )
);

-- Create policy to allow reading logos
CREATE POLICY "Allow public logo access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'logos');

-- Grant necessary permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT SELECT ON storage.objects TO public;