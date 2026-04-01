import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for managing dark mode theme
 * Persists preference to localStorage and applies to document.documentElement
 * 
 * @returns {Object} { isDark, toggleTheme, theme }
 */
export const useTheme = () => {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Apply theme to DOM - stable function
  const applyTheme = useCallback((dark) => {
    try {
      const htmlElement = document.documentElement;
      if (dark) {
        htmlElement.classList.add('dark');
        htmlElement.style.colorScheme = 'dark';
      } else {
        htmlElement.classList.remove('dark');
        htmlElement.style.colorScheme = 'light';
      }
      htmlElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    } catch (error) {
      console.error('Error applying theme:', error);
    }
  }, []);

  // Initialize theme on mount
  useEffect(() => {
    try {
      // Check localStorage
      const savedTheme = localStorage.getItem('theme');
      
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      // Determine initial theme
      const shouldBeDark = savedTheme ? savedTheme === 'dark' : prefersDark;
      
      setIsDark(shouldBeDark);
      applyTheme(shouldBeDark);
      setMounted(true);
    } catch (error) {
      console.error('Error initializing theme:', error);
      setMounted(true);
    }
  }, [applyTheme]);

  // Toggle theme
  const toggleTheme = useCallback(() => {
    setIsDark((prevIsDark) => {
      const newIsDark = !prevIsDark;
      applyTheme(newIsDark);
      try {
        localStorage.setItem('theme', newIsDark ? 'dark' : 'light');
      } catch (error) {
        console.error('Error saving theme preference:', error);
      }
      return newIsDark;
    });
  }, [applyTheme]);

  // Force set theme
  const setTheme = useCallback((theme) => {
    const isDarkTheme = theme === 'dark';
    setIsDark(isDarkTheme);
    applyTheme(isDarkTheme);
    try {
      localStorage.setItem('theme', theme);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  }, [applyTheme]);

  return {
    isDark,
    toggleTheme,
    setTheme,
    theme: isDark ? 'dark' : 'light',
    mounted,
  };
};

// Optional: System preference listener
export const useSystemThemePreference = () => {
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e) => {
      // Optionally auto-switch when system preference changes
      // setIsDark(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
};
