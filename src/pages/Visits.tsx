import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { parseExcelData } from '../utils/excelUtils';

interface ImportExcelButtonProps {
  onImportSuccess?: () => void;
}

export default function Visits() {
  const [loading, setLoading] = useState(false);

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const data = await parseExcelData(file);
      
      // Get company ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Kullanıcı bulunamadı');

      const { data: companyData } = await supabase
        .from('companies')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!companyData) throw new Error('Şirket bulunamadı');

      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      // Process each row
      for (const row of data) {
        try {
          // Find customer
          let customerData;
          
          if (row.customerCode) {
            // Try by customer code first
            const { data: customerByCode } = await supabase
              .from('customers')
              .select('id, name')
              .eq('company_id', companyData.id)
              .eq('customer_code', row.customerCode)
              .maybeSingle();
              
            if (customerByCode) {
              customerData = customerByCode;
            }
          }
          
          if (!customerData) {
            // Try by customer name
            const { data: customerByName } = await supabase
              .from('customers')
              .select('id, name')
              .eq('company_id', companyData.id)
              .ilike('name', `%${row.customerName}%`)
              .maybeSingle();
              
            customerData = customerByName;
          }

          if (!customerData) {
            throw new Error(`Müşteri bulunamadı: ${row.customerName}${row.customerCode ? ` (${row.customerCode})` : ''}`);
          }

          // Find branch
          let branchData;
          
          if (row.branchCode) {
            // Try by branch code first
            const { data: branchByCode } = await supabase
              .from('branches')
              .select('id, name')
              .eq('customer_id', customerData.id)
              .eq('branch_code', row.branchCode)
              .maybeSingle();
              
            if (branchByCode) {
              branchData = branchByCode;
            }
          }
          
          if (!branchData) {
            // Try by branch name
            const { data: branchByName } = await supabase
              .from('branches')
              .select('id, name')
              .eq('customer_id', customerData.id)
              .ilike('name', `%${row.branchName}%`)
              .maybeSingle();
              
            branchData = branchByName;
          }

          if (!branchData) {
            throw new Error(`Şube bulunamadı: ${row.branchName}${row.branchCode ? ` (${row.branchCode})` : ''} - Müşteri: ${customerData.name}`);
          }

          // Find operator if provided
          let operatorId = null;
          if (row.operator) {
            const { data: operatorData } = await supabase
              .from('operators')
              .select('id')
              .eq('company_id', companyData.id)
              .eq('status', 'approved')
              .eq('is_active', true)
              .ilike('name', `%${row.operator}%`)
              .maybeSingle();

            if (operatorData) {
              operatorId = operatorData.id;
            }
          }

          // Generate application code
          const applicationCode = 'APP-' + String(Math.floor(10000 + Math.random() * 90000));

          // Create the application
          const { error: insertError } = await supabase
            .from('applications')
            .insert([{
              company_id: companyData.id,
              customer_id: customerData.id,
              branch_id: branchData.id,
              operator_id: operatorId,
              application_code: applicationCode,
              scheduled_date: row.date,
              scheduled_time: row.time,
              service_types: [row.visitType],
              notes: row.notes,
              status: 'scheduled',
              created_by: user.id
            }]);

          if (insertError) {
            throw insertError;
          }

          successCount++;
        } catch (error: any) {
          errorCount++;
          errors.push(error.message);
        }
      }

      // Show summary
      if (successCount > 0) {
        toast.success(`${successCount} ziyaret başarıyla eklendi`);
      }
      if (errorCount > 0) {
        toast.error(`${errorCount} ziyaret eklenemedi`);
        // Show detailed errors
        errors.forEach(error => toast.error(error));
      }
    } catch (error: any) {
      console.error('Import error:', error);
      toast.error(error.message || 'Excel dosyası işlenirken bir hata oluştu');
    } finally {
      setLoading(false);
      // Reset file input
      e.target.value = '';
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Ziyaretler</h1>
        <div>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleImportExcel}
            disabled={loading}
            className="hidden"
            id="excel-import"
          />
          <label
            htmlFor="excel-import"
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            {loading ? 'İçe Aktarılıyor...' : 'Excel İçe Aktar'}
          </label>
        </div>
      </div>
      
      {/* Add your visits list/table component here */}
    </div>
  );
}