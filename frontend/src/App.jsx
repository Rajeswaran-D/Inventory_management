import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Menu, X } from 'lucide-react';
import { Sidebar } from './components/layout/Sidebar';
import { Login } from './pages/Login';
import { PrivateRoute } from './components/auth/PrivateRoute';
import { Dashboard } from './pages/Dashboard';
import ProductMaster from './pages/ProductMaster';
import Inventory from './pages/Inventory';
import EmployeeInventory from './pages/EmployeeInventory';
import { Billing } from './pages/BillingSimplified';
import BillHistory from './pages/BillHistory';
import { Reports } from './pages/Reports';
import ProductManagement from './pages/ProductManagement';
import UserManagement from './pages/UserManagement';
import { authService } from './services/authService';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize app state
  useEffect(() => {
    // We intentionally skip restoreSession here to force manual login 
    // as per user request to always see the login page first.
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Verifying Session...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
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
      
      <Routes>
        {/* Public Route */}
        <Route 
          path="/login" 
          element={
            isAuthenticated ? <Navigate to="/" replace /> : <Login setIsAuthenticated={setIsAuthenticated} />
          } 
        />

        {/* Protected Routes */}
        <Route
          path="/*"
          element={
            !isAuthenticated ? (
              <Navigate to="/login" replace />
            ) : (
              <div className="min-h-screen bg-white text-gray-900">
                {/* Top Navigation */}
                <nav className="fixed top-0 right-0 left-0 lg:left-20 h-20 border-b border-gray-200 z-30 flex items-center justify-between px-6 bg-white shadow-sm">
                  <div className="lg:hidden">
                    <button
                      onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
                    >
                      {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                  </div>
                  <div className="flex-1" />
                </nav>

                {/* Sidebar */}
                <Sidebar isOpen={isSidebarOpen} toggle={() => setIsSidebarOpen(!isSidebarOpen)} setIsAuthenticated={setIsAuthenticated} />

                {/* Main Content */}
                <main className="pt-20 lg:ml-20">
                  <div className={`min-h-screen bg-white text-gray-900 ${isSidebarOpen ? 'ml-0 lg:ml-44' : 'ml-0'}`}>
                    <div className="p-6">
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/inventory" element={
                          <PrivateRoute requiredRole="admin">
                            <Inventory />
                          </PrivateRoute>
                        } />
                        <Route path="/inventory-details" element={
                          <PrivateRoute requiredRole="employee">
                            <EmployeeInventory />
                          </PrivateRoute>
                        } />
                        <Route path="/billing" element={<Billing />} />
                        <Route path="/bill-history" element={
                          <PrivateRoute requiredRole="admin">
                            <BillHistory />
                          </PrivateRoute>
                        } />
                        <Route path="/reports" element={
                          <PrivateRoute requiredRole="admin">
                            <Reports />
                          </PrivateRoute>
                        } />
                        <Route path="/products" element={
                          <PrivateRoute requiredRole="admin">
                            <ProductMaster />
                          </PrivateRoute>
                        } />
                        <Route path="/product-management" element={
                          <PrivateRoute requiredRole="admin">
                            <ProductManagement />
                          </PrivateRoute>
                        } />
                        <Route path="/users" element={
                          <PrivateRoute requiredRole="admin">
                            <UserManagement />
                          </PrivateRoute>
                        } />
                        <Route path="*" element={<Navigate to="/" replace />} />
                      </Routes>
                    </div>
                  </div>
                </main>
              </div>
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
