import { useEffect, useState } from "react";
import axios from "../utils/axios";

export default function Dashboard() {
  const [stats, setStats] = useState({
    employees: 0,
    projects: 0,
    payments: 0,
    // Vous pouvez ajouter, par exemple, un compteur pour les fiches de paie si nécessaire :
    // fichesPaie: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Récupération des statistiques via les endpoints mis à jour
        const employeeRes = await axios.get("/employes/");
        const projectRes = await axios.get("/projets/");
        const paymentRes = await axios.get("/paiements/");
        // Optionnel : récupération du nombre de fiches de paie
        // const ficheRes = await axios.get("/fiches-de-paie/");

        setStats({
          employees: employeeRes.data.length,
          projects: projectRes.data.length,
          payments: paymentRes.data.length,
          // fichesPaie: ficheRes.data.length,
        });
      } catch (error) {
        console.error("Erreur lors de la récupération des statistiques :", error);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="p-8 bg-white shadow-lg rounded-lg mt-8">
      <h2 className="text-3xl font-semibold text-blue-700 mb-6">Tableau de bord</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        <div className="bg-blue-100 p-6 rounded-lg shadow-md text-blue-700">
          <h3 className="text-xl font-semibold">Employés</h3>
          <p className="text-lg">{stats.employees}</p>
        </div>
        <div className="bg-green-100 p-6 rounded-lg shadow-md text-green-700">
          <h3 className="text-xl font-semibold">Projets</h3>
          <p className="text-lg">{stats.projects}</p>
        </div>
        <div className="bg-yellow-100 p-6 rounded-lg shadow-md text-yellow-700">
          <h3 className="text-xl font-semibold">Paiements</h3>
          <p className="text-lg">{stats.payments}</p>
        </div>
        {/* Optionnel : ajouter d'autres statistiques, par exemple pour les fiches de paie */}
        {/* <div className="bg-purple-100 p-6 rounded-lg shadow-md text-purple-700">
          <h3 className="text-xl font-semibold">Fiches de paie</h3>
          <p className="text-lg">{stats.fichesPaie}</p>
        </div> */}
      </div>
    </div>
  );
}
