/*
  # Add Branch Code

  1. Changes
    - Add branch_code column to branches table
    - Generate unique branch codes for existing records
    - Add constraints and indexes for branch_code
*/

-- Add branch_code column if it doesn't exist
ALTER TABLE branches 
ADD COLUMN IF NOT EXISTS branch_code text;

-- Update existing rows to have a generated branch code
UPDATE branches 
SET branch_code = 'BR-' || LPAD(FLOOR(RANDOM() * 100000)::text, 5, '0')
WHERE branch_code IS NULL;

-- Make branch_code NOT NULL after all existing rows have been updated
ALTER TABLE branches 
ALTER COLUMN branch_code SET NOT NULL;

-- Add unique constraint for branch_code within customer scope
ALTER TABLE branches
ADD CONSTRAINT unique_branch_code_per_customer UNIQUE (customer_id, branch_code);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_branches_code ON branches(branch_code);