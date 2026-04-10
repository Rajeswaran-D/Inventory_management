import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Receipt,
  BarChart3,
  Settings,
  Menu,
  X,
  LogOut,
  User,
  Users
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { authService } from '../../services/authService';
import toast from 'react-hot-toast';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/', requiredRole: null },
  { icon: Package, label: 'Inventory', path: '/inventory', requiredRole: 'admin' },
  { icon: Package, label: 'Inventory Details', path: '/inventory-details', requiredRole: 'employee' },
  { icon: Receipt, label: 'Billing', path: '/billing', requiredRole: null },
  { icon: Receipt, label: 'Bill History', path: '/bill-history', requiredRole: 'admin' },
  { icon: BarChart3, label: 'Reports', path: '/reports', requiredRole: 'admin' },
  { icon: Settings, label: 'Product Master', path: '/products', requiredRole: 'admin' },
  { icon: Users, label: 'User Management', path: '/users', requiredRole: 'admin' },
];

export const Sidebar = ({ isOpen, toggle, setIsAuthenticated }) => {
  const navigate = useNavigate();
  const userRole = authService.getUserRole();
  const currentUser = authService.getCurrentUser();

  const visibleNavItems = navItems.filter(item => {
    if (!item.requiredRole) return true;
    return userRole === item.requiredRole;
  });

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <>
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed left-0 top-0 h-full bg-white border-r border-gray-200 transition-all duration-300 z-40 flex flex-col shadow-lg",
          isOpen ? "w-64" : "w-20 -translate-x-64 lg:translate-x-0 lg:w-20"
        )}
      >
        {/* Logo */}
        <div className="h-20 flex items-center justify-center border-b border-gray-100 bg-gradient-to-r from-green-50 to-white">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center text-white font-bold text-lg shadow-md hover:shadow-lg transition-shadow duration-200">
            SE
          </div>
          {isOpen && (
            <div className="ml-3">
              <p className="font-bold text-lg text-gray-900">Swamy</p>
              <p className="text-xs text-gray-500 font-medium">Inventory</p>
            </div>
          )}
        </div>

        {/* User Info */}
        {isOpen && currentUser && (
          <div className="px-4 py-4 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white text-sm font-bold shadow-md">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{currentUser.name}</p>
                <span className={cn(
                  "inline-block text-xs font-bold px-2.5 py-1 rounded-full mt-1",
                  userRole === 'admin' 
                    ? "bg-amber-100 text-amber-800" 
                    : "bg-blue-100 text-blue-800"
                )}>
                  {userRole === 'admin' ? '👑 Admin' : '📝 Employee'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-medium text-sm",
                isActive 
                  ? "bg-gradient-to-r from-green-600 to-green-700 text-white shadow-md hover:shadow-lg" 
                  : "text-gray-600 hover:bg-gray-100 hover:text-green-600"
              )}
              title={!isOpen ? item.label : ""}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {isOpen && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-gray-100 bg-gray-50/50 space-y-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-medium text-sm text-red-600 hover:bg-red-50"
            title={!isOpen ? 'Logout' : ""}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {isOpen && <span>Logout</span>}
          </button>

          {!isOpen && (
            <button
              onClick={toggle}
              className="w-full flex items-center justify-center p-3 rounded-lg transition-all duration-200 hover:bg-gray-200"
              title="Toggle sidebar"
            >
              <Menu className="w-5 h-5 text-gray-700" />
            </button>
          )}
          {isOpen && (
            <button
              onClick={toggle}
              className="w-full flex items-center justify-center p-3 rounded-lg transition-all duration-200 text-gray-600 hover:bg-gray-200"
              title="Collapse sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden" 
          onClick={toggle}
        />
      )}
    </>
  );
};
