import React, { useState } from 'react';
import { Calendar, Clock, Building2, User, PenTool as Tool, Bug, Thermometer, Droplet, FileText, Upload, X } from 'lucide-react';
import { QuantityInput } from '../components/QuantityInput';

interface ServiceFormData {
  date: string;
  time: string;
  customerId: string;
  branchId: string;
  operatorId: string;
  equipmentStatus: Record<number, {
    status: string;
    action: string;
    notes: string;
  }>;
  visitType: string[];
  targetPests: string[];
  infestationLevel: string;
  products: Array<{
    productId: string;
    amount: number;
  }>;
  additionalProducts: Array<{
    productId: string;
    quantity: number;
  }>;
  operatorNotes: string;
  recommendations: string;
  startTime: string;
  endTime: string;
  reportNumber: string;
  reportPhoto: File | null;
}

const initialFormData: ServiceFormData = {
  date: '',
  time: '',
  customerId: '',
  branchId: '',
  operatorId: '',
  equipmentStatus: {},
  visitType: [],
  targetPests: [],
  infestationLevel: '',
  products: [],
  additionalProducts: [],
  operatorNotes: '',
  recommendations: '',
  startTime: '',
  endTime: '',
  reportNumber: '',
  reportPhoto: null
};

const visitTypes = [
  'initial',
  'periodic',
  'paid',
  'workplace',
  'emergency',
  'observation',
  'technical_review',
  'final'
];

const visitTypeLabels: Record<string, string> = {
  initial: 'İlk',
  periodic: 'Periyodik',
  paid: 'Ücretli',
  workplace: 'İşyeri',
  emergency: 'Acil',
  observation: 'Gözlem',
  technical_review: 'Teknik İnceleme',
  final: 'Final'
};

const targetPests = [
  'birds',
  'cats_dogs',
  'pests',
  'flies',
  'bees',
  'reptiles',
  'rodents',
  'warehouse_pests',
  'mollusks'
];

const targetPestLabels: Record<string, string> = {
  birds: 'Kuşlar',
  cats_dogs: 'Kedi/Köpek',
  pests: 'Haşereler',
  flies: 'Sinekler',
  bees: 'Arılar',
  reptiles: 'Sürüngenler',
  rodents: 'Kemirgenler',
  warehouse_pests: 'Depo Zararlıları',
  mollusks: 'Yumuşakçalar'
};

const infestationLevels = ['low', 'high', 'severe'];

const infestationLevelLabels: Record<string, string> = {
  low: 'Düşük',
  high: 'Yüksek',
  severe: 'Şiddetli'
};

const equipmentGroups = [
  {
    name: 'Dış Mekan Yem İstasyonları',
    range: { start: 1, end: 23 }
  },
  {
    name: 'İç Mekan Canlı Yakalama Tuzakları',
    range: { start: 24, end: 38 }
  },
  {
    name: 'Sinek Kontrol Üniteleri',
    range: { start: 39, end: 64 },
    counters: ['Ev Sinekleri', 'Sivrisinekler', 'Güveler', 'Arılar', 'Meyve Sinekleri', 'Diğer']
  },
  {
    name: 'Depo Zararlıları Tuzakları',
    range: { start: 65, end: 74 },
    counters: ['Güveler', 'Akarlar', 'Diğer']
  }
];

const statusOptions = [
  'active',
  'damaged',
  'missing',
  'needs_replacement',
  'needs_cleaning'
];

const statusLabels: Record<string, string> = {
  active: 'Aktif',
  damaged: 'Hasarlı',
  missing: 'Kayıp',
  needs_replacement: 'Değişim Gerekli',
  needs_cleaning: 'Temizlik Gerekli'
};

const actionOptions = [
  'no_action',
  'replaced',
  'cleaned',
  'repaired',
  'removed'
];

const actionLabels: Record<string, string> = {
  no_action: 'İşlem Yok',
  replaced: 'Değiştirildi',
  cleaned: 'Temizlendi',
  repaired: 'Onarıldı',
  removed: 'Kaldırıldı'
};

export default function ServiceForm() {
  const [formData, setFormData] = useState<ServiceFormData>(initialFormData);
  const [selectedEquipment, setSelectedEquipment] = useState<number | null>(null);
  const [counters, setCounters] = useState<Record<string, Record<string, number>>>({});

  const handleEquipmentStatusChange = (equipmentNumber: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      equipmentStatus: {
        ...prev.equipmentStatus,
        [equipmentNumber]: {
          ...prev.equipmentStatus[equipmentNumber],
          [field]: value
        }
      }
    }));
  };

  const handleCounterChange = (groupName: string, counterName: string, value: number) => {
    setCounters(prev => ({
      ...prev,
      [groupName]: {
        ...prev[groupName],
        [counterName]: value
      }
    }));
  };

  const handleVisitTypeChange = (type: string) => {
    setFormData(prev => ({
      ...prev,
      visitType: prev.visitType.includes(type)
        ? prev.visitType.filter(t => t !== type)
        : [...prev.visitType, type]
    }));
  };

  const handleTargetPestChange = (pest: string) => {
    setFormData(prev => ({
      ...prev,
      targetPests: prev.targetPests.includes(pest)
        ? prev.targetPests.filter(p => p !== pest)
        : [...prev.targetPests, pest]
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        reportPhoto: file
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement form submission
    console.log(formData);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit} className="space-y-8 divide-y divide-gray-200 bg-white rounded-lg shadow-lg p-6">
          {/* Header Section */}
          <div className="space-y-6 sm:space-y-5">
            <div>
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Haşere İlaçlama Hizmet Formu
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Lütfen tüm alanları eksiksiz doldurunuz.
              </p>
            </div>

            <div className="space-y-6 sm:space-y-5">
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                      Tarih
                    </div>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 text-gray-400 mr-2" />
                      Saat
                    </div>
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    <div className="flex items-center">
                      <Building2 className="h-5 w-5 text-gray-400 mr-2" />
                      Müşteri
                    </div>
                  </label>
                  <select
                    required
                    value={formData.customerId}
                    onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Müşteri Seçin</option>
                    {/* TODO: Add customer options */}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    <div className="flex items-center">
                      <Building2 className="h-5 w-5 text-gray-400 mr-2" />
                      Şube
                    </div>
                  </label>
                  <select
                    required
                    value={formData.branchId}
                    onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Şube Seçin</option>
                    {/* TODO: Add branch options */}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    <div className="flex items-center">
                      <User className="h-5 w-5 text-gray-400 mr-2" />
                      Operatör
                    </div>
                  </label>
                  <select
                    required
                    value={formData.operatorId}
                    onChange={(e) => setFormData({ ...formData, operatorId: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Operatör Seçin</option>
                    {/* TODO: Add operator options */}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Equipment Inspection Section */}
          <div className="pt-8 space-y-6 sm:space-y-5">
            <div>
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Ekipman Kontrolü
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Tüm ekipmanların durumunu kontrol edin.
              </p>
            </div>

            <div className="space-y-6">
              {equipmentGroups.map((group, groupIndex) => (
                <div key={groupIndex} className="space-y-4">
                  <h4 className="text-md font-medium text-gray-900">{group.name}</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ekipman No
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Durum
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            İşlem
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Not
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {Array.from(
                          { length: group.range.end - group.range.start + 1 },
                          (_, i) => group.range.start + i
                        ).map((num) => (
                          <tr key={num} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {num}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <select
                                value={formData.equipmentStatus[num]?.status || ''}
                                onChange={(e) => handleEquipmentStatusChange(num, 'status', e.target.value)}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              >
                                <option value="">Durum Seçin</option>
                                {statusOptions.map((status) => (
                                  <option key={status} value={status}>
                                    {statusLabels[status]}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <select
                                value={formData.equipmentStatus[num]?.action || ''}
                                onChange={(e) => handleEquipmentStatusChange(num, 'action', e.target.value)}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              >
                                <option value="">İşlem Seçin</option>
                                {actionOptions.map((action) => (
                                  <option key={action} value={action}>
                                    {actionLabels[action]}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-6 py-4">
                              <input
                                type="text"
                                value={formData.equipmentStatus[num]?.notes || ''}
                                onChange={(e) => handleEquipmentStatusChange(num, 'notes', e.target.value)}
                                placeholder="Not ekleyin..."
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {group.counters && (
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {group.counters.map((counter) => (
                        <div key={counter} className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            {counter}
                          </label>
                          <QuantityInput
                            value={counters[group.name]?.[counter] || 0}
                            onChange={(value) => handleCounterChange(group.name, counter, value)}
                            min={0}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Visit Information Section */}
          <div className="pt-8 space-y-6 sm:space-y-5">
            <div>
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Ziyaret Bilgileri
              </h3>
            </div>

            <div className="space-y-6">
              <fieldset>
                <legend className="text-sm font-medium text-gray-700">Ziyaret Türü</legend>
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {visitTypes.map((type) => (
                    <div key={type} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.visitType.includes(type)}
                        onChange={() => handleVisitTypeChange(type)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-700">
                        {visitTypeLabels[type]}
                      </label>
                    </div>
                  ))}
                </div>
              </fieldset>
            </div>
          </div>

          {/* Target Pests Section */}
          <div className="pt-8 space-y-6 sm:space-y-5">
            <div>
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Hedef Zararlılar
              </h3>
            </div>

            <div className="space-y-6">
              <fieldset>
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {targetPests.map((pest) => (
                    <div key={pest} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.targetPests.includes(pest)}
                        onChange={() => handleTargetPestChange(pest)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-700">
                        {targetPestLabels[pest]}
                      </label>
                    </div>
                  ))}
                </div>
              </fieldset>
            </div>
          </div>

          {/* Infestation Level Section */}
          <div className="pt-8 space-y-6 sm:space-y-5">
            <div>
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Bulaşma Seviyesi
              </h3>
            </div>

            <div className="space-y-6">
              <fieldset>
                <div className="mt-4 space-x-4">
                  {infestationLevels.map((level) => (
                    <div key={level} className="inline-flex items-center">
                      <input
                        type="radio"
                        name="infestationLevel"
                        value={level}
                        checked={formData.infestationLevel === level}
                        onChange={(e) => setFormData({ ...formData, infestationLevel: e.target.value })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <label className="ml-2 block text-sm text-gray-700">
                        {infestationLevelLabels[level]}
                      </label>
                    </div>
                  ))}
                </div>
              </fieldset>
            </div>
          </div>

          {/* Treatment Details Section */}
          <div className="pt-8 space-y-6 sm:space-y-5">
            <div>
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Uygulama Detayları
              </h3>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    <div className="flex items-center">
                      <Droplet className="h-5 w-5 text-gray-400 mr-2" />
                      Biyosidal Ürün
                    </div>
                  </label>
                  <select
                    value={formData.products[0]?.productId || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      products: [{ productId: e.target.value, amount: formData.products[0]?.amount || 0 }]
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Ürün Seçin</option>
                    {/* TODO: Add product options */}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Miktar/Dozaj
                  </label>
                  <QuantityInput
                    value={formData.products[0]?.amount || 0}
                    onChange={(value) => setFormData({
                      ...formData,
                      products: [{ productId: formData.products[0]?.productId || '', amount: value }]
                    })}
                    min={0}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    <div className="flex items-center">
                      <Droplet className="h-5 w-5 text-gray-400 mr-2" />
                      Ek Ürün
                    </div>
                  </label>
                  <select
                    value={formData.additionalProducts[0]?.productId || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      additionalProducts: [{ productId: e.target.value, quantity: formData.additionalProducts[0]?.quantity || 0 }]
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Ürün Seçin</option>
                    {/* TODO: Add additional product options */}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Miktar
                  </label>
                  <QuantityInput
                    value={formData.additionalProducts[0]?.quantity || 0}
                    onChange={(value) => setFormData({
                      ...formData,
                      additionalProducts: [{ productId: formData.additionalProducts[0]?.productId || '', quantity: value }]
                    })}
                    min={0}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Notes and Comments Section */}
          <div className="pt-8 space-y-6 sm:space-y-5">
            <div>
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Notlar ve Yorumlar
              </h3>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Operatör Notları
                </label>
                <textarea
                  value={formData.operatorNotes}
                  onChange={(e) => setFormData({ ...formData, operatorNotes: e.target.value })}
                  rows={4}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Öneriler
                </label>
                <textarea
                  value={formData.recommendations}
                  onChange={(e) => setFormData({ ...formData, recommendations: e.target.value })}
                  rows={4}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Time and Documentation Section */}
          <div className="pt-8 space-y-6 sm:space-y-5">
            <div>
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Zaman ve Dokümantasyon
              </h3>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 text-gray-400 mr-2" />
                      Başlangıç Saati
                    </div>
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 text-gray-400 mr-2" />
                      Bitiş Saati
                    </div>
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-gray-400 mr-2" />
                      Faaliyet Rapor No
                    </div>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.reportNumber}
                    onChange={(e) => setFormData({ ...formData, reportNumber: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    <div className="flex items-center">
                      <Upload className="h-5 w-5 text-gray-400 mr-2" />
                      Rapor Fotoğrafı
                    </div>
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="mt-1 block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-medium
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-8 flex justify-end">
            <button
              type="submit"
              className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Kaydet ve Kapat
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}