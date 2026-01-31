import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios"

// Create axios instance with base configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
})

// Request interceptor to add JWT token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from localStorage (client-side only)
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token")
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      const status = error.response.status

      // Handle 401 Unauthorized - redirect to login
      if (status === 401) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("access_token")
          localStorage.removeItem("user")
          // Only redirect if not already on login page
          if (!window.location.pathname.includes("/login")) {
            window.location.href = "/login"
          }
        }
      }

      // Handle 403 Forbidden
      if (status === 403) {
        console.error("Access forbidden:", error.response.data)
      }

      // Handle 404 Not Found
      if (status === 404) {
        console.error("Resource not found:", error.config?.url)
      }

      // Handle 500 Server Error
      if (status >= 500) {
        console.error("Server error:", error.response.data)
      }
    } else if (error.request) {
      // Network error
      console.error("Network error:", error.message)
    }

    return Promise.reject(error)
  }
)

// API endpoint functions
export const api = {
  // Auth endpoints
  auth: {
    login: (email: string, password: string) =>
      apiClient.post("/auth/login", { email, password }),
    logout: () => apiClient.post("/auth/logout"),
    me: () => apiClient.get("/auth/me"),
    refreshToken: () => apiClient.post("/auth/refresh"),
  },

  // Users endpoints
  users: {
    list: (params?: Record<string, unknown>) => apiClient.get("/users", { params }),
    get: (id: string) => apiClient.get(`/users/${id}`),
    create: (data: Record<string, unknown>) => apiClient.post("/users", data),
    update: (id: string, data: Record<string, unknown>) => apiClient.put(`/users/${id}`, data),
    delete: (id: string) => apiClient.delete(`/users/${id}`),
  },

  // Studies endpoints
  studies: {
    list: (params?: Record<string, unknown>) => apiClient.get("/studies", { params }),
    get: (id: string) => apiClient.get(`/studies/${id}`),
    create: (data: Record<string, unknown>) => apiClient.post("/studies", data),
    update: (id: string, data: Record<string, unknown>) => apiClient.put(`/studies/${id}`, data),
    delete: (id: string) => apiClient.delete(`/studies/${id}`),
  },

  // Action Items endpoints
  actionItems: {
    list: (params?: Record<string, unknown>) => apiClient.get("/action-items", { params }),
    get: (id: string) => apiClient.get(`/action-items/${id}`),
    create: (data: Record<string, unknown>) => apiClient.post("/action-items", data),
    update: (id: string, data: Record<string, unknown>) => apiClient.put(`/action-items/${id}`, data),
    updateStatus: (id: string, status: string) =>
      apiClient.patch(`/action-items/${id}/status`, { status }),
    delete: (id: string) => apiClient.delete(`/action-items/${id}`),
    getStats: () => apiClient.get("/action-items/stats"),
  },

  // Dashboard endpoints
  dashboard: {
    getKpis: () => apiClient.get("/dashboard/kpis"),
    getBurndown: (days?: number) => apiClient.get("/dashboard/burndown", { params: { days } }),
    getPareto: (topN?: number) => apiClient.get("/dashboard/pareto", { params: { top_n: topN } }),
  },
}

export default apiClient
