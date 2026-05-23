import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL||"https://splitwise-backend-nmd4.onrender.com/api",
  headers: { "Content-Type": "application/json" },
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: async (credentials: object) => {
    const res = await API.post("/auth/login", credentials);
    if (res.data.token) {
      localStorage.setItem("token", res.data.token);
    localStorage.setItem("spenvaUser", JSON.stringify({ email: res.data.email }));
    }
    return res;
  },
  register: async (credentials: object) => {
    const res = await API.post("/auth/register", credentials);
    if (res.data.token) {
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("spenvaUser", JSON.stringify({ email: res.data.email }));
    }
    return res;
  },
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("spenvaUser");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("spenvaUser");
  },
  sendOtp: async (email: string) => {
    return await API.post("/auth/forgot-password/send-otp", { email });
  },
  verifyOtp: async (email: string, otp: string) => {
    return await API.post("/auth/forgot-password/verify-otp", { email, otp });
  },
  resetPassword: async (token: string, newPassword: string) => {
    return await API.post("/auth/forgot-password/reset", { token, newPassword });
  },
};


export const expenseAPI = {
  getAll: () => API.get("/expenses"),
  create: (expenseData: object) => API.post("/expenses", expenseData),
  calculate: (data: object) => API.post("/expenses/calculate", data), // âœ… new
};


export const friendAPI = {
  getAll: () => API.get("/friends"),
  getBalances: () => API.get("/friends/balances"),
};
export const groupAPI = {
  calculate: (data: object) => API.post("/groups/calculate", data),
};
export default API;
