# Brique Closing

## Rôle
Gestion des clôtures de service (saisie des couverts réels) et calcul de la baseline `B`.

## Entrées
- Total de couverts servis, service (midi/soir), date de service, présence d'offre.

## Sorties
- Enregistrement de clôture, médiane des 8 dernières clôtures sans offre.

## Règles
1. La baseline `B` est la médiane des 8 dernières clôtures SANS offre active (même jour/service).
2. Si moins de 4 clôtures comparables sont disponibles, on utilise la valeur déclarée (étiquette "déclaré").
