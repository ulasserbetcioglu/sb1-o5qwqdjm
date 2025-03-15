import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { Users, UserPlus, Search, Filter, Plus, X, Key, Eye, EyeOff, Lock, Power } from 'lucide-react';

interface Operator {
  id: string;
  company_id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  is_active: boolean;
  created_at: string;
  user_id?: string;
}

interface OperatorFormData {
  name: string;
  email: string;
  phone: string;
}

export default function Operators() {
  const navigate = useNavigate();
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState<'created_at' | 'name'>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);
  const [formData, setFormData] = useState<OperatorFormData>({
    name: '',
    email: '',
    phone: '',
  });
  const [credentialsData, setCredentialsData] = useState({
    email: '',
    password: '',
  });
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);

  useEffect(() => {
    checkCompanyAccess();
  }, []);

  useEffect(() => {
    if (companyId) {
      fetchOperators();
    }
  }, [sortField, sortDirection, companyId]);

  const checkCompanyAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('id, status, is_active')
        .eq('user_id', user.id)
        .single();

      if (companyError) {
        if (companyError.code === 'PGRST116') {
          toast.error('Şirket kaydınız bulunamadı');
          navigate('/');
          return;
        }
        throw companyError;
      }

      if (!companyData.is_active || companyData.status !== 'approved') {
        toast.error('Şirket hesabınız aktif değil veya onaylanmamış');
        navigate('/');
        return;
      }

      setCompanyId(companyData.id);
    } catch (error: any) {
      toast.error(error.message);
      navigate('/');
    }
  };

  const fetchOperators = async () => {
    if (!companyId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('operators')
        .select('*')
        .eq('company_id', companyId)
        .order(sortField, { ascending: sortDirection === 'asc' });

      if (error) throw error;
      setOperators(data || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) return;

    setIsSubmitting(true);

    try {
      // First create the operator record
      const { data: operatorData, error: operatorError } = await supabase
        .from('operators')
        .insert([{
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          company_id: companyId,
          status: 'active',
          is_active: true
        }])
        .select()
        .single();

      if (operatorError) {
        if (operatorError.code === '23505') {
          throw new Error('Bu e-posta adresi zaten kullanımda');
        }
        throw operatorError;
      }

      toast.success('Operatör başarıyla eklendi');
      setShowAddModal(false);
      setFormData({ name: '', email: '', phone: '' });
      fetchOperators();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOperator) return;

    try {
      setIsSubmitting(true);

      // Create auth user
      const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email: credentialsData.email,
        password: credentialsData.password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            email_confirmed: true,
            is_operator: true
          }
        }
      });

      if (signUpError) {
        if (signUpError.message === 'User already registered') {
          throw new Error('Bu e-posta adresi zaten kullanımda');
        }
        throw signUpError;
      }

      if (!user) throw new Error('Kullanıcı oluşturulamadı');

      // Update operator with user_id
      const { error: updateError } = await supabase
        .from('operators')
        .update({ 
          user_id: user.id,
          email: credentialsData.email
        })
        .eq('id', selectedOperator.id);

      if (updateError) throw updateError;

      toast.success('Giriş bilgileri başarıyla oluşturuldu');
      setShowCredentialsModal(false);
      setCredentialsData({ email: '', password: '' });
      setSelectedOperator(null);
      fetchOperators();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOperator) return;

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Şifreler eşleşmiyor');
      return;
    }

    try {
      setIsSubmitting(true);

      const { error } = await supabase.rpc('change_operator_password', {
        p_operator_id: selectedOperator.id,
        p_new_password: passwordData.newPassword
      });

      if (error) throw error;

      toast.success('Şifre başarıyla güncellendi');
      setShowPasswordModal(false);
      setPasswordData({ newPassword: '', confirmPassword: '' });
      setSelectedOperator(null);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bu operatörü silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('operators')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Operatör başarıyla silindi');
      fetchOperators();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('operators')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      toast.success(currentStatus ? 'Operatör pasif duruma alındı' : 'Operatör aktif duruma alındı');
      fetchOperators();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const openCredentialsModal = (operator: Operator) => {
    setSelectedOperator(operator);
    setCredentialsData({ email: operator.email, password: '' });
    setShowCredentialsModal(true);
  };

  const openPasswordModal = (operator: Operator) => {
    setSelectedOperator(operator);
    setPasswordData({ newPassword: '', confirmPassword: '' });
    setShowPasswordModal(true);
  };

  const toggleSort = (field: 'created_at' | 'name') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filteredOperators = operators.filter(operator =>
    (statusFilter === 'all' || (statusFilter === 'active' ? operator.is_active : !operator.is_active)) &&
    (operator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     operator.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 justify-between items-center">
              <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-semibold text-gray-900">OPERATÖRLER</h1>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Operatör Ekle
                </button>
              </div>
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
                    placeholder="Operatör ara..."
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
                <p className="mt-4 text-gray-500">Operatörler yükleniyor...</p>
              </div>
            ) : filteredOperators.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">
                  {searchTerm ? 'Aranan operatör bulunamadı' : 'Henüz operatör eklenmemiş'}
                </h3>
                <p className="mt-2 text-gray-500">
                  {searchTerm ? 'Farklı bir arama yapmayı deneyin' : 'İlk operatörünüzü ekleyerek başlayın'}
                </p>
                {!searchTerm && (
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Operatör Ekle
                  </button>
                )}
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İsim
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      E-posta
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Telefon
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
                  {filteredOperators.map((operator) => (
                    <tr key={operator.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{operator.name}</div>
                        <div className="text-sm text-gray-500">
                          {new Date(operator.created_at).toLocaleDateString('tr-TR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {operator.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {operator.phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          operator.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {operator.is_active ? 'Aktif' : 'Pasif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-4">
                          {!operator.user_id && (
                            <button 
                              onClick={() => openCredentialsModal(operator)}
                              className="text-blue-600 hover:text-blue-800 flex items-center"
                              title="Giriş Bilgileri"
                            >
                              <Key className="h-5 w-5" />
                              <span className="ml-1">Giriş Bilgileri</span>
                            </button>
                          )}
                          {operator.user_id && (
                            <button 
                              onClick={() => openPasswordModal(operator)}
                              className="text-blue-600 hover:text-blue-800 flex items-center"
                              title="Şifre Değiştir"
                            >
                              <Lock className="h-5 w-5" />
                              <span className="ml-1">Şifre Değiştir</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleToggleStatus(operator.id, operator.is_active)}
                            className={`text-blue-600 hover:text-blue-800 flex items-center`}
                            title={operator.is_active ? "Pasife Al" : "Aktife Al"}
                          >
                            <Power className="h-5 w-5" />
                            <span className="ml-1">{operator.is_active ? "Pasife Al" : "Aktife Al"}</span>
                          </button>
                          <button
                            onClick={() => handleDelete(operator.id)}
                            className="text-red-600 hover:text-red-800 flex items-center"
                            title="Sil"
                          >
                            <X className="h-5 w-5" />
                            <span className="ml-1">Sil</span>
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
      </div>

      {/* Add Operator Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Yeni Operatör Ekle
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
                  placeholder="Operatör adı ve soyadı"
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
                  placeholder="ornek@email.com"
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
                  placeholder="05XX XXX XX XX"
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
                  {isSubmitting ? 'Ekleniyor...' : 'Operatör Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Credentials Modal */}
      {showCredentialsModal && selectedOperator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Operatör Giriş Bilgileri
              </h2>
              <button
                onClick={() => {
                  setShowCredentialsModal(false);
                  setSelectedOperator(null);
                  setCredentialsData({ email: '', password: '' });
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
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
                  placeholder="ornek@email.com"
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
                    placeholder="Güçlü bir şifre girin"
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
                    setSelectedOperator(null);
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
      {showPasswordModal && selectedOperator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Operatör Şifresini Değiştir
              </h2>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setSelectedOperator(null);
                  setPasswordData({ newPassword: '', confirmPassword: '' });
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
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
                    placeholder="Güçlü bir şifre girin"
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
                    placeholder="Şifreyi tekrar girin"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setSelectedOperator(null);
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
    </div>
  );
}