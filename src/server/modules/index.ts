/* =============================================================================
 * GetSpecial Backend — Registre des Modules
 *
 * Architecture modulaire calquée sur la boucle produit :
 *
 * 1. 🧠 KNOW    : context-store       → Connaît chaque restaurant
 * 2. 👀 OBSERVE : signal-collector    → Signaux externes (météo, événements)
 * 3. 💡 THINK   : opportunity-engine  → Scoring & pertinence de communication
 * 4. ✍️ CREATE  : content-generator   → Génération de textes et visuels
 * 5. 📣 PUBLISH : publisher           → Planification & publication multi-plateformes
 * 6. 🔄 LEARN   : feedback-loop       → Corrélation ventes caisse ↔ publications
 *
 * + 🔐 AUTH     : auth                → Gestion des comptes & sessions
 * ============================================================================= */

export * from './context-store';
export * from './signal-collector';
export * from './opportunity-engine';
export * from './content-generator';
export * from './publisher';
export * from './feedback-loop';
