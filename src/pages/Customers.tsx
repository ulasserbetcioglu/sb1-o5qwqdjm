import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { Users, UserPlus, Search, Building2, FileText, Settings, Trash2, TrendingUp, Hash, X, Key, Eye, EyeOff, Lock, Upload, Mail, Phone } from 'lucide-react';
import type { CustomerFormData } from '../types/customer';
import { BulkCustomerImport } from '../components/BulkCustomerImport';
import { LogoUpload } from '../components/LogoUpload';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  customer_code: string;
  created_at: string;
  branch_count: number;
  logo_url?: string;
}

interface CustomerUser {
  id: string;
  user_id: string;
  customer_id: string;
  email: string;
  created_at: string;
}

export default function Customers() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerUsers, setCustomerUsers] = useState<CustomerUser[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<CustomerFormData>({
    name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [credentialsData, setCredentialsData] = useState({
    email: '',
    password: '',
  });
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
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

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('company_id', companyData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerUsers = async (customerId: string) => {
    try {
      const { data, error } = await supabase
        .from('customer_users_with_email')
        .select('*')
        .eq('customer_id', customerId);

      if (error) throw error;
      setCustomerUsers(data || []);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Kullanıcı bulunamadı');

      const { data: companyData } = await supabase
        .from('companies')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!companyData) throw new Error('Şirket bulunamadı');

      // Generate customer code
      const customerCode = 'CUS-' + String(Math.floor(10000 + Math.random() * 90000));

      const { error } = await supabase
        .from('customers')
        .insert([{
          ...formData,
          company_id: companyData.id,
          customer_code: customerCode,
          status: 'approved',
          is_active: true
        }]);

      if (error) throw error;

      toast.success('Müşteri başarıyla eklendi');
      setShowAddModal(false);
      setFormData({ name: '', email: '', phone: '', address: '' });
      fetchCustomers();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    try {
      setIsSubmitting(true);

      // Create new user
      const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email: credentialsData.email,
        password: credentialsData.password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            email_confirmed: true,
            is_customer: true
          }
        }
      });

      if (signUpError) {
        if (signUpError.message === 'User already registered') {
          toast.error('Bu e-posta adresi zaten kullanımda');
          return;
        }
        throw signUpError;
      }

      if (!user) throw new Error('Kullanıcı oluşturulamadı');

      // Create customer_user connection
      const { error: connectionError } = await supabase
        .from('customer_users')
        .insert([{
          user_id: user.id,
          customer_id: selectedCustomer.id
        }]);

      if (connectionError) throw connectionError;

      // Update customer email if different
      if (credentialsData.email !== selectedCustomer.email) {
        const { error: updateError } = await supabase
          .from('customers')
          .update({ email: credentialsData.email })
          .eq('id', selectedCustomer.id);

        if (updateError) throw updateError;
      }

      toast.success('Giriş bilgileri başarıyla oluşturuldu');
      setShowCredentialsModal(false);
      setCredentialsData({ email: '', password: '' });
      setSelectedCustomer(null);
      fetchCustomers();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Şifreler eşleşmiyor');
      return;
    }

    try {
      setIsSubmitting(true);

      const { error } = await supabase.rpc('change_customer_password', {
        p_customer_id: selectedCustomer.id,
        p_new_password: passwordData.newPassword
      });

      if (error) throw error;

      toast.success('Şifre başarıyla güncellendi');
      setShowPasswordModal(false);
      setPasswordData({ newPassword: '', confirmPassword: '' });
      setSelectedCustomer(null);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    if (!window.confirm('Bu müşteriyi silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Müşteri başarıyla silindi');
      fetchCustomers();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const openCredentialsModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCredentialsData({ email: customer.email, password: '' });
    setShowCredentialsModal(true);
    fetchCustomerUsers(customer.id);
  };

  const openPasswordModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setPasswordData({ newPassword: '', confirmPassword: '' });
    setShowPasswordModal(true);
    fetchCustomerUsers(customer.id);
  };

  const filteredCustomers = useMemo(() => 
    customers.filter(customer =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.customer_code.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [customers, searchTerm]
  );

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          {/* Header */}
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 justify-between items-start sm:items-center">
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
                <h1 className="text-2xl font-semibold text-gray-900">MÜŞTERİLER</h1>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Müşteri Ekle
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
              <div className="w-full sm:w-auto">
                <div className="relative">
                  <Search className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="search"
                    placeholder="Müşteri ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-4 text-gray-500">Müşteriler yükleniyor...</p>
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">
                  {searchTerm ? 'Aranan müşteri bulunamadı' : 'Henüz müşteri eklenmemiş'}
                </h3>
                <p className="mt-2 text-gray-500">
                  {searchTerm ? 'Farklı bir arama yapmayı deneyin' : 'İlk müşterinizi ekleyerek başlayın'}
                </p>
                {!searchTerm && (
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Müşteri Ekle
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                {filteredCustomers.map((customer) => (
                  <div key={customer.id} className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <Hash className="h-4 w-4 text-gray-400 mr-1" />
                          <span className="text-sm font-medium text-gray-900">{customer.customer_code}</span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(customer.created_at).toLocaleDateString('tr-TR')}
                        </span>
                      </div>

                      <div className="flex items-center space-x-4 mb-4">
                        <LogoUpload
                          type="customer"
                          id={customer.id}
                          currentLogo={customer.logo_url}
                          onUploadComplete={async (url) => {
                            try {
                              const { error } = await supabase
                                .from('customers')
                                .update({ logo_url: url })
                                .eq('id', customer.id);

                              if (error) throw error;
                              fetchCustomers();
                            } catch (error: any) {
                              toast.error('Logo güncellenirken bir hata oluştu');
                            }
                          }}
                        />
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{customer.name}</h3>
                          <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex items-center">
                              <Mail className="h-4 w-4 mr-2" />
                              {customer.email}
                            </div>
                            <div className="flex items-center">
                              <Phone className="h-4 w-4 mr-2" />
                              {customer.phone}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 space-y-2">
                        <button 
                          onClick={() => navigate(`/customers/${customer.id}/branches`)}
                          className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md flex items-center"
                        >
                          <Building2 className="h-4 w-4 mr-2" />
                          Şubeler ({customer.branch_count || 0})
                        </button>
                        
                        <button 
                          onClick={() => openCredentialsModal(customer)}
                          className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md flex items-center"
                        >
                          <Key className="h-4 w-4 mr-2" />
                          Giriş Bilgileri
                        </button>
                        
                        <button 
                          onClick={() => openPasswordModal(customer)}
                          className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md flex items-center"
                        >
                          <Lock className="h-4 w-4 mr-2" />
                          Şifre Değiştir
                        </button>
                        
                        <button 
                          className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md flex items-center"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Teklifler
                        </button>
                        
                        <button 
                          className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md flex items-center"
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Uygulamalar
                        </button>
                        
                        <button 
                          className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md flex items-center"
                        >
                          <TrendingUp className="h-4 w-4 mr-2" />
                          Trend
                        </button>
                        
                        <button
                          onClick={() => handleDeleteCustomer(customer.id)}
                          className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md flex items-center"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Sil
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Yeni Müşteri Ekle
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  İsim
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
                  disabled={isSubmitting}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Ekleniyor...' : 'Müşteri Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Credentials Modal */}
      {showCredentialsModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Müşteri Giriş Bilgileri
              </h2>
              <button
                onClick={() => {
                  setShowCredentialsModal(false);
                  setSelectedCustomer(null);
                  setCredentialsData({ email: '', password: '' });
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {customerUsers.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Mevcut Kullanıcılar</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  {customerUsers.map(user => (
                    <div key={user.id} className="text-sm text-gray-600">
                      {user.email}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleCreateCredentials} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  E-posta
                </label>
                <input
                  type="email"
                  required
                  value={credentialsData.email}
                  onChange={(e) => setCredentialsData({ ...credentialsData, email: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Şifre
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={credentialsData.password}
                    onChange={(e) => setCredentialsData({ ...credentialsData, password: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCredentialsModal(false);
                    setSelectedCustomer(null);
                    setCredentialsData({ email: '', password: '' });
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
                  {isSubmitting ? 'Oluşturuluyor...' : 'Giriş Bilgilerini Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {showPasswordModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Müşteri Şifresini Değiştir
              </h2>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setSelectedCustomer(null);
                  setPasswordData({ newPassword: '', confirmPassword: '' });
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {customerUsers.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Müşteri Kullanıcısı</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  {customerUsers.map(user => (
                    <div key={user.id} className="text-sm text-gray-600">
                      {user.email}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Yeni Şifre
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Şifre Tekrar
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 pr-10"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setSelectedCustomer(null);
                    setPasswordData({ newPassword: '', confirmPassword: '' });
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
                  {isSubmitting ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset -0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Excel'den Müşteri Aktar
              </h2>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <BulkCustomerImport
              onSuccess={() => {
                setShowImportModal(false);
                fetchCustomers();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}