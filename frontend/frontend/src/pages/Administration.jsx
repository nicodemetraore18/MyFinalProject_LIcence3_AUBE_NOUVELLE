import { useState, useEffect } from "react";
import axios from "../utils/axios";

export default function Administration() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [pages, setPages] = useState([]);
  const [message, setMessage] = useState("");
  const [users, setUsers] = useState([]);
  const [editId, setEditId] = useState(null); // Pour savoir si on édite

  const allPages = [
    { label: "Dashboard", value: "dashboard" },
    { label: "Employés", value: "employes" },
    { label: "Projets", value: "projets" },
    { label: "Postes", value: "postes" }, // <-- Ajoute ici si tu as une page "postes"
    { label: "Paiements", value: "paiements" },
    { label: "Banques", value: "banques" }, // <-- Ajoute ici si tu as une page "banques"
    { label: "Rapports", value: "rapports" },
    { label: "Paramètres", value: "parametres" },
    { label: "Administration", value: "administration" },
    { label: "Accueil", value: "accueil" },
    { label: "Compte", value: "compte" },
    { label: "Calculer Salaire", value: "calculer-salaire" },


    // Ajoute d'autres pages si besoin
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        // Modification
        await axios.put("/users/", {
          id: editId,
          username,
          password: password || undefined, // Ne change le mdp que si rempli
          role,
          pages,
        });
        setMessage("Utilisateur modifié !");
      } else {
        // Création
        await axios.post("/users/", {
          username,
          password,
          role,
          pages,
        });
        setMessage("Utilisateur créé avec succès !");
      }
      setUsername("");
      setPassword("");
      setRole("user");
      setPages([]);
      setEditId(null);
      fetchUsers();
    } catch (error) {
      setMessage("Erreur lors de la création/modification de l'utilisateur.");
    }
  };

  const handlePageChange = (value) => {
    setPages((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value]
    );
  };

  const fetchUsers = async () => {
    const res = await axios.get("/users/");
    setUsers(res.data);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Pré-remplir le formulaire pour modification
  const handleEdit = (u) => {
    setEditId(u.id);
    setUsername(u.username);
    setPassword(""); // On ne pré-remplit pas le mot de passe
    setRole(u.role);
    setPages(u.pages || []);
    setMessage("");
  };

  return (
    <div className="max-w-lg mx-auto bg-white p-8 rounded shadow">
      <h2 className="text-2xl font-bold mb-4">
        {editId ? "Modifier l'utilisateur" : "Créer un nouvel utilisateur"}
      </h2>
      {message && <div className="mb-4 text-blue-600">{message}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-semibold">Nom d'utilisateur</label>
          <input
            className="border p-2 rounded w-full"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={!!editId} // On ne modifie pas le username
          />
        </div>
        <div>
          <label className="block font-semibold">
            {editId ? "Nouveau mot de passe (laisser vide pour ne pas changer)" : "Mot de passe"}
          </label>
          <input
            type="password"
            className="border p-2 rounded w-full"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required={!editId}
          />
        </div>
        <div>
          <label className="block font-semibold">Rôle</label>
          <select
            className="border p-2 rounded w-full"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="user">Utilisateur</option>
            <option value="admin">Administrateur</option>
          </select>
        </div>
        <div>
          <label className="block font-semibold">Pages accessibles</label>
          <div className="flex flex-wrap gap-2">
            {allPages.map((page) => (
              <label key={page.value} className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={pages.includes(page.value)}
                  onChange={() => handlePageChange(page.value)}
                />
                {page.label}
              </label>
            ))}
          </div>
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {editId ? "Enregistrer les modifications" : "Créer l'utilisateur"}
        </button>
        {editId && (
          <button
            type="button"
            className="ml-2 px-4 py-2 rounded border"
            onClick={() => {
              setEditId(null);
              setUsername("");
              setPassword("");
              setRole("user");
              setPages([]);
              setMessage("");
            }}
          >
            Annuler
          </button>
        )}
      </form>
      <h3 className="text-xl font-bold mt-8 mb-2">Utilisateurs existants</h3>
      <table className="min-w-full border mb-4">
        <thead>
          <tr>
            <th className="border px-2 py-1">Nom d'utilisateur</th>
            <th className="border px-2 py-1">Rôle</th>
            <th className="border px-2 py-1">Pages</th>
            <th className="border px-2 py-1">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td className="border px-2 py-1">{u.username}</td>
              <td className="border px-2 py-1">{u.role}</td>
              <td className="border px-2 py-1">{(u.pages || []).join(", ")}</td>
              <td className="border px-2 py-1">
                <button
                  className="text-blue-600 mr-2"
                  onClick={() => handleEdit(u)}
                >
                  Modifier
                </button>
                <button
                  className="text-red-600"
                  onClick={async () => {
                    if (window.confirm("Supprimer cet utilisateur ?")) {
                      await axios.delete("/users/", { data: { id: u.id } });
                      fetchUsers();
                    }
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
  );
}