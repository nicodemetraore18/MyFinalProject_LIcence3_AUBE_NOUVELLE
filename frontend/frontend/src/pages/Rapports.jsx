import { useEffect, useState } from "react";
import axios from "../utils/axios";
import * as XLSX from "xlsx";

const ELEMENTS = [
  { label: "Taxes", value: "taxes" },
  { label: "Sécurité Sociale", value: "securite_sociale" },
  { label: "Salaires", value: "salaires" },
  { label: "Vacation", value: "vacation" },
  { label: "Masse Salariale", value: "masse_salariale" },
  { label: "Banques", value: "banques" },
];
const SOUS_ELEMENTS = {
  taxes: [
    { label: "IUTS", value: "iuts_net" },
    { label: "FSP", value: "fsp" },
    { label: "Retenue Vacation", value: "retenue_vacation" },
  ],
  securite_sociale: [
    { label: "CNSS Patronale", value: "cnss_patronale" },
    { label: "CNSS Employé", value: "cnss_employe" },
    { label: "CARFO Patronale", value: "carfo_patronale" },
    { label: "CARFO Employé", value: "carfo_employe" },
  ],
  banques: [],
};

export default function Rapports() {
  const [periodes, setPeriodes] = useState([]);
  const [periodeId, setPeriodeId] = useState("");
  const [element, setElement] = useState("");
  const [sousElement, setSousElement] = useState("");
  const [resultats, setResultats] = useState([]);
  const [total, setTotal] = useState(0);
  const [banques, setBanques] = useState([]);
  const [banqueId, setBanqueId] = useState("");
  const [projets, setProjets] = useState([]);
  const [projetId, setProjetId] = useState("");

  // Charger les banques au montage
  useEffect(() => {
    if (element === "banques") {
      axios.get("/banques/").then((res) => setBanques(res.data));
    }
  }, [element]);

  useEffect(() => {
    axios.get("/periodes/").then((res) => setPeriodes(res.data));
    axios.get("/projets/").then((res) => setProjets(res.data));
  }, []);

  useEffect(() => {
    if (
      periodeId &&
      element &&
      (
        (!SOUS_ELEMENTS[element] || !SOUS_ELEMENTS[element].length || sousElement) &&
        (element !== "banques" || banqueId)
      )
    ) {
      let url = `/rapports/?periode=${periodeId}&element=${element}`;
      if (sousElement) url += `&sous_element=${sousElement}`;
      if (element === "banques" && banqueId) url += `&banque_id=${banqueId}`;
      if (projetId) url += `&projet_id=${projetId}`;
      axios.get(url).then((res) => {
        setResultats(res.data.lignes || []);
        setTotal(res.data.total || 0);
      });
    } else {
      setResultats([]);
      setTotal(0);
    }
  }, [periodeId, element, sousElement, banqueId, projetId]);

  // Export Excel pour tous les tableaux
  const exportExcel = () => {
    let headers = [];
    let dataRows = [];

    if (element === "banques" && banqueId) {
      headers = ["Employé", "Net à verser"];
      dataRows = resultats.map(ligne => [
        `${ligne.nom} ${ligne.prenom}`,
        ligne.montant
      ]);
      dataRows.push(["Total", total]);
    } else if (element === "banques") {
      headers = ["Banque", "Montant"];
      dataRows = resultats.map(ligne => [
        ligne.banque_nom,
        ligne.montant
      ]);
      dataRows.push(["Total", total]);
    } else {
      headers = ["Employé", "Montant"];
      dataRows = resultats.map(ligne => [
        `${ligne.nom} ${ligne.prenom}`,
        ligne.montant
      ]);
      dataRows.push(["Total", total]);
    }

    const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rapport");
    XLSX.writeFile(wb, "rapport.xlsx");
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Rapports</h1>
      <div className="flex gap-4 mb-6">
        <select
          value={periodeId}
          onChange={(e) => setPeriodeId(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">-- Sélectionner une période --</option>
          {periodes.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nom || p.label || `Période ${p.id}`}
            </option>
          ))}
        </select>
        <select
          value={projetId}
          onChange={e => setProjetId(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">-- Sélectionner un projet --</option>
          {projets.map((p) => (
            <option key={p.id} value={p.id}>{p.nom}</option>
          ))}
        </select>
        <select
          value={element}
          onChange={(e) => {
            setElement(e.target.value);
            setSousElement("");
            setBanqueId("");
          }}
          className="border p-2 rounded"
        >
          <option value="">-- Sélectionner un élément --</option>
          {ELEMENTS.map((el) => (
            <option key={el.value} value={el.value}>
              {el.label}
            </option>
          ))}
        </select>
        {SOUS_ELEMENTS[element] && SOUS_ELEMENTS[element].length > 0 && (
          <select
            value={sousElement}
            onChange={e => setSousElement(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="">-- Sélectionner un sous-élément --</option>
            {SOUS_ELEMENTS[element].map(se => (
              <option key={se.value} value={se.value}>{se.label}</option>
            ))}
          </select>
        )}
        {element === "banques" && (
          <select
            value={banqueId}
            onChange={e => setBanqueId(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="">-- Sélectionner une banque --</option>
            {banques.map((b) => (
              <option key={b.id} value={b.id}>{b.nom}</option>
            ))}
          </select>
        )}
      </div>

      {resultats.length > 0 && (
        <div>
          <button
            className="mb-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            onClick={exportExcel}
          >
            Exporter en Excel
          </button>
          {element === "banques" && banqueId ? (
            <table className="min-w-full border mb-4">
              <thead>
                <tr>
                  <th className="border px-2 py-1">Employé</th>
                  <th className="border px-2 py-1">Net à verser</th>
                </tr>
              </thead>
              <tbody>
                {resultats.map((ligne) => (
                  <tr key={ligne.employe_id}>
                    <td className="border px-2 py-1">{ligne.nom} {ligne.prenom}</td>
                    <td className="border px-2 py-1">{ligne.montant.toLocaleString()} FCFA</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="border px-2 py-1 font-bold">Total</td>
                  <td className="border px-2 py-1 font-bold">{total.toLocaleString()} FCFA</td>
                </tr>
              </tfoot>
            </table>
          ) : element === "banques" ? (
            <table className="min-w-full border mb-4">
              <thead>
                <tr>
                  <th className="border px-2 py-1">Banque</th>
                  <th className="border px-2 py-1">Montant</th>
                </tr>
              </thead>
              <tbody>
                {resultats.map((ligne) => (
                  <tr key={ligne.banque_id}>
                    <td className="border px-2 py-1">{ligne.banque_nom}</td>
                    <td className="border px-2 py-1">{ligne.montant.toLocaleString()} FCFA</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="border px-2 py-1 font-bold">Total</td>
                  <td className="border px-2 py-1 font-bold">{total.toLocaleString()} FCFA</td>
                </tr>
              </tfoot>
            </table>
          ) : (
            <table className="min-w-full border mb-4">
              <thead>
                <tr>
                  <th className="border px-2 py-1">Employé</th>
                  <th className="border px-2 py-1">Montant</th>
                </tr>
              </thead>
              <tbody>
                {resultats.map((ligne) => (
                  <tr key={ligne.employe_id}>
                    <td className="border px-2 py-1">{ligne.nom} {ligne.prenom}</td>
                    <td className="border px-2 py-1">{ligne.montant.toLocaleString()} FCFA</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="border px-2 py-1 font-bold">Total</td>
                  <td className="border px-2 py-1 font-bold">{total.toLocaleString()} FCFA</td>
                </tr>
              </tfoot>
            </table>
          )}
          <div className="font-bold text-lg">
            Total : {total.toLocaleString()} FCFA
          </div>
        </div>
      )}

      {periodeId && element && resultats.length === 0 && (
        <div className="text-gray-500">Aucune donnée pour cette période et cet élément.</div>
      )}
    </div>
  );
}