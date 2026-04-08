import React from 'react';
import { rbac } from '../../utils/rbac';

/**
 * RoleBasedAccess Component
 * Conditionally renders children based on user role and permission
 * 
 * Usage:
 * <RoleBasedAccess permission="canEditInventory">
 *   <button>Edit Product</button>
 * </RoleBasedAccess>
 */
export const RoleBasedAccess = ({ children, permission, fallback = null }) => {
  const permissions = rbac.getPermissions();
  
  if (!permission) {
    return children; // No permission required
  }

  const hasPermission = permissions[permission];

  return hasPermission ? children : fallback;
};

/**
 * AdminOnly Component
 * Only renders children if user is admin
 */
export const AdminOnly = ({ children, fallback = null }) => {
  return rbac.isAdmin() ? children : fallback;
};

/**
 * EmployeeOnly Component
 * Only renders children if user is employee
 */
export const EmployeeOnly = ({ children, fallback = null }) => {
  return rbac.isEmployee() ? children : fallback;
};
