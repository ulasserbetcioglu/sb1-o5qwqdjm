/*
  # Field Staff Audit System

  1. New Tables
    - `field_staff_audit_log`: Tracks all changes to field staff records
      - `id` (uuid, primary key)
      - `field_staff_id` (uuid, references field_staff)
      - `action` (text): Type of action performed (INSERT, UPDATE, DELETE)
      - `changes` (jsonb): Changes made to the record
      - `performed_by` (uuid): User who performed the action
      - `ip_address` (text): IP address of the request
      - `created_at` (timestamptz)

  2. Functions
    - Creates trigger function to automatically log changes
    - Adds IP address tracking to RLS policies
*/

-- Create audit log table
CREATE TABLE field_staff_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  field_staff_id uuid REFERENCES field_staff(id) ON DELETE CASCADE,
  action text NOT NULL,
  changes jsonb NOT NULL,
  performed_by uuid NOT NULL,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE field_staff_audit_log ENABLE ROW LEVEL SECURITY;

-- Create policy for audit log access
CREATE POLICY "Companies can view own audit logs"
ON field_staff_audit_log
FOR SELECT
TO authenticated
USING (
  field_staff_id IN (
    SELECT id FROM field_staff
    WHERE company_id IN (
      SELECT id FROM companies
      WHERE user_id = auth.uid()
    )
  )
  OR EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND email LIKE '%@admin%'
  )
);

-- Create function to record audit log
CREATE OR REPLACE FUNCTION record_field_staff_audit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  changes_made jsonb;
  client_ip text;
BEGIN
  -- Get client IP from connection info
  client_ip := current_setting('request.headers', true)::jsonb->'x-real-ip' #>> '{}';
  
  IF TG_OP = 'INSERT' THEN
    changes_made := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    changes_made := jsonb_build_object(
      'old', to_jsonb(OLD),
      'new', to_jsonb(NEW),
      'changed_fields', (
        SELECT jsonb_object_agg(key, value)
        FROM jsonb_each(to_jsonb(NEW))
        WHERE to_jsonb(NEW)->>key != to_jsonb(OLD)->>key
      )
    );
  ELSE
    changes_made := to_jsonb(OLD);
  END IF;

  INSERT INTO field_staff_audit_log (
    field_staff_id,
    action,
    changes,
    performed_by,
    ip_address
  ) VALUES (
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    changes_made,
    auth.uid(),
    client_ip
  );

  RETURN NULL;
END;
$$;

-- Create triggers for field staff auditing
CREATE TRIGGER field_staff_audit_insert
  AFTER INSERT ON field_staff
  FOR EACH ROW
  EXECUTE FUNCTION record_field_staff_audit();

CREATE TRIGGER field_staff_audit_update
  AFTER UPDATE ON field_staff
  FOR EACH ROW
  EXECUTE FUNCTION record_field_staff_audit();

CREATE TRIGGER field_staff_audit_delete
  AFTER DELETE ON field_staff
  FOR EACH ROW
  EXECUTE FUNCTION record_field_staff_audit();

-- Grant necessary permissions
GRANT ALL ON field_staff_audit_log TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;