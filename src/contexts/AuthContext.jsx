import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in (e.g., from localStorage)
    const savedUser = localStorage.getItem('hris_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        localStorage.removeItem('hris_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    try {
      // For now, we'll use mock authentication
      // In a real app, this would make an API call to your backend
      const { username, password } = credentials;
      
      // Mock validation - in real app, this would be handled by backend
      if (username && password) {
        const userData = {
          id: 1,
          username: username,
          email: username.includes('@') ? username : `${username}@company.com`,
          role: 'employee', // Could be 'admin', 'hr', 'manager', etc.
          name: 'User Name', // Would come from backend
          loginTime: new Date().toISOString()
        };
        
        setUser(userData);
        localStorage.setItem('hris_user', JSON.stringify(userData));
        return { success: true };
      } else {
        return { success: false, error: 'Invalid credentials' };
      }
    } catch (error) {
      return { success: false, error: 'Login failed' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('hris_user');
  };

  const isAuthenticated = () => {
    return user !== null;
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};