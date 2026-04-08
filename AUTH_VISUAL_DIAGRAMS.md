# Authentication System - Visual Architecture & Flow Diagrams

---

## 🔐 Authentication Flow Diagram

```
┌─────────────────┐
│   USER LOGIN    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Frontend: pages/Login.jsx      │
│  ├─ Email input                 │
│  ├─ Password input              │
│  └─ Submit button               │
└──────────┬──────────────────────┘
           │
           │ POST /api/auth/login
           │ { email, password }
           ▼
┌─────────────────────────────────┐
│  Backend: routes/authRoutes.js  │
│  Validate email & password      │
└──────────┬──────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│  Backend: models/User.js        │
│  Bcrypt compare password        │
└──────────┬──────────────────────┘
           │
       ┌───┴────┐
       │         │
    VALID      INVALID
       │         │
       ▼         ▼
    JWT Token  Error
    Generated  Returned
       │         │
       └────┬────┘
            │
            ▼
┌─────────────────────────────────┐
│  Frontend: authService.js       │
│  Store token in localStorage    │
│  Set Authorization header       │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  Frontend: Navigate to Home     │
│  App checks PrivateRoute        │
│  Token validates → Dashboard    │
└─────────────────────────────────┘
```

---

## 🚀 Request Flow with Authentication

### Protected API Request

```
┌─────────────────────────────────────────────────────────────┐
│                  FRONTEND REQUEST                            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
        ┌──────────────────────────┐
        │  Get token from storage  │
        │  localStorage.getItem    │
        │  ('token')               │
        └──────┬─────────────────────┘
               │
               ▼
        ┌──────────────────────────┐
        │  Create request headers  │
        │  Authorization: Bearer   │
        │  {token}                 │
        └──────┬─────────────────────┘
               │
               ▼ POST /api/envelopes
┌─────────────────────────────────────────────────────────────┐
│                  BACKEND REQUEST                             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
                ┌─────────────┐
                │ middleware/ │
                │ auth.js     │
                │ @protect    │
                └──────┬──────┘
                       │
                   ┌───┴────────────────────┐
                   │                        │
              Token Valid?          Token Missing?
                   │                        │
                   ▼                        ▼
            Extract user            Return 401
            from token              Unauthorized
                   │
                   ▼
            Check user role
                   │
            ┌──────┴──────┐
            │             │
        Is Admin?     Is Employee?
            │             │
            ▼             ▼
        ✅ Allowed    ✓ For some endpoints
                      ✗ For admin routes
                           │
                           ▼
                      Return 403 Forbidden
```

---

## 🎯 Database Schema

```
┌───────────────────────────────────────┐
│         MongoDB: User Collection      │
├───────────────────────────────────────┤
│ _id: ObjectId (Primary Key)           │
│ name: String                          │
│ email: String (Unique)                │
│ password: String (Hashed)             │
│   └─ Format: bcrypt($2b$10$...)       │
│ role: String (enum)                   │
│   └─ ['admin', 'employee']            │
│ isActive: Boolean                     │
│ createdAt: Date                       │
│ updatedAt: Date                       │
└───────────────────────────────────────┘

Indexes:
├─ _id (default)
└─ email (unique)

Demo Data:
├─ Admin: admin@swamy.com
└─ Employee: employee@swamy.com
```

---

## 🔑 JWT Token Structure

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MGZlODZjZDc5OTQzOTAxMSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTcxMjQ1MTIwMCwiZXhwIjoxNzEzMDU2MDAwfQ.signature

┌──────────────────────────────────────────────────────────────┐
│ Header: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9              │
├──────────────────────────────────────────────────────────────┤
│ {                                                            │
│   "alg": "HS256",                                           │
│   "typ": "JWT"                                              │
│ }                                                            │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ Payload: eyJ1c2VySWQiOiI1MGZlODZjZDc5OTQzOTAxMSIsInJvbGUi │
├──────────────────────────────────────────────────────────────┤
│ {                                                            │
│   "userId": "507f86cd79943901",                             │
│   "role": "admin",                                          │
│   "iat": 1712451200,        (issued at)                     │
│   "exp": 1713056000         (expires in 7 days)            │
│ }                                                            │
└──────────────────────────────────────────────────────────────┘

Signature: HMACSHA256(base64(header) + "." + base64(payload), SECRET)
```

---

## 🎬 User Session Lifecycle

```
Timeline:
├─ T=0: User opens app
│  └─ Check localStorage for token
│     ├─ Token exists? Restore session
│     └─ No token? Show login page
│
├─ T=1: User logs in
│  └─ Email + Password submitted
│     ├─ Valid? Generate JWT + store
│     └─ Invalid? Show error
│
├─ T=2 to T=7days: User uses app
│  └─ Every API call includes token
│     ├─ Token valid? Process request
│     └─ Token invalid? Return 401
│
├─ T=logout: User clicks logout
│  └─ Clear localStorage
│     ├─ Remove token
│     ├─ Remove user data
│     └─ Redirect to login
│
└─ T>7days: Token expires
   └─ Automatic logout on next request
      ├─ Token verification fails
      ├─ Redirect to login
      └─ User must login again
```

---

## 🛡️ Security Layers

```
┌────────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                         │
├────────────────────────────────────────────────────────────┤
│                                                             │
│ Layer 1: Transport Security                               │
│ ├─ HTTPS (in production)                                   │
│ ├─ CORS validation                                         │
│ └─ Secure headers (Helmet)                                │
│                                                             │
│ Layer 2: Authentication                                    │
│ ├─ Email verification                                      │
│ ├─ Password hashing (Bcrypt)                              │
│ ├─ JWT token generation                                    │
│ └─ Token expiration (7 days)                              │
│                                                             │
│ Layer 3: Authorization                                     │
│ ├─ Role extraction from token                             │
│ ├─ Permission checking                                     │
│ ├─ Endpoint-level RBAC                                     │
│ └─ Resource-level RBAC                                     │
│                                                             │
│ Layer 4: Application                                       │
│ ├─ Route guards (PrivateRoute)                            │
│ ├─ UI element hiding                                       │
│ ├─ Form validation                                         │
│ └─ Error handling                                          │
│                                                             │
│ Layer 5: Monitoring                                        │
│ ├─ Error logging                                           │
│ ├─ Failed login tracking                                   │
│ └─ Token usage tracking                                    │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

---

## 📊 Role-Based Access Control Flow

```
User Action
    │
    ▼
┌──────────────────┐
│ Check Auth Token │
└────────┬─────────┘
         │
     ┌───┴───┐
     │       │
   Valid   Invalid
     │       │
     ▼       ▼
 Continue  401 Error
     │
     ▼
┌──────────────────┐
│  Extract Role    │
│  from Token      │
└────────┬─────────┘
         │
    ┌────┴─────┐
    │           │
  admin      employee
    │           │
    ▼           ▼
┌─────────┐  ┌──────────┐
│Admin    │  │Employee  │
│Perms    │  │Perms     │
│Permission│  │check     │
│check OK?│  │OK?       │
└────┬────┘  └────┬─────┘
     │ Yes        │ Yes
     ▼            ▼
  Continue    Continue
     │            │
     │            ▼
     │       ┌───────────────────┐
     │       │Check if endpoint  │
     │       │allows role        │
     │       └────┬──────────────┘
     │            │
     │       ┌────┴────┐
     │       │          │
     │     Yes         No
     │       │          │
     │       ▼          ▼
     │     OK        403 Error
     └─────┬────────┘
           │
    ┌──────┴──────┐
    │             │
  Grant       Deny
  Access      Access
    │             │
    ▼             ▼
Execute      Return
Handler      Error
```

---

## 🧪 Test Flow Diagram

```
Test Environment Setup
├─ MongoDB running
├─ Backend running (npm run dev)
└─ Frontend running (npm run dev)

Test Case 1: Admin Login
├─ Navigate to /login
├─ Click "Admin Demo"
│  └─ Auto-fill: admin@swamy.com / admin@123
├─ Click Sign In
├─ ✅ Redirect to home
├─ ✅ See all nav items
├─ ✅ Can access /reports
└─ ✅ Edit/Delete buttons visible

Test Case 2: Employee Login
├─ Navigate to /login
├─ Enter: employee@swamy.com / employee@123
├─ Click Sign In
├─ ✅ Redirect to home
├─ ❌ Reports not in menu
├─ Try /reports directly
└─ ❌ Redirect to home

Test Case 3: Protected Route
├─ Login as employee
├─ Try /products URL
├─ ✅ Redirects to home
├─ Logout
├─ Refresh page
└─ ✅ Redirects to /login

Test Case 4: Invalid Login
├─ Enter: invalid@email.com
├─ Enter: wrongpassword
├─ Click Sign In
├─ ✅ Error toast shown
├─ ✅ Still on /login page
└─ ✅ Not redirected
```

---

## 🔄 Component Interaction Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                          APP.jsx                            │
│  (App entry point)                                          │
│  ├─ Check authService.restoreSession()                     │
│  ├─ Set isAuthenticated state                              │
│  └─ Render routes based on auth status                     │
└───────────────────┬─────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
   Authenticated  Loading   Not Authenticated
        │           │           │
        ▼           ▼           ▼
   ┌────────┐  Loading  ┌──────────┐
   │Sidebar │  Spinner  │Login Page│
   └────┬───┘           └────┬─────┘
        │                    │
        │                    │ On success
        │                    │
        ├────────┬───────────┤
        │        │           │
        ▼        ▼           ▼
    ┌────────────────────────────┐
    │  PrivateRoute Component    │
    │  Check token + role        │
    ├────────────────────────────┤
    │ ├─ Role OK? Render page    │
    │ └─ No role? Redirect home  │
    └────────────────────────────┘
        │
Forces  ├─ Each page
all     │
pages   ├─ Check auth
through │
        └─ Protected

    RoleBasedUI Components
    ├─ AdminOnly
    ├─ EmployeeOnly
    ├─ RoleBasedAccess
    └─ (Wrap sensitive UI)
```

---

## 📱 Mobile & Desktop Experience

```
DESKTOP (1920x1080)
┌──────────────────────────────────────┐
│  Navbar (token, user info)           │
├──────────┬──────────────────────────┤
│ Sidebar  │  Main Content Area       │
│ (fixed)  │                          │
│ - Logo   │  Dashboard / Page        │
│ - Menu   │                          │
│ - User   │                          │
│ - Logout │                          │
└──────────┴──────────────────────────┘

MOBILE (375x667)
┌──────────────────┐
│ Navbar           │
│ [☰ Menu] (show) │
├──────────────────┤
│ Main Content     │
│ (full width)     │
│                  │
│                  │
├──────────────────┤

Sidebar (hidden)
[Show on menu click]
Overlay appears ↙
```

---

## ⚡ Performance Optimization

```
Initial Load
├─ Check localStorage (sync)
├─ Set auth header (sync)
├─ Restore session (instant)
└─ Render correctly first try ✅

API Load
├─ Token included in headers
├─ No extra auth calls
├─ Verify on every request
└─ Fast middleware check ✅

Memory Usage
├─ Token stored in localStorage
├─ User data cached
├─ Minimal state
└─ ~5KB overhead ✅

Network
├─ One login request
├─ Token reused for all calls
├─ No re-authentication
└─ Efficient ✅
```

---

**All Diagrams Complete** ✅

For more details, see:
- [AUTHENTICATION_SETUP.md](./AUTHENTICATION_SETUP.md)
- [IMPLEMENTATION_EXAMPLES.md](./IMPLEMENTATION_EXAMPLES.md)
