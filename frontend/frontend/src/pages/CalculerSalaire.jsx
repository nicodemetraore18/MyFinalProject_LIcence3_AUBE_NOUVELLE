


// src/pages/CalculerSalaire.jsx

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../utils/axios";
import { useSalaryResult } from "../hooks/useSalaryResult";
import { calculateResidenceIndemnity } from "../utils/calculations";
import { useLocation } from "react-router-dom";


const indemnityFields = [
  "indemnite_residence",
  "indemnite_logement",
  "indemnite_astreinte",
  "indemnite_technicite",
  "indemnite_transport",
  "indemnite_responsabilite",
  "indemnite_specifique",
  "indemnite_reseau",
  "indemnite_risque",
  "indemnite_garde",
  "indemnite_autres",
];

const CalculerSalaire = () => {
  // États pour les données saisies
  const [employee, setEmployee] = useState({ detail: {} });
  // ...après la déclaration de employee...
const statutsSpeciaux = ["vacataire", "boursier", "plateforme"];
const isStatutSpecial = statutsSpeciaux.includes(
  (employee?.detail?.statut_agent || "").toLowerCase()
);

// Effet pour forcer les valeurs à 0 si statut spécial
useEffect(() => {
  if (isStatutSpecial) {
    setSoldeIndiciaire(0);
    setBaseData({ salaire_de_base: 0, vacation: baseData.vacation });
    setPrimeData({ sursalaire: 0, prime_anciennete: 0 });
    setIndemniteData((prev) =>
      Object.fromEntries(Object.keys(prev).map((k) => [k, 0]))
    );
  }
  // eslint-disable-next-line
}, [isStatutSpecial]);
  const [parametre, setParametre] = useState(null);
  const [baseData, setBaseData] = useState({ salaire_de_base: 0, vacation: 0 });
  const [primeData, setPrimeData] = useState({ sursalaire: 0, prime_anciennete: 0 });
  const [soldeIndiciaire, setSoldeIndiciaire] = useState(0);
 // ...après la déclaration de setHeureData...
const [heureData, setHeureData] = useState({
  nombre_heures: 0,
  taux: 0,
  montant: 0,
});

// Ajoute cet effet ici :
useEffect(() => {
  setHeureData((prev) => ({
    ...prev,
    montant:
      prev.nombre_heures && prev.taux
        ? Number((prev.nombre_heures * prev.taux).toFixed(2))
        : 0,
  }));
}, [heureData.nombre_heures, heureData.taux]);
// ...le reste du code...
  const [indemniteData, setIndemniteData] = useState(
    indemnityFields.reduce((acc, field) => {
      acc[field] = 0;
      return acc;
    }, {})
  );
  const [cotisationData, setCotisationData] = useState({
    cotisation_caisse_sociale: 0,
    cotisation_assurance: 0,
    cotisation_autre: 0,
  });
  const [remboursementData, setRemboursementData] = useState({
    avances_sur_solde: 0,
    remboursement_caisse_sociale: 0,
    remboursement_autres: 0,
  });
  
  // États de contrôle pour indemnités
  const [indemnityResidenceActive, setIndemnityResidenceActive] = useState(false);
  const [indemniteExonere, setIndemniteExonere] = useState(
    indemnityFields.reduce((acc, field) => {
      acc[field] = false;
      return acc;
    }, {})
  );
  
  // Références et routing
  const { periodeId, employeId } = useParams();
  const navigate = useNavigate();
  
  // Chargement de l'employé
  useEffect(() => {
    axios
      .get(`/employes/${employeId}/`)
      .then((response) => setEmployee(response.data))
      .catch((error) => console.error("Erreur chargement employé :", error));
  }, [employeId]);
  
  // Chargement des paramètres
  useEffect(() => {
    axios
      .get("/parametres/")
      .then((response) => {
        let data = response.data;
        if (Array.isArray(data) && data.length > 0) {
          data = data[0];
        }
        setParametre(data);
      })
      .catch((error) =>
        console.error("Erreur de récupération des paramètres :", error)
      );
  }, []);
  
  // Calcul du solde indiciaire et mise à jour de baseData et d'heureData
  useEffect(() => {
    if (employee && employee.detail && parametre) {
      const indice = parseFloat(employee.detail.indice);
      const pointIndiciaire = parseFloat(parametre.point_indiciaire);
      const computedSoldeIndiciaire = indice * pointIndiciaire;
      setSoldeIndiciaire(computedSoldeIndiciaire);
      setHeureData((prev) => ({ ...prev, taux: parametre.taux_horaire }));
      if (computedSoldeIndiciaire !== 0) {
        setBaseData((prev) => ({
          ...prev,
          salaire_de_base: computedSoldeIndiciaire,
        }));
      }
    }
  }, [employee, parametre]);
  
  // Utilisation du hook personnalisé pour obtenir l'objet de synthèse
  const { salaryResult } = useSalaryResult({
    employee,
    baseData,
    primeData,
    heureData,
    indemniteData,
    parametre,
    soldeIndiciaire,
    cotisationData,
    remboursementData,
  });
  
  // Fonctions de gestion des inputs
  const handleBaseChange = (e) => {
    const { name, value } = e.target;
    setBaseData({ ...baseData, [name]: parseFloat(value) || 0 });
  };
  
  const handlePrimeChange = (e) => {
    const { name, value } = e.target;
    setPrimeData({ ...primeData, [name]: parseFloat(value) || 0 });
  };
  
  const handleHeureChange = (e) => {
    const { name, value } = e.target;
    setHeureData({ ...heureData, [name]: parseFloat(value) || 0 });
  };
  
  const handleIndemniteChange = (e) => {
    const { name, value } = e.target;
    setIndemniteData({ ...indemniteData, [name]: parseFloat(value) || 0 });
  };
  
  const handleCotisationChange = (e) => {
    const { name, value } = e.target;
    setCotisationData({ ...cotisationData, [name]: parseFloat(value) || 0 });
  };
  
  const handleRemboursementChange = (e) => {
    const { name, value } = e.target;
    setRemboursementData({ ...remboursementData, [name]: parseFloat(value) || 0 });
  };
  
  // Définition de handleExonereToggle pour éviter l'erreur
  const handleExonereToggle = (field) => {
    setIndemniteExonere((prev) => ({ ...prev, [field]: !prev[field] }));
  };
  
  // Gestion spécifique pour l'indemnité de résidence
  const handleResidenceToggle = () => {
    setIndemnityResidenceActive((prevStatus) => {
      const newStatus = !prevStatus;
      const calculatedValue = newStatus
        ? calculateResidenceIndemnity(
            employee.detail.statut_agent,
            employee.detail.indice,
            parametre.point_indiciaire
          )
        : 0;
      setIndemniteData((prevData) => ({
        ...prevData,
        indemnite_residence: calculatedValue,
      }));
      return newStatus;
    });
  };
  
  // Fonction de sauvegarde
  const handleSave = async () => {
  try {
    const calcResult = salaryResult; // calcResult contient taxes et securite_social déjà calculés
    const payload = {
      employe_id: employee?.id || null,
      session_de_paie_id: periodeId || null,
      mode_de_paiement: "VIREMENT",
      composant_base: {
        salaire_de_base: isNaN(baseData.salaire_de_base) ? 0 : baseData.salaire_de_base,
        vacation: isNaN(baseData.vacation) ? 0 : baseData.vacation,
      },
      primes: {
        sursalaire: isNaN(primeData.sursalaire) ? 0 : primeData.sursalaire,
        prime_anciennete: isNaN(primeData.prime_anciennete) ? 0 : primeData.prime_anciennete,
      },
      heure_supp: {
        nombre_heures: isNaN(heureData.nombre_heures) ? 0 : heureData.nombre_heures,
        taux: isNaN(heureData.taux) ? 0 : heureData.taux,
        montant: isNaN(heureData.montant) ? 0 : Number(heureData.montant.toFixed(2)),
      },
      indemnites: {
        values: Object.keys(indemniteData).reduce((acc, key) => {
          acc[key] = isNaN(indemniteData[key]) ? 0 : indemniteData[key];
          return acc;
        }, {}),
      },
      cotisations: Object.keys(cotisationData).reduce((acc, key) => {
        acc[key] = isNaN(cotisationData[key]) ? 0 : cotisationData[key];
        return acc;
      }, {}),
      remboursements: Object.keys(remboursementData).reduce((acc, key) => {
        acc[key] = isNaN(remboursementData[key]) ? 0 : remboursementData[key];
        return acc;
      }, {}),
      synthese: calcResult,
    };

    console.log("Payload envoyé :", payload);
    await axios.post("/fiches-de-paie/save", payload);

    alert("Fiche de paie enregistrée ou mise à jour avec succès !");
  } catch (error) {
    console.error("❌ Erreur lors de la sauvegarde :", error);
    alert("Une erreur est survenue, veuillez réessayer.");
  }
};


  const location = useLocation();
  const periodeSelectionnee = location.state?.periodeSelectionnee || null;

 const handleDownload = (employeId, periodeId) => {
  window.open(`http://127.0.0.1:8000/api/payslip/${periodeId}/${employeId}/`, "_blank");
};




  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-4 text-center">
          {employee
            ? `Calculer Salaire pour ${employee.nom} ${employee.prenom} ` +
              `(Statut : ${employee.detail?.statut_agent || "Non défini"}) – Projet : ${employee.projet?.nom || "Non défini"}`
            : "Chargement de l'employé..."}
        </h1>

        { /* Section Base Salaire */ }
        <div className="mt-4">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Base Salaire</h2>
          <div className="space-y-3">
            <div className="flex items-center">
              <label className="w-48">Solde Indiciaire :</label>
              <input
              name="solde_indiciaire"
              type="text"
              value={isStatutSpecial ? 0 : isNaN(soldeIndiciaire) ? "" : soldeIndiciaire}
              readOnly
              className={`ml-3 border rounded p-1 w-32 focus:outline-none focus:ring-2 focus:ring-green-300 ${isStatutSpecial ? "bg-gray-200" : ""}`}
            />
            </div>
            <div className="flex items-center">
              <label className="w-48">Salaire de Base :</label>
                <input
                type="number"
                name="salaire_de_base"
                value={isStatutSpecial ? 0 : isNaN(baseData.salaire_de_base) ? "" : baseData.salaire_de_base}
                onChange={handleBaseChange}
                readOnly={isStatutSpecial}
                className={`ml-3 border rounded p-1 w-32 focus:outline-none focus:ring-2 focus:ring-green-300 ${isStatutSpecial ? "bg-gray-200" : ""}`}
              />
            </div>
            <div className="flex items-center">
              <label className="w-48">Vacation :</label>
              <input
                type="number"
                name="vacation"
                value={isNaN(baseData.vacation) ? "" : baseData.vacation}
                onChange={handleBaseChange}
                className="ml-3 border rounded p-1 w-32 focus:outline-none focus:ring-2 focus:ring-green-300"
              />
            </div>
          </div>
        </div>

        {/* Section Primes */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Primes</h2>
          <div className="space-y-3">
            <div className="flex items-center">
              <label className="w-48">Sursalaire :</label>
              <input
                type="number"
                name="sursalaire"
                value={isStatutSpecial ? 0 : isNaN(primeData.sursalaire) ? "" : primeData.sursalaire}
                onChange={handlePrimeChange}
                readOnly={isStatutSpecial}
                className={`ml-3 border rounded p-1 w-32 focus:outline-none focus:ring-2 focus:ring-green-300 ${isStatutSpecial ? "bg-gray-200" : ""}`}
              />
            </div>
            <div className="flex items-center">
              <label className="w-48">Prime d'ancienneté :</label>
             <input
              type="number"
              name="prime_anciennete"
              value={isStatutSpecial ? 0 : isNaN(primeData.prime_anciennete) ? "" : primeData.prime_anciennete}
              onChange={handlePrimeChange}
              readOnly={isStatutSpecial}
              className={`ml-3 border rounded p-1 w-32 focus:outline-none focus:ring-2 focus:ring-green-300 ${isStatutSpecial ? "bg-gray-200" : ""}`}
            />
            </div>
          </div>
        </div>

        {/* Section Heures Supplémentaires */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Heures Supplémentaires</h2>
          <div className="space-y-3">
            <div className="flex items-center">
              <label className="w-48">Nombre d'Heures :</label>
              <input
                type="number"
                name="nombre_heures"
                value={isNaN(heureData.nombre_heures) ? "" : heureData.nombre_heures}
                onChange={handleHeureChange}
                className="ml-3 border rounded p-1 w-20 focus:outline-none focus:ring-2 focus:ring-green-300"
              />
            </div>
            <div className="flex items-center">
              <label className="w-48">Taux :</label>
              <input
                type="text"
                name="taux"
                value={isNaN(heureData.taux) ? "" : heureData.taux}
                readOnly
                onChange={handleHeureChange}
                className="ml-3 border rounded p-1 w-20 focus:outline-none focus:ring-2 focus:ring-green-300"
              />
            </div>
            <div className="flex items-center">
              <label className="w-48">Montant (si défini):</label>
              <input
                type="number"
                name="montant"
                value={isNaN(heureData.montant) ? "" : heureData.montant}
                onChange={handleHeureChange}
                className="ml-3 border rounded p-1 w-32 focus:outline-none focus:ring-2 focus:ring-green-300"
              />
            </div>
            <div className="flex items-center">
              <label className="w-48">Montant calculé :</label>
              <input
                type="text"
                value={
                  heureData.nombre_heures && heureData.taux
                    ? (heureData.nombre_heures * heureData.taux).toFixed(2)
                    : "0.00"
                }
                readOnly
                className="ml-3 border rounded p-1 w-32 bg-gray-100"
              />
            </div>
          </div>
        </div>

        {/* Section Indemnités */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Indemnités</h2>
          <div className="space-y-3">
            {indemnityFields.map((field) => {
              const labels = {
                indemnite_residence: "Indemnité de résidence",
                indemnite_logement: "Indemnité logement",
                indemnite_astreinte: "Indemnité d'astreinte",
                indemnite_technicite: "Indemnité de technicité",
                indemnite_transport: "Indemnité de transport",
                indemnite_responsabilite: "Indemnité de responsabilité",
                indemnite_specifique: "Indemnité spécifique",
                indemnite_reseau: "Indemnité réseau",
                indemnite_risque: "Indemnité de risque",
                indemnite_garde: "Indemnité de garde",
                indemnite_autres: "Autres indemnités",
              };
  
              if (field === "indemnite_residence") {
                return (
                  <div key={field} className="flex items-center">
                    <label className="w-48">{labels[field]} :</label>
                    <input
                      type="number"
                      name={field}
                      value={isStatutSpecial ? 0 : isNaN(indemniteData[field]) ? "" : indemniteData[field]}
                      onChange={handleIndemniteChange}
                      readOnly={isStatutSpecial}
                      className={`ml-3 border rounded p-1 w-32 focus:outline-none focus:ring-2 focus:ring-green-300 ${isStatutSpecial ? "bg-gray-200" : ""}`}
                    />
                    <div className="flex items-center ml-4">
                      <input
                        type="checkbox"
                        checked={indemnityResidenceActive}
                        onChange={handleResidenceToggle}
                        className="h-5 w-5 text-blue-600"
                      />
                      <span className="ml-1 text-gray-700">Appliquer ?</span>
                    </div>
                    <div className="flex items-center ml-4">
                      <input
                        type="checkbox"
                        checked={indemniteExonere[field]}
                        onChange={() => handleExonereToggle(field)}
                        className="h-5 w-5 text-blue-600"
                      />
                      <span className="ml-1 text-gray-700">Exonéré ?</span>
                    </div>
                  </div>
                );
              }
  
              return (
                <div key={field} className="flex items-center">
                  <label className="w-48">{labels[field] || field} :</label>
                  <input
                    type="number"
                    name={field}
                    value={isStatutSpecial ? 0 : isNaN(indemniteData[field]) ? "" : indemniteData[field]}
                    onChange={handleIndemniteChange}
                    readOnly={isStatutSpecial}
                    className={`ml-3 border rounded p-1 w-32 focus:outline-none focus:ring-2 focus:ring-green-300 ${isStatutSpecial ? "bg-gray-200" : ""}`}
                  />
                  <div className="flex items-center ml-4">
                    <input
                      type="checkbox"
                      checked={indemniteExonere[field]}
                      onChange={() => handleExonereToggle(field)}
                      className="h-5 w-5 text-blue-600"
                    />
                    <span className="ml-1 text-gray-700">Exonéré ?</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section Cotisations */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Cotisations</h2>
          <div className="space-y-3">
            <div className="flex items-center">
              <label className="w-48">Cotisation Caisse Sociale :</label>
              <input
                type="number"
                name="cotisation_caisse_sociale"
                value={
                  isNaN(cotisationData.cotisation_caisse_sociale)
                    ? ""
                    : cotisationData.cotisation_caisse_sociale
                }
                onChange={handleCotisationChange}
                className="ml-3 border rounded p-1 w-32 focus:outline-none focus:ring-2 focus:ring-green-300"
              />
            </div>
            <div className="flex items-center">
              <label className="w-48">Cotisation Assurance :</label>
              <input
                type="number"
                name="cotisation_assurance"
                value={
                  isNaN(cotisationData.cotisation_assurance)
                    ? ""
                    : cotisationData.cotisation_assurance
                }
                onChange={handleCotisationChange}
                className="ml-3 border rounded p-1 w-32 focus:outline-none focus:ring-2 focus:ring-green-300"
              />
            </div>
            <div className="flex items-center">
              <label className="w-48">Autres Cotisations :</label>
              <input
                type="number"
                name="cotisation_autre"
                value={
                  isNaN(cotisationData.cotisation_autre)
                    ? ""
                    : cotisationData.cotisation_autre
                }
                onChange={handleCotisationChange}
                className="ml-3 border rounded p-1 w-32 focus:outline-none focus:ring-2 focus:ring-green-300"
              />
            </div>
          </div>
        </div>

        {/* Section Remboursements */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            Remboursements
          </h2>
          <div className="space-y-3">
            <div className="flex items-center">
              <label className="w-48">Avances sur Solde :</label>
              <input
                type="number"
                name="avances_sur_solde"
                value={
                  isNaN(remboursementData.avances_sur_solde)
                    ? ""
                    : remboursementData.avances_sur_solde
                }
                onChange={handleRemboursementChange}
                className="ml-3 border rounded p-1 w-32 focus:outline-none focus:ring-2 focus:ring-green-300"
              />
            </div>
            <div className="flex items-center">
              <label className="w-48">Remboursement Caisse Sociale :</label>
              <input
                type="number"
                name="remboursement_caisse_sociale"
                value={
                  isNaN(remboursementData.remboursement_caisse_sociale)
                    ? ""
                    : remboursementData.remboursement_caisse_sociale
                }
                onChange={handleRemboursementChange}
                className="ml-3 border rounded p-1 w-32 focus:outline-none focus:ring-2 focus:ring-green-300"
              />
            </div>
            <div className="flex items-center">
              <label className="w-48">Autres Remboursements :</label>
              <input
                type="number"
                name="remboursement_autres"
                value={
                  isNaN(remboursementData.remboursement_autres)
                    ? ""
                    : remboursementData.remboursement_autres
                }
                onChange={handleRemboursementChange}
                className="ml-3 border rounded p-1 w-32 focus:outline-none focus:ring-2 focus:ring-green-300"
              />
            </div>
          </div>
        </div>

        {/* Section Mode de paiement */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            Mode de paiement
          </h2>
          <div className="space-y-3">
            <div className="flex flex-col">
              <label htmlFor="mode-de-paiement" className="block text-gray-700 font-medium mt-4">
                Mode de paiement :
              </label>
              <select
                id="mode-de-paiement"
                value={"VIREMENT"}
                onChange={(e) => {}}
                className="w-full border rounded px-3 py-2 mb-4"
              >
                <option value="VIREMENT">Virement Bancaire</option>
                <option value="BILLETAGE">Paiement par chèque</option>
              </select>
            </div>
          </div>
        </div>

      {/* Affichage détaillé des résultats */}
      {salaryResult && (
        <div className="max-w-4xl mx-auto mt-8 p-4 border border-gray-200 rounded-lg bg-gray-100">
          <h3 className="text-2xl font-bold text-gray-800 mb-3 text-center">
            Résultats
          </h3>
          <div className="mb-4">
            <h4 className="font-semibold text-gray-700">Sécurité Sociale</h4>
            <p>CNSS Patronale: {isNaN(salaryResult.cnss_patronale) ? "0.00" : salaryResult.cnss_patronale.toFixed(2)} FCFA</p>
            <p>CNSS Employé: {isNaN(salaryResult.cnss_employe) ? "0.00" : salaryResult.cnss_employe.toFixed(2)} FCFA</p>
            <p>CARFO Patronale: {isNaN(salaryResult.carfo_patronale) ? "0.00" : salaryResult.carfo_patronale.toFixed(2)} FCFA</p>
            <p>CARFO Employé: {isNaN(salaryResult.carfo_employe) ? "0.00" : salaryResult.carfo_employe.toFixed(2)} FCFA</p>
          </div>
  
          <div className="mb-4">
            <h4 className="font-semibold text-gray-700">Taxes</h4>
            <p>IUTS Brut: {isNaN(salaryResult.iuts_brut) ? "0.00" : salaryResult.iuts_brut.toFixed(2)} FCFA</p>
            <p>IUTS Net: {isNaN(salaryResult.iuts_net) ? "0.00" : salaryResult.iuts_net.toFixed(2)} FCFA</p>
            <p>FSP: {isNaN(salaryResult.fsp) ? "0.00" : salaryResult.fsp.toFixed(2)} FCFA</p>
            <p>Retenue Vacation: {isNaN(salaryResult.retenue_vacation) ? "0.00" : salaryResult.retenue_vacation.toFixed(2)} FCFA</p>
          </div>
  
          <div className="mb-4">
            <h4 className="font-semibold text-gray-700">Synthèse</h4>
            <p>Salaire Base Fiscale: {isNaN(salaryResult.salaire_base_fiscale) ? "0.00" : salaryResult.salaire_base_fiscale.toFixed(2)} FCFA</p>
            <p>Total Indemnités: {isNaN(salaryResult.total_indemnites) ? "0.00" : salaryResult.total_indemnites.toFixed(2)} FCFA</p>
            <p>Salaire Brut: {isNaN(salaryResult.salaire_brut) ? "0.00" : salaryResult.salaire_brut.toFixed(2)} FCFA</p>
            <p>Salaire Brut Global: {isNaN(salaryResult.salaire_brut_global) ? "0.00" : salaryResult.salaire_brut_global.toFixed(2)} FCFA</p>
            <p>Salaire Brut Imposable: {isNaN(salaryResult.salaire_brut_imposable) ? "0.00" : salaryResult.salaire_brut_imposable.toFixed(2)} FCFA</p>
            <p>Total Exonération: {isNaN(salaryResult.total_exoneration) ? "0.00" : salaryResult.total_exoneration.toFixed(2)} FCFA</p>
            <p>Abattement Charges Pro: {isNaN(salaryResult.abattement_charges_pro) ? "0.00" : salaryResult.abattement_charges_pro.toFixed(2)} FCFA</p>
            <p>Salaire Net Imposable: {isNaN(salaryResult.salaire_net_imposable) ? "0.00" : salaryResult.salaire_net_imposable.toFixed(2)} FCFA</p>
            <p>Rémunération Nette: {isNaN(salaryResult.remuneration_nette) ? "0.00" : salaryResult.remuneration_nette.toFixed(2)} FCFA</p>
            <p>Total Retenues: {isNaN(salaryResult.total_retenues) ? "0.00" : salaryResult.total_retenues.toFixed(2)} FCFA</p>
            <p>Salaire Net à Payer: {isNaN(salaryResult.salaire_net_a_payer) ? "0.00" : salaryResult.salaire_net_a_payer.toFixed(2)} FCFA</p>
            <p>Vacation Net à Payer: {isNaN(salaryResult.vacation_net_a_payer) ? "0.00" : salaryResult.vacation_net_a_payer.toFixed(2)} FCFA</p>
            <p>Net à Payer: {isNaN(salaryResult.net_a_payer) ? "0.00" : salaryResult.net_a_payer.toFixed(2)} FCFA</p>
            <p>Masse Salariale Mensuelle: {isNaN(salaryResult.masse_salariale_mensuelle) ? "0.00" : salaryResult.masse_salariale_mensuelle.toFixed(2)} FCFA</p>
          </div>
        </div>
      )}

      
        <div className="mt-8 flex flex-col items-center space-y-4">
        <button
          onClick={handleSave}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded shadow"
        >
          Sauvegarder et Valider Paiement
        </button>
        <button
            onClick={() => navigate(-1)}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded shadow"
          >
            Retour
          </button>
          <button
            onClick={() => handleDownload(employeId, periodeSelectionnee || periodeId)}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded shadow"
          >
            Télécharger Bulletin de Paie
          </button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Pour toute question, veuillez contacter le support technique.
          </p>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            © 2023 Votre Entreprise. Tous droits réservés.
          </p>
         
      </div>

       </div>
    </div>
  );
};

export default CalculerSalaire;
