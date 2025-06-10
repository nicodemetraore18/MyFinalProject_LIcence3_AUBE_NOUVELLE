import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";

export default function Employes() {
  const [employes, setEmployes] = useState([]);
  const [postes, setPostes] = useState([]);
  const [projets, setProjets] = useState([]);
  const [banks, setBanks] = useState([]); // Pour les banques
  const [selectedEmploye, setSelectedEmploye] = useState(null);
  const { register, handleSubmit, reset, watch } = useForm();

  // Surveille "statut_agent" pour déterminer le régime prévoyance sociale
  const statutAgent = watch("statut_agent") || "";
  const computedRegime =
    statutAgent === "Agent non FPH"
      ? "CNSS"
      : statutAgent === "Agent FPH"
      ? "CARFO"
      : "";

  useEffect(() => {
    axios.get("http://localhost:8000/api/employes/").then((res) => {
      setEmployes(res.data);
    });
    axios.get("http://localhost:8000/api/postes/").then((res) => {
      setPostes(res.data);
    });
    axios.get("http://localhost:8000/api/projets/").then((res) => {
      setProjets(res.data);
    });
    // Récupérer les banques
    axios.get("http://localhost:8000/api/banques/").then((res) => {
      setBanks(res.data);
    });
  }, []);

  // Réinitialisation du formulaire à la sélection d'un employé
  useEffect(() => {
    if (selectedEmploye) {
      reset({
        nom: selectedEmploye.nom,
        prenom: selectedEmploye.prenom,
        numero_identite: selectedEmploye.numero_identite || "", // nouveau champ
        poste_id: selectedEmploye.poste.id,
        projet_id: selectedEmploye.projet.id,
        statut_agent: selectedEmploye.detail?.statut_agent || "",
        numero_immatriculation: selectedEmploye.detail?.numero_immatriculation || "",
        nombre_charges_iuts:
          selectedEmploye.detail?.nombre_charges_iuts !== undefined
            ? String(selectedEmploye.detail.nombre_charges_iuts)
            : "",
        cadre:
          selectedEmploye.detail && selectedEmploye.detail.cadre
            ? String(selectedEmploye.detail.cadre)
            : "",
        indice:
          selectedEmploye.detail?.indice !== undefined
            ? String(selectedEmploye.detail.indice)
            : "",
        // Nouveaux champs dans DetailEmploye
        numero_compte: selectedEmploye.detail?.numero_compte || "",
        intitule_compte: selectedEmploye.detail?.intitule_compte || "",
        banque_id: selectedEmploye.detail?.banque?.id || ""
      });
    }
  }, [selectedEmploye, reset]);

  const onSubmit = (data) => {
    const payload = {
      nom: data.nom,
      prenom: data.prenom,
      numero_identite: data.numero_identite, // nouveau champ
      poste_id: data.poste_id,
      projet_id: data.projet_id,
      detail: {
        statut_agent: data.statut_agent,
        regime_prevoyance_sociale: computedRegime,
        numero_immatriculation: data.numero_immatriculation,
        nombre_charges_iuts: data.nombre_charges_iuts,
        cadre: data.cadre ? parseInt(data.cadre) : null,
        indice: data.indice,
        // Ajout des nouveaux champs
        numero_compte: data.numero_compte,
        intitule_compte: data.intitule_compte,
        banque: data.banque_id
      }
    };

    if (selectedEmploye) {
      axios
        .put(`http://localhost:8000/api/employes/${selectedEmploye.id}/`, payload)
        .then((res) => {
          setEmployes((prev) =>
            prev.map((emp) => (emp.id === res.data.id ? res.data : emp))
          );
          setSelectedEmploye(null);
          reset();
        })
        .catch((error) =>
          console.error("Erreur lors de la modification :", error)
        );
    } else {
      axios
        .post("http://localhost:8000/api/employes/", payload, {
          headers: { "Content-Type": "application/json" },
        })
        .then((res) => {
          setEmployes((prev) => [...prev, res.data]);
          reset();
        })
        .catch((error) => console.error("Erreur lors de l'ajout :", error));
    }
  };

  const handleEdit = (emp) => {
    setSelectedEmploye(emp);
  };

  const handleDelete = (id) => {
    axios
      .delete(`http://localhost:8000/api/employes/${id}/`)
      .then(() => {
        setEmployes((prev) => prev.filter((emp) => emp.id !== id));
      })
      .catch((error) => {
        console.error("Erreur lors de la suppression :", error);
      });
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-800">Employés</h1>

      {/* Formulaire d'ajout ou modification */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white p-6 shadow rounded-2xl space-y-4"
      >
        <h2 className="text-xl font-semibold">
          {selectedEmploye ? "Modifier un employé" : "Ajouter un employé"}
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <input
            {...register("nom")}
            placeholder="Nom"
            className="p-2 border rounded"
            required
          />
          <input
            {...register("prenom")}
            placeholder="Prénom"
            className="p-2 border rounded"
            required
          />
          <input
            {...register("numero_identite")}
            placeholder="N° d'identité"
            className="p-2 border rounded"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <select {...register("poste_id")} className="p-2 border rounded" required>
            <option value="">-- Choisir un poste --</option>
            {postes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nom}
              </option>
            ))}
          </select>
          <select {...register("projet_id")} className="p-2 border rounded" required>
            <option value="">-- Choisir un projet --</option>
            {projets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nom}
              </option>
            ))}
          </select>
        </div>

        {/* Section Détails Complémentaires */}
        <div>
          <h3 className="text-lg font-bold text-gray-700">Détails Complémentaires</h3>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <select
              {...register("statut_agent")}
              className="p-2 border rounded"
              required
            >
              <option value="">-- Choisir un statut agent --</option>
              <option value="Agent non FPH">Agent non FPH</option>
              <option value="Agent FPH">Agent FPH</option>
              <option value="Vacataire">Vacataire</option>
              <option value="Boursier">Boursier</option>
              <option value="Plateforme">Plateforme</option>
            </select>
            <input
              value={
                statutAgent === "Agent non FPH"
                  ? "CNSS"
                  : statutAgent === "Agent FPH"
                  ? "CARFO"
                  : ""
              }
              placeholder="Régime prévoyance sociale"
              disabled
              className="p-2 border rounded bg-gray-100"
            />
            <input
              {...register("numero_immatriculation")}
              placeholder="N° immatriculation cotisation"
              className="p-2 border rounded"
            />
            <input
              {...register("nombre_charges_iuts")}
              placeholder="Nombre de charges IUTS"
              type="number"
              className="p-2 border rounded"
            />
            <div className="flex flex-col">
              <label htmlFor="cadre" className="text-gray-700 mb-1">
                Catégorie d'agents (Cadre)
              </label>
              <select {...register("cadre")} id="cadre" className="p-2 border rounded" required>
                <option value="">-- Sélectionner la catégorie --</option>
                <option value="1">Cadre supérieur (1)</option>
                <option value="2">Cadre inférieur (2)</option>
              </select>
            </div>
            <input
              {...register("indice")}
              placeholder="Indice"
              type="number"
              step="0.01"
              className="p-2 border rounded"
            />

            {/* Nouveaux champs de coordonnées bancaires */}
            <input
              {...register("numero_compte")}
              placeholder="N° de compte bancaire"
              className="p-2 border rounded"
            />
            <input
              {...register("intitule_compte")}
              placeholder="Intitulé du compte"
              className="p-2 border rounded"
            />
            <select
              {...register("banque_id")}
              className="p-2 border rounded"
            >
              <option value="">-- Choisir une banque --</option>
              {banks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nom}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700">
          {selectedEmploye ? "Modifier" : "Ajouter"}
        </button>
      </form>

      {/* Table des employés */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow rounded-2xl">
          <thead className="bg-gray-200 text-gray-600">
            <tr>
              <th className="py-3 px-6 text-left">Nom</th>
              <th className="py-3 px-6 text-left">Prénom</th>
              <th className="py-3 px-6 text-left">Poste</th>
              <th className="py-3 px-6 text-left">Projet</th>
              <th className="py-3 px-6 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {employes.map((emp) => (
              <tr key={emp.id} className="border-t hover:bg-gray-50">
                <td className="py-3 px-6">{emp.nom}</td>
                <td className="py-3 px-6">{emp.prenom}</td>
                <td className="py-3 px-6">{emp.poste?.nom}</td>
                <td className="py-3 px-6">{emp.projet?.nom}</td>
                <td className="py-3 px-6">
                  <button className="text-blue-500 hover:underline" onClick={() => handleEdit(emp)}>
                    Modifier
                  </button>
                  <button className="text-red-500 hover:underline ml-4" onClick={() => handleDelete(emp.id)}>
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
