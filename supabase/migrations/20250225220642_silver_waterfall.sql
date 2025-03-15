-- Create contracts table
CREATE TABLE IF NOT EXISTS contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
  branch_id uuid REFERENCES branches(id) ON DELETE CASCADE NOT NULL,
  contract_number text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  monthly_amount numeric(10,2) NOT NULL,
  pest_types jsonb NOT NULL DEFAULT '[]',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  UNIQUE(company_id, contract_number)
);

-- Enable RLS
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- Create policy for contracts
CREATE POLICY "contracts_access_policy"
ON contracts FOR ALL
TO authenticated
USING (
  -- Admin access
  auth.jwt() ->> 'email' LIKE '%@admin%'
  -- Company access
  OR company_id IN (
    SELECT id FROM companies
    WHERE user_id = auth.uid()
  )
  -- Customer access
  OR customer_id IN (
    SELECT customer_id FROM customer_users
    WHERE user_id = auth.uid()
  )
);

-- Add indexes if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_contracts_company_id') THEN
    CREATE INDEX idx_contracts_company_id ON contracts(company_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_contracts_customer_id') THEN
    CREATE INDEX idx_contracts_customer_id ON contracts(customer_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_contracts_branch_id') THEN
    CREATE INDEX idx_contracts_branch_id ON contracts(branch_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_contracts_contract_number') THEN
    CREATE INDEX idx_contracts_contract_number ON contracts(contract_number);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_contracts_status') THEN
    CREATE INDEX idx_contracts_status ON contracts(status);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_contracts_start_date') THEN
    CREATE INDEX idx_contracts_start_date ON contracts(start_date);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_contracts_end_date') THEN
    CREATE INDEX idx_contracts_end_date ON contracts(end_date);
  END IF;
END $$;

-- Grant necessary permissions
GRANT ALL ON contracts TO authenticated;