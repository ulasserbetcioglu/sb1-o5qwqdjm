import { Routes, Route, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Register from './pages/Register';
import CustomerRegister from './pages/CustomerRegister';
import OperatorRegister from './pages/OperatorRegister';
import AdminDashboard from './pages/AdminDashboard';
import AdminCustomers from './pages/AdminCustomers';
import AdminOperators from './pages/AdminOperators';
import AdminBiocidalProducts from './pages/AdminBiocidalProducts';
import CompanyDashboard from './pages/CompanyDashboard';
import CustomerDashboard from './pages/CustomerDashboard';
import OperatorDashboard from './pages/OperatorDashboard';
import Customers from './pages/Customers';
import CustomerBranches from './pages/CustomerBranches';
import FloorPlan from './pages/FloorPlan';
import BranchTrendAnalysis from './pages/BranchTrendAnalysis';
import Definitions from './pages/Definitions';
import Operators from './pages/Operators';
import Login from './pages/Login';
import { Contracts } from './pages/Contracts';
import ControlList from './pages/ControlList';
import AddApplication from './pages/AddApplication';
import InspectionForm from './pages/InspectionForm';
import VisitCalendar from './pages/VisitCalendar';
import AdminApplications from './pages/AdminApplications';
import { Bug, LayoutDashboard, Users, Building2, FileText, Settings, PenTool as Tool, Menu, X, Contact as FileContract, ClipboardCheck, Calendar, ArrowLeft, LogOut, ChevronDown } from 'lucide-react';
import { Footer } from './components/Footer';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from './lib/supabase';
import toast from 'react-hot-toast';

function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isOperator, setIsOperator] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    checkUserRole();
  }, [location.pathname]);

  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user is an operator
      const { data: operatorData, error: operatorError } = await supabase
        .from('operators')
        .select('id, company_id')
        .eq('user_id', user.id)
        .eq('status', 'approved')
        .eq('is_active', true)
        .limit(1);

      // Only set as operator if we found an approved and active operator record
      if (operatorData && operatorData.length > 0 && !operatorError) {
        setIsOperator(true);

        // Define allowed paths for operators
        const operatorAllowedPaths = [
          '/operator/dashboard',
          '/controls',
          '/controls/new',
          '/calendar',
          '/applications',
          '/inspections'
        ];

        // Check if current path is allowed
        const isAllowedPath = operatorAllowedPaths.some(path => location.pathname.startsWith(path));

        // Redirect if not allowed
        if (!isAllowedPath && !['/login', '/register', '/customer/register', '/operator/register'].includes(location.pathname)) {
          toast.error('Bu sayfaya erişim yetkiniz bulunmamaktadır');
          navigate('/operator/dashboard');
        }
      }
    } catch (error) {
      console.error('Error checking user role:', error);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/login');
      toast.success('Başarıyla çıkış yapıldı');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // Check if the current route should show the menu
  const showMenu = [
    '/dashboard',
    '/customers',
    '/operators',
    '/definitions',
    '/contracts',
    '/controls',
    '/calendar',
    '/applications',
    '/visits'
  ].some(path => location.pathname.startsWith(path));

  // Define menu items based on user role
  const menuItems = isOperator ? [
    {
      title: 'Kontroller',
      path: '/controls',
      icon: <ClipboardCheck className="h-5 w-5" />
    },
    {
      title: 'Takvim',
      path: '/calendar',
      icon: <Calendar className="h-5 w-5" />
    }
  ] : [
    {
      title: 'Panel',
      path: '/dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />
    },
    {
      title: 'Müşteriler',
      path: '/customers',
      icon: <Users className="h-5 w-5" />
    },
    {
      title: 'Operatörler',
      path: '/operators',
      icon: <Building2 className="h-5 w-5" />
    },
    {
      title: 'Sözleşmeler',
      path: '/contracts',
      icon: <FileContract className="h-5 w-5" />
    },
    {
      title: 'Kontroller',
      path: '/controls',
      icon: <ClipboardCheck className="h-5 w-5" />
    },
    {
      title: 'Takvim',
      path: '/calendar',
      icon: <Calendar className="h-5 w-5" />
    },
    {
      title: 'Ziyaretler',
      path: '/visits',
      icon: <FileText className="h-5 w-5" />
    },
    {
      title: 'Tanımlamalar',
      path: '/definitions',
      icon: <Settings className="h-5 w-5" />,
      submenu: [
        {
          title: 'Ekipman Türleri',
          path: '/definitions?type=equipment',
          icon: <Tool className="h-4 w-4" />
        },
        {
          title: 'Hizmet Türleri',
          path: '/definitions?type=service',
          icon: <FileText className="h-4 w-4" />
        }
      ]
    }
  ];

  // Check if current route is not login or register
  const showNavigation = !['/login', '/register', '/customer/register', '/operator/register'].includes(location.pathname);

  // Function to check if a path is active
  const isActivePath = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header - Only show for non-operator pages */}
      {!location.pathname.startsWith('/operator') && (
        <nav className="bg-white shadow-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center space-x-4">
                {showMenu && (
                  <button
                    onClick={() => setMobileMenuOpen(true)}
                    className="lg:hidden -ml-2 p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                  >
                    <Menu className="h-6 w-6" />
                  </button>
                )}
                {showNavigation && location.pathname !== '/dashboard' && (
                  <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-gray-500 hover:text-gray-700"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                )}
                <div className="flex items-center">
                  <Bug className="h-8 w-8 text-blue-600 flex-shrink-0" />
                  <span className="ml-2 text-xl font-semibold text-gray-900 truncate">İlaçlama Takip</span>
                </div>
              </div>
              {showNavigation && (
                <div className="flex items-center">
                  <button
                    onClick={handleLogout}
                    className="flex items-center px-4 py-2 text-gray-500 hover:text-gray-700"
                  >
                    <LogOut className="h-5 w-5 mr-2" />
                    <span className="hidden sm:inline">Çıkış Yap</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </nav>
      )}

      {/* Mobile Menu */}
      {showMenu && (
        <div className={`fixed inset-0 z-50 lg:hidden ${mobileMenuOpen ? '' : 'hidden'}`}>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setMobileMenuOpen(false)} />

          {/* Menu Panel */}
          <div className="fixed inset-y-0 left-0 w-full max-w-xs bg-white"> <div className="h-full flex flex-col">
              {/* Header */}
              <div className="px-4 py-6 bg-gray-100 flex items-center justify-between">
                <div className="flex items-center">
                  <Bug className="h-8 w-8 text-blue-600" />
                  <span className="ml-2 text-xl font-semibold text-gray-900">Menü</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-md text-gray-400 hover:text-gray-500"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Menu Items */}
              <nav className="flex-1 overflow-y-auto">
                {menuItems.map((item) => (
                  <div key={item.path} className="space-y-1">
                    <Link
                      to={item.path}
                      className={`
                        group flex items-center px-3 py-2 text-sm font-medium rounded-md w-full
                        ${isActivePath(item.path)
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                        }
                      `}
                      onClick={() => {
                        if (window.innerWidth < 1024) {
                          setMobileMenuOpen(false);
                        }
                      }}
                    >
                      {item.icon}
                      {!isCollapsed && <span className="ml-3 flex-1">{item.title}</span>}
                      {!isCollapsed && item.submenu && (
                        <ChevronDown className="ml-auto h-4 w-4 flex-shrink-0" />
                      )}
                    </Link>

                    {!isCollapsed && item.submenu && (
                      <div className="ml-4 space-y-1">
                        {item.submenu.map((subitem) => (
                          <Link
                            key={subitem.path}
                            to={subitem.path}
                            className={`
                              group flex items-center px-3 py-2 text-sm font-medium rounded-md w-full
                              ${location.pathname + location.search === subitem.path
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                              }
                            `}
                            onClick={() => {
                              if (window.innerWidth < 1024) {
                                setMobileMenuOpen(false);
                              }
                            }}
                          >
                            {subitem.icon}
                            <span className="ml-3">{subitem.title}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Menu */}
      {showMenu && (
        <div className="hidden lg:block bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-8 h-12">
              {menuItems.map((item) => (
                <div key={item.path} className="relative group">
                  <Link
                    to={item.path}
                    className={`
                      group flex items-center px-3 py-2 text-sm font-medium rounded-md w-full
                      ${isActivePath(item.path)
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }
                    `}
                  >
                    {item.icon}
                    {!isCollapsed && <span className="ml-3">{item.title}</span>}
                    {!isCollapsed && item.submenu && (
                      <ChevronDown className="ml-auto h-4 w-4 flex-shrink-0" />
                    )}
                  </Link>

                  {!isCollapsed && item.submenu && (
                    <div className="absolute left-0 mt-1 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-in-out">
                      <div className="rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 overflow-hidden">
                        <div className="relative bg-white py-1">
                          {item.submenu.map((subitem) => (
                            <Link
                              key={subitem.path}
                              to={subitem.path}
                              className={`
                                flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100
                                ${location.pathname + location.search === subitem.path ? 'bg-blue-50 text-blue-700' : ''}
                              `}
                            >
                              {subitem.icon}
                              <span className="ml-2">{subitem.title}</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/customer/register" element={<CustomerRegister />} />
              <Route path="/operator/register" element={<OperatorRegister />} />
              <Route path="/customer/dashboard" element={<CustomerDashboard />} />
              <Route path="/operator/dashboard" element={<OperatorDashboard />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/customers" element={<AdminCustomers />} />
              <Route path="/admin/operators" element={<AdminOperators />} />
              <Route path="/admin/applications" element={<AdminApplications />} />
              <Route path="/admin/visits" element={<AdminApplications />} />
              <Route path="/admin/biocidal-products" element={<AdminBiocidalProducts />} />
              <Route path="/dashboard" element={<CompanyDashboard />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/customers/:customerId/branches" element={<CustomerBranches />} />
              <Route path="/customers/:customerId/branches/:branchId/floor-plan" element={<FloorPlan />} />
              <Route path="/customers/:customerId/branches/:branchId/trend" element={<BranchTrendAnalysis />} />
              <Route path="/definitions" element={<Definitions />} />
              <Route path="/operators" element={<Operators />} />
              <Route path="/contracts" element={<Contracts />} />
              <Route path="/controls" element={<ControlList />} />
              <Route path="/controls/new" element={<AddApplication />} />
              <Route path="/inspections/:id" element={<InspectionForm />} />
              <Route path="/calendar" element={<VisitCalendar />} />
              <Route path="/visits" element={<AdminApplications />} />
            </Routes>
          </div>
        </main>
      </div>

      <Footer />
      <Toaster position="top-right" />
    </div>
  );
}

export default App;