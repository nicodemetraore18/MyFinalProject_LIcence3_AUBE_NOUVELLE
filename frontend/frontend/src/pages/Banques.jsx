import { useState, useEffect } from "react";
import axios from "../utils/axios";

export default function Banques() {
  const [banques, setBanques] = useState([]);
  const [nom, setNom] = useState("");
  const [selectedBanque, setSelectedBanque] = useState(null);

  useEffect(() => {
    axios.get("/banques/").then((res) => setBanques(res.data));
  }, []);

  const handleAddOrEdit = (e) => {
    e.preventDefault();
    if (selectedBanque) {
      // Modification
      axios.put(`/banques/${selectedBanque.id}/`, { nom }).then((res) => {
        setBanques((prev) =>
          prev.map((b) => (b.id === res.data.id ? res.data : b))
        );
        setNom("");
        setSelectedBanque(null);
      });
    } else {
      // Ajout
      axios.post("/banques/", { nom }).then((res) => {
        setBanques((prev) => [...prev, res.data]);
        setNom("");
      });
    }
  };

  const handleSelect = (banque) => {
    setSelectedBanque(banque);
    setNom(banque.nom);
  };

  const handleCancel = () => {
    setSelectedBanque(null);
    setNom("");
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Gestion des Banques</h1>
      <form onSubmit={handleAddOrEdit} className="mb-4 flex gap-2">
        <input
          type="text"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          placeholder="Nom de la banque"
          className="border p-2 rounded"
          required
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {selectedBanque ? "Modifier" : "Ajouter"}
        </button>
        {selectedBanque && (
          <button
            type="button"
            onClick={handleCancel}
            className="bg-gray-400 text-white px-4 py-2 rounded"
          >
            Annuler
          </button>
        )}
      </form>
      <ul>
        {banques.map((b) => (
          <li
            key={b.id}
            className={`mb-2 cursor-pointer p-2 rounded ${selectedBanque && selectedBanque.id === b.id ? "bg-blue-100" : ""}`}
            onClick={() => handleSelect(b)}
          >
            {b.nom}
          </li>
        ))}
      </ul>
    </div>
  );
}