import { authService } from '../../services/authService';

/**
 * Role-based access control helper
 * Use these throughout the app to show/hide UI elements based on user role
 */
export const rbac = {
  /**
   * Check if user can perform action
   */
  canPerformAction: (requiredRole) => {
    const userRole = authService.getUserRole();
    if (!requiredRole) return true; // No role requirement
    return userRole === requiredRole;
  },

  /**
   * Check if user is admin
   */
  isAdmin: () => {
    return authService.isAdmin();
  },

  /**
   * Check if user is employee
   */
  isEmployee: () => {
    return authService.getUserRole() === 'employee';
  },

  /**
   * Get allowed permissions based on role
   */
  getPermissions: () => {
    const role = authService.getUserRole();

    if (role === 'admin') {
      return {
        canViewDashboard: true,
        canViewInventory: true,
        canEditInventory: true,
        canAddProduct: true,
        canDeleteProduct: true,
        canViewBilling: true,
        canCreateSale: true,
        canViewReports: true,
        canEditReports: true,
        canAccessSettings: true,
        canManageUsers: true
      };
    }

    if (role === 'employee') {
      return {
        canViewDashboard: true,
        canViewInventory: true,
        canEditInventory: false,
        canAddProduct: false,
        canDeleteProduct: false,
        canViewBilling: true,
        canCreateSale: true,
        canViewReports: false,
        canEditReports: false,
        canAccessSettings: false,
        canManageUsers: false
      };
    }

    // Default - no permissions
    return {
      canViewDashboard: false,
      canViewInventory: false,
      canEditInventory: false,
      canAddProduct: false,
      canDeleteProduct: false,
      canViewBilling: false,
      canCreateSale: false,
      canViewReports: false,
      canEditReports: false,
      canAccessSettings: false,
      canManageUsers: false
    };
  }
};
