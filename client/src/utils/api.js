import axios from "axios"

const api = axios.create({
  baseURL:
    process.env.NODE_ENV === "production"
      ? "https://guidenet.co/api"
      : "http://localhost:5000/",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
})

// Add a request interceptor to include the token in all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token")
    if (token) {
      config.headers["x-auth-token"] = token
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

export default api
