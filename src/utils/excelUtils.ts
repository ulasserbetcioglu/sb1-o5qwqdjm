import * as XLSX from 'xlsx';
import { Visit } from '../types/visit';
import { Application } from '../types/application';

// Common column widths
const COLUMN_WIDTHS = {
  code: { wch: 15 },      // Rapor/Uygulama Kodu
  date: { wch: 12 },      // Tarih
  time: { wch: 8 },       // Saat
  customer: { wch: 30 },  // Müşteri
  branch: { wch: 30 },    // Şube
  operator: { wch: 20 },  // Operatör
  status: { wch: 12 },    // Durum
  type: { wch: 15 },      // Tür
  notes: { wch: 40 }      // Notlar
};

// Template headers
const TEMPLATE_HEADERS = [
  'Ürün Adı',
  'Üretici',
  'Ürün Tipi',
  'Aktif Maddeler',
  'Aktif Madde Miktarları',
  'Ruhsat Tarihi',
  'Ruhsat No',
  'Ruhsat Bitiş Tarihi'
];

// Sample data for template
const TEMPLATE_SAMPLE_DATA = [
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

export const downloadTemplate = () => {
  try {
    const wb = XLSX.utils.book_new();
    const data = [TEMPLATE_HEADERS, ...TEMPLATE_SAMPLE_DATA];
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Set column widths
    ws['!cols'] = [
      { wch: 30 }, // Ürün Adı
      { wch: 30 }, // Üretici
      { wch: 15 }, // Ürün Tipi
      { wch: 40 }, // Aktif Maddeler
      { wch: 30 }, // Aktif Madde Miktarları
      { wch: 15 }, // Ruhsat Tarihi
      { wch: 15 }, // Ruhsat No
      { wch: 15 }, // Ruhsat Bitiş Tarihi
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Ürünler');
    XLSX.writeFile(wb, 'biyosidal-urun-sablonu.xlsx');
    return true;
  } catch (error) {
    console.error('Template download error:', error);
    return false;
  }
};

export const parseExcelData = async (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        if (!data) {
          throw new Error('Dosya içeriği okunamadı');
        }

        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawData = XLSX.utils.sheet_to_json(worksheet);
        
        if (!Array.isArray(rawData) || rawData.length === 0) {
          throw new Error('Excel dosyası boş veya geçersiz format');
        }

        // Process and validate each row
        const processedData = rawData.map((row: any, index: number) => {
          const rowNum = index + 2; // Excel starts at 1 and has header row
          const errors: string[] = [];

          // Helper function to safely get string value
          const getString = (value: any): string => {
            if (value === undefined || value === null) return '';
            return String(value).trim();
          };

          // Extract and validate required fields
          const productName = getString(row['Ürün Adı']);
          const manufacturer = getString(row['Üretici']);
          const productType = getString(row['Ürün Tipi']);
          const activeIngredients = getString(row['Aktif Maddeler']);
          const activeAmounts = getString(row['Aktif Madde Miktarları']);
          const licenseDate = getString(row['Ruhsat Tarihi']);
          const licenseNumber = getString(row['Ruhsat No']);
          const licenseExpiryDate = getString(row['Ruhsat Bitiş Tarihi']);

          // Validate required fields
          if (!productName) errors.push(`Satır ${rowNum}: Ürün adı zorunludur`);
          if (!manufacturer) errors.push(`Satır ${rowNum}: Üretici zorunludur`);
          if (!productType) errors.push(`Satır ${rowNum}: Ürün tipi zorunludur`);
          if (!activeIngredients) errors.push(`Satır ${rowNum}: Aktif maddeler zorunludur`);
          if (!activeAmounts) errors.push(`Satır ${rowNum}: Aktif madde miktarları zorunludur`);
          if (!licenseDate) errors.push(`Satır ${rowNum}: Ruhsat tarihi zorunludur`);
          if (!licenseNumber) errors.push(`Satır ${rowNum}: Ruhsat numarası zorunludur`);
          if (!licenseExpiryDate) errors.push(`Satır ${rowNum}: Ruhsat bitiş tarihi zorunludur`);

          // Validate date formats
          const isValidDate = (dateStr: string) => {
            const date = new Date(dateStr);
            return date instanceof Date && !isNaN(date.getTime());
          };

          if (licenseDate && !isValidDate(licenseDate)) {
            errors.push(`Satır ${rowNum}: Geçersiz ruhsat tarihi formatı (YYYY-MM-DD olmalı)`);
          }
          if (licenseExpiryDate && !isValidDate(licenseExpiryDate)) {
            errors.push(`Satır ${rowNum}: Geçersiz ruhsat bitiş tarihi formatı (YYYY-MM-DD olmalı)`);
          }

          if (errors.length > 0) {
            throw new Error(errors.join('\n'));
          }

          return {
            product_name: productName,
            manufacturer: manufacturer,
            product_type: productType,
            active_ingredients: activeIngredients.split(',').map(s => s.trim()),
            active_ingredient_amounts: activeAmounts.split(',').map(s => s.trim()),
            license_date: licenseDate,
            license_number: licenseNumber,
            license_expiry_date: licenseExpiryDate
          };
        });

        resolve(processedData);
      } catch (error: any) {
        reject(new Error(error.message || 'Excel dosyası işlenirken bir hata oluştu'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Dosya okuma hatası'));
    };

    reader.readAsBinaryString(file);
  });
};