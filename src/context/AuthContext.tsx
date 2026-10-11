"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { ApiUser, ApiUserProfile } from '../types/api';
import { authApi, profilesApi } from '../lib/services/vikingApi';
import {
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
  getActiveProfileId,
  setActiveProfileId,
  clearTokens,
  ApiError,
} from '../lib/apiClient';

interface AuthContextType {
  user: ApiUser | null;
  activeProfile: ApiUserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authError: string | null;
  clearAuthError: () => void;
  loginWithGoogle: (idToken: string) => Promise<boolean>;
  logout: () => Promise<void>;
  switchProfile: (profileId: string) => void;
  reloadUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [activeProfile, setActiveProfileState] = useState<ApiUserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  const selectInitialProfile = useCallback(
    (profiles: ApiUserProfile[]): ApiUserProfile | null => {
      if (!profiles || profiles.length === 0) return null;
      const storedProfileId = getActiveProfileId();
      if (storedProfileId) {
        const found = profiles.find((p) => p.id === storedProfileId);
        if (found) return found;
      }
      const defaultProfile = profiles.find((p) => p.is_default);
      return defaultProfile || profiles[0];
    },
    []
  );

  const reloadUserProfile = useCallback(async () => {
    try {
      const response = await authApi.getMe();
      if (response.success && response.data) {
        const userData = response.data;
        setUser(userData);
        setIsAuthenticated(true);

        const current = selectInitialProfile(userData.profiles);
        setActiveProfileState(current);
        if (current) {
          setActiveProfileId(current.id);
        }
      }
    } catch {
      clearTokens();
      setUser(null);
      setActiveProfileState(null);
      setIsAuthenticated(false);
    }
  }, [selectInitialProfile]);

  useEffect(() => {
    const initAuth = async () => {
      const token = getAccessToken();
      const refresh = getRefreshToken();

      if (!token && !refresh) {
        setIsLoading(false);
        return;
      }

      await reloadUserProfile();
      setIsLoading(false);
    };

    initAuth();

    const handleSessionExpired = () => {
      setUser(null);
      setActiveProfileState(null);
      setIsAuthenticated(false);
      setAuthError('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('viking_logout', handleSessionExpired);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('viking_logout', handleSessionExpired);
      }
    };
  }, [reloadUserProfile]);

  const loginWithGoogle = async (idToken: string): Promise<boolean> => {
    setIsLoading(true);
    setAuthError(null);

    try {
      const response = await authApi.loginWithGoogle(idToken);
      if (response.success && response.data) {
        const { access_token, refresh_token, user: userData } = response.data;

        setAccessToken(access_token);
        setRefreshToken(refresh_token);
        setUser(userData);
        setIsAuthenticated(true);

        const selected = selectInitialProfile(userData.profiles);
        setActiveProfileState(selected);
        if (selected) {
          setActiveProfileId(selected.id);
        }

        return true;
      }
      return false;
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 403) {
          setAuthError(
            'Acceso denegado: Tu cuenta de Google no está en la lista blanca autorizada de este sistema privado. Contacta al administrador.'
          );
        } else {
          setAuthError(err.message || 'Error durante la autenticación con Google.');
        }
      } else {
        setAuthError('No se pudo conectar con el servidor de autenticación.');
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    const refresh = getRefreshToken();
    if (refresh) {
      try {
        await authApi.logout(refresh);
      } catch {
        // Silently continue if logout endpoint fails
      }
    }
    clearTokens();
    setUser(null);
    setActiveProfileState(null);
    setIsAuthenticated(false);
    setAuthError(null);
  };

  const switchProfile = (profileId: string) => {
    if (!user) return;
    const found = user.profiles.find((p) => p.id === profileId);
    if (found) {
      setActiveProfileState(found);
      setActiveProfileId(found.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        activeProfile,
        isAuthenticated,
        isLoading,
        authError,
        clearAuthError,
        loginWithGoogle,
        logout,
        switchProfile,
        reloadUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
