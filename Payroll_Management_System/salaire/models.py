from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    role = models.CharField(max_length=20, default="user")
    pages = models.JSONField(default=list, blank=True)

# ============================
# Modèles de base existants
# ============================


class Banque(models.Model):
    nom = models.CharField(max_length=100)
    abreviation = models.CharField(max_length=50, blank=True, null=True)

    def __str__(self):
        return self.nom

class Projet(models.Model):
    nom = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    financement = models.CharField(max_length=200, blank=True, null=True)
    date_debut = models.DateField(null=True, blank=True)
    date_fin = models.DateField(null=True, blank=True)
    STATUT_CHOICES = [
        ('en_attente', 'En attente'),
        ('en_cours', 'En cours'),
        ('termine', 'Terminé'),
    ]
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='en_attente')
    responsable = models.ForeignKey(
        "Employe",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="projets_responsable"
    )

    def __str__(self):
        responsable_nom = self.responsable.nom if self.responsable else "Aucun responsable"
        return f"{self.nom} - {self.get_statut_display()} - {responsable_nom}"

class Poste(models.Model):
    nom = models.CharField(max_length=100)
    projet = models.ForeignKey(Projet, on_delete=models.CASCADE, default=1)

    def __str__(self):
        return self.nom

class Employe(models.Model):
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100, default='Jean')
    numero_identite = models.CharField(max_length=50, blank=True, null=True)
    poste = models.ForeignKey(Poste, on_delete=models.CASCADE)
    projet = models.ForeignKey(Projet, on_delete=models.CASCADE)
    est_actif = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.prenom} {self.nom}"

    @property
    def nom_complet(self):
        return f"{self.prenom} {self.nom}"

CADRE_CHOICES = (
    (1, "Cadre supérieur"),
    (2, "Cadre inférieur"),
)

class DetailEmploye(models.Model):
    employe = models.OneToOneField('Employe', on_delete=models.CASCADE, related_name='detail')
    statut_agent = models.CharField(max_length=50, blank=True, null=True)
    regime_prevoyance_sociale = models.CharField(max_length=100, blank=True, null=True)
    numero_immatriculation = models.CharField(max_length=50, blank=True, null=True)
    nombre_charges_iuts = models.PositiveIntegerField(default=0)
    cadre = models.IntegerField(choices=CADRE_CHOICES, blank=True, null=True)
    indice = models.DecimalField(max_digits=6, decimal_places=2, default=0.0)
    numero_compte = models.CharField(max_length=100, blank=True, null=True, help_text="Numéro de compte bancaire")
    intitule_compte = models.CharField(max_length=255, blank=True, null=True, help_text="Intitulé du compte")
    banque = models.ForeignKey(Banque, on_delete=models.SET_NULL, blank=True, null=True)

    def __str__(self):
        return f"Détails pour {self.employe}"

class PeriodePaiement(models.Model):
    mois = models.CharField(max_length=20)
    annee = models.IntegerField(default=2025)
    cloture = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.mois} {self.annee}"

# ============================
# Modèle FicheDePaie enrichi
# ============================

class FicheDePaie(models.Model):
    MODES_DE_PAIEMENT = (
        ('BILLETAGE', 'Paiement par chèque'),
        ('VIREMENT', 'Virement Bancaire'),
    )

    employe = models.ForeignKey(Employe, on_delete=models.CASCADE)
    session_de_paie = models.ForeignKey(PeriodePaiement, on_delete=models.CASCADE)
    mode_de_paiement = models.CharField(max_length=50, choices=MODES_DE_PAIEMENT)

    # Paiement (chèque)
    agence_caisse = models.CharField(max_length=255, blank=True, null=True, help_text="Agence de caisse (pour paiement par chèque)")
    numero_compte_caisse = models.CharField(max_length=255, blank=True, null=True, help_text="Numéro de compte de caisse")
    numero_cheque = models.CharField(max_length=100, blank=True, null=True)
    date_cheque = models.DateField(blank=True, null=True)

    # Champs de synthèse finaux
    salaire_base_fiscale = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_indemnites = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    salaire_brut = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    salaire_brut_global = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    salaire_brut_imposable = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_exoneration = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    abattement_charges_pro = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    salaire_net_imposable = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    remuneration_nette = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_retenues = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    salaire_net_a_payer = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    vacation_net_a_payer = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    net_a_payer = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    masse_salariale_mensuelle = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    informations_sup = models.JSONField(blank=True, null=True, help_text="Détails complémentaires (exonérations, primes supplémentaires, etc.)")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Fiche de paie pour {self.employe.nom_complet} - {self.session_de_paie}"

    def calculer(self):
        # Méthode qui agrège les résultats de tous les composants liés
        # Par exemple, vous pouvez sommer les montants des composantBase, Prime, etc.
        # et mettre à jour les champs de synthèse de cette fiche.
        pass
    class Meta:
        unique_together = ('employe', 'session_de_paie')



class Paiement(models.Model):
    STATUT_CHOICES = [
        ('non_payé', 'Non payé'),
        ('en_attente', 'En attente'),
        ('partiellement_payé', 'Partiellement payé'),
        ('payé', 'Payé'),
    ]
    
    employe = models.ForeignKey(Employe, on_delete=models.CASCADE)
    fiche_de_paie = models.ForeignKey(FicheDePaie, on_delete=models.SET_NULL, null=True, blank=True)
    periode = models.ForeignKey(PeriodePaiement, on_delete=models.CASCADE)
    montant = models.DecimalField(max_digits=10, decimal_places=2)
    date_paiement = models.DateField(null=True, blank=True)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='non_payé')
    updated_at = models.DateTimeField(auto_now=True)
    
    def est_paye(self):
        return self.statut == 'payé'
    
    def __str__(self):
        return f"{self.employe} - {self.periode} : {self.get_statut_display()}"
    
    class Meta:
        ordering = ['periode', 'employe']

class Parametre(models.Model):
    nom_entreprise = models.CharField(max_length=255, default="Nom de L'Entreprise")
    logo = models.ImageField(upload_to='logos/', blank=True, null=True)
    footer = models.TextField(default="Centre MURAZ, 2054, Avenue Mamadou KONATE, Lot 218, Bobo-Dioulasso - Burkina Faso")  # ✅ Ajout du texte footer
    salaire_minimum = models.DecimalField(max_digits=10, decimal_places=2, default=30000)
    taux_fonds_soutien_patriotique = models.DecimalField(max_digits=5, decimal_places=2, default=1.5)
    taux_retenue_vacation = models.DecimalField(max_digits=5, decimal_places=2, default=5)
    point_indiciaire = models.DecimalField(max_digits=10, decimal_places=2, default=100)
    cnss_part_patronale = models.DecimalField(max_digits=5, decimal_places=2, default=16)
    cnss_part_employe = models.DecimalField(max_digits=5, decimal_places=2, default=5.5)
    carfo_part_patronale = models.DecimalField(max_digits=5, decimal_places=2, default=12)
    carfo_part_employe = models.DecimalField(max_digits=5, decimal_places=2, default=8)
    taux_horaire = models.DecimalField(max_digits=10, decimal_places=2, default=0)


    def save(self, *args, **kwargs):
        if not self.pk and Parametre.objects.exists():
            raise Exception("Une instance de Parametre existe déjà. Vous ne pouvez pas en ajouter une autre.")
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Paramètres de {self.nom_entreprise} - Salaire Min: {self.salaire_minimum}"

# ============================
# Nouveaux modèles de composants pour le calcul de salaire
# ============================

# 1. Composant de Base (inclus Solde indiciaire, Salaire de base, Vacation)
class ComposantBase(models.Model):
    fiche = models.ForeignKey(FicheDePaie, on_delete=models.CASCADE, related_name="base_components")
    solde_indiciaire = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    salaire_de_base = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    vacation = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    def __str__(self):
        return f"Composant Base pour {self.fiche.employe.nom_complet}"

# 2. Composant Prime (ex. Sursalaire et Prime d'ancienneté)
class Prime(models.Model):
    fiche = models.ForeignKey(FicheDePaie, on_delete=models.CASCADE, related_name="primes")
    sursalaire = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    prime_anciennete = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    def __str__(self):
        return f"Composant Prime pour {self.fiche.employe.nom_complet}"

# 3. Heures Supplémentaires
class HeureSupplementaire(models.Model):
    fiche = models.ForeignKey(FicheDePaie, on_delete=models.CASCADE, related_name="heures_supplementaires")
    nombre_heures = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    taux = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    montant = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    def calculer_montant(self):
        self.montant = round(self.nombre_heures * self.taux, 2)
        return self.montant

    def __str__(self):
        return f"Heures Supplémentaires pour {self.fiche.employe.nom_complet}"

# 4. Indemnités (regroupe tous les types d'indemnités)
class Indemnite(models.Model):
    fiche = models.ForeignKey(FicheDePaie, on_delete=models.CASCADE, related_name="indemnites")
    indemnite_residence = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    indemnite_logement = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    indemnite_astreinte = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    indemnite_technicite = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    indemnite_transport = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    indemnite_responsabilite = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    indemnite_specifique = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    indemnite_reseau = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    indemnite_risque = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    indemnite_garde = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    indemnite_autres = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    def calculer_indemnite_residence(self, employee):
        # Exemple simplifié pour l'indemnité de résidence, inspiré de la formule Excel
        if not employee.detail.statut_agent:
            return 0
        if employee.detail.statut_agent in ["Agent non FPH", "Vacataire", "Boursier", "Plateforme"]:
            return 0
        # Ici, on suppose que l'employé possède un attribut J_value représentant la base de calcul
        if not hasattr(employee, "J_value"):
            return 0
        montant = employee.J_value * 0.10  # Application de 10%
        return round(montant, 0)

    def __str__(self):
        return f"Indemnités pour {self.fiche.employe.nom_complet}"

# 5. Sécurité Sociale
class SecuriteSocial(models.Model):
    fiche = models.ForeignKey(FicheDePaie, on_delete=models.CASCADE, related_name="securite_social")
    cnss_patronale = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    cnss_employe = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    carfo_patronale = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    carfo_employe = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    def __str__(self):
        return f"Sécurité Sociale pour {self.fiche.employe.nom_complet}"

# 6. Exonérations
# class Exoneration(models.Model):
#     fiche = models.ForeignKey(FicheDePaie, on_delete=models.CASCADE, related_name="exonerations")
#     exo_ind_logement = models.DecimalField(max_digits=12, decimal_places=2, default=0)
#     exo_ind_astreinte = models.DecimalField(max_digits=12, decimal_places=2, default=0)
#     exo_ind_technicite = models.DecimalField(max_digits=12, decimal_places=2, default=0)
#     exo_ind_transport = models.DecimalField(max_digits=12, decimal_places=2, default=0)
#     exo_ind_responsabilite = models.DecimalField(max_digits=12, decimal_places=2, default=0)
#     exo_ind_specifique = models.DecimalField(max_digits=12, decimal_places=2, default=0)
#     exo_ind_reseau = models.DecimalField(max_digits=12, decimal_places=2, default=0)
#     exo_ind_risque = models.DecimalField(max_digits=12, decimal_places=2, default=0)
#     exo_ind_garde = models.DecimalField(max_digits=12, decimal_places=2, default=0)
#     exo_ind_autres = models.DecimalField(max_digits=12, decimal_places=2, default=0)
#     exo_ind_residence = models.DecimalField(max_digits=12, decimal_places=2, default=0)

#     def __str__(self):
#         return f"Exonérations pour {self.fiche.employe.nom_complet}"

# 7. Taxes
class Taxes(models.Model):
    fiche = models.ForeignKey(FicheDePaie, on_delete=models.CASCADE, related_name="taxes")
    iuts_brut = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    iuts_net = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    fsp = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    retenue_vacation = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    def __str__(self):
        return f"Taxes pour {self.fiche.employe.nom_complet}"

# 8. Cotisations
class Cotisation(models.Model):
    fiche = models.ForeignKey(FicheDePaie, on_delete=models.CASCADE, related_name="cotisations")
    cotisation_caisse_sociale = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    cotisation_assurance = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    def __str__(self):
        return f"Cotisations pour {self.fiche.employe.nom_complet}"

# 9. Remboursements
class Remboursement(models.Model):
    fiche = models.ForeignKey(FicheDePaie, on_delete=models.CASCADE, related_name="remboursements")
    avances_sur_solde = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    remboursement_caisse_sociale = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    def __str__(self):
        return f"Remboursements pour {self.fiche.employe.nom_complet}"
