# Brique : history

## Rôle
Consultation en lecture seule de l'historique des publications, des propositions de l'Opportunity Engine et des performances passées.

## Entrées
- restaurantId, filtres de dates optionnels.

## Sorties
- Liste paginée ou chronologique des publications et opportunités passées.

## Règles
- Strictement en lecture seule : aucune mutation sur les tables d'historique.
- Filtrage systématique par restaurantId.

## Tests
- Requêtes isolées par restaurant.
