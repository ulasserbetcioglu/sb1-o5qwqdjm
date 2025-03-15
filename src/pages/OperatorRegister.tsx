import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { Building2, User, Mail, Phone, Lock } from 'lucide-react';

interface Company {
  id: string;
  company_name: string;
  company_code: string;
  status: string;
  is_active: boolean;
}

export default function OperatorRegister() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [formData, setFormData] = useState({
    companyId: '',
    email: '',
    password: '',
    name: '',
    phone: '',
  });

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, company_name, company_code, status, is_active')
        .eq('status', 'approved')
        .eq('is_active', true)
        .order('company_name');

      if (error) {
        console.error('Error fetching companies:', error);
        throw error;
      }

      console.log('Fetched companies:', data);
      setCompanies(data || []);
    } catch (error: any) {
      console.error('Error in fetchCompanies:', error);
      toast.error('Şirketler yüklenirken bir hata oluştu: ' + error.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Find the selected company
      const company = companies.find(c => c.id === formData.companyId);
      if (!company) {
        throw new Error('Lütfen bir şirket seçin');
      }

      if (!company.is_active) {
        throw new Error('Bu şirket şu anda aktif değil. Lütfen başka bir şirket seçin.');
      }

      if (company.status !== 'approved') {
        throw new Error('Bu şirket henüz onaylanmamış. Lütfen başka bir şirket seçin.');
      }

      // Create auth user
      const { data: { user }, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            email_confirmed: true,
            is_operator: true
          }
        }
      });

      if (authError) throw authError;
      if (!user) throw new Error('Kullanıcı oluşturulamadı');

      // Create operator record
      const { error: operatorError } = await supabase
        .from('operators')
        .insert([{
          company_id: company.id,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          status: 'pending',
          is_active: false,
          user_id: user.id
        }]);

      if (operatorError) throw operatorError;

      toast.success('Kayıt başarılı! Admin onayından sonra giriş yapabilirsiniz.');
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
        <h2 className="text-2xl font-bold text-gray-900">Operatör Kaydı</h2>
        <p className="mt-2 text-gray-600">İlaçlama şirketinizin operatör portalına kayıt olun</p>
        <p className="mt-2 text-sm text-gray-500">
          Not: Kaydınız admin onayından sonra aktif olacaktır
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="flex items-center text-sm font-medium text-gray-700">
            <Building2 className="h-5 w-5 text-gray-400 mr-2" />
            İlaçlama Şirketi
          </label>
          <select
            required
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
          {companies.length === 0 && (
            <p className="mt-2 text-sm text-red-600">
              Henüz onaylanmış ve aktif şirket bulunmamaktadır.
            </p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            Çalışacağınız ilaçlama şirketini seçin
          </p>
        </div>

        <div>
          <label className="flex items-center text-sm font-medium text-gray-700">
            <User className="h-5 w-5 text-gray-400 mr-2" />
            İsim
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