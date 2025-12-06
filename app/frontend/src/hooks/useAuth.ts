import { useState, useEffect } from 'react';
import { authApi } from '../services/api';
import type { AuthStatus } from '../types';

export function useAuth() {
  const [authStatus, setAuthStatus] = useState<AuthStatus>({
    authenticated: false,
    locked: false,
  });
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const status = await authApi.getStatus();
      console.log('[useAuth] Auth status received:', status);
      setAuthStatus(status);
    } catch (error) {
      console.error('Error checking auth status:', error);
      setAuthStatus({ authenticated: false, locked: false });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (password: string) => {
    const result = await authApi.login(password);
    if (result.success) {
      setAuthStatus({ authenticated: true, locked: false });
    }
    return result;
  };

  const logout = async () => {
    await authApi.logout();
    setAuthStatus({ authenticated: false, locked: false });
  };

  return {
    ...authStatus,
    loading,
    login,
    logout,
    checkAuth,
  };
}
