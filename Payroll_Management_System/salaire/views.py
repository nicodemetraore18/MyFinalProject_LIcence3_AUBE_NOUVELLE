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
        # Option : ne pas faire ce check manuellement et laisser le serializer faire son travail.
            serializer = FicheDePaieSerializer(data=data)
            if serializer.is_valid():
                fiche_saved = serializer.save()
                logger.info("Fiche de paie sauvegardée: %s", fiche_saved.id)
                return Response({"message": "Fiche de paie sauvegardée avec succès", "data": serializer.data}, status=status.HTTP_201_CREATED)
            else:
                logger.error("Erreur de validation: %s", serializer.errors)
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.exception("Exception lors de la sauvegarde de la fiche de paie")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        

def generate_payslip_pdf(request, periode_id, employe_id):
    employe = get_object_or_404(Employe, id=employe_id)
    fiche_de_paie = FicheDePaie.objects.filter(
    employe=employe,
    session_de_paie_id=periode_id
    ).order_by('-created_at').first()

    if not fiche_de_paie:
      return HttpResponse("Aucune fiche de paie trouvée.", status=404)

    parametres = Parametre.objects.first()

    # Vérifier si le logo existe et corriger le chemin
    logo_url = f"{request.build_absolute_uri(settings.MEDIA_URL)}{parametres.logo.name}" if parametres and parametres.logo else ""

    print(f"✅ LOGO URL FOR PDF (Corrected): {logo_url}")  # 🔍 Debug
    if not fiche_de_paie:
        return HttpResponse("Aucune fiche de paie trouvée.", status=404)

    # Récupérer et additionner les montants liés
    avoirs = [
        {"nom": "Salaire de Base", "montant": fiche_de_paie.base_components.aggregate(Sum("salaire_de_base"))["salaire_de_base__sum"] or 0},
        {"nom": "Primes", "montant": fiche_de_paie.primes.aggregate(Sum("sursalaire"))["sursalaire__sum"] or 0 + fiche_de_paie.primes.aggregate(Sum("prime_anciennete"))["prime_anciennete__sum"] or 0},
        {"nom": "Heures Supplémentaires", "montant": fiche_de_paie.heures_supplementaires.aggregate(Sum("montant"))["montant__sum"] or 0},
        {"nom": "Indemnités", "montant": fiche_de_paie.indemnites.aggregate(Sum("indemnite_residence"))["indemnite_residence__sum"] or 0 + 
                                fiche_de_paie.indemnites.aggregate(Sum("indemnite_logement"))["indemnite_logement__sum"] or 0},
    ]

    cnss_employe = fiche_de_paie.securite_social.aggregate(Sum("cnss_employe"))["cnss_employe__sum"]
    carfo_employe = fiche_de_paie.securite_social.aggregate(Sum("carfo_employe"))["carfo_employe__sum"]

    retenues = [
        {"nom": "Cotisations", "montant": fiche_de_paie.cotisations.aggregate(Sum("cotisation_caisse_sociale"))["cotisation_caisse_sociale__sum"] or 0},
        {"nom": "Remboursements", "montant": fiche_de_paie.remboursements.aggregate(Sum("avances_sur_solde"))["avances_sur_solde__sum"] or 0},
        {"nom": "Sécurité Sociale", "montant": (cnss_employe or 0) + (carfo_employe or 0)},
        {"nom": "Taxes", "montant": fiche_de_paie.taxes.aggregate(Sum("iuts_net"))["iuts_net__sum"] or 0},
    ]

    totaux = {
        "salaire_net": fiche_de_paie.salaire_net_a_payer or 0,
        "vacation_net": fiche_de_paie.vacation_net_a_payer or 0,
        "net_a_payer": fiche_de_paie.net_a_payer or 0,
    }

    html_string = render_to_string("bulletin_template.html", {
        "employe": employe,
        "fiche": fiche_de_paie,
        "parametres": parametres,
        "logo_url": escape(logo_url),
        "avoirs": avoirs,
        "retenues": retenues,
        "totaux": totaux,
    })
   

    response = HttpResponse(content_type="application/pdf")
    HTML(string=html_string, base_url=request.build_absolute_uri()).write_pdf(response)
    return response