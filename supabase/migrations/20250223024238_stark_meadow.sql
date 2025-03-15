/*
  # Add equipment code to branch equipment

  1. Changes
    - Add equipment_code column to branch_equipment table
    - Make equipment_code unique within company scope
    - Add index for faster lookups
*/

-- Add equipment_code column if it doesn't exist
ALTER TABLE branch_equipment 
ADD COLUMN IF NOT EXISTS equipment_code text;

-- Update existing rows to have a generated equipment code
UPDATE branch_equipment 
SET equipment_code = LPAD(FLOOR(RANDOM() * 1000000000000)::text, 12, '0')
WHERE equipment_code IS NULL;

-- Make equipment_code NOT NULL after all existing rows have been updated
ALTER TABLE branch_equipment 
ALTER COLUMN equipment_code SET NOT NULL;

-- Add unique constraint for equipment_code
ALTER TABLE branch_equipment
ADD CONSTRAINT unique_equipment_code UNIQUE (equipment_code);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_branch_equipment_code ON branch_equipment(equipment_code);