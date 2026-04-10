# UI Component Styling Reference Template

## Quick Copy-Paste Components

Use these templates throughout the refactoring. Copy and paste exactly as shown, then customize as needed.

---

## 1. PAGE HEADERS

### Standard Page Header (All Pages)
```jsx
<div className="pb-6 border-b border-gray-200">
  <div className="flex items-start gap-3">
    <div className="p-3 bg-green-100 rounded-lg">
      <IconName className="w-8 h-8 text-green-600" />
    </div>
    <div>
      <h1 className="text-4xl font-extrabold text-gray-900">
        Page Title Here
      </h1>
      <p className="text-gray-500 mt-1">
        Subtitle or description
      </p>
    </div>
  </div>
</div>
```

---

## 2. SEARCH BARS

### Enhanced Search Input
```jsx
<div className="bg-white rounded-xl shadow-lg border border-gray-300 p-4">
  <div className="relative">
    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
    <input
      type="text"
      placeholder="🔍 Search..."
      value={searchValue}
      onChange={(e) => setSearchValue(e.target.value)}
      className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-green-300 focus:bg-green-50 transition-all shadow-sm"
    />
  </div>
</div>
```

---

## 3. BUTTONS

### Primary Action Button (Green Gradient)
```jsx
<button
  onClick={handleAction}
  disabled={isLoading}
  className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold transition-all shadow-lg hover:shadow-xl active:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
>
  <Plus className="w-5 h-5" />
  Action Label
</button>
```

### Secondary Button (White with Border)
```jsx
<button
  onClick={handleAction}
  className="flex items-center gap-2 px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors shadow-sm"
>
  <RefreshCw className="w-5 h-5" />
  Action Label
</button>
```

### Icon Button - Add (Green)
```jsx
<button
  onClick={handleAdd}
  className="p-2.5 rounded-lg bg-green-100 hover:bg-green-200 text-green-700 font-semibold transition-all shadow-sm hover:shadow-md active:shadow-none"
  title="Add"
>
  <Plus className="w-4 h-4" />
</button>
```

### Icon Button - Edit (Blue)
```jsx
<button
  onClick={handleEdit}
  className="p-2.5 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold transition-all shadow-sm hover:shadow-md active:shadow-none"
  title="Edit"
>
  <Edit className="w-4 h-4" />
</button>
```

### Icon Button - Delete (Red)
```jsx
<button
  onClick={handleDelete}
  className="p-2.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 font-semibold transition-all shadow-sm hover:shadow-md active:shadow-none"
  title="Delete"
>
  <Trash2 className="w-4 h-4" />
</button>
```

---

## 4. CARDS & CONTAINERS

### Standard Card
```jsx
<div className="bg-white rounded-xl shadow-lg border-2 border-gray-300 p-6">
  <h3 className="text-xl font-extrabold text-gray-900 mb-4">
    Card Title
  </h3>
  {/* Content */}
</div>
```

### Card with Header Border
```jsx
<div className="bg-white rounded-xl shadow-lg border-2 border-gray-300 overflow-hidden">
  <div className="bg-gradient-to-r from-green-50 to-green-25 px-6 py-4 border-b-2 border-green-200">
    <h3 className="text-xl font-extrabold text-gray-900">
      Card Title
    </h3>
  </div>
  <div className="p-6">
    {/* Content */}
  </div>
</div>
```

### Info Box (Step/Section)
```jsx
<div className="bg-gradient-to-br from-green-50 to-white p-4 rounded-lg border border-green-200">
  <label className="block text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-600 text-white text-xs font-bold">
      1
    </span>
    Label Text
  </label>
  <select
    value={value}
    onChange={(e) => setValue(e.target.value)}
    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-300 focus:bg-green-50 transition-all outline-none font-medium shadow-sm"
  >
    <option value="">Choose option...</option>
  </select>
</div>
```

---

## 5. INPUT FIELDS

### Text Input
```jsx
<div>
  <label className="block text-sm font-bold text-gray-900 mb-2">
    Label
  </label>
  <input
    type="text"
    placeholder="Placeholder text"
    value={value}
    onChange={(e) => setValue(e.target.value)}
    className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-green-300 focus:bg-green-50 transition-all shadow-sm"
  />
</div>
```

### Select Dropdown
```jsx
<div>
  <label className="block text-sm font-bold text-gray-900 mb-2">
    Label
  </label>
  <select
    value={value}
    onChange={(e) => setValue(e.target.value)}
    className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-green-300 focus:bg-green-50 transition-all outline-none font-medium shadow-sm"
  >
    <option value="">Choose option...</option>
    <option value="1">Option 1</option>
  </select>
</div>
```

### Number Input
```jsx
<div>
  <label className="block text-sm font-bold text-gray-900 mb-2">
    Label
  </label>
  <input
    type="number"
    min="0"
    step="0.01"
    placeholder="Enter number"
    value={value}
    onChange={(e) => setValue(e.target.value)}
    className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-green-300 focus:bg-green-50 transition-all shadow-sm font-medium"
  />
</div>
```

---

## 6. TABLES

### Table Container with Header
```jsx
<div className="bg-white rounded-xl shadow-lg border-2 border-gray-300 overflow-hidden">
  <div className="bg-gradient-to-r from-green-50 to-green-25 px-6 py-4 border-b-2 border-green-200 flex items-center justify-between">
    <h3 className="font-bold text-gray-900 text-lg">
      Table Title ({itemCount} items)
    </h3>
    {searchQuery && (
      <span className="text-sm text-gray-600">
        Filtered: "{searchQuery}"
      </span>
    )}
  </div>

  <div className="overflow-x-auto">
    <table className="w-full">
      <thead className="bg-gray-50 border-b border-gray-200">
        <tr>
          <th className="text-left py-4 px-6 font-bold text-gray-900">Column 1</th>
          <th className="text-left py-4 px-6 font-bold text-gray-900">Column 2</th>
          <th className="text-right py-4 px-6 font-bold text-gray-900">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-150">
        {items.map((item) => (
          <tr key={item._id} className="hover:bg-green-50 transition-colors duration-200">
            <td className="py-4 px-6 text-gray-900 font-medium">{item.field1}</td>
            <td className="py-4 px-6 text-gray-600">{item.field2}</td>
            <td className="py-4 px-6 text-right">
              <div className="flex gap-2 justify-end">
                {/* Action buttons */}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
```

---

## 7. MODALS

### Modal Header
```jsx
<div className="flex items-center gap-3 pb-4 border-b-2 border-green-200">
  <IconName className="w-6 h-6 text-green-600" />
  <h2 className="text-2xl font-extrabold text-gray-900">
    Modal Title
  </h2>
</div>
```

### Modal Footer (Action Buttons)
```jsx
<div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
  <button
    onClick={handleCancel}
    disabled={isSubmitting}
    className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 shadow-sm"
  >
    Cancel
  </button>
  <button
    onClick={handleSubmit}
    disabled={isSubmitting}
    className="px-6 py-3 rounded-lg bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold transition-all shadow-lg disabled:opacity-50"
  >
    {isSubmitting ? 'Saving...' : 'Save'}
  </button>
</div>
```

---

## 8. STATUS BADGES

### Status Badge (Color-Coded)
```jsx
<span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
  status === 'good' ? 'bg-green-50 text-green-700' :
  status === 'medium' ? 'bg-amber-50 text-amber-700' :
  'bg-red-50 text-red-700'
}`}>
  {statusLabel} ({currentValue}/{maxValue})
</span>
```

---

## 9. ALERT/INFO BOXES

### Info Box (Green)
```jsx
<div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
  <div>
    <p className="font-semibold text-green-700">Success Message</p>
    <p className="text-xs text-green-600 mt-1">Additional details</p>
  </div>
</div>
```

### Error Box (Red)
```jsx
<div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
  <div>
    <p className="font-semibold text-red-700">Error Message</p>
    <p className="text-xs text-red-600 mt-1">Additional details</p>
  </div>
</div>
```

---

## 10. LOADING STATES

### Spinner
```jsx
<div className="flex items-center justify-center py-12 gap-3">
  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600" />
  <p className="text-gray-600 text-sm">Loading...</p>
</div>
```

### Inline Button Loading
```jsx
<button
  disabled={isLoading}
  className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-lg disabled:opacity-50"
>
  {isLoading ? (
    <>
      <RefreshCw className="w-4 h-4 inline animate-spin mr-2" />
      Loading...
    </>
  ) : (
    'Action'
  )}
</button>
```

---

## 11. EXPANDABLE SECTIONS

### Expandable Header (Accordion Style)
```jsx
<div 
  className="bg-gradient-to-r from-green-50 to-gray-50 hover:from-green-100 hover:to-gray-100 p-4 cursor-pointer flex justify-between items-center transition-colors border-b-2 border-green-200"
  onClick={() => toggle(id)}
>
  <div className="flex items-center gap-4">
    <h3 className="text-lg font-extrabold text-gray-900">Title</h3>
    <div className="flex gap-2">
      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
        Feature 1
      </span>
    </div>
  </div>
  <div className="flex items-center gap-4">
    <span className="text-gray-600 font-medium text-sm">Count: 5</span>
    <button 
      className={`transform transition-transform text-gray-400 ${isExpanded ? 'rotate-180' : ''}`}
    >
      ▼
    </button>
  </div>
</div>
```

---

## 12. FILTER/BUTTON GROUPS

### Filter Button Set
```jsx
<div className="flex flex-wrap gap-2">
  {options.map(opt => (
    <button
      key={opt.value}
      onClick={() => setActive(opt.value)}
      className={`px-5 py-3 text-sm font-semibold rounded-lg transition-all ${
        active === opt.value
          ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-md hover:shadow-lg'
          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
      }`}
    >
      {opt.icon} {opt.label}
    </button>
  ))}
</div>
```

---

## 13. SUMMARY CARDS

### Stats Card (4-Column Grid)
```jsx
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
  {cards.map(card => (
    <div key={card.label} className="bg-white border border-gray-200 rounded-xl p-4 shadow-md hover:shadow-lg transition-all">
      <div className={`${card.bg} ${card.color} p-2.5 rounded-lg mb-2 w-fit`}>
        <card.icon className="w-5 h-5" />
      </div>
      <p className="text-xs text-gray-600 font-medium">{card.label}</p>
      <p className="text-xl font-bold text-gray-900 mt-1">{card.value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{card.subtitle}</p>
    </div>
  ))}
</div>
```

---

## Tailwind Classes Reference

### Colors Used
- Primary Green: `from-green-600 to-green-700`
- Hover Green: `hover:from-green-700 hover:to-green-800`
- Light Green BG: `bg-green-50`
- Green Border: `border-green-300`, `border-green-200`
- Green Text: `text-green-600`, `text-green-700`

### Shadows
- Small: `shadow-sm`
- Medium: `shadow-md`
- Large: `shadow-lg`
- Extra Large: `shadow-xl`

### Rounded Corners
- Small form elements: `rounded-lg`
- Cards/containers: `rounded-xl`
- Circular icons: `rounded-full`

### Spacing
- Padding: `p-3`, `p-4`, `p-6` (standard)
- Margin: `m-1`, `mt-2`, `mb-4` (as needed)
- Gap: `gap-2`, `gap-3`, `gap-4` (between items)

### Typography
- Headers: `font-extrabold text-4xl` (main), `font-bold text-3xl` (section)
- Labels: `font-bold text-sm`
- Body: `font-medium` or `font-normal`

---

## Accessibility Notes

✅ **WCAG Compliance Checklist:**
- [ ] Color contrast ratio 4.5:1 minimum for text
- [ ] Focus states clearly visible
- [ ] Button padding adequate for touch targets (min 44x44px)
- [ ] Form labels properly associated
- [ ] Icons have title attributes or ARIA labels
- [ ] Disabled state clearly indicated
- [ ] Loading states announced

---

## Implementation Tips

1. **Copy-paste templates** - Use the exact templates above, then customize values
2. **Consistent spacing** - Use multiples of 4px (Tailwind's base unit)
3. **Focus states** - Always test keyboard navigation
4. **Performance** - Keep animations smooth, avoid transitions on large elements
5. **Testing** - Test on multiple screen sizes (mobile, tablet, desktop)
6. **Dark mode** - If needed, add `dark:` variants to classes

