import logging
from django.utils import timezone
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import (
    User, Banque, Projet, Poste, Employe, DetailEmploye,
    ComposantBase, Prime, HeureSupplementaire, Indemnite, SecuriteSocial,
    Exoneration, Taxes, Cotisation, Remboursement,
    PeriodePaiement, FicheDePaie, SignaturePaie, Paiement, Parametre
)

User = get_user_model()


# -------------------------
# Projet, Poste, DetailEmploye, Employe serializers
# -------------------------
class ProjetSerializer(serializers.ModelSerializer):
    responsable_nom = serializers.CharField(source='responsable.nom', read_only=True)
    responsable_id = serializers.PrimaryKeyRelatedField(
        queryset=Employe.objects.all(), source='responsable', write_only=True
    )

    class Meta:
        model = Projet
        fields = ['id', 'nom', 'description', 'date_debut', 'date_fin', 'statut', 'responsable_nom', 'responsable_id']


class PosteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Poste
        fields = ['id', 'nom']


class DetailEmployeSerializer(serializers.ModelSerializer):
    class Meta:
        model = DetailEmploye
        fields = [
            'statut_agent',
            'regime_prevoyance_sociale',
            'numero_immatriculation',
            'nombre_charges_iuts',
            'cadre',
            'indice',
            'numero_compte',        # <-- Ajoute ceci
            'intitule_compte',      # <-- Ajoute ceci
            'banque',               # <-- Ajoute ceci
        ]


class EmployeSerializer(serializers.ModelSerializer):
    poste = PosteSerializer(read_only=True)
    projet = ProjetSerializer(read_only=True)
    poste_id = serializers.PrimaryKeyRelatedField(queryset=Poste.objects.all(), source='poste', write_only=True)
    projet_id = serializers.PrimaryKeyRelatedField(queryset=Projet.objects.all(), source='projet', write_only=True)
    detail = DetailEmployeSerializer(required=False)

    class Meta:
        model = Employe
        fields = ['id', 'nom', 'prenom', 'numero_identite', 'poste', 'projet', 'poste_id', 'projet_id', 'detail']

    def create(self, validated_data):
        detail_data = validated_data.pop('detail', None)
        employe = Employe.objects.create(**validated_data)
        if detail_data:
            DetailEmploye.objects.create(employe=employe, **detail_data)
        return employe

    def update(self, instance, validated_data):
        detail_data = validated_data.pop('detail', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if detail_data:
            DetailEmploye.objects.update_or_create(employe=instance, defaults=detail_data)
        return instance


# -------------------------
# Serializers pour les composants de paie génériques
# -------------------------

class PeriodePaiementSerializer(serializers.ModelSerializer):
    class Meta:
        model = PeriodePaiement
        fields = '__all__'



# -------------------------
# Serializers pour Signature et Paiement
# -------------------------
class SignaturePaieSerializer(serializers.ModelSerializer):
    class Meta:
        model = SignaturePaie
        fields = '__all__'


class PaiementSerializer(serializers.ModelSerializer):
    employe_nom_complet = serializers.SerializerMethodField()
    employe_projet = serializers.CharField(source='employe.projet.nom', read_only=True)
    employe_id = serializers.IntegerField(source='employe.id', read_only=True)
    salaire_net = serializers.SerializerMethodField()  # Nouveau champ pour le salaire net

    class Meta:
        model = Paiement
        fields = ['id', 'employe_id', 'employe_nom_complet', 'employe_projet', 'montant', 'statut', 'salaire_net']

    def get_employe_nom_complet(self, obj):
        return obj.employe.nom_complet

    def get_salaire_net(self, obj):
        """
        On suppose que 'fiche_de_paie' est le nom de la relation vers FicheDePaie dans le modèle Paiement
        et que le champ correspondant au salaire net dans FicheDePaie est 'salaire_net_a_payer'.
        """
        if hasattr(obj, 'fiche_de_paie') and obj.fiche_de_paie:
            return obj.fiche_de_paie.salaire_net_a_payer
        return None


class ParametreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Parametre
        fields = '__all__'


# -------------------------
# Serializers pour les nouveaux modèles de composants de paie
# -------------------------

class ComposantBaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = ComposantBase
        # On ne passe pas 'fiche' puisque l'objet parent gère la relation
        fields = ['id', 'solde_indiciaire', 'salaire_de_base', 'vacation']
        # Optionnel : extra_kwargs = {'fiche': {'read_only': True}}


class PrimeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Prime
        # On retire le champ 'fiche'
        fields = ['id', 'sursalaire', 'prime_anciennete']


class HeureSupplementaireSerializer(serializers.ModelSerializer):
    # Champ calculé pour faciliter l'affichage
    montant_calculé = serializers.SerializerMethodField()

    class Meta:
        model = HeureSupplementaire
        # 'fiche' est retiré
        fields = ['id', 'nombre_heures', 'taux', 'montant', 'montant_calculé']

    def get_montant_calculé(self, obj):
        return round(obj.nombre_heures * obj.taux, 2)


class IndemniteSerializer(serializers.ModelSerializer):
    # Calcul optionnel d'une indemnité (ici, par exemple pour l'indemnité de résidence)
    indemnite_residence_calc = serializers.SerializerMethodField()

    class Meta:
        model = Indemnite
        # 'fiche' n'est pas requis dans le payload
        fields = [
            'id',
            'indemnite_residence', 'indemnite_logement', 'indemnite_astreinte',
            'indemnite_technicite', 'indemnite_transport', 'indemnite_responsabilite',
            'indemnite_specifique', 'indemnite_reseau', 'indemnite_risque',
            'indemnite_garde', 'indemnite_autres',
            'indemnite_residence_calc',
        ]

    def get_indemnite_residence_calc(self, obj):
        # Si vous souhaitez utiliser une méthode de calcul du modèle et que l'employé est dans le contexte
        employee = self.context.get('employee')
        if employee:
            return obj.calculer_indemnite_residence(employee)
        return None


class SecuriteSocialSerializer(serializers.ModelSerializer):
    class Meta:
        model = SecuriteSocial
        # 'fiche' retiré
        fields = ['id', 'cnss_patronale', 'cnss_employe', 'carfo_patronale', 'carfo_employe']


class ExonerationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Exoneration
        # 'fiche' exclu
        fields = [
            'id',
            'exo_ind_logement', 'exo_ind_astreinte', 'exo_ind_technicite',
            'exo_ind_transport', 'exo_ind_responsabilite', 'exo_ind_specifique',
            'exo_ind_reseau', 'exo_ind_risque', 'exo_ind_garde',
            'exo_ind_autres', 'exo_ind_residence'
        ]


class TaxesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Taxes
        # Aucun champ 'fiche'
        fields = ['id', 'iuts_brut', 'iuts_net', 'fsp', 'retenue_vacation']


class CotisationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cotisation
        # Utilisation d'exclude pour retirer le champ 'fiche'
        exclude = ['fiche']


class RemboursementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Remboursement
        # 'fiche' n'est pas attendu dans le payload
        fields = ['id', 'avances_sur_solde', 'remboursement_caisse_sociale']




class FicheDePaieSerializer(serializers.ModelSerializer):
    employe = EmployeSerializer(read_only=True)
    # Utilisation de "employe_id" avec source "employe"
    employe_id = serializers.PrimaryKeyRelatedField(
        queryset=Employe.objects.all(),
        source='employe',
        write_only=True
    )
    # Remplacer "periode" par "session_de_paie"
    session_de_paie = PeriodePaiementSerializer(read_only=True)
    session_de_paie_id = serializers.PrimaryKeyRelatedField(
        queryset=PeriodePaiement.objects.all(),
        source='session_de_paie',
        write_only=True
    )
    
    # Champs imbriqués pour les autres composants de la paie
    composant_base = ComposantBaseSerializer(required=False)
    primes = PrimeSerializer(required=False)
    heure_supp = HeureSupplementaireSerializer(required=False)
    indemnites = IndemniteSerializer(required=False)
    cotisations = CotisationSerializer(required=False)
    remboursements = RemboursementSerializer(required=False)
    taxes = TaxesSerializer(required=False, read_only=False)
    securite_social = SecuriteSocialSerializer(required=False, read_only=False)
    
    class Meta:
        model = FicheDePaie
        fields = [
            'id',
            'employe', 'employe_id',
            'session_de_paie', 'session_de_paie_id',  # Utilisation du nom correct
            'mode_de_paiement',
            'salaire_base_fiscale',
            'total_indemnites',
            'salaire_brut',
            'salaire_brut_global',
            'salaire_brut_imposable',
            'total_exoneration',
            'abattement_charges_pro',
            'salaire_net_imposable',
            'remuneration_nette',
            'total_retenues',
            'salaire_net_a_payer',
            'vacation_net_a_payer',
            'net_a_payer',
            'masse_salariale_mensuelle',
            'informations_sup',
            'composant_base', 'primes', 'heure_supp', 'indemnites',
            'cotisations', 'remboursements', 'taxes', 'securite_social'
        ]
    

    def create(self, validated_data):
        logger = logging.getLogger(__name__)
        # Extraire manuellement les instances déjà résolues grâce aux "source"
        employe = validated_data.pop("employe", None)
        session_de_paie = validated_data.pop("session_de_paie", None)  # Notez ici !
        
        # Extraction des données imbriquées
        nested_data = {}
        for key in ['composant_base', 'primes', 'heure_supp', 'indemnites', 'cotisations', 'remboursements', 'taxes', 'securite_social']:
            if key in validated_data:
                nested_data[key] = validated_data.pop(key)
        
        # Créer la fiche de paie en passant la bonne clé pour la période
        fiche = FicheDePaie.objects.create(employe=employe, session_de_paie=session_de_paie, **validated_data)
        
        # Création des objets enfants associés
        if 'composant_base' in nested_data:
            ComposantBase.objects.create(fiche=fiche, **nested_data['composant_base'])
        if 'primes' in nested_data:
            Prime.objects.create(fiche=fiche, **nested_data['primes'])
        if 'heure_supp' in nested_data:
            HeureSupplementaire.objects.create(fiche=fiche, **nested_data['heure_supp'])
        if 'indemnites' in nested_data:
            Indemnite.objects.create(fiche=fiche, **nested_data['indemnites'])
        if 'cotisations' in nested_data:
            Cotisation.objects.create(fiche=fiche, **nested_data['cotisations'])
        if 'remboursements' in nested_data:
            Remboursement.objects.create(fiche=fiche, **nested_data['remboursements'])
        if 'taxes' in nested_data:
            Taxes.objects.create(fiche=fiche, **nested_data['taxes'])
        if 'securite_social' in nested_data:
            SecuriteSocial.objects.create(fiche=fiche, **nested_data['securite_social'])

        # Vérifier si un paiement existe déjà
        paiement, created = Paiement.objects.get_or_create(
            employe=employe, periode=session_de_paie,
            defaults={"montant": validated_data.get("net_a_payer", 0), "statut": "payé"}
        )

    # Si le paiement existe déjà, on met à jour son statut
        if not created:
          paiement.statut = "payé"
          paiement.date_paiement = timezone.now().date()  # Enregistre la date du paiement
          paiement.save()
          logger.info(f"Paiement mis à jour : {paiement.employe.nom_complet} - {paiement.statut}")
        
        
        return fiche

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance



# -------------------------
# Serializers pour l'authentification et l'utilisateur
# -------------------------

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['email'] = user.email
        return token


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        read_only_fields = ['id', 'username']


class PasswordChangeSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)

    def validate_new_password(self, value):
        validate_password(value)
        return value


class BanqueSerializer(serializers.ModelSerializer):
    class Meta:
        model = Banque
        fields = '__all__'
