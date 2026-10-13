# GetSpecial : base de connaissances « Restauration, offres et calculs »

Document destiné à l'IA de GetSpecial (moteur d'opportunités). Il explique comment fonctionne un restaurant, comment se calculent les coûts, les marges et l'effet d'une offre, comment fixer un objectif, le suivre, et décider quoi faire du résultat.

Règle d'or : **chaque chiffre est calculé par le code à partir des données du restaurant. Le modèle de langage n'invente jamais un chiffre.** Quand une donnée manque, il le dit, utilise une valeur de départ marquée « estimé », et demande au gérant de la confirmer.

---

## 0. Comment utiliser ce document

Ordre de travail du moteur, à chaque cycle :

1. **Filtrer** : le restaurant est-il ouvert ? Le créneau visé est-il un creux déclaré ? Reste-t-il de la place ? Limites de publication atteintes ?
2. **Calculer** : marge par couvert, coût de l'avantage, point mort, objectif (sections 4 à 7).
3. **Proposer** : une fiche de proposition complète (section 10).
4. **Mesurer** : scans, utilisations, personnes, couverts totaux (section 8).
5. **Décider** : garder, ajuster ou laisser, avec la raison (section 9).
6. **Apprendre** : mémoriser le résultat par type d'offre, créneau et météo (section 11).

### Constantes du moteur (nommées, modifiables, à valider avec les premiers restaurants)

| Constante | Valeur de départ | Rôle |
|---|---|---|
| `OBJECTIVE_SHARE` | 0,25 | Part des places habituellement vides qu'on vise de remplir |
| `SUCCESS_THRESHOLD` | 1,00 | Taux d'atteinte pour parler de succès |
| `PARTIAL_THRESHOLD` | 0,30 | En dessous : échec |
| `MIN_CLOSINGS_FOR_EFFECT` | 4 | Clôtures minimales d'un même jour et service avant d'afficher un effet |
| `MIN_TRIALS_FOR_LEARNING` | 3 | Essais minimaux avant d'ajuster les scores d'un type d'offre |
| `EXPLORATION_RATE` | 0,10 à 0,20 | Part des propositions qui testent un angle nouveau |
| `MAX_ACTIVE_OFFERS` | 3 | Offres actives en même temps |
| `MAX_POSTS_PER_DAY` | 2 | Publications par jour |
| `DEFAULT_FOOD_COST_PCT` | 0,30 | Coût matière des repas si inconnu (marquer « estimé ») |
| `DEFAULT_DRINK_COST_PCT` | 0,22 | Coût matière des boissons si inconnu (marquer « estimé ») |

---

## 1. Vocabulaire de base (glossaire)

| Terme | Définition | Formule |
|---|---|---|
| **Couvert** | Une personne servie. Une table de 4 = 4 couverts, 1 addition. | |
| **Capacité de service** (`capacityCovers`) | Nombre **maximum de couverts** que le restaurant peut servir pendant un service (places × rotations possibles). Attention : « un restaurant de 40 couverts » veut souvent dire 40 places. | places × rotations |
| **Rotation** | Nombre de fois qu'une table est servie pendant un service. | couverts servis ÷ places |
| **Service** | Période de vente : midi, soir (parfois goûter, brunch). | |
| **Creux / coup de feu** | Creux : peu de clients. Coup de feu : pic d'affluence. | |
| **Taux de remplissage** | Part de la capacité utilisée. | couverts servis ÷ `capacityCovers` |
| **Chiffre d'affaires (CA)** | Ventes. On raisonne **hors taxe (HT)**. | couverts × ticket moyen HT |
| **Ticket moyen** | Ce que paie un couvert, boissons comprises. | CA HT ÷ couverts |
| **Prix HT** | Prix sans taxe. | prix TTC ÷ (1 + taux de taxe) |
| **Coût de revient d'un plat** | Coût des ingrédients d'une portion. | Σ(quantité × prix unitaire) ÷ portions, en tenant compte des pertes |
| **Coût matière (%)** (`foodCostPct`) | Part du prix qui part en ingrédients. | coût de revient ÷ prix HT |
| **Marge brute par couvert** (`m`) | Ce qui reste après la matière. | prix HT − coût de revient |
| **Taux de marge** | Marge en pourcentage du prix. | marge ÷ prix HT |
| **Coefficient multiplicateur** | Prix de vente HT = coût de revient × coefficient. Coefficient 3 ≈ coût matière 33 %. | prix HT ÷ coût de revient |
| **Coûts variables** | Augmentent avec chaque client : matière, emballages, commissions de livraison ou de paiement. | |
| **Coûts fixes** | Payés même sans client : loyer, assurances, abonnements, énergie de base. | |
| **Personnel** | Coût planifié à l'avance : quasi fixe à court terme. | |
| **Prime cost** | Matière + personnel. Repère courant : 55 à 65 % du CA. | (matière + personnel) ÷ CA |
| **Seuil de rentabilité** | Couverts à servir pour couvrir les coûts du service. | coûts fixes et personnel du service ÷ marge brute moyenne par couvert |
| **Couverts habituels** (`B`) | Couverts d'un jour et d'un service donnés **sans offre**. | médiane des 8 dernières clôtures sans offre, ou valeur déclarée tant qu'il y en a moins de 4 |
| **Clôture** | Total des couverts (et du CA) à la fermeture. Le gérant l'a déjà sur son rapport de caisse. | |

Valeurs de départ courantes (à remplacer par les vraies données du lieu, elles varient selon le pays et le concept) : coût matière repas 25 à 35 %, boissons alcoolisées 18 à 25 %, personnel 25 à 35 % du CA, résultat net 3 à 10 %, commissions des plateformes de livraison souvent entre 15 et 30 %.

---

## 2. Offre, demande et créneaux creux

- **Offre (au sens économique)** : ce que le restaurant peut servir : places, plats, horaires, équipe, capacité de cuisine.
- **Demande** : combien de clients veulent venir à un moment donné. Elle dépend du jour, de l'heure, de la météo, des événements, de la période du mois (fin de mois souvent plus calme), des vacances, des prix, de la concurrence et de la notoriété.
- **Creux** : la demande est inférieure à l'offre. Le restaurant paie une équipe et des charges pour des places vides.
- **Offre promotionnelle** (à ne pas confondre) : une action commerciale qui crée de la demande à un moment précis, en baissant le prix effectif ou en ajoutant de la valeur.

Principes :
1. Une promotion **déplace ou crée** de la demande, elle ne la fabrique pas à l'infini : la capacité est une limite.
2. **Ne jamais promouvoir un créneau déjà plein** : on baisse le prix de clients qui auraient payé plein tarif.
3. Une promotion n'est qu'**un des facteurs** : un soir de pluie ou de match peut tout changer, d'où l'intérêt de mesurer plusieurs fois.
4. **Cannibalisation** : les clients habituels qui profitent de l'offre sans qu'elle les ait fait venir. C'est le principal risque.

---

## 3. Fonctionnement d'une journée type (à adapter au lieu)

| Moment | Ce qui se passe | Lien avec GetSpecial |
|---|---|---|
| Matin | Commandes fournisseurs, préparation, menu du jour | Produits à écouler, plat du jour |
| Midi (environ 11h30 à 14h) | Service du midi | Formules, menu du jour |
| Après-midi (environ 14h30 à 18h30) | Creux, ménage, pause équipe, préparation du soir | Happy hour, goûter, afterwork |
| Soir (environ 19h à 22h) | Service du soir, coup de feu en milieu de service | Remplir les soirs creux |
| Fermeture | Clôture de caisse : couverts et CA | **Saisie des couverts totaux (30 secondes)** |

Semaine : lundi et mardi souvent creux, jeudi en montée, vendredi et samedi en pic, dimanche midi souvent familial. Ces schémas varient selon le pays et le concept : **toujours préférer les créneaux creux déclarés par le gérant.**

Contraintes d'exploitation à respecter :
- L'équipe est planifiée à l'avance : une offre qui amène trop de monde sur un petit effectif dégrade le service. Respecter la capacité de service.
- Les produits frais se perdent : une offre peut servir à écouler un stock (gain = perte évitée).
- Le gérant a peu de temps pendant le service : toute action de comptage doit tenir en un geste.
- Publier assez tôt pour être vu : pour un service du soir, publier plusieurs heures avant (ex. 15h pour 19h30).

---

## 4. Coûts et marges : comment calculer

### 4.1 Coût de revient et marge d'un plat

```
coutRevient   = somme(quantite × prixUnitaire) / nbPortions   (en comptant les pertes)
prixHT        = prixTTC / (1 + tauxTaxe)
foodCostPct   = coutRevient / prixHT
margeBrute    = prixHT − coutRevient
```

### 4.2 Marge moyenne par couvert

```
P = ticket moyen HT
c = P × foodCostPct          (coût matière moyen par couvert)
m = P − c                    (marge brute moyenne par couvert)
```

Exemple : P = 25 €, `foodCostPct` = 0,30 → c = 7,50 €, m = 17,50 €.

### 4.3 Résultat d'un service et seuil de rentabilité

```
CA            = couverts × P
margeBrute    = couverts × m
resultat      = margeBrute − (personnel + loyer et charges du service)
seuil         = (personnel + loyer et charges du service) / m
```

Exemple : coûts du service 270 €, m = 17,50 € → seuil = 15,4, soit 16 couverts. Avec 12 couverts : 12 × 17,50 − 270 = **−60 €**. Avec 55 couverts : 55 × 17,50 − 270 = **+692,50 €**.

### 4.4 Pourquoi un couvert de creux est précieux

Quand l'équipe et le loyer sont déjà payés, un couvert en plus coûte **seulement sa matière** : il rapporte presque toute sa marge `m`. C'est ce qui justifie de remplir les creux, et seulement les creux.

### 4.5 Si des données manquent

| Donnée manquante | Action |
|---|---|
| `foodCostPct` | Utiliser 0,30 (repas) ou 0,22 (boissons), afficher « estimé », demander confirmation au gérant |
| Ticket moyen en nombre | Demander. Ne pas calculer sans lui |
| Couverts habituels | Utiliser la valeur déclarée, afficher « déclaré » |
| Capacité de service | Demander. Sans elle, pas d'objectif |
| Coûts fixes du service | Facultatif. Sans eux, ne pas calculer de seuil de rentabilité |

---

## 5. Types d'offres : mécanique, coût et point mort

Notations : `B` couverts habituels, `u` part des habitués qui profitent de l'offre (0 à 1), `N` nouveaux couverts amenés par l'offre, `C` coût de l'avantage **par utilisateur**, `m` marge brute par couvert.

### 5.0 Formule générale (valable pour tout type d'offre)

```
personnes (utilisateurs de l'offre) = B×u + N
gain en marge = N × m − personnes × C
point mort    N* = B × u × C / (m − C)        (si m > C, sinon l'offre perd de l'argent à chaque utilisation)
risque maximal (aucun nouveau client, tous les habitués en profitent) = − B × C
```

Lecture : chaque nouveau client rapporte `m` ; chaque utilisateur, nouveau ou habitué, coûte `C`.

### 5.1 Remise en pourcentage (`d`)

```
C  = d × P
```
Exemple : P = 25 €, `m` = 17,50 €, d = 20 % → C = 5 €. B = 12, u = 1 : N* = 12 × 5 / 12,50 = 4,8, soit **5 nouveaux couverts** pour ne pas perdre. Avec 8 nouveaux : 8 × 17,50 − 20 × 5 = **+40 €**. Avec 3 : 3 × 17,50 − 15 × 5 = **−22,50 €**.
- Règle : `d × P` doit rester **strictement inférieur à `m`** et `d` ≤ `maxDiscountPct` du restaurant.
- Risque : image prix, attire les chasseurs de promos. À utiliser avec prudence pour un restaurant haut de gamme.

### 5.2 Article offert (dessert, café, boisson)

```
C  = coût matière de l'article offert (le prix du ticket ne change pas)
```
Exemple : dessert offert, coût 1,50 €. N* = 12 × 1,50 / (17,50 − 1,50) = 1,1, soit **2 nouveaux couverts**. Valeur perçue par le client (6 à 7 €) bien supérieure au coût réel.
- Meilleur rapport risque / bénéfice dans la plupart des cas. Conditionner l'offert à une commande (ex. « avec un plat ») pour limiter le coût.

### 5.3 Formule à prix fixe (plat + dessert, entrée + plat…)

```
mF = F − coutRevientFormule               (marge de la formule)
si mF >= m : la formule ne dégrade pas la marge (elle peut l'améliorer) → pas de point mort à franchir
sinon      : C = m − mF       puis appliquer la formule générale 5.0
```
Utile pour pousser des plats à forte marge ou augmenter le ticket du midi.

### 5.4 Happy hour (boissons à prix réduit sur une plage horaire)

```
pd = prix d'une boisson ; x = réduction ; k = boissons par personne
mD = pd × (1 − x) − pd × DRINK_COST_PCT          (marge par boisson réduite)
C  = k × x × pd                                     (coût par utilisateur)
gain = N × (k × mD + a × mAliment) − (B×u + N) × C   (a = part qui mange en plus, mAliment = marge sur la nourriture)
```
Utile sur les creux de 15h à 18h30. Respecter les règles locales sur les promotions d'alcool.

### 5.5 Deux pour un

Équivaut à une remise d'environ 50 % sur le deuxième couvert. Forte cannibalisation, point mort élevé. **À éviter**, sauf creux très marqué et marge confortable (vérifier `d × P < m`).

### 5.6 Plat ou menu du jour (écoulement de stock)

Gain = marge des ventes + **perte évitée** (valeur du stock qui aurait été jeté). À proposer quand le gérant signale un surplus.

### 5.7 Autres leviers (sans remise)

Offre groupe (bouteille ou dessert pour 6 personnes et plus), soirée thématique, match, quiz, dégustation, fidélité (le 10e offert : coût ≈ 1 article pour 10 visites). Le levier est la fréquentation, pas le prix.

### 5.8 Choisir le type d'offre (ordre de préférence, à adapter)

1. Article offert conditionné.
2. Formule à marge saine.
3. Happy hour sur créneau creux précis.
4. Remise en pourcentage, plafonnée.
5. Deux pour un : seulement en dernier recours.

L'IA tient aussi compte de `specialties`, `tone`, des interdits du restaurant, des refus récents et de l'historique de résultats.

---

## 6. Objectif : comment le fixer

```
placesVidesHabituelles = capacityCovers − B
si placesVidesHabituelles <= 0 : pas de proposition (salle déjà pleine)
objectifPersonnes = max(1, arrondi(OBJECTIVE_SHARE × placesVidesHabituelles))
```

Exemple : capacité 40, B = 12 → 28 places vides → objectif = **7 personnes**.

- L'objectif est un **but de départ**, pas une prévision. Ne jamais l'appeler « estimation de couverts incrémentaux ».
- Il est modifiable par le gérant, offre par offre.
- Vérifier la cohérence : objectif × `m` doit pouvoir couvrir le coût maximal (voir risque maximal en 5.0). Sinon, réduire l'avantage.

---

## 7. Avant de proposer : les contrôles obligatoires

- Créneau visé = créneau creux déclaré par le gérant. Sinon, ne rien proposer.
- Restaurant ouvert, pas plus de `MAX_POSTS_PER_DAY` publications, pas plus de `MAX_ACTIVE_OFFERS` offres actives.
- `C` strictement inférieur à `m`. Remise ≤ `maxDiscountPct`.
- Respect des interdits du restaurant (alcool, plats, ton).
- Ne pas répéter un angle récemment refusé (pénalité de rejet) ; explorer de temps en temps (`EXPLORATION_RATE`).
- La météo est un **angle** (terrasse au soleil, plat réconfortant sous la pluie, livraison), pas un déclencheur.

---

## 8. Suivi : ce qu'on mesure et comment

| Mesure | Comment elle est captée |
|---|---|
| Portée, clics | Réseaux sociaux (quand connectés) |
| **Scans** (visites de la page QR) | Page QR, comptés par appareil unique |
| **Réclamations** (claims) | Le client touche « Profiter de l'offre », indique la taille du groupe et la source |
| **Confirmations** | Le serveur confirme au comptoir : la réclamation correspondante **passe** de réclamée à confirmée (jamais d'addition) |
| **Utilisations** | Lignes uniques non annulées |
| **Personnes** | Somme des tailles de groupe des utilisations |
| **Source** | Instagram, Facebook, Google, passage, ami, autre |
| **Couverts totaux** | Saisis par le gérant à la fermeture |

### Indicateurs, en trois niveaux

**Niveau 1, usage** : utilisations, personnes, taux d'atteinte = personnes ÷ objectif, taux scan → réclamation, taux réclamation → confirmation.

**Niveau 2, effet** (seulement si au moins `MIN_CLOSINGS_FOR_EFFECT` clôtures du même jour et du même service) :
```
effet            = couvertsTotaux − B           (nouveaux couverts nets, N estimé)
partDeLOffre     = personnes ÷ couvertsTotaux
cannibalisation  = max(0, personnes − effet)    (clients probablement venus de toute façon)
```
Sinon afficher **« pas assez de données »**. Un seul soir ne prouve rien (météo, match, fête).

**Niveau 3, rentabilité estimée** (si l'effet est disponible) :
```
gainEstime = effet × m − personnes × C
```
Afficher toujours « estimation ».

Exemple : objectif 7, 3 utilisations (groupes de 2, 4 et 1) → 7 personnes, atteinte 100 %. Clôture : 17 couverts, B = 12 → effet +5, cannibalisation ≈ 2. Avec `C` = 1,50 € (dessert offert) et m = 17,50 € : gain ≈ 5 × 17,50 − 7 × 1,50 = **+77 €**.

Limites à rappeler : un couvert n'est pas un client unique (la même personne peut venir trois fois), les couverts habituels déclarés sont une approximation au début, le comptage dépend de la discipline du serveur.

---

## 9. Résultat et décision : que faire ensuite

### Règle de décision

| Situation | Décision |
|---|---|
| Atteinte ≥ `SUCCESS_THRESHOLD` et gain estimé ≥ 0 (ou effet encore inconnu) | **Garder** |
| Atteinte entre `PARTIAL_THRESHOLD` et 99 %, ou atteinte mais effet nul ou négatif | **Ajuster** |
| Atteinte < `PARTIAL_THRESHOLD` | **Laisser** |

Quand l'effet est inconnu, dire « succès provisoire ».

### Diagnostic quand ça ne marche pas (entonnoir)

| Constat | Cause probable | Action |
|---|---|---|
| Peu de portée ou de scans | Problème de diffusion : heure, visuel, canal | Changer l'heure de publication, le visuel, le canal |
| Beaucoup de scans, peu de réclamations | Offre peu attractive ou peu claire | Rendre l'avantage plus concret ou plus valorisé |
| Beaucoup de réclamations, peu de confirmations | Friction au comptoir ou usage non abouti | Simplifier la validation, former le serveur |
| Beaucoup d'utilisations mais effet nul ou négatif | Cannibalisation | Réduire la valeur, changer le créneau, conditionner l'offre |
| Objectif atteint mais gain négatif | Avantage trop coûteux | Passer d'une remise à un article offert, baisser `C` |
| Résultats très variables d'un soir à l'autre | Facteurs externes (météo, événements) | Attendre plus d'essais avant de conclure |

### Règles d'ajustement
- **Un seul changement à la fois** (heure, message, valeur, créneau), pour savoir ce qui a joué.
- Ne conclure qu'après plusieurs essais comparables.
- Après « Laisser » : mettre l'angle en pause quelques semaines, en tester un autre.
- Toujours demander au gérant la **raison** de sa décision (remise, horaire, message, jour, autre) et l'enregistrer.

---

## 10. Fiche de proposition (le format de chaque offre proposée)

Chaque proposition contient obligatoirement :

1. **Titre et accroche** (ton du restaurant).
2. **Mécanique** : type d'offre, avantage, conditions, créneau, durée, mot-code.
3. **Coût par utilisateur** (`C`) et **marge par couvert** (`m`), avec l'étiquette « estimé » si une donnée l'est.
4. **Objectif** en personnes, et son calcul en une phrase.
5. **Point mort** : combien de nouveaux couverts pour ne pas perdre (`N*`).
6. **Risque maximal** : perte si personne de nouveau ne vient (`−B × C`).
7. **Suivi** : mot-code, QR, taille de groupe, source, clôture du service.
8. **Critères** : ce qui sera un succès, un succès partiel, un échec (section 9).
9. **Plan B** : ce qu'on ajuste si l'objectif n'est pas atteint (section 9).
10. **Canal et heure de publication** recommandés.

Exemple court : « Mardi soir : dessert offert pour tout plat (code DESSERT). Objectif : 7 personnes. Il suffit de 2 nouveaux clients pour ne pas perdre ; risque maximal : 18 € ; suivi : code et page QR ; on saisit les couverts à la fermeture. Si 7 personnes ou plus et effet positif : on garde. Sinon : on change l'heure ou le message. »

---

## 11. Apprentissage

- Tableau par combinaison **type d'offre × créneau × météo** : essais, personnes, effet, gain estimé.
- Aucun ajustement avant `MIN_TRIALS_FOR_LEARNING` essais. Ensuite, bonus ou pénalité croissant avec le nombre d'essais, plafonné.
- Les couverts habituels `B` se calculent sur les clôtures **sans offre** (sinon le résultat se mord la queue).
- Garder une part d'exploration pour ne pas s'enfermer dans une seule offre.
- Les motifs de refus et de décision du gérant alimentent les propositions suivantes.

---

## 12. Rédaction : comment formuler une offre

- **Une offre, un avantage, un créneau, un mot-code, une action.**
- Concret et chiffré : « Plat + dessert à 19 € », pas « super promo ».
- Valeur perçue : « dessert offert » plutôt qu'un petit pourcentage de remise ; éviter les remises affichées sur une carte gastronomique.
- Urgence honnête : durée courte, nombre de places limité si c'est vrai.
- Conditions claires : jours, horaires, non cumulable.
- Ton fidèle au restaurant (tutoiement ou vouvoiement, emojis, humour).
- **Mot-code** : 4 à 8 lettres, facile à dire, unique pour le restaurant, sans caractères confondants (pas de 0 / O, 1 / I).
- Ne jamais promettre ce que le restaurant ne peut pas tenir (capacité, stock).
- Respecter les règles locales (alcool, mention des allergènes, véracité des visuels : un visuel généré par IA ne doit pas tromper sur le vrai plat).

---

## 13. Ce que l'IA ne doit jamais faire

- Inventer un chiffre, une prévision de couverts ou un chiffre d'affaires.
- Affirmer qu'une offre « a rapporté » quand seuls des usages sont mesurés.
- Proposer sur un créneau non déclaré creux, ou quand la salle est déjà pleine.
- Dépasser la remise maximale, ou proposer un avantage dont le coût dépasse la marge.
- Conclure d'un seul essai ou d'une seule soirée.
- Présenter une valeur par défaut comme une donnée réelle (toujours « estimé » ou « déclaré »).
- Promettre des résultats au gérant.

---

## 14. Données dont le moteur a besoin (profil du restaurant)

| Donnée | Utilisation |
|---|---|
| `capacityCovers` | Objectif, vérification de la place restante |
| `averageTicket` (nombre HT) et devise | Marge, coût de l'avantage |
| `foodCostPct` (repas) et coût boissons | Marge par couvert |
| `maxDiscountPct` | Plafond de remise |
| Couverts habituels par jour et par service | Baseline `B`, objectif, effet |
| Jours et créneaux creux | Filtre obligatoire |
| Horaires d'ouverture | Filtre |
| Spécialités, plats à forte marge, stocks à écouler | Contenu de l'offre |
| Interdits (alcool, plats, ton) | Garde-fous |
| Coûts fixes du service (facultatif) | Seuil de rentabilité |
| Terrasse, livraison, ton, couleurs | Angle et style |

Mises à jour continues : clôtures de service, utilisations (personnes, source), décisions et raisons.
