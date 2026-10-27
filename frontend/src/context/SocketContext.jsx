import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";
import api from "../api/axios";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) { setSocket(null); return undefined; }
    const instance = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
      withCredentials: true,
      auth: { token: localStorage.getItem("accessToken") }
    });
    let refreshing = false;
    const renewSocketToken = async error => {
      if (error.message !== "Access token expired" || refreshing) return;
      refreshing = true;
      try {
        const { data } = await api.post("/auth/refresh");
        localStorage.setItem("accessToken", data.accessToken);
        instance.auth = { token: data.accessToken };
        instance.connect();
      } catch {
        localStorage.removeItem("accessToken");
        window.location.assign("/login");
      } finally {
        refreshing = false;
      }
    };
    instance.on("connect_error", renewSocketToken);
    setSocket(instance);
    return () => {
      instance.off("connect_error", renewSocketToken);
      instance.disconnect();
      setSocket(null);
    };
  }, [user]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
};
export const useSocket = () => useContext(SocketContext);