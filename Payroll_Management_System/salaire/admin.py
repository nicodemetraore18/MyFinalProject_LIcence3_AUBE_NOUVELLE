# admin.py
from django.contrib import admin
from django.contrib.auth import get_user_model
from .models import (
    User, Banque, Projet, Poste, Employe, DetailEmploye,
    ComposantBase, Prime, HeureSupplementaire, Indemnite, SecuriteSocial,
    Exoneration, Taxes, Cotisation, Remboursement,
    PeriodePaiement, FicheDePaie, SignaturePaie, Paiement, Parametre
)

User = get_user_model()
admin.site.register(User)
admin.site.register(Banque)
admin.site.register(Projet)
admin.site.register(Poste)
admin.site.register(Employe)
admin.site.register(DetailEmploye)
admin.site.register(ComposantBase)
admin.site.register(Prime)
admin.site.register(HeureSupplementaire)
admin.site.register(Indemnite)
admin.site.register(SecuriteSocial)
admin.site.register(Exoneration)
admin.site.register(Taxes)
admin.site.register(Cotisation)
admin.site.register(Remboursement)
admin.site.register(PeriodePaiement)
admin.site.register(FicheDePaie)
admin.site.register(SignaturePaie)
admin.site.register(Paiement)
admin.site.register(Parametre)
