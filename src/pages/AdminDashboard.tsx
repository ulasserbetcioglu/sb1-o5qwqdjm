import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { Building2, Plus, ArrowLeft, LogOut, Search, Filter, RefreshCw, Trash2, Power, Hash, Calendar, ClipboardCheck, MapPin, FileText } from 'lucide-react';

interface Company {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  address: string;
  status: string;
  is_active: boolean;
  created_at: string;
  rejection_reason?: string;
  company_code: string;
}

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
  operator: {
    name: string;
  };
}

interface Branch {
  id: string;
  name: string;
  branch_code: string;
  manager_name: string;
  phone: string;
  email: string;
  address: string;
  created_at: string;
  customer: {
    name: string;
    customer_code: string;
  };
}

type ViewMode = 'companies' | 'applications' | 'branches' | 'biocidal_products';

function AdminDashboard() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<ViewMode>('companies');

  useEffect(() => {
    if (viewMode === 'companies') {
      fetchCompanies();
    } else if (viewMode === 'applications') {
      fetchApplications();
    } else if (viewMode === 'branches') {
      fetchBranches();
    }
  }, [viewMode]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCompanies(data || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          customer:customers (
            name
          ),
          branch:branches (
            name
          ),
          operator:operators (
            name
          )
        `)
        .order('scheduled_date', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('branches')
        .select(`
          *,
          customer:customers (
            name,
            customer_code
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBranches(data || []);
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

  const handleCompanyStatusUpdate = async (companyId: string, status: string, rejectionReason?: string) => {
    try {
      const { error } = await supabase
        .from('companies')
        .update({ 
          status, 
          rejection_reason: rejectionReason || null,
          is_active: status === 'approved'
        })
        .eq('id', companyId);

      if (error) throw error;
      toast.success(status === 'approved' ? 'Şirket başarıyla onaylandı' : 'Şirket başarıyla reddedildi');
      fetchCompanies();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteCompany = async (companyId: string) => {
    if (!window.confirm('Bu şirketi silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', companyId);

      if (error) throw error;
      toast.success('Şirket başarıyla silindi');
      fetchCompanies();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteBranch = async (branchId: string) => {
    if (!window.confirm('Bu şubeyi silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('branches')
        .delete()
        .eq('id', branchId);

      if (error) throw error;
      toast.success('Şube başarıyla silindi');
      fetchBranches();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleToggleActive = async (companyId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('companies')
        .update({ is_active: !currentStatus })
        .eq('id', companyId);

      if (error) throw error;
      toast.success(currentStatus ? 'Şirket pasif duruma alındı' : 'Şirket aktif duruma alındı');
      fetchCompanies();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Onaylandı';
      case 'pending':
        return 'Beklemede';
      case 'rejected':
        return 'Reddedildi';
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredCompanies = companies.filter(company => 
    (statusFilter === 'all' || company.status === statusFilter) &&
    (company.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     company.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     company.company_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
     company.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredApplications = applications.filter(app =>
    (statusFilter === 'all' || app.status === statusFilter) &&
    (app.application_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
     app.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     app.branch?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     app.operator?.name?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredBranches = branches.filter(branch =>
    branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    branch.branch_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    branch.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    branch.customer?.customer_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Admin Paneli</h2>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => {
              if (viewMode === 'companies') {
                fetchCompanies();
              } else if (viewMode === 'applications') {
                fetchApplications();
              } else if (viewMode === 'branches') {
                fetchBranches();
              }
            }}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Yenile
          </button>
          <button
            onClick={handleLogout}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
          >
            <LogOut className="h-5 w-5 mr-2" />
            Çıkış Yap
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <button
              onClick={() => setViewMode('companies')}
              className={`inline-flex items-center px-4 py-2 rounded-md ${
                viewMode === 'companies'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Building2 className="h-5 w-5 mr-2" />
              Şirketler
            </button>
            <button
              onClick={() => navigate('/admin/customers')}
              className={`inline-flex items-center px-4 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200`}
            >
              <Plus className="h-5 w-5 mr-2" />
              Müşteriler
            </button>
            <button
              onClick={() => navigate('/admin/operators')}
              className={`inline-flex items-center px-4 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200`}
            >
              <Plus className="h-5 w-5 mr-2" />
              Operatörler
            </button>
            <button
              onClick={() => setViewMode('branches')}
              className={`inline-flex items-center px-4 py-2 rounded-md ${
                viewMode === 'branches'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <MapPin className="h-5 w-5 mr-2" />
              Şubeler
            </button>
            <button
              onClick={() => setViewMode('applications')}
              className={`inline-flex items-center px-4 py-2 rounded-md ${
                viewMode === 'applications'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <ClipboardCheck className="h-5 w-5 mr-2" />
              Ziyaretler
            </button>
            <button
              onClick={() => navigate('/admin/biocidal-products')}
              className={`inline-flex items-center px-4 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200`}
            >
              <FileText className="h-5 w-5 mr-2" />
              Biyosidal Ürün Dökümanları
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
              {viewMode === 'companies' && (
                <div className="w-48">
                  <div className="relative">
                    <Filter className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="pl-10 w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="all">Tüm Durumlar</option>
                      <option value="pending">Beklemede</option>
                      <option value="approved">Onaylandı</option>
                      <option value="rejected">Reddedildi</option>
                    </select>
                  </div>
                </div>
              )}
              {viewMode === 'applications' && (
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
              )}
              <div className="relative">
                <Search className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                <input
                  type="search"
                  placeholder={
                    viewMode === 'companies' 
                      ? "Şirket ara..." 
                      : viewMode === 'branches'
                      ? "Şube ara..."
                      : "Ziyaret ara..."
                  }
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-500">
                {viewMode === 'companies' 
                  ? 'Şirketler' 
                  : viewMode === 'branches'
                  ? 'Şubeler'
                  : 'Ziyaretler'} yükleniyor...
              </p>
            </div>
          ) : viewMode === 'companies' ? (
            filteredCompanies.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900">
                  {searchTerm ? 'Aranan şirket bulunamadı' : 'Henüz şirket kaydı yok'}
                </h3>
                <p className="mt-2 text-gray-500">
                  {searchTerm ? 'Farklı bir arama yapmayı deneyin' : 'Şirketler kayıt oldukça burada listelenecek'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Şirket Kodu
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Şirket
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        İletişim Bilgileri
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Kayıt Tarihi
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
                    {filteredCompanies.map((company) => (
                      <tr key={company.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Hash className="h-4 w-4 text-gray-400 mr-1" />
                            <span className="text-sm font-medium text-gray-900">{company.company_code}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{company.company_name}</div>
                          <div className="text-sm text-gray-500">{company.address}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{company.contact_name}</div>
                          <div className="text-sm text-gray-500">{company.email}</div>
                          <div className="text-sm text-gray-500">{company.phone}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(company.created_at).toLocaleDateString('tr-TR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col space-y-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              company.status === 'approved' ? 'bg-green-100 text-green-800' :
                              company.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {getStatusText(company.status)}
                            </span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              company.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {company.is_active ? 'Aktif' : 'Pasif'}
                            </span>
                          </div>
                          {company.rejection_reason && company.status === 'rejected' && (
                            <p className="mt-1 text-xs text-red-600">
                              Sebep: {company.rejection_reason}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            {company.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleCompanyStatusUpdate(company.id, 'approved')}
                                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                                >
                                  Onayla
                                </button>
                                <button
                                  onClick={() => handleCompanyStatusUpdate(company.id, 'rejected', 'KAYIT İSTEĞİNİZ KABUL EDİLMEDİ')}
                                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                                >
                                  Reddet
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleToggleActive(company.id, company.is_active)}
                              className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white ${
                                company.is_active ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'
                              }`}
                            >
                              <Power className="h-4 w-4 mr-1" />
                              {company.is_active ? 'Pasife Al' : 'Aktife Al'}
                            </button>
                            <button
                              onClick={() => handleDeleteCompany(company.id)}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Sil
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : viewMode === 'branches' ? (
            filteredBranches.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900">
                  {searchTerm ? 'Aranan şube bulunamadı' : 'Henüz şube kaydı yok'}
                </h3>
                <p className="mt-2 text-gray-500">
                  {searchTerm ? 'Farklı bir arama yapmayı deneyin' : 'Şubeler eklendikçe burada listelenecek'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Şube Kodu
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Müşteri
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Şube Adı
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        İletişim
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Adres
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        İşlemler
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredBranches.map((branch) => (
                      <tr key={branch.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Hash className="h-4 w-4 text-gray-400 mr-1" />
                            <span className="text-sm font-medium text-gray-900">{branch.branch_code}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{branch.customer?.name}</div>
                          <div className="text-sm text-gray-500">{branch.customer?.customer_code}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{branch.name}</div>
                          <div className="text-sm text-gray-500">{branch.manager_name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500">{branch.email}</div>
                          <div className="text-sm text-gray-500">{branch.phone}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500">{branch.address}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleDeleteBranch(branch.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Sil
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            // Applications view
            filteredApplications.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900">
                  {searchTerm ? 'Aranan ziyaret bulunamadı' : 'Henüz ziyaret kaydı yok'}
                </h3>
                <p className="mt-2 text-gray-500">
                  {searchTerm ? 'Farklı bir arama yapmayı deneyin' : 'Ziyaretler eklendikçe burada listelenecek'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ziyaret Kodu
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Müşteri
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Şube
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tarih/Saat
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Operatör
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Durum
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredApplications.map((app) => (
                      <tr key={app.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {app.application_code}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text- nowrap text-sm text-gray-500">
                          {app.customer?.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {app.branch?.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(app.scheduled_date).toLocaleDateString('tr-TR')} {app.scheduled_time}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {app.operator?.name || 'Atanmadı'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                            {getStatusText(app.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;