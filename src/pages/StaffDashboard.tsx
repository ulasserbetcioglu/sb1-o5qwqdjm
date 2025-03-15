import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { Building2, User, Mail, Phone, LogOut, Clock, AlertCircle } from 'lucide-react';

interface StaffProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  created_at: string;
  company: {
    company_name: string;
    company_code: string;
  };
}

export default function StaffDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Kullanıcı bulunamadı');

      const { data: staffData, error } = await supabase
        .from('staff')
        .select(`
          id,
          name,
          email,
          phone,
          created_at,
          company:companies (
            company_name,
            company_code
          )
        `)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setProfile(staffData);
    } catch (error: any) {
      toast.error(error.message);
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/login');
      toast.success('Başarıyla çıkış yapıldı');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900">Profil Bulunamadı</h3>
          <p className="mt-2 text-gray-600">Bu beklenmedik bir durumsa lütfen destek ile iletişime geçin.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-8 bg-gradient-to-r from-blue-600 to-blue-700">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-2xl font-bold text-white">{profile.name}</h1>
                </div>
                <p className="mt-1 text-blue-100">Personel Paneli</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-2 bg-white bg-opacity-20 rounded-lg text-white hover:bg-opacity-30 transition-colors"
              >
                <LogOut className="h-5 w-5 mr-2" />
                Çıkış Yap
              </button>
            </div>
          </div>

          <div className="px-6 py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <div className="flex items-center text-gray-500 text-sm font-medium mb-2">
                    <Building2 className="h-4 w-4 mr-2" />
                    Şirket Bilgileri
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{profile.company.company_name}</h3>
                      <span className="text-sm font-medium text-gray-500">{profile.company.company_code}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center text-gray-500 text-sm font-medium mb-2">
                    <User className="h-4 w-4 mr-2" />
                    Personel Bilgileri
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900">{profile.name}</h3>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex items-center text-gray-500 text-sm font-medium mb-2">
                    <Mail className="h-4 w-4 mr-2" />
                    İletişim Bilgileri
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">E-posta</p>
                      <p className="font-medium text-gray-900">{profile.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Telefon</p>
                      <p className="font-medium text-gray-900">{profile.phone}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center text-gray-500 text-sm font-medium mb-2">
                    <Clock className="h-4 w-4 mr-2" />
                    Kayıt Tarihi
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="font-medium text-gray-900">
                      {new Date(profile.created_at).toLocaleDateString('tr-TR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}