/*
  # Add Branch Management Fields

  1. Changes
    - Add manager_name column for branch manager
    - Add phone column for branch contact
    - Add email column for branch contact
    - Add equipment_count column for tracking equipment

  2. Updates
    - Add NOT NULL constraints with default values
    - Add indexes for better performance
*/

-- Add new columns if they don't exist
DO $$ 
BEGIN
  -- Add manager_name column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'branches' AND column_name = 'manager_name'
  ) THEN
    ALTER TABLE branches ADD COLUMN manager_name text NOT NULL DEFAULT '';
  END IF;

  -- Add phone column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'branches' AND column_name = 'phone'
  ) THEN
    ALTER TABLE branches ADD COLUMN phone text NOT NULL DEFAULT '';
  END IF;

  -- Add email column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'branches' AND column_name = 'email'
  ) THEN
    ALTER TABLE branches ADD COLUMN email text NOT NULL DEFAULT '';
  END IF;

  -- Add equipment_count column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'branches' AND column_name = 'equipment_count'
  ) THEN
    ALTER TABLE branches ADD COLUMN equipment_count integer NOT NULL DEFAULT 0;
  END IF;
END $$;