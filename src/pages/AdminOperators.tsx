import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Search, Filter, Power, Hash, Building2, Phone, Mail } from 'lucide-react';

interface Operator {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  is_active: boolean;
  created_at: string;
  rejection_reason?: string;
  company: {
    company_name: string;
    company_code: string;
  };
}

export default function AdminOperators() {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchOperators();
  }, []);

  const fetchOperators = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('operators')
        .select(`
          *,
          company:companies (
            company_name,
            company_code
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOperators(data || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (operatorId: string, status: string, rejectionReason?: string) => {
    try {
      const { error } = await supabase
        .from('operators')
        .update({ 
          status, 
          rejection_reason: rejectionReason || null,
          is_active: status === 'approved'
        })
        .eq('id', operatorId);

      if (error) throw error;
      toast.success(status === 'approved' ? 'Operatör başarıyla onaylandı' : 'Operatör başarıyla reddedildi');
      fetchOperators();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleToggleActive = async (operatorId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('operators')
        .update({ is_active: !currentStatus })
        .eq('id', operatorId);

      if (error) throw error;
      toast.success(currentStatus ? 'Operatör pasif duruma alındı' : 'Operatör aktif duruma alındı');
      fetchOperators();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const filteredOperators = operators.filter(operator =>
    (statusFilter === 'all' || operator.status === statusFilter) &&
    (operator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     operator.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
     operator.company.company_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Onaylandı';
      case 'pending':
        return 'Beklemede';
      case 'rejected':
        return 'Reddedildi';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">OPERATÖRLER</h2>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 justify-between items-center">
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
                    <option value="pending">Beklemede</option>
                    <option value="approved">Onaylandı</option>
                    <option value="rejected">Reddedildi</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="relative">
              <Search className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="search"
                placeholder="Operatör ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-500">Operatörler yükleniyor...</p>
            </div>
          ) : filteredOperators.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900">
                {searchTerm ? 'Aranan operatör bulunamadı' : 'Henüz operatör kaydı yok'}
              </h3>
              <p className="mt-2 text-gray-500">
                {searchTerm ? 'Farklı bir arama yapmayı deneyin' : 'Operatörler kayıt oldukça burada listelenecek'}
              </p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Operatör
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Şirket
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İletişim
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
                {filteredOperators.map((operator) => (
                  <tr key={operator.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{operator.name}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(operator.created_at).toLocaleDateString('tr-TR')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <Building2 className="h-5 w-5 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{operator.company.company_name}</div>
                          <div className="text-sm text-gray-500">{operator.company.company_code}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-y-1 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-2" />
                          {operator.email}
                        </div>
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2" />
                          {operator.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          operator.status === 'approved' ? 'bg-green-100 text-green-800' :
                          operator.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {getStatusText(operator.status)}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          operator.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {operator.is_active ? 'Aktif' : 'Pasif'}
                        </span>
                      </div>
                      {operator.rejection_reason && operator.status === 'rejected' && (
                        <p className="mt-1 text-xs text-red-600">
                          Sebep: {operator.rejection_reason}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {operator.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(operator.id, 'approved')}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Onayla
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(operator.id, 'rejected', 'KAYIT İSTEĞİNİZ KABUL EDİLMEDİ')}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reddet
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleToggleActive(operator.id, operator.is_active)}
                          className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white ${
                            operator.is_active ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'
                          }`}
                        >
                          <Power className="h-4 w-4 mr-1" />
                          {operator.is_active ? 'Pasife Al' : 'Aktife Al'}
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
  );
}