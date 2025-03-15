import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  FileText, 
  Building2, 
  PenTool as Tool, 
  ChevronDown, 
  X,
  Contact as FileContract,
  ClipboardCheck
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, isCollapsed = false }) => {
  const location = useLocation();

  const menuItems = [
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
      title: 'Personeller',
      path: '/staff',
      icon: <Users className="h-5 w-5" />
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

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity lg:hidden z-40"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div 
        className={`
          fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}
          lg:translate-x-0 lg:static lg:inset-0 border-r border-gray-200
          flex flex-col bg-white
        `}
      >
        {/* Mobile header */}
        <div className="flex items-center justify-between p-4 lg:hidden border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <span className="text-lg font-semibold">Menü</span>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            aria-label="Close sidebar"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Menu items */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <div key={item.path} className="space-y-1">
              <Link
                to={item.path}
                className={`
                  group flex items-center px-3 py-2 text-sm font-medium rounded-md w-full
                  ${isActive(item.path)
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
                onClick={() => {
                  if (window.innerWidth < 1024) {
                    onClose();
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
                          onClose();
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
    </>
  );
};