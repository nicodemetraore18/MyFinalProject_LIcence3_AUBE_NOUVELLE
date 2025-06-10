from django.utils import timezone
import logging
from rest_framework import viewsets, generics, permissions, status
from rest_framework.decorators import api_view
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from django.shortcuts import get_object_or_404, redirect
from django.contrib.auth import get_user_model
from django.http import HttpResponse
from django.template.loader import render_to_string
from weasyprint import HTML
from django.views.decorators.clickjacking import xframe_options_exempt
from django.db.models import Sum
from django.conf import settings
from django.utils.html import escape
from .models import (
    User, Banque, Projet, Poste, Employe, DetailEmploye,FicheDePaie,
    ComposantBase, Prime, HeureSupplementaire, Indemnite, SecuriteSocial,
    Exoneration, Taxes, Cotisation, Remboursement,
    PeriodePaiement, FicheDePaie, SignaturePaie, Paiement, Parametre
)
from .serializers import (
    ProjetSerializer, PosteSerializer, EmployeSerializer, FicheDePaieSerializer,
    UserSerializer, ParametreSerializer, PasswordChangeSerializer,
    MyTokenObtainPairSerializer, PeriodePaiementSerializer, PaiementSerializer,
     BanqueSerializer,
    # Vous pouvez ajouter ici les serializers pour les nouveaux modèles si besoin :
     ComposantBaseSerializer, PrimeSerializer, HeureSupplementaireSerializer,
     IndemniteSerializer, SecuriteSocialSerializer, ExonerationSerializer,
     TaxesSerializer, CotisationSerializer, RemboursementSerializer
)

from rest_framework.permissions import IsAuthenticated

User = get_user_model()
logger = logging.getLogger(__name__)

# ------------------------------
# Endpoints pour les paiements et périodes
# ------------------------------

@api_view(['GET'])
def all_paiements(request):
    paiements = Paiement.objects.all()
    serializer = PaiementSerializer(paiements, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def periode_status_list(request):
    periodes = PeriodePaiement.objects.all()
    data = []
    for periode in periodes:
        paiements = Paiement.objects.filter(periode=periode)
        non_payes = paiements.filter(statut='non_payé').exists()
        data.append({
            "id": periode.id,
            "mois": periode.mois,
            "tousPayes": not non_payes
        })
    return Response(data)

@api_view(['GET'])
def paiements_paye(request, periode_id):
    paiements = Paiement.objects.filter(periode_id=periode_id, statut='payé')
    serializer = PaiementSerializer(paiements, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def paiements_non_paye(request, periode_id):
    paiements = Paiement.objects.filter(
        periode_id=periode_id,
        statut='non_payé',
        employe__est_actif=True,
        employe__projet__statut='en_cours'
    )
    serializer = PaiementSerializer(paiements, many=True)
    return Response(serializer.data)


from django.utils import timezone
from rest_framework.decorators import api_view
from rest_framework.response import Response

@api_view(['POST'])
def effectuer_paiement(request, periode_id):
    """
    Mise à jour du paiement d'un employé pour la période donnée.
    - Met le statut du paiement à "payé"
    - Associe une fiche de paie au paiement si l'ID de la fiche de paie est fourni.
    """
    employe_id = request.data.get('employeId')
    if not employe_id:
        return Response({"error": "L'ID de l'employé est requis."}, status=400)

    # Récupérer le paiement associé
    paiement = Paiement.objects.filter(periode_id=periode_id, employe_id=employe_id).first()
    if not paiement:
        return Response({"error": "Paiement introuvable pour cet employé."}, status=404)

    # Optionnellement, récupérer l'id de la fiche de paie depuis le payload
    fiche_de_paie_id = request.data.get('fiche_de_paie_id')
    if fiche_de_paie_id:
        try:
            fiche = FicheDePaie.objects.get(id=fiche_de_paie_id)
            paiement.fiche_de_paie = fiche
        except FicheDePaie.DoesNotExist:
            return Response({"error": "Fiche de paie introuvée."}, status=404)
    else:
        # Si vous préférez essayer de récupérer automatiquement la fiche de paie
        # associée (par exemple avec employe et période), vous pouvez décommenter
        # le code suivant :
        #
        fiche = FicheDePaie.objects.filter(employe_id=employe_id, session_de_paie_id=periode_id).first()
        if fiche:
             paiement.fiche_de_paie = fiche
        pass

    # Mettre à jour le statut en "payé"
    paiement.statut = "payé"
    paiement.date_paiement = timezone.now()
    paiement.save()

    return Response({"message": "Paiement mis à jour vers 'payé'."}, status=200)



class PeriodePaiementViewSet(viewsets.ModelViewSet):
    queryset = PeriodePaiement.objects.all()
    serializer_class = PeriodePaiementSerializer

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        periode = PeriodePaiement.objects.get(id=response.data["id"])
        for employe in Employe.objects.all():
            Paiement.objects.create(employe=employe, periode=periode, montant=0, statut="non_payé")
        return response

# ------------------------------
# Endpoints pour l'utilisateur et Token
# ------------------------------

class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            "username": user.username,
            "email": user.email,
        })

    def put(self, request):
        user = request.user
        user.username = request.data.get("username", user.username)
        user.email = request.data.get("email", user.email)
        user.save()
        return Response({"message": "Profil mis à jour"})

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

# ------------------------------
# Endpoints essentiels pour les objets référentiels
# ------------------------------

class ProjetViewSet(viewsets.ModelViewSet):
    queryset = Projet.objects.all()
    serializer_class = ProjetSerializer

class PosteViewSet(viewsets.ModelViewSet):
    queryset = Poste.objects.all()
    serializer_class = PosteSerializer

class EmployeViewSet(viewsets.ModelViewSet):
    queryset = Employe.objects.all()
    serializer_class = EmployeSerializer

class FicheDePaieViewSet(viewsets.ModelViewSet):
    queryset = FicheDePaie.objects.all()
    serializer_class = FicheDePaieSerializer

class ParametreViewSet(viewsets.ModelViewSet):
    queryset = Parametre.objects.all()
    serializer_class = ParametreSerializer

@api_view(['PUT'])
def cloturer_periode(request, periode_id):
    periode = get_object_or_404(PeriodePaiement, id=periode_id)
    if Paiement.objects.filter(periode=periode, statut='non_payé').exists():
        return Response({"message": "Impossible de clôturer : certains employés n'ont pas encore été payés !"}, status=400)
    periode.cloture = True
    periode.save()
    return Response({"message": "Période clôturée avec succès"})

# ------------------------------
# Endpoints pour les composants de salaire
# ------------------------------

# Vous pouvez ajouter ici des ViewSets pour les modèles spécifiques de composants
# Par exemple :
class ComposantBaseViewSet(viewsets.ModelViewSet):
     queryset = ComposantBase.objects.all()
     serializer_class = ComposantBaseSerializer

class PrimeViewSet(viewsets.ModelViewSet):
     queryset = Prime.objects.all()
     serializer_class = PrimeSerializer

class HeureSupplementaireViewSet(viewsets.ModelViewSet):
     queryset = HeureSupplementaire.objects.all()
     serializer_class = HeureSupplementaireSerializer

class IndemniteViewSet(viewsets.ModelViewSet):
     queryset = Indemnite.objects.all()
     serializer_class = IndemniteSerializer

class SecuriteSocialViewSet(viewsets.ModelViewSet):
     queryset = SecuriteSocial.objects.all()
     serializer_class = SecuriteSocialSerializer

class ExonerationViewSet(viewsets.ModelViewSet):
     queryset = Exoneration.objects.all()
     serializer_class = ExonerationSerializer

class TaxesViewSet(viewsets.ModelViewSet):
     queryset = Taxes.objects.all()
     serializer_class = TaxesSerializer

class CotisationViewSet(viewsets.ModelViewSet):
     queryset = Cotisation.objects.all()
     serializer_class = CotisationSerializer

class RemboursementViewSet(viewsets.ModelViewSet):
     queryset = Remboursement.objects.all()
     serializer_class = RemboursementSerializer

class BanqueViewSet(viewsets.ModelViewSet):
    queryset = Banque.objects.all()
    serializer_class = BanqueSerializer




class SaveFicheDePaieView(APIView):
    def post(self, request, format=None):
        data = request.data
        logger.info("Payload reçu: %s", data)

        try:
            # Récupère ou crée la fiche de paie principale
            fiche, created = FicheDePaie.objects.get_or_create(
                employe_id=data.get("employe_id"),
                session_de_paie_id=data.get("session_de_paie_id"),
                defaults={
                    "mode_de_paiement": data.get("mode_de_paiement", "VIREMENT"),
                    # Initialisation depuis composant_base en cas de création
                    "salaire_base_fiscale": data.get("composant_base", {}).get("salaire_de_base", 0),
                    "vacation_net_a_payer": data.get("composant_base", {}).get("vacation", 0),
                    # Pour le moment, on place aussi un éventuel salaire_net si présent dans synthese
                    "salaire_net_a_payer": data.get("synthese", {}).get("salaire_net", 0),
                }
            )

            # Mise à jour des champs principaux avec les données de synthèse
            synthese = data.get("synthese", {})
            if synthese:
                fiche.salaire_base_fiscale = synthese.get("salaire_base_fiscale", fiche.salaire_base_fiscale)
                fiche.total_indemnites = synthese.get("total_indemnites", fiche.total_indemnites)
                fiche.salaire_brut = synthese.get("salaire_brut", fiche.salaire_brut)
                fiche.salaire_brut_global = synthese.get("salaire_brut_global", fiche.salaire_brut_global)
                fiche.salaire_brut_imposable = synthese.get("salaire_brut_imposable", fiche.salaire_brut_imposable)
                fiche.total_exoneration = synthese.get("total_exoneration", fiche.total_exoneration)
                fiche.abattement_charges_pro = synthese.get("abattement_charges_pro", fiche.abattement_charges_pro)
                fiche.salaire_net_imposable = synthese.get("salaire_net_imposable", fiche.salaire_net_imposable)
                fiche.remuneration_nette = synthese.get("remuneration_nette", fiche.remuneration_nette)
                fiche.total_retenues = synthese.get("total_retenues", fiche.total_retenues)
                fiche.salaire_net_a_payer = synthese.get("salaire_net_a_payer", fiche.salaire_net_a_payer)
                fiche.vacation_net_a_payer = synthese.get("vacation_net_a_payer", fiche.vacation_net_a_payer)
                fiche.net_a_payer = synthese.get("net_a_payer", fiche.net_a_payer)
                fiche.masse_salariale_mensuelle = synthese.get("masse_salariale_mensuelle", fiche.masse_salariale_mensuelle)
                fiche.save()

            # Mise à jour ou création des objets liés :

            # Composant Base
            base_data = data.get("composant_base", {})
            if base_data:
                ComposantBase.objects.update_or_create(
                    fiche=fiche,
                    defaults={
                        "salaire_de_base": base_data.get("salaire_de_base", 0),
                        "vacation": base_data.get("vacation", 0),
                    }
                )

            # Prime
            prime_data = data.get("primes", {})
            if prime_data:
                Prime.objects.update_or_create(
                    fiche=fiche,
                    defaults={
                        "sursalaire": prime_data.get("sursalaire", 0),
                        "prime_anciennete": prime_data.get("prime_anciennete", 0)
                    }
                )

            # Heure Supplémentaire
            heure_data = data.get("heure_supp", {})
            if heure_data:
                HeureSupplementaire.objects.update_or_create(
                    fiche=fiche,
                    defaults={
                        "nombre_heures": heure_data.get("nombre_heures", 0),
                        "taux": heure_data.get("taux", 0),
                        "montant": heure_data.get("montant", 0),
                    }
                )

            # Indemnités
            indemnite_data = data.get("indemnites", {}).get("values", {})
            if indemnite_data:
                Indemnite.objects.update_or_create(
                    fiche=fiche,
                    defaults={
                        "indemnite_residence": indemnite_data.get("indemnite_residence", 0),
                        "indemnite_logement": indemnite_data.get("indemnite_logement", 0),
                        "indemnite_astreinte": indemnite_data.get("indemnite_astreinte", 0),
                        "indemnite_technicite": indemnite_data.get("indemnite_technicite", 0),
                        "indemnite_transport": indemnite_data.get("indemnite_transport", 0),
                        "indemnite_responsabilite": indemnite_data.get("indemnite_responsabilite", 0),
                        "indemnite_specifique": indemnite_data.get("indemnite_specifique", 0),
                        "indemnite_reseau": indemnite_data.get("indemnite_reseau", 0),
                        "indemnite_risque": indemnite_data.get("indemnite_risque", 0),
                        "indemnite_garde": indemnite_data.get("indemnite_garde", 0),
                        "indemnite_autres": indemnite_data.get("indemnite_autres", 0)
                    }
                )

            # Cotisations
            cotisation_data = data.get("cotisations", {})
            if cotisation_data:
                Cotisation.objects.update_or_create(
                    fiche=fiche,
                    defaults={
                        "cotisation_caisse_sociale": cotisation_data.get("cotisation_caisse_sociale", 0),
                        "cotisation_assurance": cotisation_data.get("cotisation_assurance", 0),
                    }
                )

            # Remboursements
            remboursement_data = data.get("remboursements", {})
            if remboursement_data:
                Remboursement.objects.update_or_create(
                    fiche=fiche,
                    defaults={
                        "avances_sur_solde": remboursement_data.get("avances_sur_solde", 0),
                        "remboursement_caisse_sociale": remboursement_data.get("remboursement_caisse_sociale", 0),
                    }
                )
            
            # Extraction pour Taxes directement depuis synthese
            taxes_value = {
                "iuts_brut": synthese.get("iuts_brut", 0),
                "iuts_net": synthese.get("iuts_net", 0),
                "fsp": synthese.get("fsp", 0),
                "retenue_vacation": synthese.get("retenue_vacation", 0),
            }

            if any(value for value in taxes_value.values()):
                Taxes.objects.update_or_create(
                    fiche=fiche,
                    defaults=taxes_value
                )

            # Extraction pour Sécurité Sociale directement depuis synthese
            securite_value = {
                "cnss_patronale": synthese.get("cnss_patronale", 0),
                "cnss_employe": synthese.get("cnss_employe", 0),
                "carfo_patronale": synthese.get("carfo_patronale", 0),
                "carfo_employe": synthese.get("carfo_employe", 0),
            }

            if any(value for value in securite_value.values()):
                SecuriteSocial.objects.update_or_create(
                    fiche=fiche,
                    defaults=securite_value
                )


           

            # Optionnel : Mise à jour d'un éventuel paiement associé,
            # par exemple via un modèle Paiement si vous en avez un.
            # Vous pouvez par exemple :
            paiement, p_created = Paiement.objects.update_or_create(
               employe=fiche.employe,
               periode=fiche.session_de_paie,
               defaults={"montant": fiche.net_a_payer, "statut": "payé", "date_paiement": timezone.now().date()}
            )

            return Response(
                {"message": "Fiche de paie mise à jour avec succès"},
                status=status.HTTP_200_OK
            )

        except Exception as e:
            logger.exception("Exception lors de la sauvegarde de la fiche de paie")
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


def generate_payslip_pdf(request, periode_id, employe_id):
    # Récupération de l'employé et fiche de paie (comme dans votre code existant)
    employe = get_object_or_404(Employe, id=employe_id)
    employe_detail = getattr(employe, "detail", None)

    fiche_de_paie = FicheDePaie.objects.filter(
        employe_id=employe.id,
        session_de_paie_id=periode_id
    ).order_by('-created_at').first()

    if not fiche_de_paie:
        return HttpResponse("Aucune fiche de paie trouvée.", status=404)

    parametres = Parametre.objects.first()
    logo_url = (f"{request.build_absolute_uri(settings.MEDIA_URL)}{parametres.logo.name}"
                if parametres and parametres.logo else "")
    print(f"✅ LOGO URL FOR PDF (Corrected): {logo_url}")  # Debug

    # 1. Récupérer les détails des AVOIRS
    avoirs_details = []
    for base in fiche_de_paie.base_components.all():
        if base.salaire_de_base and base.salaire_de_base != 0:
            avoirs_details.append({"libelle": "Salaire de Base", "montant": base.salaire_de_base})
        if base.vacation and base.vacation != 0:
            avoirs_details.append({"libelle": "Vacation", "montant": base.vacation})
    for prime in fiche_de_paie.primes.all():
        if prime.sursalaire and prime.sursalaire != 0:
            avoirs_details.append({"libelle": "Sursalaire", "montant": prime.sursalaire})
        if prime.prime_anciennete and prime.prime_anciennete != 0:
            avoirs_details.append({"libelle": "Prime d'ancienneté", "montant": prime.prime_anciennete})
    for heure in fiche_de_paie.heures_supplementaires.all():
        if heure.montant and heure.montant != 0:
            avoirs_details.append({"libelle": "Heures Supplémentaires", "montant": heure.montant})
    for indem in fiche_de_paie.indemnites.all():
        indemnity_fields = [
            ("Indemnité résidence", indem.indemnite_residence),
            ("Indemnité logement", indem.indemnite_logement),
            ("Indemnité astreinte", indem.indemnite_astreinte),
            ("Indemnité technicité", indem.indemnite_technicite),
            ("Indemnité transport", indem.indemnite_transport),
            ("Indemnité responsabilité", indem.indemnite_responsabilite),
            ("Indemnité spécifique", indem.indemnite_specifique),
            ("Indemnité réseau", indem.indemnite_reseau),
            ("Indemnité risque", indem.indemnite_risque),
            ("Indemnité garde", indem.indemnite_garde),
            ("Indemnité autres", indem.indemnite_autres),
        ]
        for label, value in indemnity_fields:
            if value and value != 0:
                avoirs_details.append({"libelle": label, "montant": value})

    # 2. Récupérer les détails des RETENUES
    retenues_details = []
    for cotis in fiche_de_paie.cotisations.all():
        if cotis.cotisation_caisse_sociale and cotis.cotisation_caisse_sociale != 0:
            retenues_details.append({"libelle": "Cotisation Caisse Sociale", "montant": cotis.cotisation_caisse_sociale})
        if cotis.cotisation_assurance and cotis.cotisation_assurance != 0:
            retenues_details.append({"libelle": "Cotisation Assurance", "montant": cotis.cotisation_assurance})
    for remb in fiche_de_paie.remboursements.all():
        if remb.avances_sur_solde and remb.avances_sur_solde != 0:
            retenues_details.append({"libelle": "Avances sur Solde", "montant": remb.avances_sur_solde})
        if remb.remboursement_caisse_sociale and remb.remboursement_caisse_sociale != 0:
            retenues_details.append({"libelle": "Remboursement Caisse Sociale", "montant": remb.remboursement_caisse_sociale})
    sec = fiche_de_paie.securite_social.first()
    if sec:
        if sec.cnss_employe and sec.cnss_employe != 0:
            retenues_details.append({"libelle": "CNSS Employé", "montant": sec.cnss_employe})
        if sec.cnss_patronale and sec.cnss_patronale != 0:
            retenues_details.append({"libelle": "CNSS Patronale", "montant": sec.cnss_patronale})
        if sec.carfo_employe and sec.carfo_employe != 0:
            retenues_details.append({"libelle": "CARFO Employé", "montant": sec.carfo_employe})
        if sec.carfo_patronale and sec.carfo_patronale != 0:
            retenues_details.append({"libelle": "CARFO Patronale", "montant": sec.carfo_patronale})
    tax = fiche_de_paie.taxes.first()
    if tax:
        if tax.iuts_brut and tax.iuts_brut != 0:
            retenues_details.append({"libelle": "IUTS Brut", "montant": tax.iuts_brut})
        if tax.iuts_net and tax.iuts_net != 0:
            retenues_details.append({"libelle": "IUTS Net", "montant": tax.iuts_net})
        if tax.fsp and tax.fsp != 0:
            retenues_details.append({"libelle": "FSP", "montant": tax.fsp})
        if tax.retenue_vacation and tax.retenue_vacation != 0:
            retenues_details.append({"libelle": "Retenue Vacation", "montant": tax.retenue_vacation})

    # 3. Ordonner les listes selon l'ordre désiré
    # Définissez ici l'ordre pour les avoirs et retenues, selon vos préférences.
    avoirs_order = {
        "Salaire de Base": 1,
        "Vacation": 2,
        "Sursalaire": 3,
        "Prime d'ancienneté": 4,
        "Heures Supplémentaires": 5,
        "Indemnité résidence": 6,
        "Indemnité logement": 7,
        "Indemnité astreinte": 8,
        "Indemnité technicité": 9,
        "Indemnité transport": 10,
        "Indemnité responsabilité": 11,
        "Indemnité spécifique": 12,
        "Indemnité réseau": 13,
        "Indemnité risque": 14,
        "Indemnité garde": 15,
        "Indemnité autres": 16,
    }
    retenues_order = {
        "Cotisation Caisse Sociale": 1,
        "Cotisation Assurance": 2,
        "Avances sur Solde": 3,
        "Remboursement Caisse Sociale": 4,
        "CNSS Employé": 5,
        "CNSS Patronale": 6,
        "CARFO Employé": 7,
        "CARFO Patronale": 8,
        "IUTS Brut": 9,
        "IUTS Net": 10,
        "FSP": 11,
        "Retenue Vacation": 12,
    }

    # Trier les listes selon l'ordre défini, en affectant 999 par défaut si non trouvé.
    sorted_avoirs = sorted(avoirs_details, key=lambda x: avoirs_order.get(x["libelle"], 999))
    sorted_retenues = sorted(retenues_details, key=lambda x: retenues_order.get(x["libelle"], 999))

    # 4. Fusionner les listes : d'abord tous les avoirs, puis toutes les retenues
    merged_details = []
    for a in sorted_avoirs:
        merged_details.append({
            "designation": a["libelle"],
            "avoirs": a["montant"],
            "retenues": ""
        })
    for r in sorted_retenues:
        merged_details.append({
            "designation": r["libelle"],
            "avoirs": "",
            "retenues": r["montant"]
        })

    totaux = {
        "salaire_net": fiche_de_paie.salaire_net_a_payer or 0,
        "vacation_net": fiche_de_paie.vacation_net_a_payer or 0,
        "net_a_payer": fiche_de_paie.net_a_payer or 0,
    }

    context = {
        "employe": employe,
        "fiche": fiche_de_paie,
        "parametres": parametres,
        "logo_url": escape(logo_url),
        "elements": merged_details,  # Tableau final à trois colonnes
        "totaux": totaux,
        "employe_detail": employe_detail,

    }

    html_string = render_to_string("bulletin_template.html", context)
    response = HttpResponse(content_type="application/pdf")
    HTML(string=html_string, base_url=request.build_absolute_uri()).write_pdf(response)
    return response



class RapportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        periode_id = request.GET.get("periode")
        element = request.GET.get("element")
        sous_element = request.GET.get("sous_element")
        banque_id = request.GET.get("banque_id")
        projet_id = request.GET.get("projet_id")  # <-- Ajout du projet

        if not periode_id or not element:
            return Response({"lignes": [], "total": 0})

        fiches = FicheDePaie.objects.filter(session_de_paie_id=periode_id)

        # Filtre projet
        if projet_id:
            fiches = fiches.filter(employe__projet_id=projet_id)

        # Masse salariale par banque
        if element == "banques":
            if banque_id:
                fiches = fiches.filter(employe__detail__banque__id=banque_id)
                # Détail par employé pour la banque sélectionnée
                lignes = fiches.values(
                    "employe_id", "employe__nom", "employe__prenom"
                ).annotate(montant=Sum("masse_salariale_mensuelle"))
                total = fiches.aggregate(total=Sum("masse_salariale_mensuelle"))["total"] or 0
                data = {
                    "lignes": [
                        {
                            "employe_id": l["employe_id"],
                            "nom": l["employe__nom"],
                            "prenom": l["employe__prenom"],
                            "montant": l["montant"] or 0
                        }
                        for l in lignes
                    ],
                    "total": total
                }
                return Response(data)
            else:
                # Récap global par banque
                lignes = fiches.values(
                    "employe__detail__banque__id",
                    "employe__detail__banque__nom"
                ).annotate(montant=Sum("masse_salariale_mensuelle"))
                total = fiches.aggregate(total=Sum("masse_salariale_mensuelle"))["total"] or 0
                data = {
                    "lignes": [
                        {
                            "banque_id": l["employe__detail__banque__id"],
                            "banque_nom": l["employe__detail__banque__nom"] or "Non renseignée",
                            "montant": l["montant"] or 0
                        }
                        for l in lignes
                    ],
                    "total": total
                }
                return Response(data)

        # Taxes détaillées
        if element == "taxes":
            if sous_element not in ["iuts_net", "fsp", "retenue_vacation"]:
                return Response({"lignes": [], "total": 0})
            field = f"taxes__{sous_element}"
            lignes = fiches.values(
                "employe_id", "employe__nom", "employe__prenom"
            ).annotate(montant=Sum(field))
            total = fiches.aggregate(total=Sum(field))["total"] or 0

        # Sécurité sociale détaillée
        elif element == "securite_sociale":
            if sous_element not in ["cnss_patronale", "cnss_employe", "carfo_patronale", "carfo_employe"]:
                return Response({"lignes": [], "total": 0})
            field = f"securite_social__{sous_element}"
            lignes = fiches.values(
                "employe_id", "employe__nom", "employe__prenom"
            ).annotate(montant=Sum(field))
            total = fiches.aggregate(total=Sum(field))["total"] or 0

        # Salaires, vacation, masse salariale globale
        elif element == "salaires":
            lignes = fiches.values(
                "employe_id", "employe__nom", "employe__prenom"
            ).annotate(montant=Sum("salaire_net_a_payer"))
            total = fiches.aggregate(total=Sum("salaire_net_a_payer"))["total"] or 0

        elif element == "vacation":
            lignes = fiches.values(
                "employe_id", "employe__nom", "employe__prenom"
            ).annotate(montant=Sum("vacation_net_a_payer"))
            total = fiches.aggregate(total=Sum("vacation_net_a_payer"))["total"] or 0

        elif element == "masse_salariale":
            lignes = fiches.values(
                "employe_id", "employe__nom", "employe__prenom"
            ).annotate(montant=Sum("masse_salariale_mensuelle"))
            total = fiches.aggregate(total=Sum("masse_salariale_mensuelle"))["total"] or 0

        else:
            return Response({"lignes": [], "total": 0})

        data = {
            "lignes": [
                {
                    "employe_id": l["employe_id"],
                    "nom": l["employe__nom"],
                    "prenom": l["employe__prenom"],
                    "montant": l["montant"] or 0
                }
                for l in lignes
            ],
            "total": total
        }
        return Response(data)