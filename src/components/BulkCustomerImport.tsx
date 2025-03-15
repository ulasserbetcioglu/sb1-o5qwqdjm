import React, { useState } from 'react';
import { Upload, AlertCircle, CheckCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface ImportedCustomer {
  name: string;
  email: string;
  phone: string;
  address: string;
}

interface BulkCustomerImportProps {
  onSuccess: () => void;
}

export const BulkCustomerImport: React.FC<BulkCustomerImportProps> = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<ImportedCustomer[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const validateCustomers = async (customers: ImportedCustomer[]): Promise<string[]> => {
    const errors: string[] = [];
    const emails = new Set<string>();
    
    if (customers.length === 0) {
      errors.push('Excel dosyası boş');
      return errors;
    }

    // First check for duplicate emails within the Excel file
    customers.forEach((customer, index) => {
      const rowNum = index + 2; // Excel starts at 1 and has header row
      
      if (!customer.name?.trim()) {
        errors.push(`Satır ${rowNum}: İsim alanı boş olamaz`);
      }
      
      if (!customer.email?.trim()) {
        errors.push(`Satır ${rowNum}: E-posta alanı boş olamaz`);
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
        errors.push(`Satır ${rowNum}: Geçersiz e-posta formatı`);
      } else if (emails.has(customer.email.toLowerCase())) {
        errors.push(`Satır ${rowNum}: Bu e-posta adresi Excel dosyasında tekrar ediyor`);
      } else {
        emails.add(customer.email.toLowerCase());
      }
      
      if (!customer.phone?.trim()) {
        errors.push(`Satır ${rowNum}: Telefon alanı boş olamaz`);
      }
      
      if (!customer.address?.trim()) {
        errors.push(`Satır ${rowNum}: Adres alanı boş olamaz`);
      }
    });

    // If there are basic validation errors, return them before checking the database
    if (errors.length > 0) {
      return errors;
    }

    try {
      // Get company ID for the query
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Kullanıcı bulunamadı');

      const { data: companyData } = await supabase
        .from('companies')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!companyData) throw new Error('Şirket bulunamadı');

      // Check for existing emails in the database
      const emailList = customers.map(c => c.email.toLowerCase());
      const { data: existingCustomers, error } = await supabase
        .from('customers')
        .select('email')
        .eq('company_id', companyData.id)
        .in('email', emailList);

      if (error) throw error;

      if (existingCustomers && existingCustomers.length > 0) {
        const existingEmails = new Set(existingCustomers.map(c => c.email.toLowerCase()));
        customers.forEach((customer, index) => {
          if (existingEmails.has(customer.email.toLowerCase())) {
            errors.push(`Satır ${index + 2}: ${customer.email} e-posta adresi zaten kayıtlı`);
          }
        });
      }
    } catch (error: any) {
      errors.push('Mevcut müşteriler kontrol edilirken hata oluştu: ' + error.message);
    }

    return errors;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert Excel data to JSON, skipping empty rows
        const rawData = XLSX.utils.sheet_to_json<any>(worksheet, { defval: '' });
        
        // Process and clean the data
        const customers = rawData
          .filter(row => Object.values(row).some(value => value !== '')) // Skip completely empty rows
          .map(row => ({
            name: String(row.name || '').trim(),
            email: String(row.email || '').trim().toLowerCase(), // Normalize email to lowercase
            phone: String(row.phone || '').trim(),
            address: String(row.address || '').trim()
          }));

        const validationErrors = await validateCustomers(customers);
        setErrors(validationErrors);
        setPreview(customers);

        if (customers.length === 0) {
          toast.error('Excel dosyası boş veya geçersiz format');
        }
      } catch (error) {
        console.error('Excel parsing error:', error);
        toast.error('Excel dosyası okunamadı. Lütfen şablona uygun bir dosya kullanın.');
        setPreview([]);
        setErrors(['Dosya format hatası']);
      }
    };

    reader.onerror = () => {
      toast.error('Dosya okuma hatası');
      setPreview([]);
      setErrors(['Dosya okuma hatası']);
    };

    reader.readAsBinaryString(file);
  };

  const handleImport = async () => {
    if (errors.length > 0) {
      toast.error('Lütfen hataları düzeltin');
      return;
    }

    if (preview.length === 0) {
      toast.error('İçe aktarılacak müşteri bulunamadı');
      return;
    }

    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Kullanıcı bulunamadı');

      const { data: companyData } = await supabase
        .from('companies')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!companyData) throw new Error('Şirket bulunamadı');

      // Process customers in batches of 50
      const batchSize = 50;
      const batches = [];
      
      for (let i = 0; i < preview.length; i += batchSize) {
        const batch = preview.slice(i, i + batchSize).map(customer => ({
          ...customer,
          company_id: companyData.id,
          customer_code: 'CUS-' + String(Math.floor(10000 + Math.random() * 90000)),
          status: 'approved',
          is_active: true
        }));
        batches.push(batch);
      }

      // Insert batches sequentially
      let insertedCount = 0;
      for (const batch of batches) {
        const { error } = await supabase
          .from('customers')
          .insert(batch);

        if (error) {
          if (error.code === '23505') { // Unique constraint violation
            throw new Error('Bazı e-posta adresleri zaten kullanımda');
          }
          throw error;
        }
        insertedCount += batch.length;
      }

      toast.success(`${insertedCount} müşteri başarıyla eklendi`);
      setPreview([]);
      setErrors([]);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const template = XLSX.utils.book_new();
    const data = [
      ['name', 'email', 'phone', 'address'],
      ['Örnek Müşteri', 'ornek@email.com', '05551234567', 'Örnek Adres']
    ];
    
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(template, worksheet, 'Müşteriler');
    XLSX.writeFile(template, 'musteri-sablonu.xlsx');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Excel ile Toplu Müşteri Ekle</h3>
          <p className="mt-1 text-sm text-gray-500">
            Excel dosyası kullanarak birden fazla müşteriyi tek seferde ekleyin
          </p>
        </div>
        <button
          onClick={downloadTemplate}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Şablon İndir
        </button>
      </div>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileUpload}
          className="hidden"
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          className="cursor-pointer inline-flex flex-col items-center"
        >
          <Upload className="h-12 w-12 text-gray-400" />
          <span className="mt-2 text-sm font-medium text-gray-900">
            Excel dosyası seçin veya sürükleyin
          </span>
          <span className="mt-1 text-xs text-gray-500">
            .xlsx veya .xls
          </span>
        </label>
      </div>

      {errors.length > 0 && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Dosyada {errors.length} hata bulundu
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <ul className="list-disc pl-5 space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {preview.length > 0 && errors.length === 0 && (
        <div className="rounded-md bg-green-50 p-4">
          <div className="flex">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                {preview.length} müşteri içe aktarılmaya hazır
              </h3>
            </div>
          </div>
        </div>
      )}

      {preview.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-900 mb-4">Önizleme</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İsim
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    E-posta
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Telefon
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Adres
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {preview.map((customer, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {customer.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {customer.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {customer.phone}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {customer.address}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={() => {
                setPreview([]);
                setErrors([]);
              }}
              className="mr-3 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              İptal
            </button>
            <button
              type="button"
              onClick={handleImport}
              disabled={loading || errors.length > 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'İçe Aktarılıyor...' : 'İçe Aktar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};