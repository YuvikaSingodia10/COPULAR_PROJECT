import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('hireblind_token'));
  const [role, setRole] = useState(localStorage.getItem('hireblind_role'));
  const [userName, setUserName] = useState(localStorage.getItem('hireblind_name'));
  const [workspaceCode, setWorkspaceCode] = useState(localStorage.getItem('hireblind_workspace'));
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('hireblind_token'));

  useEffect(() => {
    const storedToken = localStorage.getItem('hireblind_token');
    const storedRole = localStorage.getItem('hireblind_role');
    const storedName = localStorage.getItem('hireblind_name');
    const storedWorkspace = localStorage.getItem('hireblind_workspace');
    if (storedToken) {
      setToken(storedToken);
      setRole(storedRole);
      setUserName(storedName);
      setWorkspaceCode(storedWorkspace);
      setIsAuthenticated(true);
    }
  }, []);

  const login = (newToken, newRole, newName, newWorkspaceCode) => {
    localStorage.setItem('hireblind_token', newToken);
    localStorage.setItem('hireblind_role', newRole);
    localStorage.setItem('hireblind_name', newName);
    localStorage.setItem('hireblind_workspace', newWorkspaceCode || '');
    setToken(newToken);
    setRole(newRole);
    setUserName(newName);
    setWorkspaceCode(newWorkspaceCode || '');
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('hireblind_token');
    localStorage.removeItem('hireblind_role');
    localStorage.removeItem('hireblind_name');
    localStorage.removeItem('hireblind_workspace');
    setToken(null);
    setRole(null);
    setUserName(null);
    setWorkspaceCode(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ token, role, userName, workspaceCode, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
