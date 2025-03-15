import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Customer, CustomerFormData } from '../types/customer';
import toast from 'react-hot-toast';

export const useCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Kullanıcı bulunamadı');

      const { data: companyData } = await supabase
        .from('companies')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!companyData) throw new Error('Şirket bulunamadı');

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('company_id', companyData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Initialize customers with default values if some fields are missing
      const processedCustomers = (data || []).map(customer => ({
        ...customer,
        account_number: customer.account_number || '',
        branch_count: customer.branch_count || 0
      }));
      
      setCustomers(processedCustomers);
    } catch (err) {
      const error = err as Error;
      setError(error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const addCustomer = useCallback(async (customerData: CustomerFormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Kullanıcı bulunamadı');

      const { data: companyData } = await supabase
        .from('companies')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!companyData) throw new Error('Şirket bulunamadı');

      const { error } = await supabase
        .from('customers')
        .insert([
          {
            ...customerData,
            company_id: companyData.id,
            branch_count: 0
          }
        ]);

      if (error) {
        if (error.code === '23505') {
          throw new Error('Bu cari numarası zaten kullanımda');
        }
        throw error;
      }

      toast.success('Müşteri başarıyla eklendi');
      await fetchCustomers();
      return true;
    } catch (err) {
      const error = err as Error;
      toast.error(error.message);
      return false;
    }
  }, [fetchCustomers]);

  const deleteCustomer = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Müşteri başarıyla silindi');
      await fetchCustomers();
    } catch (err) {
      const error = err as Error;
      toast.error(error.message);
    }
  }, [fetchCustomers]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  return {
    customers,
    loading,
    error,
    addCustomer,
    deleteCustomer,
    refreshCustomers: fetchCustomers
  };
};