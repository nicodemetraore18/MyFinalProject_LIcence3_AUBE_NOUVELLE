from django.conf import settings
from django.conf.urls.static import static
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    ProjetViewSet,
    PosteViewSet,
    EmployeViewSet,
    FicheDePaieViewSet,
    SaveFicheDePaieView,
    MeView,
    PeriodePaiementViewSet,
    MyTokenObtainPairView,
    ParametreViewSet,
    BanqueViewSet,
    all_paiements,
    periode_status_list,
    paiements_paye,
    paiements_non_paye,
    effectuer_paiement,        # Votre endpoint de paiement
    cloturer_periode,
    ComposantBaseViewSet,
    PrimeViewSet,
    HeureSupplementaireViewSet,
    IndemniteViewSet,
    SecuriteSocialViewSet,
    ExonerationViewSet,
    TaxesViewSet,
    CotisationViewSet,
    RemboursementViewSet,
    generate_payslip_pdf,
)

router = DefaultRouter()
router.register('projets', ProjetViewSet)
router.register('postes', PosteViewSet)
router.register('employes', EmployeViewSet)
router.register('fiches-de-paie', FicheDePaieViewSet)  # anciennement "salaires"
router.register('periodes', PeriodePaiementViewSet)
router.register('parametres', ParametreViewSet)
router.register('banques', BanqueViewSet, basename='banques')
router.register('composant-base', ComposantBaseViewSet, basename='composant-base')
router.register('primes', PrimeViewSet, basename='primes')
router.register('heures-sup', HeureSupplementaireViewSet, basename='heures-sup')
router.register('indemnites', IndemniteViewSet, basename='indemnites')
router.register('securite-social', SecuriteSocialViewSet, basename='securite-social')
router.register('exonerations', ExonerationViewSet, basename='exonerations')
router.register('taxes', TaxesViewSet, basename='taxes')
router.register('cotisations', CotisationViewSet, basename='cotisations')
router.register('remboursements', RemboursementViewSet, basename='remboursements')

urlpatterns = [
    # Déclarez d'abord vos endpoints personnalisés
    path('paiements/<int:periode_id>/payer/', effectuer_paiement, name='effectuer_paiement'),

    # Ici, vous pouvez ajouter d'autres endpoints personnalisés si besoin

    # Ensuite, incluez les routes du routeur
    path('', include(router.urls)),

    # Les autres routes existantes
    path("me/", MeView.as_view(), name="me"),
    path('paiements/<int:periode_id>/payes', paiements_paye, name='paiements_payes'),
    path('paiements/<int:periode_id>/nonpayes', paiements_non_paye, name='paiements_nonpayes'),
    path('api/periodes/status/', periode_status_list, name='periode-status-list'),
    path("api/token/", MyTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path('paiements/', all_paiements, name='all_paiements'),
    path('paiements/periodes/<int:periode_id>/cloturer/', cloturer_periode, name='cloturer_periode'),
    path("fiches-de-paie/save", SaveFicheDePaieView.as_view(), name="save-fiche-de-paie"),
    path("api/payslip/<int:periode_id>/<int:employe_id>/", generate_payslip_pdf, name="generate_payslip_pdf")

]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
