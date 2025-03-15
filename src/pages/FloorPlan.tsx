import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { FloorPlanDrawer } from '../components/FloorPlanDrawer';
import toast from 'react-hot-toast';

interface EquipmentType {
  id: string;
  name: string;
}

export default function FloorPlan() {
  const { branchId } = useParams<{ branchId: string }>();
  const navigate = useNavigate();
  const [equipmentTypes, setEquipmentTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [branchName, setBranchName] = useState('');

  useEffect(() => {
    fetchEquipmentTypes();
    fetchBranchDetails();
  }, []);

  const fetchBranchDetails = async () => {
    try {
      const { data: branchData, error: branchError } = await supabase
        .from('branches')
        .select('name')
        .eq('id', branchId)
        .single();

      if (branchError) throw branchError;
      if (branchData) {
        setBranchName(branchData.name);
      }
    } catch (error: any) {
      toast.error('Şube bilgileri yüklenirken hata oluştu');
      navigate(-1);
    }
  };

  const fetchEquipmentTypes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Kullanıcı bulunamadı');

      const { data: companyData } = await supabase
        .from('companies')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!companyData) throw new Error('Şirket bulunamadı');

      const { data: definitions, error } = await supabase
        .from('definitions')
        .select('name')
        .eq('type', 'equipment')
        .eq('is_active', true);

      if (error) throw error;
      setEquipmentTypes(definitions?.map(d => d.name) || []);
    } catch (error: any) {
      toast.error('Ekipman türleri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!branchId) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Şube bulunamadı</h2>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          Geri Dön
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-semibold text-gray-900">
              Kroki Düzenleme - {branchName}
            </h1>
          </div>
          <FloorPlanDrawer
            branchId={branchId}
            onSave={() => {
              toast.success('Kroki başarıyla kaydedildi');
              navigate(-1);
            }}
            onClose={() => navigate(-1)}
            equipmentTypes={equipmentTypes}
          />
        </div>
      </div>
    </div>
  );
}