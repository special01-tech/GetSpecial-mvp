# Brique Config

## Rôle
Valide et expose les variables d'environnement au démarrage sans exposer de secrets au navigateur.

## Entrées
- Variables d'environnement `process.env` (.env, .env.local).

## Sorties
- Objet `env` typé et garanti par `EnvSchema`.

## Règles
1. Pas de clé service role ou LLM préfixée par `NEXT_PUBLIC_`.
2. Erreur explicite au démarrage en production si une variable critique manque.
3. Valeurs par défaut sécurisées pour le développement local.
