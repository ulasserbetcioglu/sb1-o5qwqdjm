-- Create a secure view for field staff with user information
CREATE OR REPLACE VIEW field_staff_with_user AS
SELECT 
  fs.*
FROM field_staff fs
WHERE (
  -- Companies can view their field staff
  fs.company_id IN (
    SELECT id FROM companies
    WHERE user_id = auth.uid()
  )
  -- Staff can view their own data
  OR fs.user_id = auth.uid()
  -- Admins can view all
  OR EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.email LIKE '%@admin%'
  )
);

-- Grant access to the view
GRANT SELECT ON field_staff_with_user TO authenticated;