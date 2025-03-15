-- Add company_code column if it doesn't exist
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS company_code text;

-- Update existing rows to have a generated company code
UPDATE companies 
SET company_code = 'PC-' || LPAD(FLOOR(RANDOM() * 100000)::text, 5, '0')
WHERE company_code IS NULL;

-- Make company_code NOT NULL after all existing rows have been updated
ALTER TABLE companies 
ALTER COLUMN company_code SET NOT NULL;

-- Add unique constraint for company_code
ALTER TABLE companies
ADD CONSTRAINT unique_company_code UNIQUE (company_code);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_companies_code ON companies(company_code);