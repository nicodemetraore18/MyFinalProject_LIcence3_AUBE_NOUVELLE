# myapp/management/commands/seed_db.py

from django.core.management.base import BaseCommand
from salaire.models import (
    Parametre, Projet, Poste, Employe, DetailEmploye, 
    ElementSalaire, PeriodePaiement, Salaire, SalaireElement, Paiement
)
from faker import Faker
import random
from datetime import date, timedelta

class Command(BaseCommand):
    help = "Peuple la base de données avec des données fictives pour tous les modèles sauf User."

    def add_arguments(self, parser):
        parser.add_argument(
            '--projects',
            type=int,
            default=3,
            help="Nombre de projets à créer (default: 3)"
        )
        parser.add_argument(
            '--employees',
            type=int,
            default=5,
            help="Nombre d'employés par projet (default: 5)"
        )
        parser.add_argument(
            '--elements',
            type=int,
            default=5,
            help="Nombre d'éléments de salaire à créer (default: 5)"
        )
        parser.add_argument(
            '--periods',
            type=int,
            default=2,
            help="Nombre de périodes de paiement à créer (default: 2)"
        )
    def handle(self, *args, **options):
        fake = Faker('fr_FR')
        self.stdout.write(self.style.NOTICE("Début du peuplement de la base..."))

        # 1. Créer un Paramètre (un seul en général)
        parametre, created = Parametre.objects.get_or_create(
            salaire_minimum=30000,
            defaults={
                'taux_fonds_soutien_patriotique': 1.5,
                'taux_retenue_vacation': 5,
                'point_indiciaire': 100,
                'cnss_part_patronale': 16,
                'cnss_part_employe': 5.5,
                'carfo_part_patronale': 12,
                'carfo_part_employe': 8,
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS("Paramètre créé"))
        else:
            self.stdout.write(self.style.NOTICE("Paramètre existant"))

        # 2. Créer des projets
        num_projects = options.get('projects')
        project_list = []
        for i in range(num_projects):
            projet = Projet.objects.create(
                nom=f"Projet {fake.word().capitalize()}",
                description=fake.text(max_nb_chars=200),
                date_debut=fake.date_between(start_date='-2y', end_date='today'),
                date_fin=fake.date_between(start_date='today', end_date='+1y'),
                statut=random.choice(['en_attente', 'en_cours', 'termine'])
            )
            project_list.append(projet)
            self.stdout.write(self.style.SUCCESS(f"Projet créé : {projet.nom}"))

        # 3. Créer des postes pour chaque projet
        postes_all = []
        for projet in project_list:
            postes = []
            for j in range(3):  # 3 postes par projet
                poste = Poste.objects.create(
                    nom=f"Poste {fake.word().capitalize()}",
                    projet=projet
                )
                postes.append(poste)
                postes_all.append(poste)
            self.stdout.write(self.style.SUCCESS(f"{len(postes)} postes créés pour le projet {projet.nom}"))

        # 4. Créer des employés pour chaque projet
        num_employees = options.get('employees')
        employees_all = []
        for projet in project_list:
            postes_projet = Poste.objects.filter(projet=projet)
            for k in range(num_employees):
                poste = random.choice(list(postes_projet))
                employe = Employe.objects.create(
                    nom=fake.last_name(),
                    prenom=fake.first_name(),
                    poste=poste,
                    projet=projet,
                    est_actif=True
                )
                employees_all.append(employe)
                self.stdout.write(self.style.SUCCESS(f"Employé créé : {employe}"))
                # 5. Créer des détails pour chaque employé
                DetailEmploye.objects.create(
                    employe=employe,
                    statut_agent=random.choice(["Agent non FPH", "Agent FPH", "Vacataire", "Boursier", "Plateforme"]),
                    regime_prevoyance_sociale="",  # On pourra calculer cette valeur dans l'interface si besoin
                    numero_immatriculation=str(fake.random_number(digits=8, fix_len=True)),
                    nombre_charges_iuts=random.randint(0, 5),
                    cadre=random.choice([1, 2]),
                    indice=round(random.uniform(1, 10), 2)
                )

        # 6. Créer des éléments de salaire
        num_elements = options.get('elements')
        elements_list = []
        for l in range(num_elements):
            element = ElementSalaire.objects.create(
                nom=f"Elément {fake.word().capitalize()}",
                description=fake.sentence(),
                type_element=random.choice(['FIXE', 'VARIABLE']),
                default_value=round(random.uniform(1000, 10000), 2),
                est_actif=True
            )
            elements_list.append(element)
            self.stdout.write(self.style.SUCCESS(f"Élément de salaire créé : {element.nom}"))

        # 7. Créer des périodes de paiement
        num_periods = options.get('periods')
        periods_list = []
        current_year = date.today().year
        for m in range(num_periods):
            periode = PeriodePaiement.objects.create(
                mois=fake.month_name(),
                annee=current_year,
                cloture=random.choice([False, True])
            )
            periods_list.append(periode)
            self.stdout.write(self.style.SUCCESS(f"Période créé : {periode}"))

        # 8. Créer des salaires pour chaque employé
        for employe in employees_all:
            # Créer 1 à 2 salaires par employé
            for _ in range(random.randint(1,2)):
                periode = random.choice(periods_list)
                salaire = Salaire.objects.create(
                    employe=employe,
                    periode=periode,
                    montant=round(random.uniform(50000, 200000), 2),
                    date_versement=date.today() - timedelta(days=random.randint(0,30))
                )
                self.stdout.write(self.style.SUCCESS(f"Salaire créé pour {employe}: {salaire.montant} FCFA"))
                # 9. Pour chaque salaire, associer quelques éléments de salaire
                N = random.randint(1, min(3, len(elements_list)))
                chosen_elements = random.sample(elements_list, N)
                for el in chosen_elements:
                    valeur = round(random.uniform(1000, el.default_value), 2)
                    SalaireElement.objects.create(
                        salaire=salaire,
                        element=el,
                        valeur=valeur
                    )
                    self.stdout.write(self.style.SUCCESS(
                        f"--> SalaireElement ajouté : {el.nom} avec valeur {valeur} FCFA"
                    ))

        # 10. Créer des paiements pour certains employés
        for employe in random.sample(employees_all, k=min(len(employees_all), 5)):
            periode = random.choice(periods_list)
            Paiement.objects.create(
                employe=employe,
                periode=periode,
                montant=round(random.uniform(50000, 200000), 2),
                date_paiement=date.today() - timedelta(days=random.randint(0,30)),
                statut=random.choice(['payé', 'non_payé'])
            )
            self.stdout.write(self.style.SUCCESS(f"Paiement créé pour {employe}"))

        self.stdout.write(self.style.SUCCESS("Peuplement de la base terminé avec succès."))
