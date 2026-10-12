# Brique Offer-Economics

## Rôle
Calculs purement financiers et économiques des offres : marge, coût de l'avantage, point mort, risque maximal, gain estimé et cannibalisation.

## Entrées
- Prix du plat `P`, ratio coût matière `foodCostPct`, remise `d` ou coût article offert `C`, baseline `B`, capacité salle.

## Sorties
- Marge `m`, Coût avantage `C`, Point mort `N*`, Risque maximal `-B*C`, Objectif de couverts.

## Règles
1. Si `C >= m` : offre strictement interdite.
2. Si `capacity <= B` : aucune offre proposée.
3. Le code recalcule et impose TOUS les chiffres (les chiffres du LLM sont ignorés).
