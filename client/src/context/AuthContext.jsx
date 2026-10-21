import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { apiRequest } from "../lib/api";
const AuthContext = createContext(null);
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const refreshUser = useCallback(async () => {
    try {
      const data = await apiRequest("/auth/me");
      setUser(data.user);
      return data.user;
    } catch (_) {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);
  const login = async (body) => {
    const data = await apiRequest("/auth/login", { method: "POST", body });
    setUser(data.user);
    return data.user;
  };
  const signup = async (body) => {
    const data = await apiRequest("/auth/signup", { method: "POST", body });
    setUser(data.user);
    return data;
  };
  const logout = async () => {
    await apiRequest("/auth/logout", { method: "POST" });
    setUser(null);
  };
  return (
    <AuthContext.Provider
      value={{ user, loading, login, signup, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};
export const useAuth = () => useContext(AuthContext);
