# Brique Counter

## Rôle
Gestion des scans, réclamations (claim), confirmations au comptoir et annulations.

## Entrées
- Scans QR, Réclamations client avec taille de groupe (1, 2, 3, 4+), Confirmation staff.

## Sorties
- Utilisations réelles, total personnes, conversions.

## Règles
1. Ne JAMAIS additionner claimed et confirmed. Une ligne = 1 utilisation.
2. Les personnes correspondent à la somme des `party_size`.
3. Annulation permise uniquement pendant 2 minutes (statut `cancelled`).
