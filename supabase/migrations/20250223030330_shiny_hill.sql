/*
  # Add Customer Code

  1. Changes
    - Add customer_code column to customers table
    - Generate unique customer codes for existing records
    - Add constraints and indexes for customer_code
*/

-- Add customer_code column if it doesn't exist
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS customer_code text;

-- Update existing rows to have a generated customer code
UPDATE customers 
SET customer_code = 'CUS-' || LPAD(FLOOR(RANDOM() * 100000)::text, 5, '0')
WHERE customer_code IS NULL;

-- Make customer_code NOT NULL after all existing rows have been updated
ALTER TABLE customers 
ALTER COLUMN customer_code SET NOT NULL;

-- Add unique constraint for customer_code within company scope
ALTER TABLE customers
ADD CONSTRAINT unique_customer_code_per_company UNIQUE (company_id, customer_code);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_customers_code ON customers(customer_code);