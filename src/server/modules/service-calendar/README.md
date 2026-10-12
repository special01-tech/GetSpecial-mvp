# Brique Service-Calendar

## Rôle
Unique autorité pour déterminer la date de service, le créneau (midi/soir), l'ouverture et les créneaux creux.

## Entrées
- Date/heure actuelle UTC, fuseau horaire du restaurant, créneaux déclarés.

## Sorties
- Date de service (YYYY-MM-DD), type de service (midi/soir), statut creux/ouvert.

## Règles
1. `DAY_ROLLOVER_HOUR` = 4h : avant 4h du matin, le service compte pour la veille.
2. `SERVICE_CUTOFF_HOUR` = 16h : avant 16h = midi, à partir de 16h = soir.
3. Seuls les créneaux déclarés comme creux peuvent recevoir des offres.
