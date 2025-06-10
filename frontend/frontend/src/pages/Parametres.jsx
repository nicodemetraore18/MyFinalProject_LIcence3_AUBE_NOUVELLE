import { useEffect, useState } from "react";
import axios from "../utils/axios";

export default function Parametres() {
  // On définit un state pour un seul paramètre (singleton)
  const [parametre, setParametre] = useState(null);
  const [selectedParametreId, setSelectedParametreId] = useState(null);
  const [previewLogo, setPreviewLogo] = useState(null);
  const [formData, setFormData] = useState({
  nom_entreprise: "Nom de L'Entreprise",
  salaire_minimum: 30000,
  taux_fonds_soutien_patriotique: 1.5,
  taux_retenue_vacation: 5,
  point_indiciaire: 100,
  cnss_part_patronale: 16,
  cnss_part_employe: 5.5,
  carfo_part_patronale: 12,
  carfo_part_employe: 8,
  taux_horaire: 0, // Nouveau champ ajouté
  logo: null,
  footer: "", // ✅ Ajout du texte du footer
});

  // Chargement de l'unique instance de Paramètre depuis l'API
  useEffect(() => {
    axios
      .get("/parametres/")
      .then((response) => {
        // Selon la configuration de l'API, response.data peut être un tableau ou un objet
        let data = response.data;
        if (Array.isArray(data)) {
          if (data.length > 0) {
            data = data[0];
          }
        }
        if (data) {
          setParametre(data);
          setSelectedParametreId(data.id);
          setFormData({
    nom_entreprise: data.nom_entreprise || "Nom de L'Entreprise",
    salaire_minimum: data.salaire_minimum,
    taux_fonds_soutien_patriotique: data.taux_fonds_soutien_patriotique,
    taux_retenue_vacation: data.taux_retenue_vacation,
    point_indiciaire: data.point_indiciaire,
    cnss_part_patronale: data.cnss_part_patronale,
    cnss_part_employe: data.cnss_part_employe,
    carfo_part_patronale: data.carfo_part_patronale,
    carfo_part_employe: data.carfo_part_employe,
    taux_horaire: data.taux_horaire,
    logo: null,
    footer: data.footer || "", // ✅ Ajout du texte du footer
  });
        }
      })
      .catch((error) =>
        console.error("Erreur de récupération :", error)
      );
  }, []);

  // Gestion des champs textuels/numériques
  const handleChange = (e) => {
  const { name, value } = e.target;
  setFormData({ 
    ...formData, 
    [name]: value === "" ? "" : Number(value)
  });
};


  // Gestion de l'upload du logo
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFormData({ ...formData, logo: file });
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewLogo(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewLogo(null);
    }
  };

  const handleSelect = (param) => {
  setSelectedParametreId(param.id);
  setFormData({
  nom_entreprise: param.nom_entreprise || "Nom de L'Entreprise",
  salaire_minimum: param.salaire_minimum || 30000,
  taux_fonds_soutien_patriotique: param.taux_fonds_soutien_patriotique || 1.5,
  taux_retenue_vacation: param.taux_retenue_vacation || 5,
  point_indiciaire: param.point_indiciaire || 100,
  cnss_part_patronale: param.cnss_part_patronale || 16,
  cnss_part_employe: param.cnss_part_employe || 5.5,
  carfo_part_patronale: param.carfo_part_patronale || 12,
  carfo_part_employe: param.carfo_part_employe || 8,
  taux_horaire: param.taux_horaire || 0,
  logo: null,
});

};


  // Soumission du formulaire avec un objet FormData pour gérer le fichier
  const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const submissionData = new FormData();
    submissionData.append("nom_entreprise", formData.nom_entreprise);
    submissionData.append("salaire_minimum", formData.salaire_minimum);
    // Convertissez les pourcentages en décimaux en divisant par 100 et en formatant avec 2 décimales
    submissionData.append(
      "taux_fonds_soutien_patriotique",
      (Number(formData.taux_fonds_soutien_patriotique) / 100).toFixed(2)
    );
    submissionData.append(
      "taux_retenue_vacation",
      (Number(formData.taux_retenue_vacation) / 100).toFixed(2)
    );
    submissionData.append("point_indiciaire", formData.point_indiciaire);
    submissionData.append(
      "cnss_part_patronale",
      (Number(formData.cnss_part_patronale) / 100).toFixed(2)
    );
    submissionData.append(
      "cnss_part_employe",
      (Number(formData.cnss_part_employe) / 100).toFixed(2)
    );
    submissionData.append(
      "carfo_part_patronale",
      (Number(formData.carfo_part_patronale) / 100).toFixed(2)
    );
    submissionData.append(
      "carfo_part_employe",
      (Number(formData.carfo_part_employe) / 100).toFixed(2)
    );
    submissionData.append("footer", formData.footer);

    submissionData.append("taux_horaire", formData.taux_horaire); // Pas de conversion si ce taux est en valeur absolue
    if (formData.logo) {
      submissionData.append("logo", formData.logo);
    }
    // Envoi en PUT ou POST selon l'instance
    if (selectedParametreId) {
      const response = await axios.put(
        `/parametres/${selectedParametreId}/`,
        submissionData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setParametre(response.data);
    } else {
      const response = await axios.post("/parametres/", submissionData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setParametre(response.data);
      setSelectedParametreId(response.data.id);
    }
  } catch (error) {
    console.error(
      "Erreur lors de l'ajout ou mise à jour :",
      error.response?.data || error
    );
  }
};


  const handleDelete = async (id) => {
    try {
      await axios.delete(`/parametres/${id}/`);
      setParametre(null);
      setSelectedParametreId(null);
    } catch (error) {
      console.error("Erreur de suppression :", error);
    }
  };

  return (
    <div>
    <div className="max-w-xl mx-auto">
      {/* Section Paramètres Réglementaires */}
      <h1 className="text-3xl font-bold mb-4">Paramètres réglementaires</h1>

      <form onSubmit={handleSubmit} className="bg-white shadow rounded-xl p-6 space-y-4">
        <p className="text-gray-600 mb-4">Gérez les paramètres réglementaires :</p>
        
        {/* Champ pour le nom de l'entreprise */}
        <div>
          <label className="block text-gray-700 font-medium mb-1">
            Nom de l'entreprise
          </label>
          <input
            type="text"
            name="nom_entreprise"
            value={formData.nom_entreprise}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>

        {/* Champ pour le logo */}
        <div>
          <label className="block text-gray-700 font-medium mb-1">
            Logo de l'entreprise
          </label>
          <input
            type="file"
            name="logo"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full border rounded px-3 py-2"
          />
          {previewLogo && (
            <div className="mt-2">
              <img src={previewLogo} alt="Prévisualisation du logo" className="h-20"/>
            </div>
          )}
        </div>

        {/* Champs numériques existants */}
        {[
  "salaire_minimum",
  "taux_fonds_soutien_patriotique",
  "taux_retenue_vacation",
  "point_indiciaire",
  "cnss_part_patronale",
  "cnss_part_employe",
  "carfo_part_patronale",
  "carfo_part_employe",
  "taux_horaire",
].map((key) => (
  <div key={key}>
    <label className="block text-gray-700 font-medium mb-1">
      {key.replace(/_/g, " ").toUpperCase()}
    </label>
    <input
      type="number"
      name={key}
      value={formData[key] !== undefined ? formData[key] : ""}
      onChange={handleChange}
      className="w-full border rounded px-3 py-2"
      required
    />
  </div>
))}
<div>
  <label className="block text-gray-700 font-medium mb-1">
    Texte du footer
  </label>
  <textarea
    name="footer"
    value={formData.footer}
    onChange={handleChange}
    rows="4"
    className="w-full border rounded px-3 py-2"
  />
</div>


        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          {selectedParametreId ? "Mettre à jour" : "Enregistrer"}
        </button>
      </form>

       {/* Liste du paramètre (singleton converti en tableau) */}
      <h2 className="text-xl font-bold mt-6">Liste du paramètre</h2>
      <ul className="mt-4 bg-white shadow rounded-xl p-4 space-y-2">
        {(parametre ? [parametre] : []).map((param) => (
          <li
            key={param.id}
            className={`cursor-pointer text-gray-700 p-2 rounded ${
              selectedParametreId === param.id ? "bg-blue-100" : "hover:bg-gray-100"
            }`}
            onClick={() => handleSelect(param)}
          >
            <div className="flex justify-between items-center">
              <span>
                <strong>Salaire minimum :</strong> {param.salaire_minimum} FCFA
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(param.id);
                }}
                className="text-red-600 hover:text-red-800"
              >
                Supprimer
              </button>
            </div>
          </li>
        ))}
      </ul>
      </div>


      {/* Section Composants de Salaire */}

    </div>
  );
}
