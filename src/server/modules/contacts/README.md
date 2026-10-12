# Brique : contacts

## Rôle
Gestion des contacts clients : recueil de consentement explicite, désinscription (opt-out), export CSV et suppression RGPD.

## Entrées
- Données contact : type ('email' | 'phone'), valeur, texte de consentement, restaurantId, offerId optionnel.

## Sorties
- Enregistrement contact sécurisé dans Supabase.
- Flux CSV pour l'export gérant.

## Règles
- Consentement horodaté obligatoire (`consent_text` et `consent_at`).
- Pas de consentement => rejet immédiat.
- Désinscription immédiate sur demande (`unsubscribed = true`).
- Filtrage strict par restaurantId.

## Tests
- Validation format email/téléphone et présence obligatoire du consentement.
