import { useNavigate } from "react-router-dom";
import axios from "../utils/axios";
import { useForm } from "react-hook-form";
import { useAuth } from "../contexts/AuthContext";
import { motion } from "framer-motion";
import { useState } from "react";
import { FaUser, FaLock } from "react-icons/fa";

// Fonction utilitaire pour décoder un JWT
function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Erreur lors du décodage du JWT :", error);
    return null;
  }
}

export default function Login() {
  const { register, handleSubmit } = useForm();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:8000/api/token/", data);

      localStorage.setItem("token", res.data.access);
      localStorage.setItem("refresh_token", res.data.refresh);

      // Utilisation de notre propre fonction pour décoder le token JWT
      const decoded = parseJwt(res.data.access);
      if (decoded && decoded.username) {
        // login({ username: decoded.username });
      } else {
        throw new Error("Impossible de décoder le token ou username introuvable.");
      }
      
      const userRes = await axios.get("/me/");
      setUser(userRes.data);
      localStorage.setItem("user", JSON.stringify(userRes.data));

      navigate("/employes");
    } catch (err) {
      alert("Erreur de connexion : identifiants incorrects");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-100 to-blue-300">
      <motion.form
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm space-y-6"
      >
        <h2 className="text-3xl font-bold text-center text-gray-700">
          Connexion
        </h2>

        <div className="relative">
          <FaUser className="absolute left-3 top-3 text-gray-400" />
          <input
            {...register("username")}
            type="text"
            placeholder="Nom d'utilisateur"
            className="w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
        </div>

        <div className="relative">
          <FaLock className="absolute left-3 top-3 text-gray-400" />
          <input
            {...register("password")}
            type="password"
            placeholder="Mot de passe"
            className="w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200 ${loading && "opacity-50 cursor-not-allowed"}`}
        >
          {loading ? "Connexion en cours..." : "Se connecter"}
        </button>
      </motion.form>
    </div>
  );
}
