/**
 * ROLE-BASED ACCESS IMPLEMENTATION GUIDE
 * 
 * This file shows how to add role-based access control to your existing components
 * Copy and adapt these patterns to your pages and components
 */

// ============================================================================
// OPTION 1: Use PrivateRoute for Entire Page (RECOMMENDED)
// ============================================================================

// Before:
// <Route path="/reports" element={<Reports />} />

// After:
import { PrivateRoute } from './components/auth/PrivateRoute';
import { Reports } from './pages/Reports';

// Admin-only route
<Route path="/reports" element={
  <PrivateRoute requiredRole="admin">
    <Reports />
  </PrivateRoute>
} />

// All authenticated users can access
<Route path="/billing" element={
  <PrivateRoute>
    <Billing />
  </PrivateRoute>
} />

// ============================================================================
// OPTION 2: Conditionally Show/Hide Buttons (RECOMMENDED)
// ============================================================================

import { AdminOnly, EmployeeOnly, RoleBasedAccess } from './components/auth/RoleBasedAccess';

export const ProductList = () => {
  return (
    <div>
      {/* Everyone sees this button */}
      <button>View Product</button>

      {/* Only admins see these buttons */}
      <AdminOnly>
        <button className="bg-blue-500">Edit Product</button>
        <button className="bg-red-500">Delete Product</button>
      </AdminOnly>

      {/* Only employees see this */}
      <EmployeeOnly>
        <p>You can only view products</p>
      </EmployeeOnly>

      {/* Use RoleBasedAccess for more granular control */}
      <RoleBasedAccess permission="canEditInventory">
        <button>Edit Inventory</button>
      </RoleBasedAccess>

      {/* With fallback message */}
      <RoleBasedAccess 
        permission="canAccessSettings"
        fallback={<p className="text-gray-500">Settings not available</p>}
      >
        <button>Open Settings</button>
      </RoleBasedAccess>
    </div>
  );
};

// ============================================================================
// OPTION 3: Check Permissions in JavaScript Code
// ============================================================================

import { rbac } from './utils/rbac';

export const Dashboard = () => {
  const permissions = rbac.getPermissions();

  const handleDeleteClick = () => {
    if (!permissions.canDeleteProduct) {
      toast.error('You do not have permission to delete products');
      return;
    }
    
    // Proceed with deletion
    deleteProduct();
  };

  const handleAdminAction = () => {
    if (!rbac.isAdmin()) {
      toast.error('Only admins can perform this action');
      return;
    }
    
    // Perform admin action
  };

  return (
    <div>
      {permissions.canEditInventory && (
        <button onClick={handleDeleteClick}>Delete</button>
      )}
    </div>
  );
};

// ============================================================================
// OPTION 4: Disable Buttons Instead of Hiding (UX-Friendly)
// ============================================================================

import { rbac } from './utils/rbac';
import toast from 'react-hot-toast';

export const InventoryActions = () => {
  const permissions = rbac.getPermissions();
  const canEdit = permissions.canEditInventory;

  return (
    <div>
      {/* Show button but disable if no permission */}
      <button
        onClick={() => {
          if (!canEdit) {
            toast.error('You do not have permission to edit inventory');
            return;
          }
          editProduct();
        }}
        disabled={!canEdit}
        className={canEdit ? 'bg-blue-500' : 'bg-gray-300 cursor-not-allowed'}
        title={!canEdit ? 'Only admins can edit inventory' : 'Edit inventory'}
      >
        Edit Inventory
      </button>
    </div>
  );
};

// ============================================================================
// OPTION 5: Protected API Calls with Error Handling
// ============================================================================

import { authService } from './services/authService';
import axios from 'axios';

export const productService = {
  // Create product (Admin only)
  createProduct: async (data) => {
    // Check permission before calling API
    if (!authService.isAdmin()) {
      return { success: false, message: 'Only admins can create products' };
    }

    try {
      const response = await axios.post(
        'http://localhost:5000/api/envelopes',
        data,
        { headers: authService.getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      // Handle 403 Forbidden (backend permission denied)
      if (error.response?.status === 403) {
        return { 
          success: false, 
          message: 'You do not have permission to perform this action' 
        };
      }
      return { success: false, message: error.message };
    }
  },

  // View products (Everyone)
  getProducts: async () => {
    try {
      const response = await axios.get(
        'http://localhost:5000/api/envelopes',
        { headers: authService.getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
};

// ============================================================================
// OPTION 6: Role-Specific Navigation Menu
// ============================================================================

import { authService } from './services/authService';

export const Sidebar = () => {
  const role = authService.getUserRole();
  const isAdmin = authService.isAdmin();

  const navItems = [
    { label: 'Dashboard', path: '/', requiredRole: null }, // All
    { label: 'Inventory', path: '/inventory', requiredRole: null }, // All
    { label: 'Billing', path: '/billing', requiredRole: null }, // All
    { label: 'Reports', path: '/reports', requiredRole: 'admin' }, // Admin only
    { label: 'Settings', path: '/settings', requiredRole: 'admin' }, // Admin only
  ];

  const visibleItems = navItems.filter(item => 
    !item.requiredRole || item.requiredRole === role
  );

  return (
    <nav>
      {visibleItems.map(item => (
        <NavLink key={item.path} to={item.path}>
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
};

// ============================================================================
// OPTION 7: Complete Page Example with Multiple Permissions
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PrivateRoute } from './components/auth/PrivateRoute';
import { AdminOnly, RoleBasedAccess } from './components/auth/RoleBasedAccess';
import { rbac } from './utils/rbac';
import toast from 'react-hot-toast';

export const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();
  const permissions = rbac.getPermissions();

  // If employee, redirect to inventory (read-only view)
  if (!permissions.canEditInventory) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">
          ⚠️ You do not have permission to access this page. 
          <a href="/inventory" className="font-bold underline"> View Inventory instead</a>
        </p>
      </div>
    );
  }

  const handleAddProduct = () => {
    if (!permissions.canAddProduct) {
      toast.error('You do not have permission to add products');
      return;
    }
    // Show add product modal
  };

  const handleDeleteProduct = (id) => {
    if (!permissions.canDeleteProduct) {
      toast.error('You do not have permission to delete products');
      return;
    }
    // Delete product
  };

  return (
    <PrivateRoute requiredRole="admin">
      <div>
        <h1>Product Management</h1>
        
        {/* This section only shows for admins */}
        <AdminOnly>
          <button onClick={handleAddProduct}>
            Add Product
          </button>
        </AdminOnly>

        {/* Products table */}
        <table>
          <tbody>
            {products.map(product => (
              <tr key={product.id}>
                <td>{product.name}</td>
                <td>
                  {/* Edit button visible for admins */}
                  <RoleBasedAccess permission="canEditInventory">
                    <button onClick={() => editProduct(product.id)}>
                      Edit
                    </button>
                  </RoleBasedAccess>

                  {/* Delete button visible for admins */}
                  <RoleBasedAccess permission="canDeleteProduct">
                    <button 
                      onClick={() => handleDeleteProduct(product.id)}
                      className="bg-red-500"
                    >
                      Delete
                    </button>
                  </RoleBasedAccess>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PrivateRoute>
  );
};

// ============================================================================
// ADDING ROLE-BASED ACCESS TO YOUR INVENTORY PAGE
// ============================================================================

// In your Inventory.jsx file, import these:
import { AdminOnly } from '../components/auth/RoleBasedAccess';
import { rbac } from '../utils/rbac';

// Then wrap the edit/delete buttons:
{/* In the Actions column of your inventory table */}
<td>
  <div className="flex gap-2">
    {/* Everyone can add/reduce stock */}
    <button onClick={() => addStock(product)}>
      <Plus className="w-4 h-4" />
    </button>

    {/* Only admins can edit */}
    <AdminOnly>
      <button onClick={() => editProduct(product)}>
        <Edit className="w-4 h-4" />
      </button>
    </AdminOnly>

    {/* Only admins can delete */}
    <AdminOnly>
      <button onClick={() => deleteProduct(product)}>
        <Trash2 className="w-4 h-4" />
      </button>
    </AdminOnly>
  </div>
</td>

// Also hide the "Add New Product" button for employees:
{/* Action Buttons section */}
<AdminOnly>
  <button onClick={() => setShowAddProductModal(true)}>
    <Plus className="w-4 h-4" />
    Add New Product
  </button>
</AdminOnly>

// ============================================================================
// TESTING YOUR IMPLEMENTATION
// ============================================================================

// Test Case 1: Login as Admin
// ✅ Should see all buttons
// ✅ Can click edit/delete
// ✅ Can access all pages

// Test Case 2: Login as Employee
// ✅ Should NOT see edit/delete buttons
// ✅ Can see view buttons
// ✅ Reports page redirects to home
// ✅ Product Master page redirects to home

// Test Case 3: Clear token and refresh
// ✅ Should redirect to login
// ✅ No pages accessible

// ============================================================================
// PERMISSION LIST (from rbac.js)
// ============================================================================

const examplePermissions = {
  canViewDashboard: true,
  canViewInventory: true,
  canEditInventory: true,    // Use this to hide edit buttons
  canAddProduct: true,        // Use this to hide add button
  canDeleteProduct: true,     // Use this to hide delete button
  canViewBilling: true,
  canCreateSale: true,
  canViewReports: true,       // Reports page
  canEditReports: true,
  canAccessSettings: true,    // Settings/Admin panel
  canManageUsers: true        // User management
};

// Use these in your components like:
// if (permissions.canEditInventory) { show edit button }
// if (permissions.canDeleteProduct) { show delete button }

// ============================================================================
// HOW TO ADD MORE ROLES/PERMISSIONS
// ============================================================================

// 1. Add role to User model (backend/src/models/User.js):
// enum: ['admin', 'employee', 'manager', 'viewer']

// 2. Update rbac.js with new role permissions:
if (role === 'manager') {
  return {
    canViewDashboard: true,
    canViewInventory: true,
    canEditInventory: true,
    canAddProduct: false,
    canDeleteProduct: false,
    // ... other permissions
  };
}

// 3. Update isAdmin check if needed:
// canPerformSpecialAction: role === 'admin' || role === 'manager'

// ============================================================================
// END OF IMPLEMENTATION GUIDE
// ============================================================================
