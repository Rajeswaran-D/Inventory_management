import React from 'react';
import { useTheme } from '../../hooks/useTheme';
import { Sun, Moon, Check, AlertCircle, Info } from 'lucide-react';

/**
 * DarkModeExample Component
 * 
 * Demonstrates:
 * 1. Using the useTheme hook
 * 2. Applying dark: classes properly
 * 3. Responsive dark mode styling
 * 4. Interactive theme switching
 * 5. Various component patterns with dark mode
 */
export function DarkModeExample() {
  const { isDark, toggleTheme, theme } = useTheme();

  const examples = [
    {
      title: 'Card with Dark Mode',
      description: 'Standard white card that becomes gray in dark mode',
      className: 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6',
    },
    {
      title: 'Text Colors',
      description: 'Text automatically adjusts for contrast',
      className: 'text-gray-900 dark:text-white',
    },
    {
      title: 'Borders & Dividers',
      description: 'Subtle in light mode, visible in dark mode',
      className: 'border-b-2 border-gray-200 dark:border-gray-800',
    },
    {
      title: 'Background Fill',
      description: 'Filled backgrounds with proper contrast',
      className: 'bg-blue-50 dark:bg-blue-950 text-blue-900 dark:text-blue-100',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
          Dark Mode Example Component
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Click the toggle button to see dark mode in action. Your preference is saved in localStorage.
        </p>
      </div>

      {/* Theme Status Card */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-6 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isDark ? (
              <Moon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            ) : (
              <Sun className="w-8 h-8 text-yellow-500" />
            )}
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Current Theme</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white capitalize">
                {theme} Mode
              </p>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors duration-200 flex items-center gap-2"
          >
            {isDark ? <>
              <Sun className="w-5 h-5" />
              Switch to Light
            </> : <>
              <Moon className="w-5 h-5" />
              Switch to Dark
            </>}
          </button>
        </div>
      </div>

      {/* Examples Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {examples.map((example, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6 space-y-4 hover:shadow-lg dark:hover:shadow-none transition-shadow duration-200"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {example.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {example.description}
            </p>
            <div
              className={`p-4 rounded-md border border-gray-200 dark:border-gray-700 flex items-center justify-center min-h-24 ${example.className}`}
            >
              <span className="text-center font-mono text-xs">
                {example.className}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Color Palette Showcase */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Color Palette</h2>

        {/* Text Colors */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Text Colors</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg">
              <p className="text-gray-900 dark:text-white font-semibold">Primary Text</p>
              <code className="text-xs text-gray-500 dark:text-gray-500">
                text-gray-900 dark:text-white
              </code>
            </div>
            <div className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg">
              <p className="text-gray-600 dark:text-gray-400 font-semibold">Secondary Text</p>
              <code className="text-xs text-gray-500 dark:text-gray-500">
                text-gray-600 dark:text-gray-400
              </code>
            </div>
          </div>
        </div>

        {/* Background Colors */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Background Colors</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">Subtle</p>
              <code className="text-xs text-gray-500 dark:text-gray-500">
                bg-gray-50 dark:bg-gray-800
              </code>
            </div>
            <div className="p-4 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg">
              <p className="text-xs text-gray-700 dark:text-gray-300 font-semibold">Medium</p>
              <code className="text-xs text-gray-600 dark:text-gray-400">
                bg-gray-100 dark:bg-gray-700
              </code>
            </div>
            <div className="p-4 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-lg">
              <p className="text-xs text-gray-900 dark:text-white font-semibold">Prominent</p>
              <code className="text-xs text-gray-600 dark:text-gray-400">
                bg-white dark:bg-gray-900
              </code>
            </div>
          </div>
        </div>

        {/* Status Colors */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Status Colors</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-3">
              <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-green-900 dark:text-green-100">Success</p>
                <code className="text-xs text-green-700 dark:text-green-300">
                  bg-green-50 dark:bg-green-950
                </code>
              </div>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">Info</p>
                <code className="text-xs text-blue-700 dark:text-blue-300">
                  bg-blue-50 dark:bg-blue-950
                </code>
              </div>
            </div>
            <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-900 dark:text-red-100">Error</p>
                <code className="text-xs text-red-700 dark:text-red-300">
                  bg-red-50 dark:bg-red-950
                </code>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Code Examples */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Code Examples</h2>

        {/* Example 1: Card */}
        <div className="bg-gray-900 dark:bg-gray-950 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <pre className="text-sm">{`<div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
  <h2 className="text-gray-900 dark:text-white font-semibold">Card Title</h2>
  <p className="text-gray-600 dark:text-gray-400">Card description</p>
</div>`}</pre>
        </div>

        {/* Example 2: Button */}
        <div className="bg-gray-900 dark:bg-gray-950 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <pre className="text-sm">{`<button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg transition-colors">
  Click me
</button>`}</pre>
        </div>

        {/* Example 3: Using hook */}
        <div className="bg-gray-900 dark:bg-gray-950 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <pre className="text-sm">{`import { useTheme } from '../hooks/useTheme';

export function MyComponent() {
  const { isDark, toggleTheme } = useTheme();
  
  return (
    <button onClick={toggleTheme}>
      {isDark ? '☀️ Light' : '🌙 Dark'}
    </button>
  );
}`}</pre>
        </div>
      </div>

      {/* Documentation Link */}
      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-6 text-center space-y-3">
        <p className="text-gray-700 dark:text-gray-300 font-medium">
          📚 For detailed documentation and troubleshooting, see
        </p>
        <code className="inline-block bg-white dark:bg-gray-900 px-3 py-1 rounded text-blue-600 dark:text-blue-400 text-sm">
          DARK_MODE_GUIDE.md
        </code>
      </div>
    </div>
  );
}
