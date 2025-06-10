// src/hooks/useSalaryResult.js
import { useState, useEffect } from "react";
import {
  calculateExoneration,
  calculateExonerationResidence,
  calculateAbattementChargesPro,
  calculateSalaireNetImposable,
  calculateCnssPatronale,
  calculateCnssEmploye,
  calculateCarfoPatronale,
  calculateCarfoEmploye,
  calculateIUTSBrut,
  calculateIUTSNet,
  calculateRemunerationNette,
  calculateFSP,
  calculateTotalRetenues,
  calculateSalaireNetAPayer,
  calculateVacationNetAPayer,
  calculateNetAPayer,
  calculateMasseSalarialeMensuelle,
  calculateRetenueVacation
} from "../utils/calculations";

export const useSalaryResult = ({
  employee,
  baseData,
  primeData,
  heureData,
  indemniteData,
  parametre,
  soldeIndiciaire,
  cotisationData,
  remboursementData,
}) => {
  const [salaryResult, setSalaryResult] = useState(null);

  useEffect(() => {
    if (
      !employee?.detail ||
      !baseData ||
      !primeData ||
      !heureData ||
      !indemniteData ||
      !parametre
    ) {
      return;
    }

    // ---- Calcul de base ----
    const totalBase = Number(baseData.salaire_de_base) || 0;
    const totalPrime =
      (Number(primeData.sursalaire) || 0) +
      (Number(primeData.prime_anciennete) || 0);
    const montantHeures =
      Number(heureData.nombre_heures) * Number(heureData.taux) || 0;
    const salaire_base_fiscale_local =
      totalBase + totalPrime + montantHeures;
    const totalIndemnites = Object.keys(indemniteData).reduce(
      (acc, field) => acc + (Number(indemniteData[field]) || 0),
      0
    );
    const salaire_brut_local = salaire_base_fiscale_local + totalIndemnites;
    const salaire_brut_global_local =
      salaire_brut_local + (Number(baseData.vacation) || 0);

    // ---- Contributions sociales ----
   // ...existing code...
const cnss_patronale_local = calculateCnssPatronale(
  employee.detail.statut_agent,
  employee.detail.regime_prevoyance_sociale,
  employee.detail.cadre,
  salaire_brut_global_local,
  salaire_brut_local,
  parametre ? parametre.cnss_part_patronale : 0 // PAS de division par 100
);
const cnss_employe_local = calculateCnssEmploye(
  employee.detail.statut_agent,
  employee.detail.regime_prevoyance_sociale,
  employee.detail.cadre,
  salaire_brut_global_local,
  salaire_brut_local,
  parametre ? parametre.cnss_part_employe : 0 // PAS de division par 100
);
const carfo_patronale_local = calculateCarfoPatronale(
  employee.detail.statut_agent,
  employee.detail.regime_prevoyance_sociale,
  employee.detail.cadre,
  totalBase,
  soldeIndiciaire,
  parametre ? parametre.carfo_part_patronale : 0 // PAS de division par 100
);
const carfo_employe_local = calculateCarfoEmploye(
  employee.detail.statut_agent,
  employee.detail.regime_prevoyance_sociale,
  employee.detail.cadre,
  totalBase,
  soldeIndiciaire,
  parametre ? parametre.carfo_part_employe : 0 // PAS de division par 100
);
// ...existing code...
    // ---- Exonérations ----
    const localExoLogement = calculateExoneration(
      employee.detail.statut_agent,
      employee.detail.regime_prevoyance_sociale,
      indemniteData.indemnite_logement,
      salaire_brut_local,
      0.20,
      75000
    );
    const localExoAstreinte = calculateExoneration(
      employee.detail.statut_agent,
      employee.detail.regime_prevoyance_sociale,
      indemniteData.indemnite_astreinte,
      salaire_brut_local,
      0.05,
      50000
    );
    const localExoTechnicite = calculateExoneration(
      employee.detail.statut_agent,
      employee.detail.regime_prevoyance_sociale,
      indemniteData.indemnite_technicite,
      salaire_brut_local,
      0.05,
      50000
    );
    const localExoTransport = calculateExoneration(
      employee.detail.statut_agent,
      employee.detail.regime_prevoyance_sociale,
      indemniteData.indemnite_transport,
      salaire_brut_local,
      0.05,
      30000
    );
    const localExoResponsabilite = calculateExoneration(
      employee.detail.statut_agent,
      employee.detail.regime_prevoyance_sociale,
      indemniteData.indemnite_responsabilite,
      salaire_brut_local,
      0.05,
      50000
    );
    const localExoSpecifique = calculateExoneration(
      employee.detail.statut_agent,
      employee.detail.regime_prevoyance_sociale,
      indemniteData.indemnite_specifique,
      salaire_brut_local,
      0.05,
      50000
    );
    const localExoReseau = calculateExoneration(
      employee.detail.statut_agent,
      employee.detail.regime_prevoyance_sociale,
      indemniteData.indemnite_reseau,
      salaire_brut_local,
      0.05,
      50000
    );
    const localExoRisque = calculateExoneration(
      employee.detail.statut_agent,
      employee.detail.regime_prevoyance_sociale,
      indemniteData.indemnite_risque,
      salaire_brut_local,
      0.05,
      50000
    );
    const localExoGarde = calculateExoneration(
      employee.detail.statut_agent,
      employee.detail.regime_prevoyance_sociale,
      indemniteData.indemnite_garde,
      salaire_brut_local,
      0.05,
      50000
    );
    const localExoAutres = calculateExoneration(
      employee.detail.statut_agent,
      employee.detail.regime_prevoyance_sociale,
      indemniteData.indemnite_autres,
      salaire_brut_local,
      0.05,
      50000
    );
    const localExoResidence = calculateExonerationResidence(
      employee.detail.statut_agent,
      employee.detail.regime_prevoyance_sociale,
      employee.detail.cadre,
      indemniteData.indemnite_residence,
      salaire_brut_local,
      0.05,
      75000
    );
    const localTotalExoneration =
      (localExoLogement || 0) +
      (localExoAstreinte || 0) +
      (localExoTechnicite || 0) +
      (localExoTransport || 0) +
      (localExoResponsabilite || 0) +
      (localExoSpecifique || 0) +
      (localExoReseau || 0) +
      (localExoRisque || 0) +
      (localExoGarde || 0) +
      (localExoAutres || 0) +
      (localExoResidence || 0);

    // ---- Calculs complémentaires ----
    const calculatedAbattement = calculateAbattementChargesPro(
      employee.detail.statut_agent,
      employee.detail.regime_prevoyance_sociale,
      employee.detail.cadre,
      salaire_brut_global_local,
      salaire_base_fiscale_local
    );
    const salaire_net_imposable_local = calculateSalaireNetImposable(
      employee.detail.cadre,
      salaire_brut_local,
      localTotalExoneration,
      calculatedAbattement
    );
    const calculatedIutsBrut = calculateIUTSBrut(salaire_net_imposable_local);
    const calculatedIutsNet = calculateIUTSNet(
      calculatedIutsBrut,
      employee.detail.nombre_charges_iuts
    );
    const calculatedRetenue = calculateRetenueVacation(
      employee.detail.statut_agent,
      Number(baseData.vacation) || 0,
      parametre ? parametre.taux_retenue_vacation : 0
    );
    const remuneration_nette = calculateRemunerationNette(
      employee.detail.statut_agent,
      salaire_brut_local,
      cnss_employe_local,
      calculatedIutsNet
    );
    const calculatedFsp = calculateFSP(
      employee.detail.statut_agent,
      salaire_brut_local,
      cnss_employe_local,
      calculatedIutsNet,
      parametre ? parametre.taux_fonds_soutien_patriotique : 0
    );
    const totalCotisations = Object.values(cotisationData).reduce(
      (sum, value) => sum + (Number(value) || 0),
      0
    );
    const totalRemboursements = Object.values(remboursementData).reduce(
      (sum, value) => sum + (Number(value) || 0),
      0
    );
    const calculatedTotalRetenues = calculateTotalRetenues(
      employee.detail.statut_agent,
      employee.detail.regime_prevoyance_sociale,
      employee.detail.cadre,
      salaire_brut_local,
      cnss_employe_local,
      carfo_employe_local,
      calculatedIutsNet,
      calculatedFsp,
      totalCotisations,
      totalRemboursements
    );
    const calculatedSalaireNetAPayer = calculateSalaireNetAPayer(
      employee.detail.statut_agent,
      salaire_brut_local,
      calculatedTotalRetenues
    );
    const calculatedVacationNetAPayer = calculateVacationNetAPayer(
      employee.detail.statut_agent,
      Number(baseData.vacation) || 0,
      calculatedRetenue
    );
    const calculatedNetAPayer = calculateNetAPayer(
      calculatedSalaireNetAPayer,
      calculatedVacationNetAPayer
    );
    const calculatedMasseSalarialeMensuelle = calculateMasseSalarialeMensuelle(
      employee.detail.statut_agent,
      employee.detail.regime_prevoyance_sociale,
      salaire_brut_global_local,
      cnss_patronale_local,
      carfo_patronale_local,
      Number(baseData.vacation) || 0
    );

    // Calcul des résultats
  const resultData = {
    salaire_base_fiscale: salaire_base_fiscale_local,
    total_indemnites: totalIndemnites,
    salaire_brut: salaire_brut_local,
    salaire_brut_global: salaire_brut_global_local,
    cnss_patronale: cnss_patronale_local,
    cnss_employe: cnss_employe_local,
    carfo_patronale: carfo_patronale_local,
    carfo_employe: carfo_employe_local,
    salaire_brut_imposable: salaire_net_imposable_local,
    total_exoneration: localTotalExoneration,
    abattement_charges_pro: calculatedAbattement,
    salaire_net_imposable: salaire_net_imposable_local,
    iuts_brut: calculatedIutsBrut,
    iuts_net: calculatedIutsNet,
    retenue_vacation: calculatedRetenue,
    remuneration_nette,
    fsp: calculatedFsp,
    total_retenues: calculatedTotalRetenues,
    salaire_net_a_payer: calculatedSalaireNetAPayer,
    vacation_net_a_payer: calculatedVacationNetAPayer,
    net_a_payer: calculatedNetAPayer,
    masse_salariale_mensuelle: calculatedMasseSalarialeMensuelle,
  };

  // ✅ Vérifie si le nouvel état est différent avant de le mettre à jour
  setSalaryResult(prevResult => {
    return JSON.stringify(prevResult) !== JSON.stringify(resultData)
      ? resultData
      : prevResult;
  });

}, [
  employee,
  baseData,
  primeData,
  heureData,
  indemniteData,
  parametre,
  soldeIndiciaire,
  cotisationData,
  remboursementData,
]);

  return { salaryResult };
};
