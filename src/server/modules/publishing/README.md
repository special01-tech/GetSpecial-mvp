# Brique : publishing

## Rôle
Gestion de la publication des offres sur les réseaux sociaux (Instagram, Facebook, Google My Business) et journalisation sécurisée des envois.

## Entrées
- Données de publication : postId, restaurantId, plateforme, image/texte.

## Sorties
- Journal de publication (`Publication` entity) avec horodatage, statut et clé d'idempotence.

## Règles
- Idempotence stricte : empêche tout double envoi sur les réseaux.
- Enregistrement immédiat dans la table `publications` de Supabase.

## Tests
- Vérification de l'unicité de la clé d'idempotence.
