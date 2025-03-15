import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { Building2, User, Mail, Phone, Lock, MapPin } from 'lucide-react';

interface Company {
  id: string;
  company_name: string;
  company_code: string;
}

export default function CustomerRegister() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [formData, setFormData] = useState({
    companyId: '',
    email: '',
    password: '',
    name: '',
    phone: '',
    address: '', // Added address field
  });

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, company_name, company_code')
        .eq('status', 'approved')
        .eq('is_active', true)
        .order('company_name');

      if (error) throw error;
      setCompanies(data || []);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create auth user
      const { data: { user }, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            email_confirmed: true,
            is_customer: true
          }
        }
      });

      if (authError) throw authError;
      if (!user) throw new Error('Kullanıcı oluşturulamadı');

      // Generate unique customer code
      const customerCode = 'CUS-' + String(Math.floor(10000 + Math.random() * 90000));

      // Create customer record
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .insert([{
          company_id: formData.companyId || null,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address, // Added address
          customer_code: customerCode,
          status: 'approved',
          is_active: true
        }])
        .select()
        .single();

      if (customerError) throw customerError;

      // Create customer_user connection
      const { error: connectionError } = await supabase
        .from('customer_users')
        .insert([{
          user_id: user.id,
          customer_id: customerData.id
        }]);

      if (connectionError) throw connectionError;

      toast.success('Kayıt başarılı! Giriş yapabilirsiniz.');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl p-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Müşteri Kaydı</h2>
        <p className="mt-2 text-gray-600">İlaçlama şirketinizin müşteri portalına kayıt olun</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="flex items-center text-sm font-medium text-gray-700">
            <Building2 className="h-5 w-5 text-gray-400 mr-2" />
            İlaçlama Şirketi (Opsiyonel)
          </label>
          <select
            value={formData.companyId}
            onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Şirket Seçin</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.company_name} ({company.company_code})
              </option>
            ))}
          </select>
          <p className="mt-1 text-sm text-gray-500">
            Kayıtlı ilaçlama şirketlerinden birini seçebilirsiniz
          </p>
        </div>

        <div>
          <label className="flex items-center text-sm font-medium text-gray-700">
            <User className="h-5 w-5 text-gray-400 mr-2" />
            Müşteri Adı
          </label>
          <input
            type="text"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div>
          <label className="flex items-center text-sm font-medium text-gray-700">
            <Mail className="h-5 w-5 text-gray-400 mr-2" />
            E-posta
          </label>
          <input
            type="email"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>

        <div>
          <label className="flex items-center text-sm font-medium text-gray-700">
            <Phone className="h-5 w-5 text-gray-400 mr-2" />
            Telefon
          </label>
          <input
            type="tel"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>

        <div>
          <label className="flex items-center text-sm font-medium text-gray-700">
            <MapPin className="h-5 w-5 text-gray-400 mr-2" />
            Adres
          </label>
          <textarea
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            rows={3}
          />
        </div>

        <div>
          <label className="flex items-center text-sm font-medium text-gray-700">
            <Lock className="h-5 w-5 text-gray-400 mr-2" />
            Şifre
          </label>
          <input
            type="password"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {loading ? 'Kaydediliyor...' : 'Kayıt Ol'}
        </button>

        <div className="text-center text-sm text-gray-600">
          Zaten hesabınız var mı?{' '}
          <a href="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Giriş yapın
          </a>
        </div>
      </form>
    </div>
  );
}