import axios from "axios";
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true
});
api.interceptors.request.use(config => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(res => res, async error => {
  const original = error.config;
  if (error.response?.status === 401 && original && !original._retry && !original.url?.includes("/auth/refresh") && !original.url?.includes("/auth/login") && !original.url?.includes("/auth/register")) {
    original._retry = true;
    try {
const { data } = await api.post("/auth/refresh");
git add frontend/src/api/axios.js      localStorage.setItem("accessToken", data.accessToken); original.headers.Authorization = `Bearer ${data.accessToken}`; return api(original);
    } catch { localStorage.removeItem("accessToken"); if (window.location.pathname !== "/login") window.location.href = "/login"; }
  }
  return Promise.reject(error);
});
export default api;