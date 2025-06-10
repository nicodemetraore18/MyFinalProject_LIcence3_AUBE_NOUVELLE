import { createContext, useContext, useState, useEffect } from "react";
import axios from "../utils/axios";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  // Optionnel: à l'initialisation, si un token est présent, tenter de récupérer les infos utilisateur depuis l’API
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      axios
        .get("me/")
        .then((res) => {
          setUser(res.data);
          localStorage.setItem("user", JSON.stringify(res.data));
        })
        .catch((err) => {
          console.error("Erreur lors de la récupération de l'utilisateur :", err.response?.data || err);
        });
    }
  }, []);

  const login = (userData) => {
    // On s'attend ici à ce que userData contienne les infos utilisateur ainsi que les tokens (access et refresh)
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));

    // Si la réponse fournit des tokens, on les stocke
    // Ici, on adapte selon ce qui est renvoyé par votre endpoint de connexion
    if (userData.access && userData.refresh) {
      localStorage.setItem("token", userData.access);
      localStorage.setItem("refresh_token", userData.refresh);
    } else if (userData.token) {
      localStorage.setItem("token", userData.token);
      // Vous pouvez aussi vérifier si un refresh token est fourni, sinon ajuster la logique
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("refresh_token");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
