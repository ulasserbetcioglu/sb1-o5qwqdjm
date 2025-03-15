import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { Calendar, Clock, Building2, MapPin, Plus, Minus, Upload, Save } from 'lucide-react';

interface Application {
  id: string;
  application_code: string;
  scheduled_date: string;
  scheduled_time: string;
  customer: {
    name: string;
  } | null;
  branch: {
    id: string;
    name: string;
  } | null;
}

interface Equipment {
  id: string;
  equipment_code: string;
  equipment_type: {
    name: string;
  } | null;
  quantity: number;
  created_at: string;
}

interface Definition {
  id: string;
  name: string;
  code: string;
  type: string;
}

interface FormData {
  startTime: string;
  endTime: string;
  reportNumber: string;
  reportPhoto: File | null;
  equipmentInspections: Array<{
    equipment_id: string;
    consumption_data: ConsumptionData;
    process_status: string;
    cost_type: string;
    notes: string;
  }>;
  targetPests: string[];
  infestationLevel: string;
  biocidalProducts: Array<{
    productName: string;
    dosage: string;
  }>;
  additionalProducts: Array<{
    productName: string;
    quantity: number;
  }>;
  notes: string;
  recommendations: string;
}

interface ConsumptionData {
  type: 'default' | 'activity' | 'warehouse' | 'fly';
  values: Record<string, any>;
}

const PROCESS_OPTIONS = [
  'İşlem Yok',
  'Temizlendi',
  'Değiştirildi',
  'Onarıldı',
  'Kaldırıldı'
];

const COST_OPTIONS = [
  'Ücretsiz',
  'Ücretli'
];

const ACTIVITY_OPTIONS = [
  'Aktivite Var',
  'Aktivite Yok'
];

const WAREHOUSE_PEST_TYPES = [
  'GÜVE',
  'BİT',
  'PİRE',
  'Diğer'
];

const FLY_TYPES = [
  'Karasinek',
  'Sivrisinek',
  'Güve',
  'Arı',
  'Meyve Sineği',
  'Diğer'
];

const INFESTATION_LEVELS = [
  { id: 'none', label: 'Yok' },
  { id: 'low', label: 'Az' },
  { id: 'medium', label: 'Çok' },
  { id: 'high', label: 'İstila' }
];

const TARGET_PESTS = [
  'Kuş',
  'Haşere',
  'Arı',
  'Kemirgen',
  'Yumuşakça',
  'Mikroorganizma',
  'Sinek',
  'Sürüngen',
  'Ambar Zararlısı',
  'Diğer'
];

export default function InspectionForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState<Application | null>(null);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [definitions, setDefinitions] = useState<Definition[]>([]);
  const [formData, setFormData] = useState<FormData>({
    startTime: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
    endTime: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
    reportNumber: '',
    reportPhoto: null,
    equipmentInspections: [],
    targetPests: [],
    infestationLevel: '',
    biocidalProducts: [],
    additionalProducts: [],
    notes: '',
    recommendations: ''
  });

  useEffect(() => {
    if (id) {
      fetchApplicationDetails();
    }
  }, [id]);

  useEffect(() => {
    if (application?.branch?.id) {
      fetchEquipment(application.branch.id);
      fetchEquipmentTypes();
    }
  }, [application]);

  const fetchApplicationDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          customer:customers (
            name
          ),
          branch:branches (
            id,
            name
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setApplication(data);
    } catch (error: any) {
      toast.error('Uygulama detayları yüklenirken hata oluştu');
      navigate('/controls');
    }
  };

  const fetchEquipmentTypes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Kullanıcı bulunamadı');

      // First check if user is an operator
      const { data: operatorData } = await supabase
        .from('operators')
        .select('company_id')
        .eq('user_id', user.id)
        .single();

      if (!operatorData) throw new Error('Operatör bulunamadı');

      const { data, error } = await supabase
        .from('definitions')
        .select('id, name, code, type')
        .eq('company_id', operatorData.company_id)
        .eq('type', 'equipment')
        .eq('is_active', true);

      if (error) throw error;
      setDefinitions(data || []);
    } catch (error: any) {
      console.error('Error fetching equipment types:', error);
      toast.error('Ekipman türleri yüklenirken hata oluştu');
    }
  };

  const fetchEquipment = async (branchId: string) => {
    try {
      const { data, error } = await supabase
        .from('branch_equipment')
        .select(`
          id,
          equipment_code,
          equipment_type:equipment_types (
            name
          ),
          quantity,
          created_at
        `)
        .eq('branch_id', branchId);

      if (error) throw error;
      
      const equipmentData = data || [];
      setEquipment(equipmentData);
      
      // Initialize equipment inspections
      setFormData(prev => ({
        ...prev,
        equipmentInspections: equipmentData.map(eq => ({
          equipment_id: eq.id,
          consumption_data: initializeConsumptionData(getConsumptionType(eq.equipment_type?.name || '')),
          process_status: 'İşlem Yok',
          cost_type: 'Ücretsiz',
          notes: ''
        }))
      }));
    } catch (error: any) {
      toast.error('Ekipman listesi yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const getConsumptionType = (equipmentTypeName: string): 'default' | 'activity' | 'warehouse' | 'fly' => {
    if (!equipmentTypeName) return 'default';
    
    const name = equipmentTypeName.toLowerCase();
    if (name.includes('haşere monitörü') || name.includes('canlı yakalama')) {
      return 'activity';
    } else if (name.includes('ambar zararlı')) {
      return 'warehouse';
    } else if (name.includes('sinek kontrol')) {
      return 'fly';
    }
    return 'default';
  };

  const initializeConsumptionData = (type: 'default' | 'activity' | 'warehouse' | 'fly'): ConsumptionData => {
    switch (type) {
      case 'activity':
        return {
          type: 'activity',
          values: {
            status: 'Aktivite Yok'
          }
        };
      case 'warehouse':
        return {
          type: 'warehouse',
          values: {
            status: 'Aktivite Yok',
            counts: {
              'GÜVE': '',
              'BİT': '',
              'PİRE': '',
              'Diğer': ''
            }
          }
        };
      case 'fly':
        return {
          type: 'fly',
          values: {
            counts: {
              'Karasinek': '',
              'Sivrisinek': '',
              'Güve': '',
              'Arı': '',
              'Meyve Sineği': '',
              'Diğer': ''
            }
          }
        };
      default:
        return {
          type: 'default',
          values: {
            status: 'Tüketim Yok'
          }
        };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.reportNumber.trim()) {
      toast.error('Lütfen faaliyet rapor numarası girin');
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Kullanıcı bulunamadı');

      // Create inspection report
      const { data: reportData, error: reportError } = await supabase
        .from('inspection_reports')
        .insert([{
          application_id: id,
          start_time: formData.startTime,
          end_time: formData.endTime,
          report_number: formData.reportNumber,
          notes: formData.notes,
          recommendations: formData.recommendations,
          infestation_level: formData.infestationLevel,
          created_by: user.id
        }])
        .select()
        .single();

      if (reportError) {
        if (reportError.code === '23505') {
          throw new Error('Bu rapor numarası zaten kullanılmış. Lütfen farklı bir numara girin.');
        }
        throw reportError;
      }

      // Upload report photo if exists
      if (formData.reportPhoto) {
        const { error: uploadError } = await supabase.storage
          .from('report-photos')
          .upload(
            `${reportData.id}/${formData.reportPhoto.name}`,
            formData.reportPhoto
          );

        if (uploadError) throw uploadError;
      }

      // Create equipment inspections
      if (formData.equipmentInspections.length > 0) {
        const { error: equipmentError } = await supabase
          .from('equipment_inspections')
          .insert(
            formData.equipmentInspections.map(inspection => ({
              report_id: reportData.id,
              equipment_id: inspection.equipment_id,
              consumption_data: inspection.consumption_data,
              process_status: inspection.process_status,
              cost_type: inspection.cost_type,
              notes: inspection.notes
            }))
          );

        if (equipmentError) throw equipmentError;
      }

      // Create biocidal products
      if (formData.biocidalProducts.length > 0) {
        const { error: productsError } = await supabase
          .from('biocidal_products')
          .insert(
            formData.biocidalProducts.map(product => ({
              report_id: reportData.id,
              product_name: product.productName,
              dosage: product.dosage
            }))
          );

        if (productsError) throw productsError;
      }

      // Create additional products
      if (formData.additionalProducts.length > 0) {
        const { error: addProductsError } = await supabase
          .from('additional_products')
          .insert(
            formData.additionalProducts.map(product => ({
              report_id: reportData.id,
              product_name: product.productName,
              quantity: product.quantity
            }))
          );

        if (addProductsError) throw addProductsError;
      }

      // Update application status
      const { error: updateError } = await supabase
        .from('applications')
        .update({ status: 'completed' })
        .eq('id', id);

      if (updateError) throw updateError;

      toast.success('Kontrol raporu başarıyla kaydedildi');
      navigate('/controls');
    } catch (error: any) {
      toast.error(error.message || 'Rapor kaydedilirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const renderConsumptionInput = (inspection: any, index: number, equipmentType: string) => {
    const consumptionType = getConsumptionType(equipmentType);

    switch (consumptionType) {
      case 'activity':
        return (
          <select
            value={inspection.consumption_data.values.status}
            onChange={(e) => {
              const newInspections = [...formData.equipmentInspections];
              newInspections[index].consumption_data.values.status = e.target.value;
              setFormData({ ...formData, equipmentInspections: newInspections });
            }}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            {ACTIVITY_OPTIONS.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );

      case 'warehouse':
        return (
          <div className="space-y-2">
            <select
              value={inspection.consumption_data.values.status}
              onChange={(e) => {
                const newInspections = [...formData.equipmentInspections];
                newInspections[index].consumption_data.values.status = e.target.value;
                setFormData({ ...formData, equipmentInspections: newInspections });
              }}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              {ACTIVITY_OPTIONS.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            {inspection.consumption_data.values.status === 'Aktivite Var' && (
              <div className="grid grid-cols-2 gap-2">
                {WAREHOUSE_PEST_TYPES.map(pestType => (
                  <div key={pestType} className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700">
                      {pestType}
                    </label>
                    <input
                      type="text"
                      value={inspection.consumption_data.values.counts[pestType]}
                      onChange={(e) => {
                        const newInspections = [...formData.equipmentInspections];
                        newInspections[index].consumption_data.values.counts[pestType] = e.target.value;
                        setFormData({ ...formData, equipmentInspections: newInspections });
                      }}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="Sayı"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'fly':
        return (
          <div className="grid grid-cols-2 gap-2">
            {FLY_TYPES.map(flyType => (
              <div key={flyType} className="space-y-1">
                <label className="block text-xs font-medium text-gray-700">
                  {flyType}
                </label>
                <input
                  type="text"
                  value={inspection.consumption_data.values.counts[flyType]}
                  onChange={(e) => {
                    const newInspections = [...formData.equipmentInspections];
                    newInspections[index].consumption_data.values.counts[flyType] = e.target.value;
                    setFormData({ ...formData, equipmentInspections: newInspections });
                  }}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Sayı"
                />
              </div>
            ))}
          </div>
        );

      default:
        return (
          <select
            value={inspection.consumption_data.values.status}
            onChange={(e) => {
              const newInspections = [...formData.equipmentInspections];
              newInspections[index].consumption_data.values.status = e.target.value;
              setFormData({ ...formData, equipmentInspections: newInspections });
            }}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="Tüketim Yok">Tüketim Yok</option>
            <option value="Az Tüketim">Az Tüketim</option>
            <option value="Orta Tüketim">Orta Tüketim</option>
            <option value="Yüksek Tüketim">Yüksek Tüketim</option>
          </select>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Uygulama bulunamadı</h2>
        <button
          onClick={() => navigate('/controls')}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          Kontrol Listesine Dön
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(application.scheduled_date).toLocaleDateString('tr-TR')}</span>
                  <Clock className="h-4 w-4 ml-2" />
                  <span>{application.scheduled_time}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5 text-gray-400" />
                  <h1 className="text-xl font-semibold text-gray-900">
                    {application.customer?.name || 'Müşteri bilgisi yok'}
                  </h1>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <MapPin className="h-4 w-4" />
                  <span>{application.branch?.name || 'Şube bilgisi yok'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Equipment & Consumption Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Ekipman Kontrolleri</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {equipment.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Bu şubede henüz ekipman bulunmuyor.</p>
                </div>
              ) : (
                formData.equipmentInspections.map((inspection, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Ekipman Bilgileri
                      </label>
                      <div className="mt-1 space-y-1">
                        <div className="text-sm text-gray-900">
                          {equipment[index]?.equipment_type?.name || 'Ekipman türü belirtilmemiş'}
                        </div>
                        <div className="text-sm text-gray-500">
                          Kod: {equipment[index]?.equipment_code || 'Kod belirtilmemiş'}
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        {getConsumptionType(equipment[index]?.equipment_type?.name || '') === 'activity' ? 'Aktivite' : 'Tüketim'}
                      </label>
                      {renderConsumptionInput(inspection, index, equipment[index]?.equipment_type?.name || '')}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">İşlem</label>
                      <select
                        value={inspection.process_status}
                        onChange={(e) => {
                          const newInspections = [...formData.equipmentInspections];
                          newInspections[index].process_status = e.target.value;
                          setFormData({ ...formData, equipmentInspections: newInspections });
                        }}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      >
                        {PROCESS_OPTIONS.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Ücret</label>
                      <select
                        value={inspection.cost_type}
                        onChange={(e) => {
                          const newInspections = [...formData.equipmentInspections];
                          newInspections[index].cost_type = e.target.value;
                          setFormData({ ...formData, equipmentInspections: newInspections });
                        }}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      >
                        {COST_OPTIONS.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Target Pests & Intensity Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Hedef Zararlılar ve Yoğunluk</h2>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              {/* Target Pests */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hedef Zararlılar
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                  {TARGET_PESTS.map((pest) => (
                    <label key={pest} className="inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.targetPests.includes(pest)}
                        onChange={(e) => {
                          const newPests = e.target.checked
                            ? [...formData.targetPests, pest]
                            : formData.targetPests.filter(p => p !== pest);
                          setFormData({ ...formData, targetPests: newPests });
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{pest}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Intensity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bulaşma Seviyesi
                </label>
                <div className="flex space-x-6">
                  {INFESTATION_LEVELS.map((level) => (
                    <label key={level.id} className="inline-flex items-center">
                      <input
                        type="radio"
                        name="infestationLevel"
                        value={level.id}
                        checked={formData.infestationLevel === level.id}
                        onChange={(e) => setFormData({ ...formData, infestationLevel: e.target.value })}
                        className="border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{level.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Kullanılan Ürünler</h2>
          </div>
          <div className="p-6 space-y-6">
            {/* Biocidal Products */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Biyosidal Ürünler
                </label>
                <button
                  type="button"
                  onClick={() => setFormData({
                    ...formData,
                    biocidalProducts: [
                      ...formData.biocidalProducts,
                      { productName: '', dosage: '' }
                    ]
                  })}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Ürün Ekle
                </button>
              </div>
              <div className="space-y-4">
                {formData.biocidalProducts.map((product, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Ticari İsmi"
                        value={product.productName}
                        onChange={(e) => {
                          const newProducts = [...formData.biocidalProducts];
                          newProducts[index].productName = e.target.value;
                          setFormData({ ...formData, biocidalProducts: newProducts });
                        }}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Miktar / Doz"
                        value={product.dosage}
                        onChange={(e) => {
                          const newProducts = [...formData.biocidalProducts];
                          newProducts[index].dosage = e.target.value;
                          setFormData({ ...formData, biocidalProducts: newProducts });
                        }}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newProducts = [...formData.biocidalProducts];
                        newProducts.splice(index, 1);
                        setFormData({ ...formData, biocidalProducts: newProducts });
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Minus className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Products */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Ek Ürünler
                </label>
                <button
                  type="button"
                  onClick={() => setFormData({
                    ...formData,
                    additionalProducts: [
                      ...formData.additionalProducts,
                      { productName: '', quantity: 1 }
                    ]
                  })}
                  className="inline-flex items-center px-3 py-1 border border-transparent text- sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Ürün Ekle
                </button>
              </div>
              <div className="space-y-4">
                {formData.additionalProducts.map((product, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Ürün Adı"
                        value={product.productName}
                        onChange={(e) => {
                          const newProducts = [...formData.additionalProducts];
                          newProducts[index].productName = e.target.value;
                          setFormData({ ...formData, additionalProducts: newProducts });
                        }}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>
                    <div className="w-32">
                      <input
                        type="number"
                        min="1"
                        value={product.quantity}
                        onChange={(e) => {
                          const newProducts = [...formData.additionalProducts];
                          newProducts[index].quantity = parseInt(e.target.value);
                          setFormData({ ...formData, additionalProducts: newProducts });
                        }}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newProducts = [...formData.additionalProducts];
                        newProducts.splice(index, 1);
                        setFormData({ ...formData, additionalProducts: newProducts });
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Minus className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Notes & Recommendations Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Notlar ve Öneriler</h2>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Açıklamalar
              </label>
              <textarea
                rows={4}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Öneriler & Uyarılar
              </label>
              <textarea
                rows={4}
                value={formData.recommendations}
                onChange={(e) => setFormData({ ...formData, recommendations: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
          </div>
        </div>

        {/* Time & Report Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Zaman ve Rapor Bilgileri</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Başlama Saati
                </label>
                <input
                  type="time"
                  required
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Bitiş Saati
                </label>
                <input
                  type="time"
                  required
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Faaliyet Rapor No
                </label>
                <input
                  type="text"
                  required
                  value={formData.reportNumber}
                  onChange={(e) => setFormData({ ...formData, reportNumber: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Rapor numarasını girin"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Rapor Fotoğrafı
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="report-photo"
                        className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                      >
                        <span>Fotoğraf Yükle</span>
                        <input
                          id="report-photo"
                          name="report-photo"
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setFormData({ ...formData, reportPhoto: file });
                            }
                          }}
                        />
                      </label>
                    </div>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, GIF up to 10MB
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/controls')}
            className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            İptal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Kaydediliyor...' : 'Tamamlandı'}
          </button>
        </div>
      </form>
    </div>
  );
}