import React, { useState } from 'react';
import { Settings, Building2, PenTool as Tool, Tag, Package, FileText, Users, ChevronRight, Plus, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

type TabType = 'equipment-types' | 'service-types' | 'unit-types' | 'package-types' | 'document-types' | 'staff-types' | 'custom-types';

interface TabButtonProps {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick: () => void;
}

interface DefinitionType {
  id: string;
  code: string;
  name: string;
  description: string;
  status: 'active' | 'passive';
}

interface DefinitionFormData {
  code: string;
  name: string;
  description: string;
}

const TabButton: React.FC<TabButtonProps> = ({ active, icon, label, description, onClick }) => (
  <button
    onClick={onClick}
    className={`flex flex-col w-full px-4 py-3 text-left border-b border-gray-200 ${
      active 
        ? 'bg-blue-50 border-r-4 border-blue-500' 
        : 'hover:bg-gray-50'
    }`}
  >
    <div className="flex items-center">
      <div className={`${active ? 'text-blue-600' : 'text-gray-400'}`}>
        {icon}
      </div>
      <span className={`ml-3 flex-1 font-medium ${active ? 'text-blue-700' : 'text-gray-900'}`}>
        {label}
      </span>
      <ChevronRight className={`h-5 w-5 ${active ? 'text-blue-500' : 'text-gray-400'}`} />
    </div>
    <p className={`mt-1 text-sm ${active ? 'text-blue-600' : 'text-gray-500'}`}>
      {description}
    </p>
  </button>
);

export default function Definitions() {
  const [activeTab, setActiveTab] = useState<TabType>('equipment-types');
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [definitions, setDefinitions] = useState<DefinitionType[]>([]);
  const [formData, setFormData] = useState<DefinitionFormData>({
    code: '',
    name: '',
    description: ''
  });

  const tabs = [
    { 
      id: 'equipment-types' as TabType, 
      label: 'Ekipman Türleri', 
      icon: <Tool className="h-5 w-5" />,
      description: 'İlaçlama ve kontrol ekipmanlarının kategorilerini yönetin',
      addButtonText: 'Ekipman Türü Ekle',
      emptyStateText: 'Henüz ekipman türü tanımlanmamış',
      tableTitle: 'Ekipman Türleri Listesi',
      tableName: 'equipment_types',
      codePlaceholder: 'EKP001',
      namePlaceholder: 'Sırt Pompası',
      descriptionPlaceholder: 'İlaçlama için kullanılan sırt pompası ekipmanı'
    },
    { 
      id: 'service-types' as TabType, 
      label: 'Hizmet Türleri', 
      icon: <Settings className="h-5 w-5" />,
      description: 'Sunulan ilaçlama ve kontrol hizmetlerini kategorize edin',
      addButtonText: 'Hizmet Türü Ekle',
      emptyStateText: 'Henüz hizmet türü tanımlanmamış',
      tableTitle: 'Hizmet Türleri Listesi',
      tableName: 'service_types',
      codePlaceholder: 'HZM001',
      namePlaceholder: 'Haşere İlaçlama',
      descriptionPlaceholder: 'Genel haşere ilaçlama hizmeti'
    },
    { 
      id: 'unit-types' as TabType, 
      label: 'Birim Türleri', 
      icon: <Tag className="h-5 w-5" />,
      description: 'Ölçü birimlerini ve hesaplama yöntemlerini belirleyin',
      addButtonText: 'Birim Türü Ekle',
      emptyStateText: 'Henüz birim türü tanımlanmamış',
      tableTitle: 'Birim Türleri Listesi',
      tableName: 'unit_types',
      codePlaceholder: 'BRM001',
      namePlaceholder: 'Metrekare',
      descriptionPlaceholder: 'Alan ölçümü için kullanılan birim'
    },
    { 
      id: 'package-types' as TabType, 
      label: 'Paket Türleri', 
      icon: <Package className="h-5 w-5" />,
      description: 'Hizmet paketlerini ve kombinasyonlarını düzenleyin',
      addButtonText: 'Paket Türü Ekle',
      emptyStateText: 'Henüz paket türü tanımlanmamış',
      tableTitle: 'Paket Türleri Listesi',
      tableName: 'package_types',
      codePlaceholder: 'PKT001',
      namePlaceholder: 'Aylık Bakım',
      descriptionPlaceholder: 'Aylık periyodik ilaçlama paketi'
    },
    { 
      id: 'document-types' as TabType, 
      label: 'Evrak Türleri', 
      icon: <FileText className="h-5 w-5" />,
      description: 'Gerekli belge ve sertifika türlerini yönetin',
      addButtonText: 'Evrak Türü Ekle',
      emptyStateText: 'Henüz evrak türü tanımlanmamış',
      tableTitle: 'Evrak Türleri Listesi',
      tableName: 'document_types',
      codePlaceholder: 'EVR001',
      namePlaceholder: 'İlaçlama Sertifikası',
      descriptionPlaceholder: 'İlaçlama sonrası verilen sertifika'
    },
    { 
      id: 'staff-types' as TabType, 
      label: 'Personel Türleri', 
      icon: <Users className="h-5 w-5" />,
      description: 'Çalışan pozisyonlarını ve rollerini tanımlayın',
      addButtonText: 'Personel Türü Ekle',
      emptyStateText: 'Henüz personel türü tanımlanmamış',
      tableTitle: 'Personel Türleri Listesi',
      tableName: 'staff_types',
      codePlaceholder: 'PRS001',
      namePlaceholder: 'İlaçlama Uzmanı',
      descriptionPlaceholder: 'Saha ilaçlama operasyonlarını yürüten personel'
    },
    {
      id: 'custom-types' as TabType,
      label: 'Özel Tanımlamalar',
      icon: <Settings className="h-5 w-5" />,
      description: 'Kendi özel tanımlama türlerinizi oluşturun ve yönetin',
      addButtonText: 'Özel Tanımlama Ekle',
      emptyStateText: 'Henüz özel tanımlama oluşturulmamış',
      tableTitle: 'Özel Tanımlamalar Listesi',
      tableName: 'definition_types',
      codePlaceholder: 'TNM001',
      namePlaceholder: 'Özel Tanımlama',
      descriptionPlaceholder: 'Özel tanımlama açıklaması'
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Kullanıcı bulunamadı');

      const { data: companyData } = await supabase
        .from('companies')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!companyData) throw new Error('Şirket bulunamadı');

      const currentTab = tabs.find(tab => tab.id === activeTab);
      if (!currentTab) throw new Error('Geçersiz tür');

      const { error } = await supabase
        .from(currentTab.tableName)
        .insert([
          {
            ...formData,
            company_id: companyData.id,
            status: 'active'
          }
        ]);

      if (error) {
        if (error.code === '23505') {
          throw new Error('Bu kod zaten kullanımda');
        }
        throw error;
      }

      toast.success(`${currentTab.label.slice(0, -1)} başarıyla eklendi`);
      setShowAddModal(false);
      setFormData({ code: '', name: '', description: '' });
      fetchDefinitions();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDefinitions = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Kullanıcı bulunamadı');

      const { data: companyData } = await supabase
        .from('companies')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!companyData) throw new Error('Şirket bulunamadı');

      const currentTab = tabs.find(tab => tab.id === activeTab);
      if (!currentTab) throw new Error('Geçersiz tür');

      const { data, error } = await supabase
        .from(currentTab.tableName)
        .select('*')
        .eq('company_id', companyData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDefinitions(data || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const currentTab = tabs.find(tab => tab.id === activeTab);
    if (!currentTab) return;

    if (!window.confirm(`Bu ${currentTab.label.toLowerCase().slice(0, -1)}ü silmek istediğinizden emin misiniz?`)) return;

    try {
      const { error } = await supabase
        .from(currentTab.tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success(`${currentTab.label.slice(0, -1)} başarıyla silindi`);
      fetchDefinitions();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const currentTab = tabs.find(tab => tab.id === activeTab);
    if (!currentTab) return;

    try {
      const { error } = await supabase
        .from(currentTab.tableName)
        .update({ status: currentStatus === 'active' ? 'passive' : 'active' })
        .eq('id', id);

      if (error) throw error;
      toast.success('Durum başarıyla güncellendi');
      fetchDefinitions();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  React.useEffect(() => {
    fetchDefinitions();
  }, [activeTab]);

  const currentTab = tabs.find(tab => tab.id === activeTab);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Sistem Tanımlamaları</h1>
          <p className="mt-2 text-gray-600">
            Sistemde kullanılacak tüm tanımlamaları buradan yönetebilirsiniz.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <Settings className="h-6 w-6 text-gray-600" />
              <h2 className="ml-3 text-xl font-semibold text-gray-900">
                Tanımlama Türleri
              </h2>
            </div>
          </div>

          <div className="flex">
            {/* Sidebar */}
            <div className="w-80 border-r border-gray-200">
              <nav>
                {tabs.map((tab) => (
                  <TabButton
                    key={tab.id}
                    active={activeTab === tab.id}
                    icon={tab.icon}
                    label={tab.label}
                    description={tab.description}
                    onClick={() => setActiveTab(tab.id)}
                  />
                ))}
              </nav>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {currentTab?.tableTitle}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {currentTab?.description}
                  </p>
                </div>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {currentTab?.addButtonText}
                </button>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-4 text-gray-500">Yükleniyor...</p>
                </div>
              ) : definitions.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                  {currentTab?.icon}
                  <h3 className="mt-4 text-lg font-medium text-gray-900">
                    {currentTab?.emptyStateText}
                  </h3>
                  <p className="mt-2 text-gray-500">
                    İlk tanımlamayı ekleyerek başlayın
                  </p>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {currentTab?.addButtonText}
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-lg border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Kod
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ad
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Açıklama
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Durum
                        </th>
                        <th scope="col" className="relative px-6 py-3">
                          <span className="sr-only">İşlemler</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {definitions.map((definition) => (
                        <tr key={definition.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {definition.code}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {definition.name}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {definition.description}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => handleToggleStatus(definition.id, definition.status)}
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                definition.status === 'active'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {definition.status === 'active' ? 'Aktif' : 'Pasif'}
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button className="text-blue-600 hover:text-blue-900 mr-4">Düzenle</button>
                            <button
                              onClick={() => handleDelete(definition.id)}
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
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && currentTab && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {currentTab.addButtonText}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                  Kod
                </label>
                <input
                  type="text"
                  id="code"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder={currentTab.codePlaceholder}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Benzersiz bir kod girin. Bu kod sistem içinde tekil olmalıdır.
                </p>
              </div>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Ad
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={currentTab.namePlaceholder}
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Açıklama
                </label>
                <textarea
                  id="description"
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={currentTab.descriptionPlaceholder}
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
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Ekleniyor...' : 'Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}