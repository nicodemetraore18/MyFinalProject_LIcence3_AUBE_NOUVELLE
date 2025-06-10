import { useEffect, useState } from "react";
import axios from "../utils/axios"; 

export default function Projets() {
  const [projets, setProjets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedProjetId, setSelectedProjetId] = useState(null); // Stocke l'ID du projet sélectionné
  const [formData, setFormData] = useState({
    nom: "",
    statut: "en_attente",
    responsable: "",
    date_debut: "",
    date_fin: "",
    description: "",
    financement: ""
  });

  // 🔹 Charger les projets et employés depuis le backend
  useEffect(() => {
    axios.get("/projets/")
      .then(response => setProjets(response.data))
      .catch(error => console.error("Erreur lors de la récupération des projets :", error));

    axios.get("/employes/")
      .then(response => setEmployees(response.data))
      .catch(error => console.error("Erreur lors de la récupération des employés :", error));
  }, []);

  // 🔹 Mettre à jour le formulaire lorsqu'un projet est sélectionné
  const handleSelect = (projet) => {
    setSelectedProjetId(projet.id);
    setFormData({
      nom: projet.nom,
      statut: projet.statut,
      responsable: projet.responsable ? projet.responsable : "",
      date_debut: projet.date_debut,
      date_fin: projet.date_fin,
      description: projet.description || "",
      financement: projet.financement || ""
    });
  };

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // On mappe "responsable" en clé responsable_id car le serializer attend cette clé
    const requestData = { ...formData, responsable_id: formData.responsable };

    try {
      if (selectedProjetId) {
        // 🔹 Mettre à jour un projet existant
        await axios.put(`/projets/${selectedProjetId}/`, requestData);
        setProjets(projets.map(p => p.id === selectedProjetId ? { ...p, ...requestData } : p));
      } else {
        // 🔹 Ajouter un nouveau projet
        const response = await axios.post("/projets/", requestData);
        setProjets([...projets, response.data]);
      }

      // 🔹 Réinitialiser le formulaire
      setFormData({
        nom: "",
        statut: "en_attente",
        responsable: "",
        date_debut: "",
        date_fin: "",
        description: "",
        financement: ""
      });
      setSelectedProjetId(null);
    } catch (error) {
      console.error("Erreur lors de l'ajout ou mise à jour du projet :", error.response?.data || error);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Projets</h1>

      <form onSubmit={handleSubmit} className="mb-6 bg-white p-6 rounded-2xl shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            name="nom"
            placeholder="Nom du projet"
            value={formData.nom}
            onChange={handleChange}
            required
            className="border rounded px-4 py-2 w-full"
          />
          <select
            name="statut"
            value={formData.statut}
            onChange={handleChange}
            className="border rounded px-4 py-2 w-full"
          >
            <option value="en_attente">En attente</option>
            <option value="en_cours">En cours</option>
            <option value="termine">Terminé</option>
          </select>
          <select
            name="responsable"
            value={formData.responsable}
            onChange={handleChange}
            required
            className="border rounded px-4 py-2 w-full"
          >
            <option value="">Sélectionner un responsable</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>
                {emp.nom} {emp.prenom}
              </option>
            ))}
          </select>
          <input
            type="date"
            name="date_debut"
            value={formData.date_debut}
            onChange={handleChange}
            required
            className="border rounded px-4 py-2 w-full"
          />
          <input
            type="date"
            name="date_fin"
            value={formData.date_fin}
            onChange={handleChange}
            required
            className="border rounded px-4 py-2 w-full"
          />
          <input
            type="text"
            name="description"
            placeholder="Description du projet"
            value={formData.description}
            onChange={handleChange}
            className="border rounded px-4 py-2 w-full"
          />
          <input
            type="text"
            name="financement"
            placeholder="Financement"
            value={formData.financement}
            onChange={handleChange}
            className="border rounded px-4 py-2 w-full"
          />
        </div>
        <button
          type="submit"
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded"
        >
          {selectedProjetId ? "Mettre à jour" : "Ajouter le projet"}
        </button>
      </form>

      {/* 🔹 Tableau des projets */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow rounded-2xl">
          <thead className="bg-gray-200 text-gray-600">
            <tr>
              <th className="py-3 px-6 text-left">Nom</th>
              <th className="py-3 px-6 text-left">Statut</th>
              <th className="py-3 px-6 text-left">Responsable</th>
              <th className="py-3 px-6 text-left">Date de début</th>
              <th className="py-3 px-6 text-left">Date de fin</th>
            </tr>
          </thead>
          <tbody>
            {projets.map(projet => (
              <tr
                key={projet.id}
                className="border-t hover:bg-gray-50 cursor-pointer"
                onClick={() => handleSelect(projet)}
              >
                <td className="py-3 px-6">{projet.nom}</td>
                <td className="py-3 px-6">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium 
                    ${projet.statut === 'termine' ? 'bg-green-100 text-green-700' :
                      projet.statut === 'en_cours' ? 'bg-blue-100 text-blue-700' :
                      'bg-yellow-100 text-yellow-700'}`}
                  >
                    {projet.statut}
                  </span>
                </td>
                <td className="py-3 px-6">{projet.responsable_nom || "Non défini"}</td>
                <td className="py-3 px-6">{projet.date_debut}</td>
                <td className="py-3 px-6">{projet.date_fin}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
