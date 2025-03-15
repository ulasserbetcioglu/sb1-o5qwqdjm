import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Calendar, FileText, Bug, Building2, ChevronDown, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface TrendAnalysisData {
  totalVisits: number;
  visitTypes: {
    [key: string]: number;
  };
  pestTypes: {
    [key: string]: number;
  };
  rodentActivity: Array<{
    date: string;
    equipment: string;
    location: string;
    status: string;
  }>;
  rodenticides: Array<{
    date: string;
    activeMaterial: string;
    packageAmount: string;
    totalUsage: string;
  }>;
  crawlingActivity: Array<{
    date: string;
    product: string;
    packageAmount: string;
    totalUsage: string;
  }>;
  flyActivity: Array<{
    date: string;
    equipmentNo: string;
    housefly: number;
    mosquito: number;
    moth: number;
    bee: number;
    fruitfly: number;
    other: number;
  }>;
  warehousePests: Array<{
    date: string;
    equipmentNo: string;
    moth: number;
    mite: number;
    other: number;
  }>;
  materialUsage: Array<{
    date: string;
    material: string;
    amount: number;
  }>;
  visits: Array<{
    date: string;
    time: string;
    type: string;
  }>;
}

export default function BranchTrendAnalysis() {
  const { customerId, branchId } = useParams<{ customerId: string; branchId: string }>();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [customerInfo, setCustomerInfo] = useState<{
    customerName: string;
    branchName: string;
    location: string;
  } | null>(null);
  const [data, setData] = useState<TrendAnalysisData | null>(null);

  useEffect(() => {
    fetchCustomerInfo();
    fetchTrendData();
  }, [customerId, branchId, dateRange]);

  const fetchCustomerInfo = async () => {
    try {
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('name')
        .eq('id', customerId)
        .single();

      if (customerError) throw customerError;

      const { data: branchData, error: branchError } = await supabase
        .from('branches')
        .select('name, address')
        .eq('id', branchId)
        .single();

      if (branchError) throw branchError;

      setCustomerInfo({
        customerName: customerData.name,
        branchName: branchData.name,
        location: branchData.address
      });
    } catch (error: any) {
      toast.error('Müşteri bilgileri yüklenirken hata oluştu');
    }
  };

  const fetchTrendData = async () => {
    try {
      setLoading(true);

      // Fetch applications data
      const { data: applications, error: applicationsError } = await supabase
        .from('applications')
        .select(`
          id,
          scheduled_date,
          scheduled_time,
          service_types,
          pest_categories,
          status
        `)
        .eq('branch_id', branchId)
        .gte('scheduled_date', dateRange.start)
        .lte('scheduled_date', dateRange.end)
        .order('scheduled_date', { ascending: true });

      if (applicationsError) throw applicationsError;

      // Process data
      const trendData: TrendAnalysisData = {
        totalVisits: applications?.length || 0,
        visitTypes: {
          'İlk': 0,
          'Periyodik': 0,
          'Ücretli': 0,
          'İşyeri': 0,
          'Acil Ça.': 0,
          'Gözlem': 0,
          'Teknik İn.': 0,
          'Son': 0
        },
        pestTypes: {
          'Kuş': 0,
          'Mikroor.': 0,
          'Haşere': 0,
          'Sinek': 0,
          'Arı': 0,
          'Sürüngen': 0,
          'Kemirgen': 0,
          'A.Zarar.': 0,
          'Yumuşakça': 0,
          'Diğer': 0
        },
        rodentActivity: [],
        rodenticides: [],
        crawlingActivity: [],
        flyActivity: [],
        warehousePests: [],
        materialUsage: [],
        visits: applications?.map(app => ({
          date: new Date(app.scheduled_date).toLocaleDateString('tr-TR'),
          time: app.scheduled_time,
          type: app.service_types[0] || 'Periyodik'
        })) || []
      };

      // Process visit types and pest categories
      applications?.forEach(app => {
        app.service_types?.forEach(type => {
          if (trendData.visitTypes.hasOwnProperty(type)) {
            trendData.visitTypes[type]++;
          }
        });

        app.pest_categories?.forEach(pest => {
          if (trendData.pestTypes.hasOwnProperty(pest)) {
            trendData.pestTypes[pest]++;
          }
        });
      });

      setData(trendData);
    } catch (error: any) {
      toast.error('Trend verileri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const element = document.getElementById('trend-report');
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`trend-analizi-${customerInfo?.branchName || 'rapor'}.pdf`);
      toast.success('Trend analizi PDF olarak kaydedildi');
    } catch (error) {
      toast.error('PDF oluşturulurken bir hata oluştu');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div id="trend-report" className="bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{customerInfo?.customerName}</h1>
          <h2 className="text-xl font-semibold text-gray-700 mt-2">{customerInfo?.branchName}</h2>
          <p className="text-gray-600 mt-1">{customerInfo?.location}</p>
        </div>

        {/* Date Range and Export */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <Calendar className="h-5 w-5 text-gray-400" />
            <div className="flex space-x-2">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="px-3 py-2 border rounded-md"
              />
              <span className="text-gray-500">-</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="px-3 py-2 border rounded-md"
              />
            </div>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Download className="h-5 w-5 mr-2" />
            PDF İndir
          </button>
        </div>

        {/* Content */}
        <div className="space-y-8">
          {/* General Analysis */}
          <section>
            <h2 className="text-xl font-semibold mb-4">1. GENEL ANALİZLER</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Total Visits */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-2">1.1 TOPLAM ZİYARET SAYISI</h3>
                <p className="text-3xl font-bold text-blue-600">{data?.totalVisits || 0}</p>
              </div>

              {/* Visit Types */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-2">1.2 ZİYARET TÜRÜNE GÖRE ÇAĞRI SAYISI</h3>
                <div className="space-y-2">
                  {Object.entries(data?.visitTypes || {}).map(([type, count]) => (
                    <div key={type} className="flex justify-between">
                      <span>{type}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pest Types */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-2">1.3 ZARARLI TÜRLERİ</h3>
                <div className="space-y-2">
                  {Object.entries(data?.pestTypes || {}).map(([type, count]) => (
                    <div key={type} className="flex justify-between">
                      <span>{type}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Visit Calendar */}
          <section>
            <h2 className="text-xl font-semibold mb-4">2. ZİYARET TAKVİMİ</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tarih
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Saat
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ziyaret Türü
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data?.visits.map((visit, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {visit.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {visit.time}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {visit.type}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}