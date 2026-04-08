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
  User
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { authService } from '../../services/authService';
import toast from 'react-hot-toast';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/', requiredRole: null }, // All can access
  { icon: Package, label: 'Inventory', path: '/inventory', requiredRole: 'admin' }, // Admin only
  { icon: Package, label: 'Inventory Details', path: '/inventory-details', requiredRole: 'employee' }, // Employee only
  { icon: Receipt, label: 'Billing', path: '/billing', requiredRole: null }, // All can access
  { icon: BarChart3, label: 'Reports', path: '/reports', requiredRole: 'admin' }, // Admin only
  { icon: Settings, label: 'Product Master', path: '/products', requiredRole: 'admin' }, // Admin only
];

// Hidden modules (preserved for functionality but not shown in UI)
// - Billing (Variants) (/billing-variants)
// - Bill History (/bill-history)
// - Product Management (/product-management)
// - Simple Inventory (/simple-inventory)
// All routes, APIs, and logic remain intact and can be accessed directly via URL if needed

export const Sidebar = ({ isOpen, toggle, setIsAuthenticated }) => {
  const navigate = useNavigate();
  const userRole = authService.getUserRole();
  const currentUser = authService.getCurrentUser();

  const visibleNavItems = navItems.filter(item => {
    // If no role requirement, everyone can see it
    if (!item.requiredRole) return true;
    // If role is required, only that role can see it
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
          "fixed left-0 top-0 h-full border-r transition-all duration-300 z-40 flex flex-col shadow-md",
          isOpen ? "w-64" : "w-20 -translate-x-64 lg:translate-x-0 lg:w-20"
        )}
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border)'
        }}
      >
        {/* Logo */}
        <div 
          className="h-20 flex items-center justify-center border-b"
          style={{
            backgroundColor: 'var(--bg-main)',
            borderColor: 'var(--border)'
          }}
        >
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md"
            style={{ backgroundColor: 'var(--primary)' }}
          >
            SE
          </div>
          {isOpen && <span className="ml-3 font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Swamy</span>}
        </div>

        {/* User Info */}
        {isOpen && currentUser && (
          <div 
            className="px-4 py-3 border-b"
            style={{
              backgroundColor: 'var(--bg-main)',
              borderColor: 'var(--border)'
            }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: 'var(--primary)' }}
              >
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                  {currentUser.name}
                </p>
                <p className="text-xs capitalize px-2 py-0.5 rounded-full w-fit" style={{
                  backgroundColor: userRole === 'admin' ? '#FEF3C7' : '#DBEAFE',
                  color: userRole === 'admin' ? '#92400E' : '#1E40AF'
                }}>
                  {userRole}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto">
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 font-medium",
                isActive 
                  ? "text-white shadow-md" 
                  : "hover:rounded-lg transition-colors duration-200"
              )}
              style={({ isActive }) => isActive ? {
                backgroundColor: 'var(--primary)',
                color: 'white'
              } : {
                color: 'var(--text-secondary)'
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.classList.contains('active')) {
                  e.currentTarget.style.backgroundColor = 'var(--border)';
                  e.currentTarget.style.color = 'var(--primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!e.currentTarget.classList.contains('active')) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
              title={!isOpen ? item.label : ""}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {isOpen && <span className="text-sm">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Logout & Footer */}
        <div 
          className="p-3 border-t space-y-2"
          style={{
            backgroundColor: 'var(--bg-main)',
            borderColor: 'var(--border)'
          }}
        >
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 font-medium"
            style={{
              color: '#EF4444',
              backgroundColor: '#FEE2E2'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#FECACA';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#FEE2E2';
            }}
            title={!isOpen ? 'Logout' : ""}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {isOpen && <span className="text-sm">Logout</span>}
          </button>

          <button
            onClick={toggle}
            className="w-full flex items-center justify-center p-2.5 rounded-lg transition-colors duration-200 font-medium hover:rounded-lg"
            style={{
              color: 'var(--text-secondary)',
              backgroundColor: 'transparent'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'var(--border)';
              e.target.style.color = 'var(--primary)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = 'var(--text-secondary)';
            }}
            title="Toggle sidebar"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
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
