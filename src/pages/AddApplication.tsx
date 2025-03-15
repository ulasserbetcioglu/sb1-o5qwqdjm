import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { Calendar, Clock, Building2, Bug, FileText } from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  branches: Array<{
    id: string;
    name: string;
  }>;
}

const SERVICE_TYPES = [
  { id: 'initial', label: 'İlk' },
  { id: 'paid', label: 'Ücretli' },
  { id: 'emergency', label: 'Acil Çağrı' },
  { id: 'technical', label: 'Teknik İnceleme' },
  { id: 'periodic', label: 'Periyodik' },
  { id: 'business', label: 'İşyeri' },
  { id: 'observation', label: 'Gözlem' },
  { id: 'final', label: 'Final' }
];

const PEST_CATEGORIES = [
  { id: 'bird', label: 'Kuş' },
  { id: 'pest', label: 'Haşere' },
  { id: 'bee', label: 'Arı' },
  { id: 'rodent', label: 'Kemirgen' },
  { id: 'mollusk', label: 'Yumuşakça' },
  { id: 'cat_dog', label: 'Kedi/Köpek' },
  { id: 'fly', label: 'Sinek' },
  { id: 'reptile', label: 'Sürüngen' },
  { id: 'warehouse_pest', label: 'Depo Zararlısı' }
];

export default function AddApplication() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOperator, setIsOperator] = useState(false);
  const [operatorId, setOperatorId] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    customerId: '',
    branchId: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
    serviceTypes: [] as string[],
    pestCategories: [] as string[],
    notes: ''
  });

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      // First check if user is an operator
      const { data: operatorData, error: operatorError } = await supabase
        .from('operators')
        .select('id, company_id')
        .eq('user_id', user.id)
        .eq('status', 'approved')
        .eq('is_active', true)
        .single();

      if (operatorError) {
        if (operatorError.code !== 'PGRST116') {
          throw operatorError;
        }
      }

      if (operatorData) {
        setIsOperator(true);
        setOperatorId(operatorData.id);
        setCompanyId(operatorData.company_id);
        await fetchCustomers(operatorData.company_id);
      } else {
        // Check for company access
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (companyError) {
          if (companyError.code === 'PGRST116') {
            toast.error('Şirket veya operatör kaydı bulunamadı');
            navigate('/login');
            return;
          }
          throw companyError;
        }

        setCompanyId(companyData.id);
        await fetchCustomers(companyData.id);
      }
    } catch (error: any) {
      console.error('Error checking access:', error);
      toast.error('Erişim kontrolü sırasında bir hata oluştu');
      navigate('/login');
    }
  };

  const fetchCustomers = async (companyId: string) => {
    try {
      setLoading(true);
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select(`
          id,
          name,
          branches (
            id,
            name
          )
        `)
        .eq('company_id', companyId)
        .eq('is_active', true);

      if (customersError) throw customersError;
      setCustomers(customersData || []);
    } catch (error: any) {
      console.error('Error fetching customers:', error);
      toast.error('Müşteriler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (!companyId) {
        throw new Error('Şirket bilgisi bulunamadı');
      }

      // Generate application code
      const applicationCode = 'APP-' + String(Math.floor(10000 + Math.random() * 90000));

      const { error: applicationError } = await supabase
        .from('applications')
        .insert([{
          company_id: companyId,
          customer_id: formData.customerId,
          branch_id: formData.branchId,
          operator_id: isOperator ? operatorId : null,
          application_code: applicationCode,
          scheduled_date: formData.date,
          scheduled_time: formData.time,
          service_types: formData.serviceTypes,
          pest_categories: formData.pestCategories,
          notes: formData.notes,
          created_by: (await supabase.auth.getUser()).data.user?.id
        }]);

      if (applicationError) throw applicationError;

      toast.success('Uygulama başarıyla kaydedildi');
      navigate(isOperator ? '/operator/dashboard' : '/controls');
    } catch (error: any) {
      console.error('Error creating application:', error);
      toast.error('Uygulama kaydedilirken bir hata oluştu');
    }
  };

  const selectedCustomer = customers.find(c => c.id === formData.customerId);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h1 className="text-xl font-semibold text-gray-900">Yeni Uygulama Ekle</h1>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Customer Selection */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              <div className="flex items-center">
                <Building2 className="h-5 w-5 text-gray-400 mr-2" />
                Müşteri
              </div>
            </label>
            <select
              value={formData.customerId}
              onChange={(e) => setFormData({ ...formData, customerId: e.target.value, branchId: '' })}
              className="mt-1 block w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              required
            >
              <option value="">Müşteri Seçin</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>

          {selectedCustomer && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                <div className="flex items-center">
                  <Building2 className="h-5 w-5 text-gray-400 mr-2" />
                  Şube
                </div>
              </label>
              <select
                value={formData.branchId}
                onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                className="mt-1 block w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                required
              >
                <option value="">Şube Seçin</option>
                {selectedCustomer.branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Date and Time */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                Tarih
              </div>
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="mt-1 block w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-gray-400 mr-2" />
                Saat
              </div>
            </label>
            <input
              type="time"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              className="mt-1 block w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        {/* Service Types */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center">
              <FileText className="h-5 w-5 text-gray-400 mr-2" />
              Hizmet Türü
            </div>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {SERVICE_TYPES.map((type) => (
              <label key={type.id} className="relative flex items-start">
                <div className="flex items-center h-5">
                  <input
                    type="checkbox"
                    checked={formData.serviceTypes.includes(type.id)}
                    onChange={(e) => {
                      const newTypes = e.target.checked
                        ? [...formData.serviceTypes, type.id]
                        : formData.serviceTypes.filter(t => t !== type.id);
                      setFormData({ ...formData, serviceTypes: newTypes });
                    }}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>
                <div className="ml-2 text-sm">
                  <span className="text-gray-700">{type.label}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Pest Categories */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center">
              <Bug className="h-5 w-5 text-gray-400 mr-2" />
              Zararlı Kategorisi
            </div>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {PEST_CATEGORIES.map((category) => (
              <label key={category.id} className="relative flex items-start">
                <div className="flex items-center h-5">
                  <input
                    type="checkbox"
                    checked={formData.pestCategories.includes(category.id)}
                    onChange={(e) => {
                      const newCategories = e.target.checked
                        ? [...formData.pestCategories, category.id]
                        : formData.pestCategories.filter(c => c !== category.id);
                      setFormData({ ...formData, pestCategories: newCategories });
                    }}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>
                <div className="ml-2 text-sm">
                  <span className="text-gray-700">{category.label}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            <div className="flex items-center">
              <FileText className="h-5 w-5 text-gray-400 mr-2" />
              Notlar (Operatöre Özel)
            </div>
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={4}
            className="mt-1 block w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            placeholder="Operatöre özel notları buraya yazın..."
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate(isOperator ? '/operator/dashboard' : '/controls')}
            className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            İptal
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Kaydet
          </button>
        </div>
      </form>
    </div>
  );
}