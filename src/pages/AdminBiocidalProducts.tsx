import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { Download, Upload, X, Plus, Search, Filter, Eye, FileText, Trash2, Power } from 'lucide-react';
import * as XLSX from 'xlsx';

interface BiocidalProduct {
  id: string;
  product_name: string;
  manufacturer: string;
  product_type: string;
  active_ingredients: string[];
  active_ingredient_amounts: string[];
  license_date: string;
  license_number: string;
  license_expiry_date: string;
  msds_url: string | null;
  license_url: string | null;
  is_active: boolean;
  created_at: string;
}

interface ExcelRow {
  'Ürün Adı': string;
  'Üretici': string;
  'Ürün Tipi': string;
  'Aktif Maddeler': string;
  'Aktif Madde Miktarları': string;
  'Ruhsat Tarihi': string;
  'Ruhsat No': string;
  'Ruhsat Bitiş Tarihi': string;
}

interface FormData {
  product_name: string;
  manufacturer: string;
  product_type: string;
  active_ingredients: string[];
  active_ingredient_amounts: string[];
  license_date: string;
  license_number: string;
  license_expiry_date: string;
}

const PRODUCT_TYPES = [
  'İnsektisit',
  'Rodentisit',
  'Dezenfektan',
  'Mollusisit',
  'Akarisit',
  'Bakterisit',
  'Fungusit'
];

const initialFormData: FormData = {
  product_name: '',
  manufacturer: '',
  product_type: '',
  active_ingredients: [''],
  active_ingredient_amounts: [''],
  license_date: '',
  license_number: '',
  license_expiry_date: ''
};

export default function AdminBiocidalProducts() {
  const [products, setProducts] = useState<BiocidalProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<BiocidalProduct | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>(initialFormData);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('biocidal_products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddIngredient = () => {
    setFormData(prev => ({
      ...prev,
      active_ingredients: [...prev.active_ingredients, ''],
      active_ingredient_amounts: [...prev.active_ingredient_amounts, '']
    }));
  };

  const handleRemoveIngredient = (index: number) => {
    setFormData(prev => ({
      ...prev,
      active_ingredients: prev.active_ingredients.filter((_, i) => i !== index),
      active_ingredient_amounts: prev.active_ingredient_amounts.filter((_, i) => i !== index)
    }));
  };

  const handleIngredientChange = (index: number, value: string, field: 'active_ingredients' | 'active_ingredient_amounts') => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Kullanıcı bulunamadı');

      // Check if license number already exists
      const { data: existingProduct } = await supabase
        .from('biocidal_products')
        .select('id')
        .eq('license_number', formData.license_number)
        .maybeSingle();

      if (existingProduct) {
        throw new Error('Bu ruhsat numarası zaten kullanımda');
      }

      const { error } = await supabase
        .from('biocidal_products')
        .insert([{
          ...formData,
          created_by: user.id,
          is_active: true
        }]);

      if (error) throw error;

      toast.success('Ürün başarıyla eklendi');
      setShowAddModal(false);
      setFormData(initialFormData);
      fetchProducts();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !selectedFile) return;

    try {
      setIsSubmitting(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Kullanıcı bulunamadı');

      // Upload file
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${selectedProduct.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('biocidal-documents')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('biocidal-documents')
        .getPublicUrl(fileName);

      // Update product record
      const { error: updateError } = await supabase
        .from('biocidal_product_documents')
        .insert([{
          product_id: selectedProduct.id,
          document_type: selectedFile.name.toLowerCase().includes('msds') ? 'msds' : 'license',
          file_name: selectedFile.name,
          file_url: publicUrl,
          uploaded_by: user.id,
          is_active: true
        }]);

      if (updateError) throw updateError;

      toast.success('Doküman başarıyla yüklendi');
      setShowUploadModal(false);
      setSelectedProduct(null);
      setSelectedFile(null);
      fetchProducts();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('biocidal_products')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      toast.success(currentStatus ? 'Ürün pasif duruma alındı' : 'Ürün aktif duruma alındı');
      fetchProducts();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bu ürünü silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('biocidal_products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Ürün başarıyla silindi');
      fetchProducts();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const downloadTemplate = () => {
    const template = XLSX.utils.book_new();
    const data = [
      [
        'Ürün Adı',
        'Üretici',
        'Ürün Tipi',
        'Aktif Maddeler',
        'Aktif Madde Miktarları',
        'Ruhsat Tarihi',
        'Ruhsat No',
        'Ruhsat Bitiş Tarihi'
      ],
      [
        'Örnek Ürün',
        'Örnek Üretici',
        'İnsektisit',
        'Permetrin, Tetrametrin',
        '%25, %15',
        '2025-01-01',
        'RHT-2025-001',
        '2027-01-01'
      ]
    ];
    
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(template, worksheet, 'Ürünler');
    XLSX.writeFile(template, 'biyosidal-urun-sablonu.xlsx');
  };

  const validateExcelRow = (row: ExcelRow, rowIndex: number): string[] => {
    const errors: string[] = [];
    const rowNum = rowIndex + 2; // Excel starts at 1 and has header row

    if (!row['Ürün Adı']?.trim()) {
      errors.push(`Satır ${rowNum}: Ürün adı zorunludur`);
    }
    if (!row['Üretici']?.trim()) {
      errors.push(`Satır ${rowNum}: Üretici zorunludur`);
    }
    if (!row['Ürün Tipi']?.trim()) {
      errors.push(`Satır ${rowNum}: Ürün tipi zorunludur`);
    }
    if (!row['Aktif Maddeler']?.trim()) {
      errors.push(`Satır ${rowNum}: Aktif maddeler zorunludur`);
    }
    if (!row['Aktif Madde Miktarları']?.trim()) {
      errors.push(`Satır ${rowNum}: Aktif madde miktarları zorunludur`);
    }
    if (!row['Ruhsat Tarihi']?.trim()) {
      errors.push(`Satır ${rowNum}: Ruhsat tarihi zorunludur`);
    }
    if (!row['Ruhsat No']?.trim()) {
      errors.push(`Satır ${rowNum}: Ruhsat numarası zorunludur`);
    }
    if (!row['Ruhsat Bitiş Tarihi']?.trim()) {
      errors.push(`Satır ${rowNum}: Ruhsat bitiş tarihi zorunludur`);
    }

    // Validate date formats
    const dateFields = [
      { name: 'Ruhsat Tarihi', value: row['Ruhsat Tarihi'] },
      { name: 'Ruhsat Bitiş Tarihi', value: row['Ruhsat Bitiş Tarihi'] }
    ];

    dateFields.forEach(field => {
      if (field.value && !isValidDate(field.value)) {
        errors.push(`Satır ${rowNum}: ${field.name} geçerli bir tarih formatında olmalıdır (YYYY-MM-DD)`);
      }
    });

    // Validate active ingredients and amounts match
    const ingredients = row['Aktif Maddeler'].split(',').map(s => s.trim());
    const amounts = row['Aktif Madde Miktarları'].split(',').map(s => s.trim());
    if (ingredients.length !== amounts.length) {
      errors.push(`Satır ${rowNum}: Aktif madde sayısı ile miktar sayısı eşleşmiyor`);
    }

    return errors;
  };

  const isValidDate = (dateStr: string): boolean => {
    const date = new Date(dateStr);
    return date instanceof Date && !isNaN(date.getTime());
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsSubmitting(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Kullanıcı bulunamadı');

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const data = event.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet) as ExcelRow[];

          if (jsonData.length === 0) {
            throw new Error('Excel dosyası boş');
          }

          // Validate all rows first
          const allErrors: string[] = [];
          jsonData.forEach((row, index) => {
            const rowErrors = validateExcelRow(row, index);
            allErrors.push(...rowErrors);
          });

          if (allErrors.length > 0) {
            throw new Error('Doğrulama hataları:\n' + allErrors.join('\n'));
          }

          let successCount = 0;
          let errorCount = 0;
          const errors: string[] = [];

          for (const row of jsonData) {
            try {
              // Check if license number already exists
              const { data: existingProduct } = await supabase
                .from('biocidal_products')
                .select('id')
                .eq('license_number', row['Ruhsat No'])
                .maybeSingle();

              if (existingProduct) {
                throw new Error(`Ruhsat numarası '${row['Ruhsat No']}' zaten kullanımda`);
              }

              const product = {
                product_name: row['Ürün Adı'].trim(),
                manufacturer: row['Üretici'].trim(),
                product_type: row['Ürün Tipi'].trim(),
                active_ingredients: row['Aktif Maddeler'].split(',').map(s => s.trim()),
                active_ingredient_amounts: row['Aktif Madde Miktarları'].split(',').map(s => s.trim()),
                license_date: row['Ruhsat Tarihi'].trim(),
                license_number: row['Ruhsat No'].trim(),
                license_expiry_date: row['Ruhsat Bitiş Tarihi'].trim(),
                created_by: user.id,
                is_active: true
              };

              const { error } = await supabase
                .from('biocidal_products')
                .insert([product]);

              if (error) throw error;
              successCount++;
            } catch (error: any) {
              errorCount++;
              errors.push(`Satır ${successCount + errorCount + 1}: ${error.message}`);
            }
          }

          if (successCount > 0) {
            toast.success(`${successCount} ürün başarıyla eklendi`);
          }
          if (errorCount > 0) {
            toast.error(`${errorCount} ürün eklenemedi`);
            errors.forEach(error => toast.error(error));
          }

          setShowImportModal(false);
          fetchProducts();
        } catch (error: any) {
          toast.error(error.message);
        }
      };

      reader.readAsBinaryString(file);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
      e.target.value = '';
    }
  };

  const filteredProducts = products.filter(product =>
    (statusFilter === 'all' || (statusFilter === 'active' ? product.is_active : !product.is_active)) &&
    (product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     product.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
     product.license_number.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">BİYOSİDAL ÜRÜNLER</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Yeni Ürün
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Upload className="h-4 w-4 mr-2" />
            Excel'den Aktar
          </button>
        </div>
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
                    <option value="active">Aktif</option>
                    <option value="passive">Pasif</option>
                  </select>
                </div>
              </div>
              <div className="relative">
                <Search className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                <input
                  type="search"
                  placeholder="Ürün ara..."
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
              <p className="mt-4 text-gray-500">Ürünler yükleniyor...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">
                {searchTerm ? 'Aranan ürün bulunamadı' : 'Henüz ürün eklenmemiş'}
              </h3>
              <p className="mt-2 text-gray-500">
                {searchTerm ? 'Farklı bir arama yapmayı deneyin' : 'Yeni ürün ekleyerek veya Excel ile toplu ürün ekleyerek başlayın'}
              </p>
              {!searchTerm && (
                <div className="mt-4 space-x-4">
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Yeni Ürün
                  </button>
                  <button
                    onClick={() => setShowImportModal(true)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Excel'den Aktar
                  </button>
                </div>
              )}
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ürün Bilgileri
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aktif Maddeler
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ruhsat Bilgileri
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
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{product.product_name}</div>
                      <div className="text-sm text-gray-500">{product.manufacturer}</div>
                      <div className="text-sm text-gray-500">{product.product_type}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {product.active_ingredients.map((ingredient, index) => (
                          <div key={index} className="text-sm text-gray-900">
                            {ingredient} ({product.active_ingredient_amounts[index]})
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">Ruhsat No: {product.license_number}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(product.license_date).toLocaleDateString('tr-TR')} -
                        {new Date(product.license_expiry_date).toLocaleDateString('tr-TR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        product.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {product.is_active ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => {
                            setSelectedProduct(product);
                            setShowUploadModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 flex items-center"
                        >
                          <Upload className="h-4 w-4 mr-1" />
                          Doküman Yükle
                        </button>
                        <button
                          onClick={() => handleToggleStatus(product.id, product.is_active)}
                          className={`text-blue-600 hover:text-blue-900 flex items-center`}
                        >
                          <Power className="h-4 w-4 mr-1" />
                          {product.is_active ? 'Pasife Al' : 'Aktife Al'}
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="text-red-600 hover:text-red-900 flex items-center"
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
          )}
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Yeni Biyosidal Ürün Ekle
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setFormData(initialFormData);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Ürün Adı
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.product_name}
                    onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Üretici
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Ürün Tipi
                  </label>
                  <select
                    required
                    value={formData.product_type}
                    onChange={(e) => setFormData({ ...formData, product_type: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Ürün Tipi Seçin</option>
                    {PRODUCT_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Ruhsat Numarası
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.license_number}
                    onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Ruhsat Tarihi
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.license_date}
                    onChange={(e) => setFormData({ ...formData, license_date: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Ruhsat Bitiş Tarihi
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.license_expiry_date}
                    onChange={(e) => setFormData({ ...formData, license_expiry_date: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Aktif Maddeler
                   </label>
                  <button
                    type="button"
                    onClick={handleAddIngredient}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Aktif Madde Ekle
                  </button>
                </div>

                {formData.active_ingredients.map((ingredient, index) => (
                  <div key={index} className="flex space-x-4 mb-4">
                    <div className="flex-1">
                      <input
                        type="text"
                        required
                        value={ingredient}
                        onChange={(e) => handleIngredientChange(index, e.target.value, 'active_ingredients')}
                        placeholder="Aktif madde adı"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        required
                        value={formData.active_ingredient_amounts[index]}
                        onChange={(e) => handleIngredientChange(index, e.target.value, 'active_ingredient_amounts')}
                        placeholder="Miktar (örn: %25)"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveIngredient(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData(initialFormData);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  disabled={isSubmitting}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Ekleniyor...' : 'Ürün Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      {showUploadModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Doküman Yükle
              </h2>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedProduct(null);
                  setSelectedFile(null);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-4">
              <h3 className="font-medium text-gray-900">{selectedProduct.product_name}</h3>
              <p className="text-sm text-gray-500">{selectedProduct.manufacturer}</p>
            </div>

            <form onSubmit={handleUploadDocument} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Doküman
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="mt-1 block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-medium
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                />
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false);
                    setSelectedProduct(null);
                    setSelectedFile(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  disabled={isSubmitting}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedFile}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Yükleniyor...' : 'Yükle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Excel'den İçe Aktar
              </h2>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Excel dosyasından toplu ürün eklemek için önce şablonu indirin ve doldurun.
              </p>
              <button
                onClick={downloadTemplate}
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center justify-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Şablonu İndir
              </button>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Excel Dosyası Seç
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleImportExcel}
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
      )}
    </div>
  );
}