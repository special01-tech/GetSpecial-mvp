# Brique Auth-PIN

## Rôle
Gestion de l'authentification par code PIN (Staff en salle, Admin gérant) et sessions sécurisées.

## Entrées
- Code PIN (4 chiffres pour le staff, 6 chiffres pour l'admin), IP cliente.

## Sorties
- Hash scrypt, validation booléenne, statut de blocage par tentative.

## Règles
1. Hachage via `crypto.scrypt` natif avec sel applicatif.
2. Limitation à 5 erreurs consécutives par IP et par restaurant => blocage 5 minutes.
3. Sessions par cookie signé `httpOnly` et `SameSite=Lax`.
