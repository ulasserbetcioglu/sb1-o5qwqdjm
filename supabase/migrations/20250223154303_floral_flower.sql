-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;

-- Companies table permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON companies TO authenticated;

-- Customers table permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON customers TO authenticated;

-- Branches table permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON branches TO authenticated;

-- Field staff table permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON field_staff TO authenticated;

-- Equipment types table permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON equipment_types TO authenticated;

-- Branch equipment table permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON branch_equipment TO authenticated;

-- Service types table permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON service_types TO authenticated;

-- Unit types table permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON unit_types TO authenticated;

-- Package types table permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON package_types TO authenticated;

-- Document types table permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON document_types TO authenticated;

-- Staff types table permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON staff_types TO authenticated;

-- Definition types table permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON definition_types TO authenticated;

-- Applications table permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON applications TO authenticated;

-- Application services table permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON application_services TO authenticated;

-- Application equipment table permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON application_equipment TO authenticated;

-- Field staff audit log table permissions
GRANT SELECT ON field_staff_audit_log TO authenticated;

-- Grant execute permission on functions
GRANT EXECUTE ON FUNCTION change_field_staff_password TO authenticated;
GRANT EXECUTE ON FUNCTION change_customer_password TO authenticated;

-- Ensure sequences are accessible
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;