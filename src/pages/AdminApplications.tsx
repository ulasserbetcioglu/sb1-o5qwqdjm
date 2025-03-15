import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { Calendar, Clock, FileText, Filter, Search, Settings, SortAsc, SortDesc, PenTool as Tool, User, Building2, Hash } from 'lucide-react';

interface Application {
  id: string;
  application_code: string;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  notes: string;
  company: {
    company_name: string;
    company_code: string;
  } | null;
  customer: {
    name: string;
    customer_code: string;
  } | null;
  branch: {
    name: string;
    branch_code: string;
  } | null;
  operator: {
    name: string;
    email: string;
  } | null;
}

export default function AdminApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState<'scheduled_date' | 'application_code'>('scheduled_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchApplications();
  }, [sortField, sortDirection]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          company:companies (
            company_name,
            company_code
          ),
          customer:customers (
            name,
            customer_code
          ),
          branch:branches (
            name,
            branch_code
          ),
          operator:operators (
            name,
            email
          )
        `)
        .order(sortField, { ascending: sortDirection === 'asc' });

      if (error) throw error;
      setApplications(data || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSort = (field: 'scheduled_date' | 'application_code') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
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

  const filteredApplications = applications.filter(app =>
    (statusFilter === 'all' || app.status === statusFilter) &&
    (app.application_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
     (app.company?.company_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
     (app.customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
     (app.branch?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
     (app.operator?.name || '').toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 justify-between items-center">
              <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-semibold text-gray-900">UYGULAMALAR</h1>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-48">
                  <div className="relative">
                    <Filter className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="pl-10 w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="all">Tüm Durumlar</option>
                      <option value="scheduled">Planlandı</option>
                      <option value="in_progress">Devam Ediyor</option>
                      <option value="completed">Tamamlandı</option>
                      <option value="cancelled">İptal Edildi</option>
                    </select>
                  </div>
                </div>
                <div className="relative">
                  <Search className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="search"
                    placeholder="Uygulama ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-4 text-gray-500">Uygulamalar yükleniyor...</p>
              </div>
            ) : filteredApplications.length === 0 ? (
              <div className="text-center py-12">
                <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">
                  {searchTerm ? 'Aranan uygulama bulunamadı' : 'Henüz uygulama eklenmemiş'}
                </h3>
                <p className="mt-2 text-gray-500">
                  {searchTerm ? 'Farklı bir arama yapmayı deneyin' : 'Henüz hiçbir uygulama kaydı yok'}
                </p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => toggleSort('application_code')}
                        className="flex items-center space-x-1 hover:text-gray-700"
                      >
                        <span>Uygulama Kodu</span>
                        {sortField === 'application_code' && (
                          sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                        )}
                      </button>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Şirket
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Müşteri
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Şube
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => toggleSort('scheduled_date')}
                        className="flex items-center space-x-1 hover:text-gray-700"
                      >
                        <span>Tarih</span>
                        {sortField === 'scheduled_date' && (
                          sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                        )}
                      </button>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Operatör
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Durum
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredApplications.map((app) => (
                    <tr key={app.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {app.application_code}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{app.company?.company_name || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{app.company?.company_code || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{app.customer?.name || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{app.customer?.customer_code || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{app.branch?.name || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{app.branch?.branch_code || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(app.scheduled_date).toLocaleDateString('tr-TR')}
                        </div>
                        <div className="text-sm text-gray-500">
                          {app.scheduled_time}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {app.operator ? (
                          <>
                            <div className="text-sm font-medium text-gray-900">{app.operator.name}</div>
                            <div className="text-sm text-gray-500">{app.operator.email}</div>
                          </>
                        ) : (
                          <span className="text-sm text-gray-500">Atanmadı</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                          {getStatusText(app.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-4">
                          <button className="text-blue-600 hover:text-blue-800 flex items-center">
                            <FileText className="h-5 w-5" />
                            <span className="ml-1">Detay</span>
                          </button>
                          <button className="text-blue-600 hover:text-blue-800 flex items-center">
                            <Tool className="h-5 w-5" />
                            <span className="ml-1">Ekipmanlar</span>
                          </button>
                          <button className="text-blue-600 hover:text-blue-800 flex items-center">
                            <Settings className="h-5 w-5" />
                            <span className="ml-1">Düzenle</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}