/*
  # Add account number and branch count to customers table

  1. Changes
    - Add account_number column with default value
    - Add branch_count column with default value
    - Add unique constraint for account_number within company scope
    - Add index for faster lookups

  2. Security
    - Maintain existing RLS policies
*/

-- First, add the columns with default values
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS account_number text DEFAULT '',
ADD COLUMN IF NOT EXISTS branch_count integer DEFAULT 0;

-- Update existing rows to have a generated account number based on their ID
UPDATE customers 
SET account_number = 'CUS-' || SUBSTRING(id::text, 1, 8)
WHERE account_number = '';

-- Now make account_number NOT NULL after all existing rows have been updated
ALTER TABLE customers 
ALTER COLUMN account_number SET NOT NULL,
ALTER COLUMN branch_count SET NOT NULL;

-- Add unique constraint for account_number within company scope
ALTER TABLE customers
ADD CONSTRAINT unique_account_number_per_company UNIQUE (company_id, account_number);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_customers_account_number ON customers(account_number);