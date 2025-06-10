import { useState, useEffect } from "react";
import axios from "../utils/axios"; // Assure-toi d’avoir un fichier axios.js avec le token
import { useAuth } from "../contexts/AuthContext";

export default function Compte() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({ username: "", email: "" });
  const [passwordData, setPasswordData] = useState({ old_password: "", new_password: "" });
  const [message, setMessage] = useState("");

 useEffect(() => {
  axios.get("me/")
    .then(res => {
      setFormData({
        username: res.data.username,
        email: res.data.email,
      });
    })
    .catch(err => console.error("Erreur de chargement du compte :", err));
}, []);



  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handlePasswordChange = e => setPasswordData({ ...passwordData, [e.target.name]: e.target.value });

  const handleUpdate = async e => {
    e.preventDefault();
    try {
      await axios.put("/me/", formData);
      setMessage("Informations mises à jour avec succès !");
    } catch {
      setMessage("Échec de la mise à jour.");
    }
  };

  const handleChangePassword = async (e) => {
  e.preventDefault();
  try {
    const response = await axios.post(
      "/api/change-password/", // Corriger ici si nécessaire
      {
        old_password: passwordData.old_password,
        new_password: passwordData.new_password,
      },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );
    setMessage("Mot de passe modifié avec succès !");
    setPasswordData({ old_password: "", new_password: "" });
  } catch (error) {
    if (error.response) {
      setMessage(`Erreur: ${error.response.data.detail || error.response.data}`);
    } else {
      setMessage("Erreur lors du changement de mot de passe.");
    }
  }
};



  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Compte utilisateur</h1>

      {message && <div className="text-center p-3 rounded bg-blue-100 text-blue-700">{message}</div>}

      {/* Formulaire infos */}
      <form onSubmit={handleUpdate} className="bg-white p-6 rounded-xl shadow space-y-4">
        <div>
          <label className="block text-sm text-gray-600">Nom d'utilisateur</label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700" type="submit">
          Mettre à jour
        </button>
      </form>

      {/* Formulaire mot de passe */}
      <form onSubmit={handleChangePassword} className="bg-white p-6 rounded-xl shadow space-y-4">
        <h2 className="text-lg font-semibold">Changer le mot de passe</h2>
        <div>
          <label className="block text-sm text-gray-600">Ancien mot de passe</label>
          <input
            type="password"
            name="old_password"
            value={passwordData.old_password}
            onChange={handlePasswordChange}
            className="w-full border p-2 rounded"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600">Nouveau mot de passe</label>
          <input
            type="password"
            name="new_password"
            value={passwordData.new_password}
            onChange={handlePasswordChange}
            className="w-full border p-2 rounded"
          />
        </div>
        <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700" type="submit">
          Changer le mot de passe
        </button>
      </form>
    </div>
  );
}
