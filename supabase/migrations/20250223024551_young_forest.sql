/*
  # Remove location column and add bulk equipment support

  1. Changes
    - Remove location column from branch_equipment table
    - Add created_by column for audit
*/

-- Remove location column if it exists
ALTER TABLE branch_equipment 
DROP COLUMN IF EXISTS location;

-- Add created_by column for audit
ALTER TABLE branch_equipment
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);