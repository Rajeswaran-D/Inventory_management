import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Menu, X } from 'lucide-react';
import { Sidebar } from './components/layout/Sidebar';
import { Dashboard } from './pages/Dashboard';
import ProductMaster from './pages/ProductMaster';
import Inventory from './pages/Inventory';
import { Billing } from './pages/BillingSimplified';
import { BillingWithVariants } from './pages/BillingWithVariants';
import { BillHistory } from './pages/BillHistory';
import { Reports } from './pages/Reports';

import ProductManagement from './pages/ProductManagement';
import SimpleInventory from './pages/SimpleInventory';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-white text-gray-900">
        <Toaster 
          position="top-right" 
          toastOptions={{ 
            className: 'rounded-lg border shadow-xl font-medium text-sm',
            style: {
              background: 'white',
              color: 'rgb(17, 24, 39)',
              borderColor: '#e5e7eb'
            },
            duration: 3000 
          }} 
        />
        
        {/* Top Navigation */}
        <nav className="fixed top-0 right-0 left-0 lg:left-20 h-20 border-b border-gray-200 z-30 flex items-center justify-between px-6 bg-white shadow-sm">
          <div className="lg:hidden">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
              title={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
          
          <div className="flex-1" />
        </nav>

        {/* Sidebar */}
        <Sidebar isOpen={isSidebarOpen} toggle={() => setIsSidebarOpen(!isSidebarOpen)} />

        {/* Main Content */}
        <main className="pt-20 lg:ml-20">
          <div className={`min-h-screen bg-white text-gray-900 ${isSidebarOpen ? 'ml-0 lg:ml-44' : 'ml-0'}`}>
            <div className="p-6">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/billing" element={<Billing />} />
                <Route path="/billing-variants" element={<BillingWithVariants />} />
                <Route path="/bill-history" element={<BillHistory />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/products" element={<ProductMaster />} />
                <Route path="/product-management" element={<ProductManagement />} />
                <Route path="/simple-inventory" element={<SimpleInventory />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
