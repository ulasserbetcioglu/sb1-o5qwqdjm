import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { Building2, User, Mail, Phone, MapPin, Lock } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    address: '',
    password: '',
  });

  const generateCompanyCode = () => {
    return 'PC-' + String(Math.floor(10000 + Math.random() * 90000));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const isAdmin = formData.email.includes('@admin');
      
      const { data: { user }, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            email_confirmed: true,
            is_admin: isAdmin
          }
        }
      });

      if (authError) throw authError;
      if (!user) throw new Error('Kullanıcı bilgisi alınamadı');

      if (!isAdmin) {
        const { error: profileError } = await supabase.from('companies').insert([
          {
            company_name: formData.companyName,
            contact_name: formData.contactName,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            user_id: user.id,
            company_code: generateCompanyCode()
          },
        ]);

        if (profileError) throw profileError;
        toast.success('Kayıt başarılı! Lütfen admin onayını bekleyin.');
      } else {
        toast.success('Admin hesabı başarıyla oluşturuldu!');
      }

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
        <h2 className="text-2xl font-bold text-gray-900">İlaçlama Şirketi Kaydı</h2>
        <p className="mt-2 text-gray-600">Platformumuza katılmak için şirketinizi kaydedin</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="flex items-center text-sm font-medium text-gray-700">
            <Building2 className="h-5 w-5 text-gray-400 mr-2" />
            Şirket Adı
          </label>
          <input
            type="text"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={formData.companyName}
            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
          />
        </div>

        <div>
          <label className="flex items-center text-sm font-medium text-gray-700">
            <User className="h-5 w-5 text-gray-400 mr-2" />
            İletişim Kişisi
          </label>
          <input
            type="text"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={formData.contactName}
            onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
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
            Şirket Adresi
          </label>
          <textarea
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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
          {loading ? 'Kaydediliyor...' : 'Şirketi Kaydet'}
        </button>

        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-gray-600">Zaten hesabınız var mı?</p>
          <div className="flex justify-center space-x-4">
            <a 
              href="/login" 
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Giriş Yap
            </a>
          </div>
          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">Farklı bir hesap türü için kayıt ol:</p>
            <div className="mt-2 flex justify-center space-x-4">
              <a 
                href="/customer/register" 
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Müşteri Kaydı
              </a>
              <span className="text-gray-300">|</span>
              <a 
                href="/operator/register" 
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Operatör Kaydı
              </a>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}