import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { Mail, Lock, Check } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (error) throw error;

      if (formData.rememberMe) {
        localStorage.setItem('sb-remember-me', 'true');
      } else {
        localStorage.removeItem('sb-remember-me');
      }

      // Check if user is admin
      if (data.user.email?.includes('@admin')) {
        navigate('/admin');
        return;
      }

      // Check if user is an operator
      const { data: operatorData } = await supabase
        .from('operators')
        .select(`
          id,
          company_id,
          is_active,
          status,
          company:companies (
            status,
            is_active
          )
        `)
        .eq('user_id', data.user.id)
        .maybeSingle();

      if (operatorData) {
        if (!operatorData.is_active || operatorData.status !== 'approved') {
          toast.error('Hesabınız henüz onaylanmamış veya pasif durumda. Lütfen yönetici ile iletişime geçin.');
          await supabase.auth.signOut();
          return;
        }

        if (!operatorData.company?.is_active || operatorData.company?.status !== 'approved') {
          toast.error('Bağlı olduğunuz şirket hesabı aktif değil veya onaylanmamış.');
          await supabase.auth.signOut();
          return;
        }

        navigate('/operator/dashboard');
        return;
      }

      // Check if user is a customer
      const { data: customerUser } = await supabase
        .from('customer_users')
        .select('customer_id')
        .eq('user_id', data.user.id)
        .maybeSingle();

      if (customerUser) {
        navigate('/customer/dashboard');
        return;
      }

      // Company user login flow
      const { data: companyData } = await supabase
        .from('companies')
        .select('status, rejection_reason, is_active')
        .eq('user_id', data.user.id)
        .maybeSingle();

      if (!companyData) {
        toast.error('Hesap bulunamadı');
        await supabase.auth.signOut();
        return;
      }

      if (!companyData.is_active) {
        toast.error('Hesabınız pasif durumda. Lütfen yönetici ile iletişime geçin.');
        await supabase.auth.signOut();
        return;
      }

      switch (companyData.status) {
        case 'approved':
          navigate('/dashboard');
          break;
        case 'pending':
          toast.error('Kaydınız hala onay bekliyor');
          await supabase.auth.signOut();
          break;
        case 'rejected':
          const reason = companyData.rejection_reason || 'Sebep belirtilmedi';
          toast.error(`Kaydınız reddedildi. Sebep: ${reason}`);
          await supabase.auth.signOut();
          break;
        default:
          toast.error('Geçersiz hesap durumu');
          await supabase.auth.signOut();
      }
    } catch (error: any) {
      if (error.message === 'Invalid login credentials') {
        toast.error('Geçersiz e-posta veya şifre');
      } else {
        toast.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl p-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Giriş</h2>
        <p className="mt-2 text-gray-600">Hesabınıza erişin</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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

        <div className="flex items-center">
          <input
            type="checkbox"
            id="remember-me"
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            checked={formData.rememberMe}
            onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
          />
          <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
            Beni hatırla
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
        </button>

        <div className="text-center text-sm text-gray-600">
          <p>Hesabınız yok mu?</p>
          <div className="mt-2 space-y-2">
            <Link to="/register" className="block font-medium text-blue-600 hover:text-blue-500">
              Şirket olarak kayıt olun
            </Link>
            <Link to="/customer/register" className="block font-medium text-blue-600 hover:text-blue-500">
              Müşteri olarak kayıt olun
            </Link>
            <Link to="/operator/register" className="block font-medium text-blue-600 hover:text-blue-500">
              Operatör olarak kayıt olun
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}