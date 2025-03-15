import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { Calendar, Plus, Search, Filter, ArrowRight, Clock, Building2, MapPin } from 'lucide-react';

interface Application {
  id: string;
  application_code: string;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  customer: {
    name: string;
  };
  branch: {
    name: string;
  };
}

export default function ControlList() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');

  useEffect(() => {
    fetchApplications();
  }, [selectedDate]);

  const fetchApplications = async () => {
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
        .single();

      if (operatorError && operatorError.code !== 'PGRST116') {
        throw operatorError;
      }

      // If not an operator, check for company
      let companyId;
      if (!operatorData) {
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
        companyId = companyData.id;
      } else {
        companyId = operatorData.company_id;
      }

      const query = supabase
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
        .eq('scheduled_date', selectedDate)
        .order('scheduled_time', { ascending: true });

      // Add appropriate filter based on user role
      if (operatorData) {
        query.eq('operator_id', operatorData.id);
      } else {
        query.eq('company_id', companyId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setApplications(data || []);
    } catch (error: any) {
      console.error('Error fetching applications:', error);
      toast.error('Kontroller yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const filteredApplications = applications.filter(application => {
    const matchesSearch = 
      application.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      application.branch.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'pending' && application.status === 'pending') ||
      (statusFilter === 'completed' && application.status === 'completed');

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
              <h1 className="text-2xl font-bold text-gray-900">Kontrol Listesi</h1>
              <div className="flex items-center space-x-4">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
                <button
                  onClick={() => navigate('/controls/new')}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Yeni Kontrol
                </button>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="flex-1 relative">
                <Search className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  placeholder="Müşteri veya lokasyon ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="w-full sm:w-48">
                <div className="relative">
                  <Filter className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as 'all' | 'pending' | 'completed')}
                    className="pl-10 w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="all">Tüm Durumlar</option>
                    <option value="pending">Bekleyen</option>
                    <option value="completed">Tamamlanan</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Application List */}
          <div className="divide-y divide-gray-200">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : filteredApplications.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Uygulama Bulunamadı</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Bu tarih için henüz bir uygulama planlanmamış.
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => navigate('/controls/new')}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Yeni Uygulama Ekle
                  </button>
                </div>
              </div>
            ) : (
              filteredApplications.map((application) => (
                <div key={application.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(application.scheduled_date).toLocaleDateString('tr-TR')}</span>
                        <Clock className="h-4 w-4 ml-2" />
                        <span>{application.scheduled_time}</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-start space-x-2">
                          <Building2 className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">{application.customer.name}</h3>
                            <div className="flex items-center text-sm text-gray-500">
                              <MapPin className="h-4 w-4 mr-1" />
                              <span>{application.branch.name}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/inspections/${application.id}`)}
                      className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium ${
                        application.status === 'pending'
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {application.status === 'pending' ? 'Başlat' : 'İncele'}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}