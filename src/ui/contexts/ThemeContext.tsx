import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { lightTheme, darkTheme } from '../styles/theme';

interface ThemeContextType {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeContextProvider');
  }
  return context;
};

interface ThemeContextProviderProps {
  children: React.ReactNode;
}

export const ThemeContextProvider: React.FC<ThemeContextProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    // 从localStorage读取主题设置，默认使用浅色主题
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('luckee_dao_theme');
      return (savedTheme as 'light' | 'dark') || 'light';
    }
    return 'light';
  });

  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('luckee_dao_theme', newTheme);
      // 更新document的class以支持CSS主题切换
      document.documentElement.className = newTheme === 'dark' ? 'dark-theme' : '';
    }
  };

  useEffect(() => {
    // 初始化时设置document class
    document.documentElement.className = theme === 'dark' ? 'dark-theme' : '';
  }, [theme]);

  const muiTheme = theme === 'dark' ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <ThemeProvider theme={muiTheme}>
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};
