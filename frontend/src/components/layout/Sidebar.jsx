import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  History, 
  Receipt, 
  Users, 
  Settings,
  ChevronLeft,
  Menu,
  ShieldCheck,
  Zap,
  Layers,
  Box,
  ChartBar,
  Command,
  HelpCircle,
  LogOut
} from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Box, label: 'Inventory Unit', path: '/inventory' },
  { icon: Receipt, label: 'POS Terminal', path: '/billing' },
  { icon: History, label: 'Logistics Log', path: '/stock' },
  { icon: Users, label: 'Client Base', path: '/customers' },
  { icon: ChartBar, label: 'Performance', path: '/reports' },
];

export const Sidebar = ({ isOpen, toggle }) => {
  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 h-full bg-white dark:bg-surface-900 border-r-2 border-surface-100 dark:border-surface-800 transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] z-50 flex flex-col",
        isOpen ? "w-[300px]" : "w-24"
      )}
    >
      <div className="flex items-center gap-4 p-8 border-b-2 border-surface-50 dark:border-surface-800 mb-6 overflow-hidden">
         <div className="w-12 h-12 bg-[#4F46E5] rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-indigo-500/30 shrink-0 rotate-3 transition-transform hover:rotate-0 duration-500">
            <Command className="w-6 h-6" />
         </div>
         {isOpen && (
           <div className="flex flex-col min-w-0 animate-in">
              <span className="font-black text-xl tracking-tighter text-surface-900 dark:text-white leading-none mb-1 truncate">Swamy ERP</span>
              <div className="flex items-center gap-1.5 opacity-40">
                 <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                 <span className="text-[8px] font-black uppercase tracking-[0.2em]">Operational</span>
              </div>
           </div>
         )}
      </div>

      <nav className="flex-1 px-4 space-y-3 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex items-center gap-4 p-4 rounded-3xl transition-all duration-500 group relative overflow-hidden",
              isActive 
                 ? "bg-indigo-600 text-white shadow-xl shadow-indigo-500/20 translate-x-1" 
                 : "text-surface-500 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800 hover:translate-x-1"
            )}
          >
            <div className={cn(
               "relative z-10 transition-transform duration-500",
               isOpen ? "" : "mx-auto scale-110"
            )}>
               <item.icon className="w-6 h-6" />
            </div>
            {isOpen && (
               <div className="flex flex-col relative z-10 animate-in">
                  <span className="font-black text-xs uppercase tracking-widest">{item.label}</span>
               </div>
            )}
            
            {/* Hover Background Accent */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </NavLink>
        ))}
      </nav>

      <div className="p-4 mt-auto space-y-4">
         <div className={cn(
            "p-6 rounded-4xl bg-surface-50 dark:bg-surface-800 border-2 border-dashed border-surface-200 dark:border-surface-700 transition-all",
            isOpen ? "opacity-100" : "opacity-0 scale-90 pointer-events-none"
         )}>
            <div className="flex items-center gap-3 mb-3">
               <HelpCircle className="w-4 h-4 text-indigo-600" />
               <span className="text-[10px] font-black uppercase tracking-widest text-surface-500">Core Support</span>
            </div>
            <p className="text-[9px] font-bold text-surface-400 mb-4 leading-relaxed italic">Consult the Logistics Protocol Manual for operational clearance.</p>
            <Button size="sm" variant="secondary" className="w-full text-[9px] py-3 uppercase tracking-[0.2em] shadow-none">Docs V2.0</Button>
         </div>

         <div className="flex flex-col gap-2">
            <button className={cn(
               "flex items-center gap-4 p-4 rounded-3xl text-surface-400 hover:text-rose-500 hover:bg-rose-50 transition-all group",
               isOpen ? "" : "justify-center"
            )}>
               <LogOut className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
               {isOpen && <span className="font-black text-xs uppercase tracking-widest">Terminate Session</span>}
            </button>
            <button 
               onClick={toggle}
               className={cn(
                  "flex items-center gap-4 p-4 rounded-3xl text-surface-400 hover:bg-surface-50 transition-all",
                  isOpen ? "" : "justify-center"
               )}
            >
               <ChevronLeft className={cn("w-6 h-6 transition-transform duration-700", !isOpen && "rotate-180")} />
               {isOpen && <span className="font-black text-xs uppercase tracking-widest">Collapse View</span>}
            </button>
         </div>
      </div>
    </aside>
  );
};
