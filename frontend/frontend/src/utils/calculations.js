// src/utils/calculations.js

export function calculateResidenceIndemnity(statutAgent, indice, pointIndiciaire) {
  if (!statutAgent || statutAgent === "") return 0;
  const excludedStatuses = ["Agent non FPH", "Vacataire", "Boursier", "Plateforme"];
  if (excludedStatuses.includes(statutAgent)) return 0;
  if (!indice || indice === "") return 0;
  const soldeIndiciaire = parseFloat(indice) * parseFloat(pointIndiciaire);
  return Math.round(soldeIndiciaire * 0.10);
}

export function calculateExoneration(statutAgent, regime, baseIndemnite, salaireBrutImposable, percentage, limit) {
  if (!statutAgent || !regime || ["Vacataire", "Boursier", "Plateforme"].includes(statutAgent)) {
    return 0;
  }
  if (!baseIndemnite) return 0;
  const computed = salaireBrutImposable * percentage;
  let finalValue = 0;
  if (computed >= limit && baseIndemnite >= limit) {
    finalValue = limit;
  } else if (limit > baseIndemnite && computed >= baseIndemnite) {
    finalValue = baseIndemnite;
  } else if (baseIndemnite > computed && limit > computed) {
    finalValue = computed;
  } else {
    finalValue = 0;
  }
  return Math.round(finalValue);
}

export function calculateExonerationResidence(statutAgent, regime, cadre, baseIndemnite, salaireBrutImposable, percentage, limit) {
  if (!statutAgent || !regime || !cadre || ["Vacataire", "Boursier", "Plateforme"].includes(statutAgent)) {
    return 0;
  }
  if (!baseIndemnite) return 0;
  const computed = salaireBrutImposable * percentage;
  let finalValue = 0;
  if (computed >= limit && baseIndemnite >= limit) {
    finalValue = limit;
  } else if (limit > baseIndemnite && computed >= baseIndemnite) {
    finalValue = baseIndemnite;
  } else if (baseIndemnite > computed && limit > computed) {
    finalValue = computed;
  } else {
    finalValue = 0;
  }
  return Math.round(finalValue);
}

export function calculateCnssPatronale(
  statutAgent,
  regime,
  cadre,
  salaireBrutGlobal,
  salaireBrut,
  tauxCnssPatronale = 0.16, // valeur par défaut si non fourni
  plafondCnss = 800000
) {
  if (!statutAgent || !regime || !cadre || !salaireBrutGlobal) return 0;
  if (
    statutAgent === "Vacataire" ||
    statutAgent === "Boursier" ||
    statutAgent === "Plateforme" ||
    regime === "CARFO"
  ) {
    return 0;
  }
  return salaireBrut <= plafondCnss
    ? Math.round(salaireBrut * tauxCnssPatronale)
    : Math.round(plafondCnss * tauxCnssPatronale);
}

export function calculateCnssEmploye(
  statutAgent,
  regime,
  cadre,
  salaireBrutGlobal,
  salaireBrut,
  tauxCnssEmploye = 0.055,
  plafondCnss = 800000
) {
  if (!statutAgent || !regime || !cadre || !salaireBrutGlobal) return 0;
  if (
    statutAgent === "Vacataire" ||
    statutAgent === "Boursier" ||
    statutAgent === "Plateforme" ||
    regime === "CARFO"
  ) {
    return 0;
  }
  return salaireBrut <= plafondCnss
    ? Math.round(salaireBrut * tauxCnssEmploye)
    : Math.round(plafondCnss * tauxCnssEmploye);
}

export function calculateCarfoPatronale(
  statutAgent,
  regime,
  cadre,
  salaireBase,
  soldeIndiciaire,
  tauxCarfoPatronale = 0.12
) {
  if (!statutAgent || !regime || !cadre) return 0;
  if (
    statutAgent === "Vacataire" ||
    statutAgent === "Boursier" ||
    statutAgent === "Plateforme" ||
    regime === "CNSS"
  ) {
    return 0;
  }
  return statutAgent === "Agent non FPH"
    ? Math.round(salaireBase * tauxCarfoPatronale)
    : Math.round(soldeIndiciaire * tauxCarfoPatronale);
}

export function calculateCarfoEmploye(
  statutAgent,
  regime,
  cadre,
  salaireBase,
  soldeIndiciaire,
  tauxCarfoEmploye = 0.08
) {
  if (!statutAgent || !regime || !cadre) return 0;
  if (
    statutAgent === "Vacataire" ||
    statutAgent === "Boursier" ||
    statutAgent === "Plateforme" ||
    regime === "CNSS"
  ) {
    return 0;
  }
  return statutAgent === "Agent non FPH"
    ? Math.round(salaireBase * tauxCarfoEmploye)
    : Math.round(soldeIndiciaire * tauxCarfoEmploye);
}
/**
 * Calcule la retenue sur la vacation.
 *
 * @param {string} statutAgent - Statut de l'agent.
 * @param {number} vacation - Montant de la vacation.
 * @param {number} tauxRetenue - Taux applicable à la vacation.
 * @returns {number} - Retenue sur la vacation, arrondie, ou 0 si non applicable.
 */
export function calculateRetenueVacation(statutAgent, vacation, tauxRetenue) {
  if (!statutAgent || !vacation || ["Boursier", "Plateforme"].includes(statutAgent)) {
    return 0;
  }
  return Math.round(vacation * tauxRetenue);
}


export function calculateSalaireBrutImposable(
  statutAgent,
  regime,
  cadre,
  salaireBrutGlobal,
  salaireBaseFiscale,
  salaireBrut,
  cnssEmploye,
  carfoEmploye
) {
  if (!statutAgent || !regime || !cadre || !salaireBrutGlobal) return 0;
  if (["Vacataire", "Boursier", "Plateforme"].includes(statutAgent)) return 0;
  if (regime === "CNSS") {
    const seuilCNSS = 800000 * 0.055;
    const seuilCarfo = salaireBaseFiscale * 0.08;
    const seuilBrut = salaireBrut * 0.055;
    if (seuilCNSS < seuilCarfo && seuilCNSS < seuilBrut) {
      return Math.round(salaireBrut - seuilCNSS);
    } else if (seuilCarfo < seuilCNSS && seuilCarfo < seuilBrut) {
      return Math.round(salaireBrut - seuilCarfo);
    } else if (seuilBrut < seuilCarfo && seuilBrut < seuilCNSS) {
      return Math.round(salaireBrut - cnssEmploye);
    } else {
      return Math.round(salaireBrut - carfoEmploye);
    }
  }
  return Math.round(salaireBrut);
}

export function calculateAbattementChargesPro(
  statutAgent,
  regime,
  cadre,
  salaireBrutGlobal,
  salaireBaseFiscale
) {
  if (!statutAgent || !regime || !cadre || !salaireBrutGlobal) return 0;
  if (["Vacataire", "Boursier", "Plateforme"].includes(statutAgent)) return 0;
  let tauxAbattement = 0;
  if (cadre === 1) {
    tauxAbattement = 0.20;
  } else if (cadre === 2) {
    tauxAbattement = 0.25;
  } else {
    return 0;
  }
  return Math.round(salaireBaseFiscale * tauxAbattement);
}

export function calculateSalaireNetImposable(
  cadre,
  salaireBrutImposable,
  totalExoneration,
  abattementChargesPro
) {
  if (!cadre || !salaireBrutImposable) return 0;
  return Math.round(salaireBrutImposable - (totalExoneration + abattementChargesPro));
}

export function calculateIUTSBrut(salaireNetImposable) {
  if (!salaireNetImposable) return 0;
  let iuts = 0;
  if (salaireNetImposable > 250000) {
    iuts += (salaireNetImposable - 250000) * 0.25;
    salaireNetImposable = 250000;
  }
  if (salaireNetImposable > 170000) {
    iuts += (salaireNetImposable - 170000) * 0.217;
    salaireNetImposable = 170000;
  }
  if (salaireNetImposable > 120000) {
    iuts += (salaireNetImposable - 120000) * 0.184;
    salaireNetImposable = 120000;
  }
  if (salaireNetImposable > 80000) {
    iuts += (salaireNetImposable - 80000) * 0.157;
    salaireNetImposable = 80000;
  }
  if (salaireNetImposable > 50000) {
    iuts += (salaireNetImposable - 50000) * 0.139;
    salaireNetImposable = 50000;
  }
  if (salaireNetImposable > 30000) {
    iuts += (salaireNetImposable - 30000) * 0.121;
  }
  return Math.round(iuts);
}

export function calculateIUTSNet(iutsBrut, nombreCharges) {
  if (!iutsBrut || nombreCharges === undefined || nombreCharges < 0) return 0;
  const tauxReduction = {
    0: 1.00,
    1: 0.92,
    2: 0.90,
    3: 0.88,
    4: 0.86,
    5: 0.84,
    6: 0.82,
    7: 0.80,
  };
  const taux = tauxReduction[nombreCharges] || tauxReduction[7];
  return Math.round(iutsBrut * taux);
}

export function calculateRemunerationNette(statutAgent, salaireBrut, cnssEmploye, iutsNet) {
  if (!statutAgent || ["Boursier", "Plateforme", "Vacataire"].includes(statutAgent))
    return 0;
  if (["Agent FPH", "Agent non FPH"].includes(statutAgent)) {
    return Math.round(salaireBrut - (cnssEmploye + iutsNet));
  }
  return 0;
}

export function calculateFSP(statutAgent, salaireBrut, cnssEmploye, iutsNet, tauxFSP) {
  if (!statutAgent || ["Boursier", "Plateforme", "Vacataire"].includes(statutAgent))
    return 0;
  if (["Agent FPH", "Agent non FPH"].includes(statutAgent)) {
    return Math.round((salaireBrut - (cnssEmploye + iutsNet)) * tauxFSP);
  }
  return 0;
}

export function calculateTotalRetenues(
  statutAgent, 
  regime, 
  cadre, 
  salaireBrut, 
  cnssEmploye, 
  carfoEmploye, 
  iutsNet, 
  fsp, 
  cotisations, 
  remboursements
) {
  if (["Vacataire", "Boursier", "Plateforme"].includes(statutAgent)) {
    return Math.round(cotisations + remboursements);
  }
  if (!statutAgent || !regime || !cadre || !salaireBrut) return 0;
  if (regime === "CNSS") {
    return Math.round(cnssEmploye + iutsNet + cotisations + remboursements + fsp);
  } else if (regime === "CARFO") {
    return Math.round(carfoEmploye + iutsNet + cotisations + remboursements + fsp);
  }
  return 0;
}

export function calculateSalaireNetAPayer(statutAgent, salaireBrut, totalRetenues) {
  if (!statutAgent || !salaireBrut || ["Vacataire", "Boursier", "Plateforme"].includes(statutAgent))
    return 0;
  if (["Agent FPH", "Agent non FPH"].includes(statutAgent) && !totalRetenues) return 0;
  return Math.round(salaireBrut - totalRetenues);
}

export function calculateVacationNetAPayer(statutAgent, vacation, retenueVacation) {
  if (!statutAgent || !vacation) return 0;
  if (["Agent FPH", "Agent non FPH"].includes(statutAgent) && !retenueVacation)
    return 0;
  if (["Vacataire", "Boursier", "Plateforme", "Agent FPH", "Agent non FPH"].includes(statutAgent))
    return Math.round(vacation - retenueVacation);
  return 0;
}

export function calculateNetAPayer(salaireNetAPayer, vacationNetAPayer) {
  if (!salaireNetAPayer && !vacationNetAPayer) return 0;
  return Math.round(salaireNetAPayer + vacationNetAPayer);
}

export function calculateMasseSalarialeMensuelle(statutAgent, regime, salaireBrutGlobal, cnssPatronale, carfoPatronale, vacation) {
  if (!statutAgent || !salaireBrutGlobal) return 0;
  if (["Vacataire", "Boursier", "Plateforme"].includes(statutAgent))
    return Math.round(vacation);
  if (["Agent FPH", "Agent non FPH"].includes(statutAgent) && regime === "CNSS") {
    return Math.round(salaireBrutGlobal + cnssPatronale);
  }
  if (["Agent FPH", "Agent non FPH"].includes(statutAgent) && regime === "CARFO") {
    return Math.round(salaireBrutGlobal + carfoPatronale);
  }
  return 0;
}
