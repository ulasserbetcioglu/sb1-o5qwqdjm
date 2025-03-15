import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { Building2, FileText, Settings, TrendingUp, LogOut, Clock, AlertCircle, Hash, ChevronRight, Users } from 'lucide-react';

interface CustomerProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  customer_code: string;
  created_at: string;
  company: {
    company_name: string;
    company_code: string;
  };
  branch_count: number;
}

interface Branch {
  id: string;
  name: string;
  branch_code: string;
  equipment_count: number;
}

interface Offer {
  id: string;
  offer_code: string;
  total_amount: number;
  status: string;
  created_at: string;
}

interface Application {
  id: string;
  application_code: string;
  status: string;
  scheduled_date: string;
}

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Kullanıcı bulunamadı');

      // First get the customer_users entry
      const { data: customerUser, error: customerUserError } = await supabase
        .from('customer_users')
        .select('customer_id')
        .eq('user_id', user.id)
        .single();

      if (customerUserError) throw customerUserError;
      if (!customerUser) throw new Error('Müşteri kaydı bulunamadı');

      // Then get the customer data
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select(`
          id,
          name,
          email,
          phone,
          customer_code,
          created_at,
          branch_count,
          company:companies (
            company_name,
            company_code
          )
        `)
        .eq('id', customerUser.customer_id)
        .single();

      if (customerError) throw customerError;
      setProfile(customerData);

      // Fetch branches
      const { data: branchData, error: branchError } = await supabase
        .from('branches')
        .select('id, name, branch_code, equipment_count')
        .eq('customer_id', customerUser.customer_id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (branchError) throw branchError;
      setBranches(branchData || []);

      // Fetch recent offers (placeholder for now)
      setOffers([
        {
          id: '1',
          offer_code: 'OFF-001',
          total_amount: 1500,
          status: 'pending',
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          offer_code: 'OFF-002',
          total_amount: 2500,
          status: 'approved',
          created_at: new Date().toISOString()
        }
      ]);

      // Fetch recent applications (placeholder for now)
      setApplications([
        {
          id: '1',
          application_code: 'APP-001',
          status: 'scheduled',
          scheduled_date: new Date().toISOString()
        },
        {
          id: '2',
          application_code: 'APP-002',
          status: 'completed',
          scheduled_date: new Date().toISOString()
        }
      ]);

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
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
          <div className="px-6 py-8 bg-gradient-to-r from-blue-600 to-blue-700">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-2xl font-bold text-white">{profile.name}</h1>
                  <span className="px-2 py-1 bg-white bg-opacity-20 rounded text-sm text-white font-medium">
                    {profile.customer_code}
                  </span>
                </div>
                <p className="mt-1 text-blue-100">Müşteri Paneli</p>
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

          <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-4 gap-4 border-t border-gray-100">
            <div className="flex items-center space-x-3 px-4 py-3 bg-gray-50 rounded-lg">
              <Building2 className="h-6 w-6 text-blue-500" />
              <div>
                <p className="text-sm text-gray-500">Toplam Şube</p>
                <p className="text-lg font-semibold text-gray-900">{profile.branch_count}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 px-4 py-3 bg-gray-50 rounded-lg">
              <FileText className="h-6 w-6 text-green-500" />
              <div>
                <p className="text-sm text-gray-500">Aktif Teklif</p>
                <p className="text-lg font-semibold text-gray-900">3</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 px-4 py-3 bg-gray-50 rounded-lg">
              <Settings className="h-6 w-6 text-purple-500" />
              <div>
                <p className="text-sm text-gray-500">Planlı Uygulama</p>
                <p className="text-lg font-semibold text-gray-900">5</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 px-4 py-3 bg-gray-50 rounded-lg">
              <Users className="h-6 w-6 text-orange-500" />
              <div>
                <p className="text-sm text-gray-500">Aktif Personel</p>
                <p className="text-lg font-semibold text-gray-900">8</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Branches Section */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Şubeler</h2>
              <button
                onClick={() => navigate('/branches')}
                className="text-blue-600 hover:text-blue-800 flex items-center text-sm font-medium"
              >
                Tümünü Gör
                <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            </div>
            <div className="p-6">
              {branches.length === 0 ? (
                <div className="text-center py-8">
                  <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Henüz şube eklenmemiş</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {branches.map(branch => (
                    <div key={branch.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900">{branch.name}</h3>
                        <p className="text-sm text-gray-500">{branch.branch_code}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{branch.equipment_count} Ekipman</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Offers Section */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Son Teklifler</h2>
              <button
                onClick={() => navigate('/offers')}
                className="text-blue-600 hover:text-blue-800 flex items-center text-sm font-medium"
              >
                Tümünü Gör
                <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            </div>
            <div className="p-6">
              {offers.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Henüz teklif bulunmuyor</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {offers.map(offer => (
                    <div key={offer.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900">{offer.offer_code}</h3>
                        <p className="text-sm text-gray-500">
                          {new Date(offer.created_at).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {offer.total_amount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                        </p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          offer.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {offer.status === 'approved' ? 'Onaylandı' : 'Beklemede'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Applications Section */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Uygulamalar</h2>
              <button
                onClick={() => navigate('/applications')}
                className="text-blue-600 hover:text-blue-800 flex items-center text-sm font-medium"
              >
                Tümünü Gör
                <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            </div>
            <div className="p-6">
              {applications.length === 0 ? (
                <div className="text-center py-8">
                  <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Henüz uygulama bulunmuyor</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.map(application => (
                    <div key={application.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900">{application.application_code}</h3>
                        <p className="text-sm text-gray-500">
                          {new Date(application.scheduled_date).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                      <div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          application.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {application.status === 'completed' ? 'Tamamlandı' : 'Planlandı'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Trend Analysis Section */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Trend Analizi</h2>
              <button
                onClick={() => navigate('/trends')}
                className="text-blue-600 hover:text-blue-800 flex items-center text-sm font-medium"
              >
                Detaylı Analiz
                <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            </div>
            <div className="p-6">
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Trend analizi yakında eklenecek</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}