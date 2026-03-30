import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Sidebar } from './components/layout/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Inventory } from './pages/Inventory';
import { Billing } from './pages/Billing';
import { StockHistory } from './pages/StockHistory';
import { 
  Menu, 
  Search, 
  Bell, 
  Sun, 
  Moon, 
  Zap, 
  Settings, 
  ShieldCheck,
  ChevronDown,
  Globe,
  Monitor
} from 'lucide-react';
import { Button } from './components/ui/Button';

const PageLayout = ({ children, isSidebarOpen }) => (
  <main className={`transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] min-h-screen pt-28 pb-12 px-6 lg:px-12 ${isSidebarOpen ? 'ml-[300px]' : 'ml-24'}`}>
    <div className="max-w-[1800px] mx-auto">
      {children}
    </div>
  </main>
)

const TopBar = ({ isSidebarOpen }) => {
  const [isDark, setIsDark] = useState(false);
  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <header className={`fixed top-0 right-0 h-24 bg-white/70 dark:bg-surface-900/70 backdrop-blur-3xl border-b-2 border-surface-50 dark:border-surface-800 z-40 transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] flex items-center justify-between px-12 ${isSidebarOpen ? 'left-[300px]' : 'left-24'}`}>
      <div className="flex items-center gap-6">
         <div className="flex items-center gap-4 bg-surface-50 dark:bg-surface-800 px-6 py-3 rounded-2xl border-2 border-transparent focus-within:border-indigo-600/20 focus-within:bg-white dark:focus-within:bg-surface-700 w-[500px] group transition-all focus-within:shadow-2xl focus-within:shadow-indigo-500/5">
           <Search className="w-5 h-5 text-surface-400 group-focus-within:text-indigo-600 transition-colors" />
           <input 
              type="text" 
              placeholder="Query System Protocol... (⌘K)" 
              className="bg-transparent border-none focus:ring-0 text-sm font-black text-surface-900 dark:text-white placeholder:text-surface-400 w-full placeholder:uppercase placeholder:text-[10px] placeholder:tracking-widest"
           />
           <div className="flex items-center gap-1 opacity-20">
              <kbd className="px-1.5 py-0.5 rounded border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-[10px] font-black">⌘</kbd>
              <kbd className="px-1.5 py-0.5 rounded border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-[10px] font-black">K</kbd>
           </div>
         </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 pr-6 border-r-2 border-surface-50 dark:border-surface-800">
           <button 
              onClick={toggleTheme}
              className="p-3 text-surface-400 hover:text-indigo-600 hover:bg-surface-50 dark:hover:bg-surface-800 rounded-2xl transition-all active:scale-90 border-2 border-transparent hover:border-indigo-100"
           >
             {isDark ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
           </button>
           <button className="p-3 text-surface-400 hover:text-indigo-600 hover:bg-surface-50 dark:hover:bg-surface-800 rounded-2xl transition-all relative border-2 border-transparent hover:border-indigo-100">
             <Bell className="w-6 h-6" />
             <span className="absolute top-2 right-2 w-3 h-3 bg-indigo-600 rounded-full ring-4 ring-white dark:ring-surface-900" />
           </button>
        </div>

        <button className="flex items-center gap-4 bg-surface-50 dark:bg-surface-800 p-2 pr-6 rounded-3xl border-2 border-transparent hover:border-indigo-600/20 hover:bg-white transition-all group">
            <div className="h-12 w-12 rounded-2xl bg-gradient-premium flex items-center justify-center text-white font-black text-lg shadow-xl shadow-indigo-500/30 group-hover:rotate-6 transition-transform">
              AD
            </div>
            <div className="text-left hidden md:block">
               <p className="text-xs font-black text-surface-900 dark:text-white uppercase tracking-tighter leading-none mb-1">Administrative Node</p>
               <p className="text-[10px] font-bold text-surface-400 tracking-widest uppercase flex items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" />
                  Level 5 Clearance
               </p>
            </div>
            <ChevronDown className="w-4 h-4 text-surface-300 group-hover:text-indigo-600 transition-colors ml-4" />
        </button>
      </div>
    </header>
  );
};

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-surface-50 dark:bg-surface-950 transition-colors selection:bg-indigo-600 selection:text-white">
        <Toaster 
           position="top-right" 
           toastOptions={{ 
             className: 'dark:bg-surface-800 dark:text-white rounded-[1.5rem] border-2 border-surface-100 dark:border-surface-700 shadow-2xl font-black text-xs uppercase tracking-widest',
             duration: 4000 
           }} 
        />
        <Sidebar isOpen={isSidebarOpen} toggle={() => setIsSidebarOpen(!isSidebarOpen)} />
        <TopBar isSidebarOpen={isSidebarOpen} />
        
        <PageLayout isSidebarOpen={isSidebarOpen}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/stock" element={<StockHistory />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </PageLayout>
      </div>
    </BrowserRouter>
  );
}

export default App;
