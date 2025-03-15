import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { Building2, User, Mail, Phone, Lock, Hash } from 'lucide-react';

export default function FieldStaffRegister() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    companyCode: '',
    email: '',
    password: '',
    name: '',
    phone: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // First, find the company by code
      const { data: companies, error: companyError } = await supabase
        .from('companies')
        .select('id, status, is_active, company_code')
        .eq('company_code', formData.companyCode.trim());

      if (companyError) throw companyError;
      
      if (!companies || companies.length === 0) {
        throw new Error('Geçersiz şirket kodu. Lütfen şirketinizin size verdiği kodu kontrol edin.');
      }

      const company = companies[0];

      if (!company.is_active) {
        throw new Error('Bu şirket şu anda aktif değil. Lütfen şirketinizle iletişime geçin.');
      }

      if (company.status !== 'approved') {
        throw new Error('Bu şirket henüz onaylanmamış. Lütfen şirketinizle iletişime geçin.');
      }

      // Create auth user
      const { data: { user }, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            email_confirmed: true,
            is_field_staff: true
          }
        }
      });

      if (authError) throw authError;
      if (!user) throw new Error('Kullanıcı oluşturulamadı');

      // Generate unique staff code
      const staffCode = 'STF-' + String(Math.floor(10000 + Math.random() * 90000));

      // Create field staff record
      const { error: staffError } = await supabase
        .from('field_staff')
        .insert([{
          company_id: company.id,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          staff_code: staffCode,
          status: 'pending',
          is_active: false,
          user_id: user.id
        }]);

      if (staffError) throw staffError;

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
        <h2 className="text-2xl font-bold text-gray-900">Saha Personeli Kaydı</h2>
        <p className="mt-2 text-gray-600">İlaçlama şirketinizin saha personeli portalına kayıt olun</p>
        <p className="mt-2 text-sm text-gray-500">
          Not: Kaydınız admin onayından sonra aktif olacaktır
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="flex items-center text-sm font-medium text-gray-700">
            <Hash className="h-5 w-5 text-gray-400 mr-2" />
            Şirket Kodu
          </label>
          <input
            type="text"
            required
            placeholder="Örn: PC-12345"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={formData.companyCode}
            onChange={(e) => setFormData({ ...formData, companyCode: e.target.value.toUpperCase() })}
          />
          <p className="mt-1 text-sm text-gray-500">
            İlaçlama şirketinizin size verdiği kodu girin
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