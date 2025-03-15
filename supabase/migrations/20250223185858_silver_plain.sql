-- Add initial_password column to operators table
ALTER TABLE operators
ADD COLUMN IF NOT EXISTS initial_password text;

-- Add initial_password column to customers table
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS initial_password text;

-- Add initial_password column to companies table
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS initial_password text;