# Brique Morning-Summary

## Rôle
Calcul à la demande du bilan de la veille et recommandation déterministe (Garder / Ajuster / Laisser).

## Entrées
- Objectif cible, personnes réelles servies, gain estimé (si >= 4 clôtures comparables).

## Sorties
- Taux d'atteinte, recommandation (garder | ajuster | laisser), justification textuelle.

## Règles
1. Atteinte >= 100% et gain >= 0 => "Garder".
2. Atteinte entre 30% et 99% (ou objectif atteint mais gain négatif) => "Ajuster".
3. Atteinte < 30% => "Laisser".
4. Chaque décision enregistre le motif en un clic.
