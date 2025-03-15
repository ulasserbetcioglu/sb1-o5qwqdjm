/*
  # Add is_active column to companies table

  1. Changes
    - Add `is_active` boolean column to companies table with default value true
    
  2. Notes
    - All existing companies will be set as active by default
    - New companies will be active by default unless specified otherwise
*/

ALTER TABLE companies
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true NOT NULL;

-- Update existing rows to have is_active set to true
UPDATE companies
SET is_active = true
WHERE is_active IS NULL;