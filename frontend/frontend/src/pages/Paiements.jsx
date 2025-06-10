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
        const periodesActives = response.data.filter((p) => !p.cloture);
        setPeriodes(periodesActives);
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
  const payerEmploye = (employeId) => {
    navigate(`/calculer-salaire/${periodeSelectionnee}/${employeId}`);
  };

  // Clôture de la période
  const cloturerPaiement = async () => {
    if (employesNonPayes.length > 0) {
      alert("Impossible de clôturer : certains employés n'ont pas encore été payés !");
      return;
    }

    try {
      await axios.put(`/paiements/periodes/${periodeSelectionnee}/cloturer/`);
      setPeriodes(periodes.filter((p) => p.id !== Number(periodeSelectionnee)));
      setPeriodeSelectionnee(null);
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
        >
          <option value="">--Choisissez une période--</option>
          {periodes.map((periode) => (
            <option
              key={periode.id}
              value={periode.id}
              className={periode.cloture ? "hidden" : ""}
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

      {periodeSelectionnee && (
        <>
         <h2 className="text-2xl font-semibold mb-4">Employés payés :</h2>
<ul>
  {employesPayes.map((employe) => {
  console.log("Employé payé :", employe); // pour inspecter la structure
  return (
    <li key={employe.id || employe.employe_id} className="flex justify-between items-center p-2 border-b">
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
     <button
  onClick={() => {
    const employeeId = employe.employe_id || employe.id;
    console.log("Redirection vers fiche de paie pour :", { periode: periodeSelectionnee, employeeId });
    window.open(`http://127.0.0.1:8000/api/payslip/${periodeSelectionnee}/${employeeId}/`, '_blank')
  }}
  className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900"
>
  Voir Fiche de Paie
</button>

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
