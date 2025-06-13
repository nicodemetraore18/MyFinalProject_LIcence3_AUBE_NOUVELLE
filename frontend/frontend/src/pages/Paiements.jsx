import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; 
import axios from "../utils/axios"; 

export default function Paiements() {
  const [periodes, setPeriodes] = useState([]);
  const [periodeSelectionnee, setPeriodeSelectionnee] = useState(null);
  const [employesPayes, setEmployesPayes] = useState([]);
  const [employesNonPayes, setEmployesNonPayes] = useState([]);
  const [nouvellePeriode, setNouvellePeriode] = useState("");
  

  const navigate = useNavigate();

  // Charger les périodes actives
  useEffect(() => {
    axios
      .get("/periodes/")
      .then((response) => {
        setPeriodes(response.data); // On garde toutes les périodes
      })
      .catch((error) =>
        console.error("Erreur lors de la récupération des périodes :", error)
      );
  }, []);

  // Lorsqu'une période est sélectionnée, on charge les paiements associés
  useEffect(() => {
    if (periodeSelectionnee) {
      console.log("Période sélectionnée pour rafraîchissement :", periodeSelectionnee);

      axios.get(`/paiements/${periodeSelectionnee}/payes`)
        .then((response) => {
          console.log("Employés payés récupérés :", response.data);
          setEmployesPayes(response.data);
        })
        .catch((error) => console.error("Erreur lors du chargement des paiements payés :", error));

      axios.get(`/paiements/${periodeSelectionnee}/nonpayes`)
        .then((response) => {
          console.log("Employés non payés récupérés :", response.data);
          setEmployesNonPayes(response.data);
        })
        .catch((error) => console.error("Erreur lors du chargement des paiements non payés :", error));
    }
  }, [periodeSelectionnee]);

  // Paiement d'un employé : redirige vers CalculerSalaire en transmettant l'ID de l'employé
  const payerEmploye = async (employeId) => {
  try {
    console.log("Paiement de l'employé ID :", employeId, "pour la période :", periodeSelectionnee);

    // Préparer le payload avec les valeurs par défaut
    const payload = {
      employe_id: employeId,
      session_de_paie_id: periodeSelectionnee,
      mode_de_paiement: "VIREMENT",

      // Champs liés aux paiements par chèque
      agence_caisse: "",
      numero_compte_caisse: "",
      numero_cheque: "",
      date_cheque: null,

      // Champs financiers initiaux à zéro
      salaire_base_fiscale: 0,
      total_indemnites: 0,
      salaire_brut: 0,
      salaire_brut_global: 0,
      salaire_brut_imposable: 0,
      total_exoneration: 0,
      abattement_charges_pro: 0,
      salaire_net_imposable: 0,
      remuneration_nette: 0,
      total_retenues: 0,
      salaire_net_a_payer: 0,
      vacation_net_a_payer: 0,
      net_a_payer: 0,
      masse_salariale_mensuelle: 0,

      // Informations supplémentaires (JSON vide)
      informations_sup: {},
    };

    // 🔥 Appel direct à `fiches-de-paie/save` pour créer ou modifier la fiche
    await axios.post("/fiches-de-paie/save", payload);

    console.log("Fiche de paie sauvegardée/modifiée avec succès !");
    navigate(`/calculer-salaire/${periodeSelectionnee}/${employeId}`);
  } catch (error) {
    console.error("❌ Erreur lors de la sauvegarde de la fiche de paie :", error);
    alert("Une erreur est survenue, veuillez réessayer.");
  }
};



  // Clôture de la période
  const cloturerPaiement = async () => {
    if (employesNonPayes.length > 0) {
      alert("Impossible de clôturer : certains employés n'ont pas encore été payés !");
      return;
    }

    try {
      await axios.put(`/paiements/periodes/${periodeSelectionnee}/cloturer/`);
      // Met à jour l'état cloture de la période sélectionnée
      setPeriodes(periodes.map(p =>
        p.id == periodeSelectionnee ? { ...p, cloture: true } : p
      ));
      // Ne retire plus la période de la liste
    } catch (error) {
      console.error("Erreur lors de la clôture :", error);
    }
  };

  // Ajouter une nouvelle période
  const ajouterPeriode = async () => {
    if (!nouvellePeriode) return;
    try {
      const response = await axios.post("/periodes/", {
        mois: nouvellePeriode,
        annee: new Date().getFullYear(),
        cloture: false,
      });
      setPeriodes([...periodes, response.data]);
      setNouvellePeriode("");
    } catch (error) {
      console.error("Erreur lors de l'ajout :", error);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Paiements</h1>

      <div>
        <label className="block text-gray-700 font-medium mb-2">
          Sélectionnez une période :
        </label>
        <select
          onChange={(e) => setPeriodeSelectionnee(e.target.value)}
          className="w-full border rounded px-3 py-2 mb-6"
          value={periodeSelectionnee || ""}
        >
          <option value="">--Choisissez une période--</option>
          {periodes.map((periode) => (
            <option
              key={periode.id}
              value={periode.id}
            >
              {periode.mois} {periode.annee}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 mb-2">
          Ajouter une nouvelle période :
        </label>
        <input
          type="month"
          value={nouvellePeriode}
          onChange={(e) => setNouvellePeriode(e.target.value)}
          className="border rounded px-3 py-2 w-full"
        />
      </div>

      <button
        onClick={ajouterPeriode}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 mb-4"
      >
        Ajouter une période
      </button>

      {/* Affichage du statut de la période sélectionnée */}
      {periodeSelectionnee && (
        <div className="mb-4">
          <span className={`px-3 py-1 rounded text-white ${periodes.find(p => p.id == periodeSelectionnee)?.cloture ? "bg-red-600" : "bg-green-600"}`}>
            {periodes.find(p => p.id == periodeSelectionnee)?.cloture ? "Période clôturée" : "Période non clôturée"}
          </span>
        </div>
      )}

      {periodeSelectionnee && (
        <>
         <h2 className="text-2xl font-semibold mb-4">Employés payés :</h2>
<ul>
  {employesPayes.map((employe) => {
    const employeeId = employe.employe_id || employe.id;
    return (
      <li key={employeeId} className="flex justify-between items-center p-2 border-b">
        <div>
          <span className="font-bold">
            {employe.employe_nom_complet || employe.nom}
          </span>{" - "}
          <span>
            {employe.employe_projet || employe.projet}
          </span>{" | Salaire net : "}
          <span className="text-green-600">
            {employe.salaire_net || employe.montant_net || employe.montant}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              window.open(`http://127.0.0.1:8000/api/payslip/${periodeSelectionnee}/${employeeId}/`, '_blank')
            }}
            className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900"
          >
            Voir bulletin
          </button>
          <button
            onClick={() => {
              navigate(`/calculer-salaire/${periodeSelectionnee}/${employeeId}`);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Modifier fiche de paie
          </button>
        </div>
      </li>
    );
  })}
</ul>
          <h2 className="text-2xl font-semibold mt-6 mb-4">
            Employés non payés :
          </h2>
          <ul>
            {employesNonPayes.map((paiement) => (
              <li key={paiement.id} className="flex justify-between items-center p-2 border-b">
                <span>
                  {paiement.employe_nom_complet} - {paiement.employe_projet}
                </span>
                <button
                  onClick={() => payerEmploye(paiement.employe_id)}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Payer
                </button>
              </li>
            ))}
          </ul>

          <button
            onClick={cloturerPaiement}
            className="mt-6 bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700"
          >
            Clôturer paiement
          </button>
          <button 
            onClick={() => {
              axios.get(`/paiements/${periodeSelectionnee}/payes`)
                .then((response) => setEmployesPayes(response.data));
              axios.get(`/paiements/${periodeSelectionnee}/nonpayes`)
                .then((response) => setEmployesNonPayes(response.data));
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded mt-4"
          >
            Rafraîchir les paiements
          </button>
        </>
      )}
    </div>
  );
}
