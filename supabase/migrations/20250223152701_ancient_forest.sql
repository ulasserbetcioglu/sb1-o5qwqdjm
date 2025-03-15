/*
  # Fix Branches Table Structure

  1. Changes
    - Add missing address column
    - Set default values for required fields
    - Add NOT NULL constraints
    - Add indexes for better performance

  2. Updates
    - Ensure all required fields have appropriate defaults
    - Add validation for required fields
*/

-- Add or update columns with proper constraints
ALTER TABLE branches
ALTER COLUMN name SET NOT NULL,
ALTER COLUMN manager_name SET NOT NULL,
ALTER COLUMN phone SET NOT NULL,
ALTER COLUMN email SET NOT NULL,
ALTER COLUMN address SET DEFAULT '',
ALTER COLUMN address SET NOT NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_branches_customer_id ON branches(customer_id);
CREATE INDEX IF NOT EXISTS idx_branches_branch_code ON branches(branch_code);
CREATE INDEX IF NOT EXISTS idx_branches_name ON branches(name);

-- Update any existing NULL values to empty string
UPDATE branches 
SET address = ''
WHERE address IS NULL;