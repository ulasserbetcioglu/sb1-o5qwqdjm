import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { Building2, User, Mail, Phone, LogOut, Clock, AlertCircle, Calendar, ClipboardCheck, Plus } from 'lucide-react';

interface OperatorProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  is_active: boolean;
  created_at: string;
  company: {
    company_name: string;
    company_code: string;
  };
}

interface Application {
  id: string;
  application_code: string;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  customer: {
    name: string;
  } | null;
  branch: {
    name: string;
  } | null;
}

export default function OperatorDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<OperatorProfile | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
    fetchApplications();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Kullanıcı bulunamadı');

      const { data: operatorData, error } = await supabase
        .from('operators')
        .select(`
          id,
          name,
          email,
          phone,
          status,
          is_active,
          created_at,
          company:companies (
            company_name,
            company_code
          )
        `)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      // Check operator status and company status
      if (!operatorData.is_active || operatorData.status !== 'approved') {
        toast.error('Hesabınız henüz onaylanmamış veya pasif durumda');
        await supabase.auth.signOut();
        navigate('/login');
        return;
      }

      setProfile(operatorData);
    } catch (error: any) {
      toast.error(error.message);
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Kullanıcı bulunamadı');

      const { data: operatorData } = await supabase
        .from('operators')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!operatorData) throw new Error('Operatör bulunamadı');

      const { data: applicationsData, error } = await supabase
        .from('applications')
        .select(`
          id,
          application_code,
          scheduled_date,
          scheduled_time,
          status,
          customer:customers (
            name
          ),
          branch:branches (
            name
          )
        `)
        .eq('operator_id', operatorData.id)
        .order('scheduled_date', { ascending: true })
        .order('scheduled_time', { ascending: true })
        .limit(5);

      if (error) throw error;
      setApplications(applicationsData || []);
    } catch (error: any) {
      console.error('Error fetching applications:', error);
      toast.error('Uygulamalar yüklenirken bir hata oluştu');
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'Planlandı';
      case 'in_progress':
        return 'Devam Ediyor';
      case 'completed':
        return 'Tamamlandı';
      case 'cancelled':
        return 'İptal Edildi';
      default:
        return status;
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
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
          <div className="px-6 py-8 bg-gradient-to-r from-blue-600 to-blue-700">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-2xl font-bold text-white">{profile.name}</h1>
                </div>
                <p className="mt-1 text-blue-100">Operatör Paneli</p>
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

          <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => navigate('/controls')}
              className="flex items-center justify-center px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ClipboardCheck className="h-6 w-6 text-blue-600 mr-2" />
              <span className="text-gray-900 font-medium">Kontrol Listesi</span>
            </button>
            <button
              onClick={() => navigate('/controls/new')}
              className="flex items-center justify-center px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Plus className="h-6 w-6 text-green-600 mr-2" />
              <span className="text-gray-900 font-medium">Yeni Uygulama</span>
            </button>
            <button
              onClick={() => navigate('/calendar')}
              className="flex items-center justify-center px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Calendar className="h-6 w-6 text-purple-600 mr-2" />
              <span className="text-gray-900 font-medium">Takvim</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Profile Info */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Profil Bilgileri</h2>
            </div>
            <div className="p-6 space-y-6">
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

          {/* Recent Applications */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Son Uygulamalar</h2>
            </div>
            <div className="p-6">
              {applications.length === 0 ? (
                <div className="text-center py-8">
                  <ClipboardCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Henüz uygulama bulunmuyor</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.map(application => (
                    <div 
                      key={application.id}
                      className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {application.customer?.name || 'Müşteri bilgisi yok'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {application.branch?.name || 'Şube bilgisi yok'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(application.scheduled_date).toLocaleDateString('tr-TR')} - {application.scheduled_time}
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                          {getStatusText(application.status)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}