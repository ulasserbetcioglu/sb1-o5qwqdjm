-- Drop application related tables
DROP TABLE IF EXISTS application_equipment CASCADE;
DROP TABLE IF EXISTS application_services CASCADE;
DROP TABLE IF EXISTS applications CASCADE;

-- Drop operator related tables
DROP TABLE IF EXISTS operators CASCADE;

-- Drop field staff related tables
DROP TABLE IF EXISTS field_staff_audit_log CASCADE;
DROP TABLE IF EXISTS field_staff CASCADE;

-- Drop related functions
DROP FUNCTION IF EXISTS change_operator_password CASCADE;
DROP FUNCTION IF EXISTS change_field_staff_password CASCADE;
DROP FUNCTION IF EXISTS record_field_staff_audit CASCADE;