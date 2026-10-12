# Brique : restaurant-profile

## Rôle
Gestion du profil du restaurant, onboarding et paramètres économiques (capacité, ticket moyen, ratios matières, fuseau horaire).

## Entrées
- Identifiant restaurant (`restaurantId` ou `slug`).
- Données de mise à jour du profil (capacités, ratios, horaires, contraintes).

## Sorties
- Entité profil complet avec paramètres économiques et de contact.

## Règles
- Ne devine jamais les valeurs : utilise les déclarations réelles ou le repli documenté.
- Données persistées dans Supabase (Postgres).
- RLS actif : requêtes toujours isolées par `restaurantId`.

## Tests
- Validation des champs numériques (capacité > 0, foodCostPct entre 0 et 1).
