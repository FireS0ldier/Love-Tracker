import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import { FiSun, FiMoon, FiChevronLeft } from 'react-icons/fi';

/**
 * Header component for the app
 */
const Header = ({ title, showBack = false }) => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Only show back button if not on home page and showBack is true
  const shouldShowBack = showBack && location.pathname !== '/';
  
  // Handle back button click
  const handleBack = () => {
    navigate(-1);
  };
  
  return (
    <header className="sticky top-0 z-10 py-3 px-4 
                       bg-white dark:bg-gray-900 
                       border-b border-gray-200 dark:border-gray-800
                       transition-colors duration-200">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center">
          {shouldShowBack && (
            <button
              onClick={handleBack}
              aria-label="Go back"
              className="mr-2 p-2 rounded-full
                         text-gray-700 dark:text-gray-300
                         hover:bg-gray-100 dark:hover:bg-gray-800
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <FiChevronLeft size={24} />
            </button>
          )}
          <h1 className="text-lg font-semibold 
                         text-gray-800 dark:text-white">
            {title}
          </h1>
        </div>
        <div>
          <button
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-2 rounded-full
                       text-gray-700 dark:text-gray-300
                       hover:bg-gray-100 dark:hover:bg-gray-800
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {theme === 'dark' ? <FiSun size={24} /> : <FiMoon size={24} />}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
