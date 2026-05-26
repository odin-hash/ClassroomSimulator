import React, { useEffect } from 'react';

export const ThemeToggle: React.FC = () => {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
  }, []);

  return null;
};
