# Brique Knowledge-Base

## Rôle
Charge et découpe le document métier `docs/knowledge/getspecial-base-de-connaissances.md` pour injecter uniquement les sections utiles dans le prompt du LLM.

## Entrées
- Sections demandées (5.8, 7, 10, 12, 13).

## Sorties
- Extrait formaté en Markdown pour injection de prompt.

## Règles
1. Si le fichier est absent, ne bloque jamais l'application (log simple de notice).
2. Seules les sections strictement nécessaires sont transmises pour économiser les tokens.
