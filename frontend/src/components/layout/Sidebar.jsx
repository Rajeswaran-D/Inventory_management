import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Receipt,
  BarChart3,
  Settings,
  Menu,
  X
} from 'lucide-react';
import { cn } from '../../utils/cn';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Package, label: 'Inventory', path: '/inventory' },
  { icon: Receipt, label: 'Billing', path: '/billing' },
  { icon: BarChart3, label: 'Reports', path: '/reports' },
  { icon: Settings, label: 'Product Master', path: '/products' },
];

// Hidden modules (preserved for functionality but not shown in UI)
// - Billing (Variants) (/billing-variants)
// - Bill History (/bill-history)
// - Product Management (/product-management)
// - Simple Inventory (/simple-inventory)
// All routes, APIs, and logic remain intact and can be accessed directly via URL if needed

export const Sidebar = ({ isOpen, toggle }) => {
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

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
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

        {/* Toggle Button */}
        <div 
          className="p-3 border-t"
          style={{
            backgroundColor: 'var(--bg-main)',
            borderColor: 'var(--border)'
          }}
        >
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
