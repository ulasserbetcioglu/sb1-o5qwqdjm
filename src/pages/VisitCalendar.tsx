import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { Calendar, Clock, Building2, MapPin, User, ChevronLeft, ChevronRight } from 'lucide-react';

interface Visit {
  id: string;
  application_code: string;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  customer: {
    name: string;
  } | null;
  branch: {
    name: string;
  } | null;
  operator: {
    name: string;
  } | null;
}

export default function VisitCalendar() {
  const navigate = useNavigate();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isOperator, setIsOperator] = useState(false);
  const [operatorId, setOperatorId] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);

  useEffect(() => {
    checkAccess();
  }, []);

  useEffect(() => {
    if (companyId || operatorId) {
      fetchVisits();
    }
  }, [currentDate, companyId, operatorId]);

  const checkAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      // First check if user is an operator
      const { data: operatorData, error: operatorError } = await supabase
        .from('operators')
        .select('id, company_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (operatorError && operatorError.code !== 'PGRST116') {
        throw operatorError;
      }

      if (operatorData) {
        setIsOperator(true);
        setOperatorId(operatorData.id);
        setCompanyId(operatorData.company_id);
      } else {
        // Check for company access
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (companyError) {
          if (companyError.code === 'PGRST116') {
            toast.error('Şirket veya operatör kaydı bulunamadı');
            navigate('/login');
            return;
          }
          throw companyError;
        }

        if (companyData) {
          setCompanyId(companyData.id);
        }
      }
    } catch (error: any) {
      console.error('Error checking access:', error);
      toast.error('Erişim kontrolü sırasında bir hata oluştu');
      navigate('/login');
    }
  };

  const fetchVisits = async () => {
    try {
      setLoading(true);
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      let query = supabase
        .from('applications')
        .select(`
          id,
          application_code,
          scheduled_date,
          scheduled_time,
          status,
          customer:customers (
            name
          ),
          branch:branches (
            name
          ),
          operator:operators (
            name
          )
        `)
        .gte('scheduled_date', startOfMonth.toISOString())
        .lte('scheduled_date', endOfMonth.toISOString())
        .order('scheduled_date', { ascending: true })
        .order('scheduled_time', { ascending: true });

      // Add filter based on user role
      if (isOperator && operatorId) {
        query = query.eq('operator_id', operatorId);
      } else if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setVisits(data || []);
    } catch (error: any) {
      console.error('Error fetching visits:', error);
      toast.error('Ziyaretler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getVisitsForDate = (date: Date) => {
    return visits.filter(visit => {
      const visitDate = new Date(visit.scheduled_date);
      return (
        visitDate.getDate() === date.getDate() &&
        visitDate.getMonth() === date.getMonth() &&
        visitDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'Planlandı';
      case 'in_progress':
        return 'Devam Ediyor';
      case 'completed':
        return 'Tamamlandı';
      case 'cancelled':
        return 'İptal Edildi';
      default:
        return status;
    }
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDayOfMonth = getFirstDayOfMonth(currentDate);
    const weeks = [];
    let days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(
        <td key={`empty-${i}`} className="p-2 border border-gray-200"></td>
      );
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dayVisits = getVisitsForDate(date);
      const isToday = new Date().toDateString() === date.toDateString();
      const isSelected = selectedDate?.toDateString() === date.toDateString();

      days.push(
        <td 
          key={day}
          className={`p-2 border border-gray-200 align-top cursor-pointer transition-colors
            ${isToday ? 'bg-blue-50' : 'hover:bg-gray-50'}
            ${isSelected ? 'ring-2 ring-blue-500' : ''}
          `}
          onClick={() => setSelectedDate(date)}
        >
          <div className="min-h-[120px]">
            <div className="font-medium text-gray-900 mb-2">{day}</div>
            {dayVisits.length > 0 && (
              <div className="space-y-1">
                {dayVisits.map(visit => (
                  <div 
                    key={visit.id}
                    className="text-xs p-1 rounded bg-white border shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="font-medium text-gray-900">
                      {visit.scheduled_time.substring(0, 5)}
                    </div>
                    <div className="text-gray-600 truncate">
                      {visit.customer?.name || 'Müşteri bilgisi yok'}
                    </div>
                    <div className="text-gray-500 truncate">
                      {visit.branch?.name || 'Şube bilgisi yok'}
                    </div>
                    {visit.operator && (
                      <div className="text-gray-500 truncate flex items-center">
                        <User className="h-3 w-3 mr-1" />
                        {visit.operator.name}
                      </div>
                    )}
                    <div className={`mt-1 px-1.5 py-0.5 rounded-sm text-xs inline-flex ${getStatusColor(visit.status)}`}>
                      {getStatusText(visit.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </td>
      );

      if ((firstDayOfMonth + day) % 7 === 0 || day === daysInMonth) {
        weeks.push(
          <tr key={`week-${weeks.length}`}>
            {days}
          </tr>
        );
        days = [];
      }
    }

    return weeks;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-semibold text-gray-900">Ziyaret Takvimi</h1>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Bugün
                </button>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                    className="p-2 text-gray-600 hover:text-gray-900"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <span className="text-lg font-medium text-gray-900">
                    {currentDate.toLocaleString('tr-TR', { month: 'long', year: 'numeric' })}
                  </span>
                  <button
                    onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                    className="p-2 text-gray-600 hover:text-gray-900"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {['Pzr', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'].map(day => (
                    <th key={day} className="p-2 border border-gray-200 text-sm font-medium text-gray-700">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {renderCalendar()}
              </tbody>
            </table>
          </div>

          {selectedDate && (
            <div className="px-6 py-4 border-t border-gray-200">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                {selectedDate.toLocaleDateString('tr-TR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </h2>
              <div className="space-y-4">
                {getVisitsForDate(selectedDate).map(visit => (
                  <div 
                    key={visit.id}
                    className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-5 w-5 text-gray-400" />
                        <span className="font-medium">{visit.scheduled_time.substring(0, 5)}</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(visit.status)}`}>
                        {getStatusText(visit.status)}
                      </span>
                    </div>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-start space-x-2">
                        <Building2 className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                          <div className="font-medium">{visit.customer?.name || 'Müşteri bilgisi yok'}</div>
                          <div className="text-sm text-gray-500">{visit.branch?.name || 'Şube bilgisi yok'}</div>
                        </div>
                      </div>
                      {visit.operator && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <User className="h-5 w-5 text-gray-400" />
                          <span>{visit.operator.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {getVisitsForDate(selectedDate).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    Bu tarihte planlanmış ziyaret bulunmuyor
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}