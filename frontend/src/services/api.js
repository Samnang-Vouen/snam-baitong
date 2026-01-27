import axios from "axios";

const API_BASE =
  typeof import.meta !== "undefined" && import.meta?.env?.VITE_API_BASE_URL
    ? import.meta.env.VITE_API_BASE_URL
    : "http://localhost:3000/api";

const client = axios.create({ baseURL: API_BASE });
export const httpClient = client;

client.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export const login = async (username, password) => {
  const res = await client.post("/auth/login", { username, password });
  return res.data;
};

// Plants / crops
export const getPlants = async ({ includeLatest = false } = {}) => {
  const res = await client.get("/plants", { params: { includeLatest } });
  return res.data;
};

export const getPlant = async (id, { includeSensors = true } = {}) => {
  const res = await client.get(`/plants/${id}`, { params: { includeSensors } });
  return res.data;
};

export const createPlant = async (data) => {
  const res = await client.post("/plants", data);
  return res.data;
};

export const updatePlant = async (id, data) => {
  const res = await client.put(`/plants/${id}`, data);
  return res.data;
};

export const deletePlant = async (id) => {
  const res = await client.delete(`/plants/${id}`);
  return res.data;
};

// Ministry user management
export const getMinistryUsers = async () => {
  const res = await client.get("/users");
  return res.data;
};

export const createMinistryUser = async ({
  username,
  password,
  role = "ministry",
}) => {
  const res = await client.post("/users", { username, password, role });
  return res.data;
};

export const updateMinistryUser = async (id, payload) => {
  const res = await client.put(`/users/${id}`, payload);
  return res.data;
};

export const deleteMinistryUser = async (id) => {
  const res = await client.delete(`/users/${id}`);
  return res.data;
};

// Sensors
export const getLatestSensors = async () => {
  const res = await client.get("/sensors/latest");
  return res.data;
};

export const getDashboardData = async () => {
  const res = await client.get("/dashboard");
  return res.data;
};

// Public QR scan endpoint (backend: GET /api/qr/scan/:token)
export const getPublicPlantByToken = async (token) => {
  const res = await client.get(`/qr/scan/${token}`);
  return res.data;
};
