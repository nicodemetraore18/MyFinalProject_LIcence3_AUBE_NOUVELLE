import { useEffect, useState } from "react";
import axios from "../utils/axios";

export default function Postes() {
  const [postes, setPostes] = useState([]);
  const [projets, setProjets] = useState([]);
  const [selectedPoste, setSelectedPoste] = useState(null);
  const [formData, setFormData] = useState({ 
    nom: "",
    projet_id: ""
  });

  // Charger la liste des postes depuis le backend
  useEffect(() => {
    axios.get("/postes/")
      .then(response => setPostes(response.data))
      .catch(error => console.error("Erreur lors de la récupération des postes :", error));
  }, []);

  // Charger la liste des projets pour permettre la sélection
  useEffect(() => {
    axios.get("/projets/")
      .then(response => setProjets(response.data))
      .catch(error => console.error("Erreur lors de la récupération des projets :", error));
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.projet_id) {
      alert("Veuillez sélectionner un projet avant d'ajouter un poste.");
      return;
    }

    if (selectedPoste) {
      // Mise à jour : on effectue une requête PUT
      try {
        const response = await axios.put(`/postes/${selectedPoste.id}/`, formData);
        setPostes(prev => prev.map(p => p.id === selectedPoste.id ? response.data : p));
        setSelectedPoste(null);
        setFormData({ nom: "", projet_id: "" });
      } catch (error) {
        console.error("Erreur lors de la modification du poste :", error.response?.data || error);
      }
    } else {
      // Création d'un nouveau poste : on effectue une requête POST
      try {
        const response = await axios.post("/postes/", formData);
        setPostes(prev => [...prev, response.data]);
        setFormData({ nom: "", projet_id: "" });
      } catch (error) {
        console.error("Erreur lors de l'ajout du poste :", error.response?.data || error);
      }
    }
  };

  // Lorsqu'une ligne du tableau est sélectionnée, on remplit le formulaire pour modification
  const handleSelect = (poste) => {
    setSelectedPoste(poste);
    setFormData({
      nom: poste.nom,
      projet_id: poste.projet?.id || ""
    });
  };

  // Pour supprimer un poste
  const handleDelete = async (id) => {
    try {
      await axios.delete(`/postes/${id}/`);
      setPostes(prev => prev.filter(p => p.id !== id));
      // Si le poste supprimé est celui en édition, réinitialiser le formulaire
      if (selectedPoste && selectedPoste.id === id) {
        setSelectedPoste(null);
        setFormData({ nom: "", projet_id: "" });
      }
    } catch (error) {
      console.error("Erreur lors de la suppression du poste :", error.response?.data || error);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Postes</h1>
      
      {/* Formulaire d'ajout ou modification */}
      <form onSubmit={handleSubmit} className="mb-6 bg-white p-6 rounded-2xl shadow">
        <div className="grid grid-cols-1 gap-4">
          <input 
            type="text"
            name="nom"
            placeholder="Nom du poste"
            value={formData.nom}
            onChange={handleChange}
            required
            className="border rounded px-4 py-2 w-full"
          />
          <select 
            name="projet_id" 
            value={formData.projet_id} 
            onChange={handleChange}
            required 
            className="border rounded px-4 py-2 w-full"
          >
            <option value="">-- Choisir un projet --</option>
            {projets.map(projet => (
              <option key={projet.id} value={projet.id}>
                {projet.nom}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded"
        >
          {selectedPoste ? "Mettre à jour" : "Ajouter le poste"}
        </button>
      </form>

      {/* Tableau des postes */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow rounded-2xl">
          <thead className="bg-gray-200 text-gray-600">
            <tr>
              <th className="py-3 px-6 text-left">Nom du poste</th>
              <th className="py-3 px-6 text-left">Projet rattaché</th>
              <th className="py-3 px-6 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {postes.map(poste => (
              <tr 
                key={poste.id} 
                className="border-t hover:bg-gray-50 cursor-pointer" 
                onClick={() => handleSelect(poste)}
              >
                <td className="py-3 px-6">{poste.nom}</td>
                <td className="py-3 px-6">{poste.projet?.nom}</td>
                <td className="py-3 px-6">
                  <button 
                    className="text-red-500 hover:underline" 
                    onClick={(e) => {
                      e.stopPropagation(); // Empêche le déclenchement de la sélection lorsque l'on clique sur Supprimer
                      handleDelete(poste.id);
                    }}
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
