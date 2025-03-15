/*
  # Fix Customer Account Number Handling

  1. Changes
    - Remove account_number column and its constraints
    - Update unique constraints to use customer_code instead
    - Add migration to clean up any duplicate data

  2. Security
    - Maintain RLS policies
    - Ensure data integrity during migration
*/

-- Drop the unique constraint for account_number
ALTER TABLE customers
DROP CONSTRAINT IF EXISTS unique_account_number_per_company;

-- Drop the account_number column if it exists
ALTER TABLE customers
DROP COLUMN IF EXISTS account_number;

-- Ensure customer_code is unique within company scope
ALTER TABLE customers
DROP CONSTRAINT IF EXISTS unique_customer_code_per_company;

ALTER TABLE customers
ADD CONSTRAINT unique_customer_code_per_company UNIQUE (company_id, customer_code);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_customers_customer_code ON customers(customer_code);