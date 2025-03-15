import React, { useEffect, useState, useRef } from 'react';
import { Plus, X, Eye, Download, Search, Filter, Calendar, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { ContractTemplate } from '../components/ContractTemplate';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface Contract {
  id: string;
  contract_number: string;
  customer_id: string;
  branch_id: string;
  start_date: string;
  end_date: string;
  monthly_amount: number;
  status: 'active' | 'expired' | 'cancelled';
  pest_types: Array<{
    type: string;
    visitCount: number;
    area: string;
  }>;
  customer: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
  branch: {
    name: string;
  };
}

interface Customer {
  id: string;
  name: string;
  branches: {
    id: string;
    name: string;
  }[];
}

interface FormData {
  customer_id: string;
  branch_id: string;
  start_date: string;
  end_date: string;
  monthly_amount: string;
  pest_types: Array<{
    type: string;
    visitCount: number;
    area: string;
  }>;
}

const VISIT_COUNTS = [
  { label: 'Ayda 1 Ziyaret', value: 1 },
  { label: 'Ayda 2 Ziyaret', value: 2 },
  { label: 'Ayda 3 Ziyaret', value: 3 },
  { label: 'Ayda 4 Ziyaret', value: 4 },
  { label: '3 Ayda 1 Ziyaret', value: 0.33 }
];

const APPLICATION_AREAS = [
  'İç Alan',
  'Dış Alan',
  'Yemekhane',
  'İdari Ofisler'
];

export function Contracts() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [showContractPreview, setShowContractPreview] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    customer_id: '',
    branch_id: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    monthly_amount: '',
    pest_types: []
  });
  const [error, setError] = useState('');
  const contractPreviewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchContracts();
  }, []);

  async function fetchContracts() {
    try {
      setLoading(true);

      // Get company ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Kullanıcı bulunamadı');

      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (companyError) throw companyError;

      // Fetch contracts
      const { data: contractsData, error: contractsError } = await supabase
        .from('contracts')
        .select(`
          *,
          customer:customers (
            name,
            address,
            phone,
            email
          ),
          branch:branches (name)
        `)
        .eq('company_id', companyData.id)
        .order('created_at', { ascending: false });

      if (contractsError) throw contractsError;

      // Fetch customers
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select(`
          id,
          name,
          branches (
            id,
            name
          )
        `)
        .eq('company_id', companyData.id);

      if (customersError) throw customersError;

      setContracts(contractsData || []);
      setCustomers(customersData || []);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error('Veriler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Kullanıcı bulunamadı');

      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (companyError) throw companyError;

      // Generate contract number
      const currentYear = new Date().getFullYear();
      const { data: latestContract } = await supabase
        .from('contracts')
        .select('contract_number')
        .ilike('contract_number', `${currentYear}-%`)
        .order('contract_number', { ascending: false })
        .limit(1);

      let nextNumber = 100;
      if (latestContract && latestContract.length > 0) {
        const lastNumber = parseInt(latestContract[0].contract_number.split('-')[1]);
        nextNumber = lastNumber + 1;
      }

      const contractNumber = `${currentYear}-${nextNumber}`;

      // Create contract
      const { error: contractError } = await supabase
        .from('contracts')
        .insert([{
          company_id: companyData.id,
          contract_number: contractNumber,
          customer_id: formData.customer_id,
          branch_id: formData.branch_id,
          start_date: formData.start_date,
          end_date: formData.end_date,
          monthly_amount: parseFloat(formData.monthly_amount),
          pest_types: formData.pest_types,
          created_by: user.id,
          status: 'active'
        }]);

      if (contractError) throw contractError;

      toast.success('Sözleşme başarıyla oluşturuldu');
      setIsModalOpen(false);
      setFormData({
        customer_id: '',
        branch_id: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        monthly_amount: '',
        pest_types: []
      });
      fetchContracts();
    } catch (error: any) {
      console.error('Error creating contract:', error);
      setError(error.message);
    }
  };

  const handleExportPDF = async (contract: Contract) => {
    if (!contractPreviewRef.current) return;

    try {
      setSelectedContract(contract);
      await new Promise(resolve => setTimeout(resolve, 100));

      const element = contractPreviewRef.current;
      const canvas = await html2canvas(element, {
        scale: 1.5,
        logging: false,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`sozlesme-${contract.contract_number}.pdf`);

      setSelectedContract(null);
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('PDF oluşturulurken bir hata oluştu');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Aktif';
      case 'expired':
        return 'Süresi Dolmuş';
      case 'cancelled':
        return 'İptal Edilmiş';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sözleşmeler</h1>
          <p className="mt-1 text-sm text-gray-500">
            Müşterilerinizle olan sözleşmelerinizi yönetin
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Yeni Sözleşme
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex-1 relative">
              <Search className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                placeholder="Sözleşme ara..."
                className="pl-10 w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="w-full sm:w-48">
              <div className="relative">
                <Filter className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <select
                  className="pl-10 w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="all">Tüm Durumlar</option>
                  <option value="active">Aktif</option>
                  <option value="expired">Süresi Dolmuş</option>
                  <option value="cancelled">İptal Edilmiş</option>
                </select>
              </div>
            </div>
            <div className="w-full sm:w-48">
              <div className="relative">
                <Calendar className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <select
                  className="pl-10 w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="all">Tüm Tarihler</option>
                  <option value="this_month">Bu Ay</option>
                  <option value="last_month">Geçen Ay</option>
                  <option value="this_year">Bu Yıl</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              <p className="mt-4 text-sm text-gray-500">Sözleşmeler yükleniyor...</p>
            </div>
          ) : contracts.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto h-12 w-12 text-gray-400">
                <FileText className="h-12 w-12" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Henüz sözleşme bulunmuyor</h3>
              <p className="mt-2 text-sm text-gray-500">İlk sözleşmenizi oluşturarak başlayın.</p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-6 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-5 w-5 mr-2" />
                Yeni Sözleşme
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      Sözleşme No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      Müşteri/Şube
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      Tarih Aralığı
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      Aylık Tutar
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      Durum
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {contracts.map((contract) => (
                    <tr key={contract.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {contract.contract_number}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {contract.customer.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {contract.branch.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(contract.start_date).toLocaleDateString('tr-TR')} -
                          {new Date(contract.end_date).toLocaleDateString('tr-TR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {contract.monthly_amount.toLocaleString('tr-TR', {
                            style: 'currency',
                            currency: 'TRY'
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(contract.status)}`}>
                          {getStatusText(contract.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-3">
                          <button
                            onClick={() => {
                              setSelectedContract(contract);
                              setShowContractPreview(true);
                            }}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                            title="Görüntüle"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleExportPDF(contract)}
                            className="text-green-600 hover:text-green-800 transition-colors"
                            title="PDF'e Aktar"
                          >
                            <Download className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Contract Preview Modal */}
      {showContractPreview && selectedContract && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center overflow-y-auto p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full my-8">
            <div className="sticky top-0 z-10 bg-white border-b rounded-t-lg">
              <div className="flex justify-between items-center p-6">
                <h3 className="text-lg font-semibold">Sözleşme Önizleme</h3>
                <button
                  onClick={() => {
                    setShowContractPreview(false);
                    setSelectedContract(null);
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div id="contract-preview" ref={contractPreviewRef}>
                <ContractTemplate
                  data={{
                    contractNumber: selectedContract.contract_number,
                    startDate: selectedContract.start_date,
                    endDate: selectedContract.end_date,
                    customerName: selectedContract.customer.name,
                    customerAddress: selectedContract.customer.address,
                    customerPhone: selectedContract.customer.phone,
                    customerEmail: selectedContract.customer.email,
                    monthlyAmount: selectedContract.monthly_amount,
                    pests: selectedContract.pest_types
                  }}
                />
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => handleExportPDF(selectedContract)}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  PDF'e Aktar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contract Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-lg font-semibold">Yeni Sözleşme Oluştur</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label htmlFor="customer_id" className="block text-sm font-medium text-gray-700">
                    Müşteri
                  </label>
                  <select
                    id="customer_id"
                    required
                    value={formData.customer_id}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        customer_id: e.target.value,
                        branch_id: ''
                      });
                    }}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="">Müşteri Seçin</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                </div>

                {formData.customer_id && (
                  <div>
                    <label htmlFor="branch_id" className="block text-sm font-medium text-gray-700">
                      Şube
                    </label>
                    <select
                      id="branch_id"
                      required
                      value={formData.branch_id}
                      onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                      <option value="">Şube Seçin</option>
                      {customers
                        .find(c => c.id === formData.customer_id)
                        ?.branches.map((branch) => (
                          <option key={branch.id} value={branch.id}>
                            {branch.name}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                <div>
                  <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
                    Başlangıç Tarihi
                  </label>
                  <input
                    type="date"
                    id="start_date"
                    required
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">
                    Bitiş Tarihi
                  </label>
                  <input
                    type="date"
                    id="end_date"
                    required
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="monthly_amount" className="block text-sm font-medium text-gray-700">
                    Aylık Tutar (₺)
                  </label>
                  <input
                    type="number"
                    id="monthly_amount"
                    required
                    min="0"
                    step="0.01"
                    value={formData.monthly_amount}
                    onChange={(e) => setFormData({ ...formData, monthly_amount: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Zararlı Türleri ve Ziyaret Planı
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormData({
                      ...formData,
                      pest_types: [
                        ...formData.pest_types,
                        {
                          type: 'Haşere İlaçlama',
                          visitCount: 1,
                          area: 'İç Alan'
                        }
                      ]
                    })}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Zararlı Türü Ekle
                  </button>
                </div>

                <div className="space-y-4">
                  {formData.pest_types.map((pest, index) => (
                    <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded">
                      <div className="flex-grow grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Zararlı Türü
                          </label>
                          <input
                            type="text"
                            value={pest.type}
                            onChange={(e) => {
                              const newPestTypes = [...formData.pest_types];
                              newPestTypes[index].type = e.target.value;
                              setFormData({ ...formData, pest_types: newPestTypes });
                            }}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Ziyaret Sıklığı
                          </label>
                          <select
                            value={pest.visitCount}
                            onChange={(e) => {
                              const newPestTypes = [...formData.pest_types];
                              newPestTypes[index].visitCount = parseFloat(e.target.value);
                              setFormData({ ...formData, pest_types: newPestTypes });
                            }}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          >
                            {VISIT_COUNTS.map((count) => (
                              <option key={count.value} value={count.value}>
                                {count.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Uygulama Alanı
                          </label>
                          <select
                            value={pest.area}
                            onChange={(e) => {
                              const newPestTypes = [...formData.pest_types];
                              newPestTypes[index].area = e.target.value;
                              setFormData({ ...formData, pest_types: newPestTypes });
                            }}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          >
                            {APPLICATION_AREAS.map((area) => (
                              <option key={area} value={area}>
                                {area}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const newPestTypes = [...formData.pest_types];
                          newPestTypes.splice(index, 1);
                          setFormData({ ...formData, pest_types: newPestTypes });
                        }}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Oluştur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}