// src/utils/axios.js
import axios from "axios";

const instance = axios.create({
  baseURL: "http://localhost:8000/api/", // Endpoint de votre API
});

// Intercepteur de requête pour ajouter le token à chaque requête
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur de réponse pour gérer le rafraîchissement
instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Si le token est invalide (code "token_not_valid"), tenter de le rafraîchir
    if (error.response?.status === 401 && error.response.data?.code === "token_not_valid") {
      const refreshToken = localStorage.getItem("refresh_token");
      if (refreshToken) {
        try {
          // Utilisation de l'instance pour bénéficier du baseURL
          const refreshResponse = await instance.post("token/refresh/", { refresh: refreshToken });
          localStorage.setItem("token", refreshResponse.data.access);
          error.config.headers.Authorization = `Bearer ${refreshResponse.data.access}`;
          // Réessayer la requête initiale avec le nouveau token
          return instance(error.config);
        } catch (refreshError) {
          console.error("Échec du rafraîchissement du token :", refreshError);
          localStorage.removeItem("token");
          localStorage.removeItem("refresh_token");
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default instance;
