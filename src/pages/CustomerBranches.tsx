import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Building2, Plus, ArrowLeft, PenTool as Tool, FileText, Settings, TrendingUp, Pencil, Trash2, QrCode, TrendingDown, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { QuantityInput } from '../components/QuantityInput';

interface Branch {
  id: string;
  name: string;
  manager_name: string;
  phone: string;
  email: string;
  address: string;
  equipment_count: number;
  branch_code: string;
}

interface Customer {
  id: string;
  name: string;
  customer_code: string;
}

interface Equipment {
  id: string;
  equipment_code: string;
  equipment_type_id: string;
  equipment_type_name: string;
  quantity: number;
  created_at: string;
}

interface EquipmentType {
  id: string;
  name: string;
  code: string;
}

interface BulkEquipmentItem {
  equipment_type_id: string;
  quantity: number;
}

const PAGE_SIZE = 20;

export default function CustomerBranches() {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddEquipmentModal, setShowAddEquipmentModal] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [selectedBranchName, setSelectedBranchName] = useState<string>('');
  const [equipmentTypes, setEquipmentTypes] = useState<EquipmentType[]>([]);
  const [branchEquipment, setBranchEquipment] = useState<Equipment[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [isOperator, setIsOperator] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const observer = useRef<IntersectionObserver | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    manager_name: '',
    phone: '',
    email: '',
    address: ''
  });
  const [bulkEquipment, setBulkEquipment] = useState<BulkEquipmentItem[]>([
    { equipment_type_id: '', quantity: 1 }
  ]);

  useEffect(() => {
    checkAccess();
  }, [customerId]);

  const checkAccess = async () => {
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
        .maybeSingle();

      if (operatorError && operatorError.code !== 'PGRST116') {
        throw operatorError;
      }

      if (operatorData) {
        setIsOperator(true);
        setCompanyId(operatorData.company_id);
        await fetchCustomerAndBranches(operatorData.company_id);
        await fetchEquipmentTypes(operatorData.company_id);
      } else {
        // Check for company access
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (companyError) {
          if (companyError.code === 'PGRST116') {
            toast.error('Şirket veya operatör kaydı bulunamadı');
            navigate('/login');
            return;
          }
          throw companyError;
        }

        if (companyData) {
          setCompanyId(companyData.id);
          await fetchCustomerAndBranches(companyData.id);
          await fetchEquipmentTypes(companyData.id);
        }
      }
    } catch (error: any) {
      console.error('Error checking access:', error);
      toast.error('Erişim kontrolü sırasında bir hata oluştu');
      navigate('/login');
    }
  };

  const fetchCustomerAndBranches = async (companyId: string) => {
    try {
      setLoading(true);
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('id, name, customer_code')
        .eq('id', customerId)
        .eq('company_id', companyId)
        .single();

      if (customerError) throw customerError;
      setCustomer(customerData);

      const { data: branchesData, error: branchesError } = await supabase
        .from('branches')
        .select('*')
        .eq('customer_id', customerId)
        .order('name', { ascending: true });

      if (branchesError) throw branchesError;
      setBranches(branchesData || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchEquipmentTypes = async (companyId: string) => {
    try {
      const { data: definitions, error } = await supabase
        .from('definitions')
        .select('id, name, code')
        .eq('type', 'equipment')
        .eq('company_id', companyId)
        .eq('is_active', true);

      if (error) throw error;
      setEquipmentTypes(definitions || []);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const fetchBranchEquipment = async (branchId: string) => {
    try {
      setPage(0);
      setHasMore(true);
      setBranchEquipment([]);
      
      const { data, error } = await supabase
        .from('branch_equipment')
        .select(`
          id,
          equipment_code,
          equipment_type_id,
          equipment_types (name),
          quantity,
          created_at
        `)
        .eq('branch_id', branchId)
        .order('created_at', { ascending: false })
        .range(0, PAGE_SIZE - 1);

      if (error) throw error;

      const formattedEquipment = data.map(item => ({
        id: item.id,
        equipment_code: item.equipment_code,
        equipment_type_id: item.equipment_type_id,
        equipment_type_name: item.equipment_types.name,
        quantity: item.quantity,
        created_at: item.created_at
      }));

      setBranchEquipment(formattedEquipment);
      setHasMore(data.length === PAGE_SIZE);
      setPage(1);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const loadMoreEquipment = async () => {
    if (!selectedBranchId || loadingMore || !hasMore) return;

    try {
      setLoadingMore(true);
      const start = page * PAGE_SIZE;
      const end = start + PAGE_SIZE - 1;

      const { data, error } = await supabase
        .from('branch_equipment')
        .select(`
          id,
          equipment_code,
          equipment_type_id,
          equipment_types (name),
          quantity,
          created_at
        `)
        .eq('branch_id', selectedBranchId)
        .order('created_at', { ascending: false })
        .range(start, end);

      if (error) throw error;

      const formattedEquipment = data.map(item => ({
        id: item.id,
        equipment_code: item.equipment_code,
        equipment_type_id: item.equipment_type_id,
        equipment_type_name: item.equipment_types.name,
        quantity: item.quantity,
        created_at: item.created_at
      }));

      setBranchEquipment(prev => [...prev, ...formattedEquipment]);
      setHasMore(data.length === PAGE_SIZE);
      setPage(prev => prev + 1);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Generate branch code
      const branchCode = 'BR-' + String(Math.floor(10000 + Math.random() * 90000));

      const { error } = await supabase
        .from('branches')
        .insert([{
          customer_id: customerId,
          name: formData.name,
          manager_name: formData.manager_name,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          branch_code: branchCode
        }]);

      if (error) throw error;

      toast.success('Şube başarıyla eklendi');
      setShowAddModal(false);
      setFormData({
        name: '',
        manager_name: '',
        phone: '',
        email: '',
        address: ''
      });
      fetchCustomerAndBranches(companyId!);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const lastEquipmentElementRef = useCallback((node: HTMLTableRowElement | null) => {
    if (loadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMoreEquipment();
      }
    });
    if (node) observer.current.observe(node);
  }, [loadingMore, hasMore]);

  const handleDelete = async (branchId: string) => {
    if (!window.confirm('Bu şubeyi silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('branches')
        .delete()
        .eq('id', branchId);

      if (error) throw error;
      toast.success('Şube başarıyla silindi');
      fetchCustomerAndBranches(companyId!);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Müşteri bulunamadı</h2>
          <button
            onClick={() => navigate('/customers')}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Müşterilere Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <button
            onClick={() => navigate('/customers')}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Müşterilere Dön
          </button>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  ŞUBELER ({customer.name})
                </h1>
              </div>
              {!isOperator && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Şube Ekle
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Şube Kodu
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Şube Adı
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Yetkili İsim
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İletişim
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {branches.map((branch) => (
                  <tr key={branch.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {branch.branch_code}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{branch.name}</div>
                      <div className="text-sm text-gray-500">{branch.address}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {branch.manager_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>{branch.email || '-'}</div>
                      <div>{branch.phone || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => navigate(`/customers/${customerId}/branches/${branch.id}/floor-plan`)}
                          className="text-blue-600 hover:text-blue-800 flex items-center"
                          title="Kroki"
                        >
                          <Tool className="h-4 w-4 mr-1" />
                          <span>Kroki</span>
                        </button>
                        <button
                          onClick={() => navigate(`/customers/${customerId}/branches/${branch.id}/trend`)}
                          className="text-blue-600 hover:text-blue-800 flex items-center"
                        >
                          <TrendingUp className="h-4 w-4 mr-1" />
                          <span>Trend</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedBranchId(branch.id);
                            setSelectedBranchName(branch.name);
                            fetchBranchEquipment(branch.id);
                            setShowAddEquipmentModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 flex items-center"
                        >
                          <Tool className="h-4 w-4 mr-1" />
                          <span>Ekipman ({branch.equipment_count || 0})</span>
                        </button>
                        {!isOperator && (
                          <>
                            <button className="text-blue-600 hover:text-blue-800 flex items-center">
                              <FileText className="h-4 w-4 mr-1" />
                              <span>Teklifler</span>
                            </button>
                            <button className="text-blue-600 hover:text-blue-800 flex items-center">
                              <Settings className="h-4 w-4 mr-1" />
                              <span>Uygulamalar</span>
                            </button>
                            <button className="text-blue-600 hover:text-blue-800 flex items-center">
                              <Pencil className="h-4 w-4 mr-1" />
                              <span>Düzenle</span>
                            </button>
                            <button
                              onClick={() => handleDelete(branch.id)}
                              className="text-red-600 hover:text-red-800 flex items-center"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              <span>Sil</span>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Branch Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Yeni Şube Ekle
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleAddBranch} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Şube Adı
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Yetkili İsim
                </label>
                <input
                  type="text"
                  required
                  value={formData.manager_name}
                  onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  E-posta
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Telefon
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Adres
                </label>
                <textarea
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Şube Ekle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}