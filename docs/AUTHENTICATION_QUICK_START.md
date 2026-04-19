# Authentication System - Quick Start Guide

**Version:** 1.0  
**Date:** April 7, 2026  
**Status:** ✅ Ready to Use

---

## 🚀 Quick Start (5 Minutes)

### 1. Install Dependencies

```bash
npm run install-all
```

### 2. Start Application

```bash
npm run dev
```

### 3. Access Application

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000

### 4. Login with Demo Accounts

**Admin Account:**
```
Email: admin@swamy.com
Password: admin@123
```

**Employee Account:**
```
Email: employee@swamy.com
Password: employee@123
```

---

## 📊 What Can Each Role Do?

### ADMIN Can:
✅ View everything  
✅ Add/Edit/Delete products  
✅ Manage inventory  
✅ View & export reports  
✅ Create sales/billing  
✅ Access all settings  

### EMPLOYEE Can:
✅ View inventory (read-only)  
✅ Create sales/billing  
✅ View dashboard  
❌ Cannot edit/delete products  
❌ Cannot view reports  
❌ Cannot access settings  

---

## 🔑 How It Works

1. **Login Page** (`/login`)
   - Enter email and password
   - Click "Sign In"
   - Token stored in browser

2. **Dashboard** (`/`)
   - Protected route - redirects to login if not authenticated
   - Shows different menus based on role

3. **Inventory** (`/inventory`)
   - All can view products
   - Admins can edit/delete
   - Edit/delete buttons hidden for employees

4. **Billing** (`/billing`)
   - Both roles can create sales

5. **Reports** (`/reports`)
   - Admin only
   - Redirects to home if employee tries to access

---

## 📁 Files Created

### Backend Files

| File | Purpose |
|------|---------|
| `src/models/User.js` | User database model with password hashing |
| `src/routes/authRoutes.js` | Login, register, user endpoints |
| `src/middleware/auth.js` | JWT verification, role checking |
| `src/autoSeedUsers.js` | Creates demo accounts on startup |

### Frontend Files

| File | Purpose |
|------|---------|
| `src/pages/Login.jsx` | Beautiful login page |
| `src/services/authService.js` | Handles login/logout/token |
| `src/components/auth/PrivateRoute.jsx` | Protects routes |
| `src/components/auth/RoleBasedAccess.jsx` | UI components for role checking |
| `src/utils/rbac.js` | Permission checking utility |

### Configuration Files

| File | Purpose |
|------|---------|
| `backend/.env.example` | Environment variables template |
| `frontend/.env.example` | Frontend environment variables |

---

## 💻 Code Examples

### Example 1: Protected Route (Admin Only)

```jsx
import { PrivateRoute } from './components/auth/PrivateRoute';
import Reports from './pages/Reports';

// In App.jsx
<Route path="/reports" element={
  <PrivateRoute requiredRole="admin">
    <Reports />
  </PrivateRoute>
} />
```

### Example 2: Show/Hide Button Based on Role

```jsx
import { AdminOnly } from './components/auth/RoleBasedAccess';

export const ProductActions = () => {
  return (
    <div>
      <button>View</button>
      
      <AdminOnly>
        <button>Edit</button>
        <button>Delete</button>
      </AdminOnly>
    </div>
  );
};
```

### Example 3: Check Permissions in Code

```javascript
import { rbac } from './utils/rbac';

const permissions = rbac.getPermissions();

if (permissions.canEditInventory) {
  // Show edit button
}

if (rbac.isAdmin()) {
  // Admin-only actions
}
```

### Example 4: API Call with Auth Token

```javascript
import { authService } from './services/authService';

// Get auth header
const headers = authService.getAuthHeader();

// Make API call
const response = await axios.get(
  'http://localhost:5000/api/envelopes',
  { headers }
);
```

---

## 🔐 Security Features

✅ **Passwords:** Hashed with Bcrypt  
✅ **Tokens:** JWT with 7-day expiration  
✅ **Storage:** localStorage (can upgrade to HTTPOnly cookies)  
✅ **Validation:** Email/password on every login  
✅ **Headers:** Security headers via Helmet  

---

## 🧪 Testing Checklist

- [ ] Can login with admin account
- [ ] Can login with employee account
- [ ] Dashboard visible after login
- [ ] Inventory shows products
- [ ] Admin can see edit/delete buttons
- [ ] Employee cannot see edit/delete buttons
- [ ] Employee cannot access reports page
- [ ] Logout button works
- [ ] Refresh maintains session
- [ ] Invalid login shows error

---

## ⚠️ Common Issues

### "Not authorized to access this route"
- Check token is stored: `localStorage.getItem('token')`
- Verify backend has CORS enabled

### Login fails
- Verify MongoDB is running
- Check email/password are correct
- Check backend console for errors

### Employee can access admin pages
- Verify `requiredRole` prop in PrivateRoute
- Clear localStorage and login again

---

## 📞 Need Help?

1. Check [AUTHENTICATION_SETUP.md](./AUTHENTICATION_SETUP.md) for detailed docs
2. Check backend logs: `npm run dev`
3. Check browser console (F12)
4. Verify .env files are configured

---

## 📚 What's Next?

After this is working:

1. **Customize permissions** - Edit `rbac.js` to add/remove permissions
2. **Add more users** - Create new accounts via `/api/auth/register`
3. **Integrate with existing routes** - Add `@protect @isAdmin` to other endpoints
4. **Upgrade storage** - Move tokens to HTTPOnly cookies for production

---

**Ready? Start with:** `npm run dev`

Then visit: **http://localhost:5173**
