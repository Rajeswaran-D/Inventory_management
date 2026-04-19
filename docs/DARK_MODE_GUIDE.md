# Dark Mode Implementation Guide

## ✅ What Was Fixed

### 1. **CSS Architecture** 
- **Before:** Overly complex `@theme` configuration in index.css
- **After:** Simplified to just `@import "tailwindcss"` with proper color-scheme support
- **Why:** Tailwind v4 with Vite plugin handles theme generation automatically

### 2. **Theme Hook**
- **Before:** Logic was scattered in App.jsx useEffect
- **After:** Created reusable `useTheme()` hook in `src/hooks/useTheme.js`
- **Why:** Better separation of concerns and reusability across components

### 3. **Mounted State Protection**
- **Before:** No protection against rendering before theme is loaded
- **After:** Added `mounted` state with loading spinner
- **Why:** Prevents flash of unstyled content (FOUC)

### 4. **Enhanced DOM Updates**
- **Before:** Only added/removed 'dark' class
- **After:** Also adds `data-theme` attribute for better CSS targeting
- **Why:** More robust approach, easier debugging

### 5. **Error Handling**
- **Before:** No try-catch blocks
- **After:** Wrapped localStorage and DOM operations in try-catch
- **Why:** Prevents crashes from localStorage access restrictions

---

## 🎨 How It Works

### Class-Based Dark Mode
```
Light Mode (Default):  html (no dark class)
                      ├─ bg-white
                      └─ text-gray-900

Dark Mode:            html.dark
                      ├─ bg-gray-950 (via dark:bg-gray-950)
                      └─ text-white (via dark:text-white)
```

### Tailwind Configuration
```javascript
// tailwind.config.js
export default {
  darkMode: 'class',  // ← Uses .dark class on html element
  // ... rest of config
}
```

### CSS Pattern
```css
.component {
  background-color: white;           /* Light mode (default) */
  color: #1f2937;                    /* Light mode (default) */
}

.dark .component {
  background-color: #111827;         /* Dark mode */
  color: white;                      /* Dark mode */
}
```

### Tailwind Shorthand
```jsx
<div className="bg-white dark:bg-gray-900">
  ☝️ Light: bg-white | Dark: bg-gray-900
</div>

<div className="text-gray-900 dark:text-white">
  ☝️ Light: text-gray-900 | Dark: text-white
</div>
```

---

## 🔧 Implementation Details

### 1. **useTheme Hook** (`src/hooks/useTheme.js`)

```javascript
const { isDark, toggleTheme, theme, mounted } = useTheme();

// isDark (boolean) - true if dark mode is active
// toggleTheme (function) - toggle between light/dark
// theme (string) - 'light' or 'dark'
// mounted (boolean) - whether hook has initialized
```

**Features:**
- ✅ Reads from localStorage on init
- ✅ Falls back to system preference
- ✅ Persists changes to localStorage
- ✅ Applies class to document.documentElement
- ✅ Error handling for restricted environments

---

## 📝 Using Dark Mode in Components

### Basic Example
```jsx
import { Card } from '../components/ui/Card';

export function MyComponent() {
  return (
    <Card className="bg-white dark:bg-gray-900">
      <h1 className="text-gray-900 dark:text-white">Hello</h1>
      <p className="text-gray-600 dark:text-gray-400">Description</p>
    </Card>
  );
}
```

### Using the Hook
```jsx
import { useTheme } from '../hooks/useTheme';

export function ThemeSwitch() {
  const { isDark, toggleTheme } = useTheme();
  
  return (
    <button onClick={toggleTheme}>
      {isDark ? '☀️ Light' : '🌙 Dark'}
    </button>
  );
}
```

### Conditional Styling
```jsx
<div className={`
  px-4 py-2 rounded-lg
  ${isDark ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-900'}
`}>
  Conditional Dark Mode
</div>
```

---

## 🎯 Common Dark Mode Patterns

### Colors
```jsx
// Text
<span className="text-gray-900 dark:text-white" />

// Background
<div className="bg-white dark:bg-gray-900" />

// Borders
<div className="border border-gray-200 dark:border-gray-800" />

// Hover States
<button className="hover:bg-gray-100 dark:hover:bg-gray-800" />
```

### Cards & Containers
```jsx
<div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
  <h2 className="text-gray-900 dark:text-white">Title</h2>
  <p className="text-gray-600 dark:text-gray-400">Content</p>
</div>
```

### Form Elements
```jsx
<input
  className="
    bg-white dark:bg-gray-800
    text-gray-900 dark:text-white
    border border-gray-300 dark:border-gray-600
    placeholder:text-gray-400 dark:placeholder:text-gray-500
  "
  placeholder="Enter text..."
/>
```

---

## ✨ Testing Dark Mode

### 1. **Manual Testing**
- Click the Sun/Moon button in navbar
- Check that all colors update smoothly
- Refresh page - preference should persist
- Check browser DevTools - html should have `dark` class

### 2. **Browser DevTools**
```javascript
// Toggle manually in console
document.documentElement.classList.add('dark');
document.documentElement.classList.remove('dark');

// Check current theme
document.documentElement.classList.contains('dark') // true or false

// Check localStorage
localStorage.getItem('theme') // 'dark' or 'light'
```

### 3. **System Preference**
- Windows: Settings > Personalization > Colors > Dark
- macOS: System Preferences > General > Appearance
- Clear localStorage and refresh to test system preference detection

---

## 🚨 Troubleshooting

### Dark Mode Not Working?

**1. Check tailwind.config.js**
```javascript
darkMode: 'class',  // ✅ Must be 'class'
// darkMode: 'media'  // ❌ Wrong setting
```

**2. Check HTML element**
```javascript
// In browser console:
document.documentElement.classList  // Should contain 'dark'
document.documentElement.getAttribute('class')  // Should show 'dark'
```

**3. Check CSS is applied**
```javascript
// Inspect element in DevTools
// Look for elements with dark: classes
<div class="bg-white dark:bg-gray-900">
```

**4. Check index.css is imported**
```javascript
// main.jsx or index.jsx should have:
import './index.css'
```

**5. Force rebuild**
```bash
# Clear cache and rebuild
rm -rf node_modules/.vite
npm run dev
```

---

## 🔍 Performance Tips

### 1. **Use Tailwind Classes**
```jsx
// ✅ Good - Tailwind handles optimization
<div className="text-white dark:text-gray-900" />

// ❌ Bad - Inline styles, hard to maintain
<div style={{ color: isDark ? 'white' : '#111827' }} />
```

### 2. **Avoid Repeated Classes**
```jsx
// ✅ Good
const darkCardClass = 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800';

// Use in multiple components
<Card className={darkCardClass} />

// Or create a component
<DarkCard />
```

### 3. **Transitions**
```jsx
// ✅ Good - Smooth 200ms transition
<div className="bg-white dark:bg-gray-900 transition-colors duration-200" />

// Disable for performance-critical areas if needed
<div className="bg-white dark:bg-gray-900" />
```

---

## 📚 File Structure

```
frontend/
├── src/
│   ├── hooks/
│   │   └── useTheme.js          ← New: Theme management hook
│   ├── components/
│   │   └── ui/
│   │       ├── Card.jsx          ← Has dark: classes
│   │       ├── Button.jsx        ← Has dark: classes
│   │       └── ...
│   ├── pages/
│   │   ├── Dashboard.jsx         ← Has dark: classes
│   │   └── ...
│   ├── App.jsx                   ← Updated: Uses useTheme hook
│   ├── index.css                 ← Updated: Simplified
│   └── main.jsx
├── tailwind.config.js            ← Already has darkMode: 'class'
└── vite.config.js                ← Already configured
```

---

## 🎓 Best Practices

1. **Always use Tailwind classes** for consistency
2. **Test in both modes** before committing
3. **Use semantic color names** (not hex codes)
4. **Include transitions** for smooth UX
5. **Use consistent spacing** in dark:variants
6. **Document custom colors** if needed
7. **Test with screen readers** for accessibility

---

## 🔗 Resources

- [Tailwind CSS Dark Mode](https://tailwindcss.com/docs/dark-mode)
- [React Hooks Best Practices](https://react.dev/reference/react/hooks)
- [localStorage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- [CSS Class Toggling](https://developer.mozilla.org/en-US/docs/Web/API/Element/classList)
