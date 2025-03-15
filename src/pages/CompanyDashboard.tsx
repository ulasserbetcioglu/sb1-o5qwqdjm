import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { Building2, User, Mail, Phone, LogOut, Clock, AlertCircle, Hash, ChevronRight, Users, Settings, FileText, ClipboardCheck, Calendar, Contact as FileContract, Plus } from 'lucide-react';
import { LogoUpload } from '../components/LogoUpload';

interface CompanyProfile {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  address: string;
  status: string;
  created_at: string;
  rejection_reason?: string;
  company_code: string;
  logo_url?: string;
}

export default function CompanyDashboard() {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        if (error.code === 'PGRST116') {
          toast.error('Şirket kaydınız bulunamadı');
          navigate('/');
          return;
        }
        throw error;
      }

      if (!data) {
        toast.error('Şirket kaydınız bulunamadı');
        navigate('/');
        return;
      }

      if (!data.is_active || data.status !== 'approved') {
        toast.error('Şirket hesabınız aktif değil veya onaylanmamış');
        navigate('/');
        return;
      }

      setProfile(data);
    } catch (error: any) {
      toast.error(error.message);
      navigate('/');
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

  const menuItems = [
    {
      title: 'Müşteriler',
      path: '/customers',
      icon: <Users className="h-6 w-6 text-blue-600" />,
      description: 'Müşteri yönetimi ve detayları'
    },
    {
      title: 'Operatörler',
      path: '/operators',
      icon: <User className="h-6 w-6 text-green-600" />,
      description: 'Operatör yönetimi'
    },
    {
      title: 'Sözleşmeler',
      path: '/contracts',
      icon: <FileContract className="h-6 w-6 text-purple-600" />,
      description: 'Sözleşme yönetimi'
    },
    {
      title: 'Kontroller',
      path: '/controls',
      icon: <ClipboardCheck className="h-6 w-6 text-orange-600" />,
      description: 'Uygulama kontrolleri'
    },
    {
      title: 'Takvim',
      path: '/calendar',
      icon: <Calendar className="h-6 w-6 text-red-600" />,
      description: 'Ziyaret takvimi'
    },
    {
      title: 'Tanımlamalar',
      path: '/definitions',
      icon: <Settings className="h-6 w-6 text-indigo-600" />,
      description: 'Sistem tanımlamaları'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
          <div className="px-6 py-8 bg-gradient-to-r from-blue-600 to-blue-700">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-6">
                {/* Add LogoUpload component */}
                {profile && (
                  <LogoUpload
                    type="company"
                    id={profile.id}
                    currentLogo={profile.logo_url}
                    onUploadComplete={async (url) => {
                      try {
                        const { error } = await supabase
                          .from('companies')
                          .update({ logo_url: url })
                          .eq('id', profile.id);

                        if (error) throw error;
                        setProfile(prev => prev ? { ...prev, logo_url: url } : null);
                      } catch (error: any) {
                        toast.error('Logo güncellenirken bir hata oluştu');
                      }
                    }}
                  />
                )}
                <div>
                  <div className="flex items-center space-x-2">
                    <h1 className="text-2xl font-bold text-white">{profile?.company_name}</h1>
                    <span className="px-2 py-1 bg-white bg-opacity-20 rounded text-sm text-white font-medium">
                      {profile?.company_code}
                    </span>
                  </div>
                  <p className="mt-1 text-blue-100">Şirket Paneli</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate('/controls/new')}
                  className="flex items-center px-4 py-2 bg-white bg-opacity-20 rounded-lg text-white hover:bg-opacity-30 transition-colors"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Yeni Uygulama
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center px-4 py-2 bg-white bg-opacity-20 rounded-lg text-white hover:bg-opacity-30 transition-colors"
                >
                  <LogOut className="h-5 w-5 mr-2" />
                  Çıkış Yap
                </button>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center text-gray-500 text-sm font-medium mb-2">
                    <Building2 className="h-4 w-4 mr-2" />
                    Şirket Bilgileri
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{profile.company_name}</h3>
                      <span className="text-sm font-medium text-gray-500">{profile.company_code}</span>
                    </div>
                    <p className="text-gray-600 text-sm">{profile.address}</p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center text-gray-500 text-sm font-medium mb-2">
                    <User className="h-4 w-4 mr-2" />
                    İletişim Kişisi
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900">{profile.contact_name}</h3>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
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

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  {item.icon}
                  <h3 className="ml-3 text-lg font-medium text-gray-900">{item.title}</h3>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">{item.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}