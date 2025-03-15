/*
  # Branch Equipment Management

  1. New Tables
    - `branch_equipment`
      - `id` (uuid, primary key)
      - `branch_id` (uuid, references branches)
      - `equipment_type_id` (uuid, references equipment_types)
      - `location` (text)
      - `quantity` (integer)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `branch_equipment` table
    - Add policies for companies to manage their branch equipment
    - Add trigger to update equipment count in branches table

  3. Relationships
    - Branch equipment belongs to a branch
    - Branch equipment has an equipment type
*/

-- Create branch equipment table
CREATE TABLE IF NOT EXISTS branch_equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid REFERENCES branches(id) ON DELETE CASCADE NOT NULL,
  equipment_type_id uuid REFERENCES equipment_types(id) ON DELETE RESTRICT NOT NULL,
  location text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT positive_quantity CHECK (quantity > 0)
);

-- Enable RLS
ALTER TABLE branch_equipment ENABLE ROW LEVEL SECURITY;

-- Companies can view equipment for their branches
CREATE POLICY "Companies can view branch equipment"
  ON branch_equipment
  FOR SELECT
  TO authenticated
  USING (
    branch_id IN (
      SELECT b.id FROM branches b
      JOIN customers c ON b.customer_id = c.id
      JOIN companies comp ON c.company_id = comp.id
      WHERE comp.user_id = auth.uid()
    )
  );

-- Companies can add equipment to their branches
CREATE POLICY "Companies can add branch equipment"
  ON branch_equipment
  FOR INSERT
  TO authenticated
  WITH CHECK (
    branch_id IN (
      SELECT b.id FROM branches b
      JOIN customers c ON b.customer_id = c.id
      JOIN companies comp ON c.company_id = comp.id
      WHERE comp.user_id = auth.uid()
    )
  );

-- Companies can update equipment in their branches
CREATE POLICY "Companies can update branch equipment"
  ON branch_equipment
  FOR UPDATE
  TO authenticated
  USING (
    branch_id IN (
      SELECT b.id FROM branches b
      JOIN customers c ON b.customer_id = c.id
      JOIN companies comp ON c.company_id = comp.id
      WHERE comp.user_id = auth.uid()
    )
  )
  WITH CHECK (
    branch_id IN (
      SELECT b.id FROM branches b
      JOIN customers c ON b.customer_id = c.id
      JOIN companies comp ON c.company_id = comp.id
      WHERE comp.user_id = auth.uid()
    )
  );

-- Companies can delete equipment from their branches
CREATE POLICY "Companies can delete branch equipment"
  ON branch_equipment
  FOR DELETE
  TO authenticated
  USING (
    branch_id IN (
      SELECT b.id FROM branches b
      JOIN customers c ON b.customer_id = c.id
      JOIN companies comp ON c.company_id = comp.id
      WHERE comp.user_id = auth.uid()
    )
  );

-- Add equipment count column to branches if it doesn't exist
ALTER TABLE branches 
ADD COLUMN IF NOT EXISTS equipment_count integer DEFAULT 0;

-- Create or replace trigger function to update equipment count
CREATE OR REPLACE FUNCTION update_branch_equipment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE branches
    SET equipment_count = equipment_count + NEW.quantity
    WHERE id = NEW.branch_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE branches
    SET equipment_count = equipment_count - OLD.quantity
    WHERE id = OLD.branch_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.quantity != NEW.quantity THEN
    UPDATE branches
    SET equipment_count = equipment_count - OLD.quantity + NEW.quantity
    WHERE id = NEW.branch_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for equipment count updates
DROP TRIGGER IF EXISTS update_equipment_count_on_insert ON branch_equipment;
DROP TRIGGER IF EXISTS update_equipment_count_on_delete ON branch_equipment;
DROP TRIGGER IF EXISTS update_equipment_count_on_update ON branch_equipment;

CREATE TRIGGER update_equipment_count_on_insert
  AFTER INSERT ON branch_equipment
  FOR EACH ROW
  EXECUTE FUNCTION update_branch_equipment_count();

CREATE TRIGGER update_equipment_count_on_delete
  AFTER DELETE ON branch_equipment
  FOR EACH ROW
  EXECUTE FUNCTION update_branch_equipment_count();

CREATE TRIGGER update_equipment_count_on_update
  AFTER UPDATE OF quantity ON branch_equipment
  FOR EACH ROW
  EXECUTE FUNCTION update_branch_equipment_count();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_branch_equipment_branch_id ON branch_equipment(branch_id);
CREATE INDEX IF NOT EXISTS idx_branch_equipment_equipment_type_id ON branch_equipment(equipment_type_id);