import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";
const AuthContext = createContext(null);
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); const [loading, setLoading] = useState(true);
  useEffect(() => {
    const load = async () => {
      try {
        if (localStorage.getItem("accessToken")) { const { data } = await api.get("/auth/me"); setUser(data); }
        else {
          try { const { data } = await api.post("/auth/refresh"); localStorage.setItem("accessToken", data.accessToken); const me = await api.get("/auth/me"); setUser(me.data); }
          catch { localStorage.removeItem("accessToken"); }
        }
      } catch { localStorage.removeItem("accessToken"); } finally { setLoading(false); }
    }; load();
  }, []);
  const login = async (email, password) => { const { data } = await api.post("/auth/login", { email, password }); localStorage.setItem("accessToken", data.accessToken); setUser(data.user); };
  const register = async (name, email, password) => { const { data } = await api.post("/auth/register", { name, email, password }); localStorage.setItem("accessToken", data.accessToken); setUser(data.user); };
  const logout = async () => { try { await api.post("/auth/logout"); } finally { localStorage.removeItem("accessToken"); setUser(null); } };
  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>;
};
export const useAuth = () => useContext(AuthContext);