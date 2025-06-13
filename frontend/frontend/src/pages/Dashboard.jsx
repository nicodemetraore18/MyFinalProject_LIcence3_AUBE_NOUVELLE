import { useEffect, useState } from "react";
import axios from "../utils/axios";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A020F0", "#FF6384"];

export default function Dashboard() {
  const [stats, setStats] = useState({
    employees: 0,
    projects: 0,
    payments: 0,
    fichesPaie: 0,
  });
  const [paiementsEvolution, setPaiementsEvolution] = useState([]);
  const [employesParProjet, setEmployesParProjet] = useState([]);
  const [derniersPaiements, setDerniersPaiements] = useState([]);
  const [periodesACloturer, setPeriodesACloturer] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const employeeRes = await axios.get("/employes/");
        const projectRes = await axios.get("/projets/");
        const paymentRes = await axios.get("/paiements/");
        const ficheRes = await axios.get("/fiches-de-paie/");
        const periodeRes = await axios.get("/periodes/");

        // Evolution des paiements par mois (exemple simplifié)
        const paiementsParMois = {};
        paymentRes.data.forEach(p => {
          const mois = p.periode?.mois || p.mois || "Non renseigné";
          const annee = p.periode?.annee || p.annee || "";
          const key = `${mois} ${annee}`.trim();
          paiementsParMois[key] = (paiementsParMois[key] || 0) + (parseFloat(p.montant) || 0);
        });
        const evolutionData = Object.entries(paiementsParMois).map(([periode, montant]) => ({
          periode,
          montant,
        }));

        // Répartition des employés par projet
        const projetCount = {};
        employeeRes.data.forEach(e => {
          const projet = e.projet?.nom || "Non affecté";
          projetCount[projet] = (projetCount[projet] || 0) + 1;
        });
        const repartitionData = Object.entries(projetCount).map(([projet, count]) => ({
          name: projet,
          value: count,
        }));

        // Derniers paiements (5 derniers)
        const derniers = paymentRes.data
          .sort((a, b) => new Date(b.date_paiement) - new Date(a.date_paiement))
          .slice(0, 5);

        // Périodes à clôturer
        const aCloturer = periodeRes.data.filter(p => !p.cloture);

        setStats({
          employees: employeeRes.data.length,
          projects: projectRes.data.length,
          payments: paymentRes.data.length,
          fichesPaie: ficheRes.data.length,
        });
        setPaiementsEvolution(evolutionData);
        setEmployesParProjet(repartitionData);
        setDerniersPaiements(derniers);
        setPeriodesACloturer(aCloturer);
      } catch (error) {
        console.error("Erreur lors de la récupération des statistiques :", error);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="p-8 bg-white shadow-lg rounded-lg mt-8">
      <h2 className="text-3xl font-semibold text-blue-700 mb-6">Tableau de bord</h2>
      <div className="dashboard">
        {/* KPI */}
        <div className="kpi-cards grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
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
          <div className="bg-purple-100 p-6 rounded-lg shadow-md text-purple-700">
            <h3 className="text-xl font-semibold">Fiches de paie</h3>
            <p className="text-lg">{stats.fichesPaie}</p>
          </div>
        </div>

        {/* Graphiques */}
        <div className="charts grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Evolution des paiements */}
          <div className="bg-gray-50 p-4 rounded-lg shadow">
            <h4 className="font-semibold mb-2">Évolution des paiements</h4>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={paiementsEvolution}>
                <XAxis dataKey="periode" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="montant" fill="#8884d8" name="Montant payé" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Répartition des employés par projet */}
          <div className="bg-gray-50 p-4 rounded-lg shadow">
            <h4 className="font-semibold mb-2">Répartition des employés par projet</h4>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={employesParProjet}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {employesParProjet.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Listes dynamiques */}
        <div className="lists grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Derniers paiements */}
          <div className="bg-gray-50 p-4 rounded-lg shadow">
            <h4 className="font-semibold mb-2">Derniers paiements</h4>
            <ul>
              {derniersPaiements.map((p, idx) => (
                <li key={p.id || idx} className="border-b py-1 flex justify-between">
                  <span>
                    {p.employe_prenom + " " + p.employe_nom}
                    {" - "}
                    {p.montant} FCFA
                    {" | "}
                    {p.periode?.mois || p.mois || "?"} {p.periode?.annee || p.annee || ""}
                  </span>
                  <span className="text-xs text-gray-500">{p.date_paiement}</span>
                </li>
              ))}
              {derniersPaiements.length === 0 && <li>Aucun paiement récent.</li>}
            </ul>
          </div>
          {/* Périodes à clôturer */}
          <div className="bg-gray-50 p-4 rounded-lg shadow">
            <h4 className="font-semibold mb-2">Périodes à clôturer</h4>
            <ul>
              {periodesACloturer.map((p) => (
                <li key={p.id} className="border-b py-1">
                  {p.mois} {p.annee}
                </li>
              ))}
              {periodesACloturer.length === 0 && <li>Toutes les périodes sont clôturées.</li>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
