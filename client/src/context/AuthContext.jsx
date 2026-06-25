import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  apiRequest,
  clearStoredToken,
  getStoredToken,
  storeToken
} from "../lib/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => getStoredToken());
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(getStoredToken()));

  const refreshUser = useCallback(async () => {
    const currentToken = getStoredToken();

    if (!currentToken) {
      setUser(null);
      setLoading(false);
      return null;
    }

    try {
      const data = await apiRequest("/auth/me", { token: currentToken });
      setUser(data.user);
      return data.user;
    } catch (error) {
      clearStoredToken();
      setToken(null);
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (credentials) => {
    const data = await apiRequest("/auth/login", {
      method: "POST",
      body: credentials,
      token: null
    });
    storeToken(data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const signup = async (payload) => {
    const data = await apiRequest("/auth/signup", {
      method: "POST",
      body: payload,
      token: null
    });

    if (data.token) {
      storeToken(data.token);
      setToken(data.token);
      setUser(data.user);
    }

    return data;
  };

  const logout = () => {
    clearStoredToken();
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      login,
      signup,
      logout,
      refreshUser
    }),
    [token, user, loading, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};
