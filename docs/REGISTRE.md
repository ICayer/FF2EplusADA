# scrollyFFADA2S v2 — Registre
 
**Isabel Cayer · Atelier Love & Code · 2026**
*Document vivant — une phrase par décision importante, mis à jour au fil des sessions.*
 
---
 
## Instructions (en-tête à coller dans le projet Claude)
 
Tu es un·e sénior pédagogue bienveillant·e. Isabel est junior-intermédiaire en programmation, design graphique web et conception d'assets visuels, intermédiaire en visualisation de données et rédaction/traduction, junior en assets audio — et expert·e (sénior) en gestion de projet, direction pédagogique et direction scientifique. Ajuste ta posture en conséquence : explique toujours le pourquoi derrière une décision ou une commande, ne tiens rien pour acquis dans les rôles junior/intermédiaire, et laisse Isabel diriger dans les rôles où il est sénior. Challenge les idées quand ça n'a pas de sens, avec bienveillance mais sans complaisance — tu n'es pas obligé d'être d'accord.
 
**Règles non-négociables :**
- Isabel utilise le masculin grammatical pour lui-même (il est non-binaire)
- Point médian pour les groupes généraux (ex. les artistes autochtones, les utilisateur·rices)
- Effort réel : ne jamais estimer — toujours demander le temps réel avant de mettre à jour Notion
- Ce projet se fait *avec et pour* les femmes et artistes autochtones impliquées, pas *sur elles* — la gouvernance créative et le contenu (récits, données FAQ) restent sous leur autorité
- Le Registre est le document pivot — noter les décisions importantes ici
- Commits Git au format S[n]B[n]T[n] — description courte
- Claude.ai gère architecture/gouvernance/validation ; Claude Code exécute mais ne commit jamais — Isabel valide puis commit manuellement
---
 
## Contexte du projet
 
Refonte v2 du scrollytelling scrollyFFADA2S (Femmes, Filles et personnes bispirituelles Autochtones Disparues ou Assassinées), initialement développé en septembre 2025 comme premier projet appliquant les principes de MasterCayer. La v1 vit sur `github.com/ICayer/scrollyFFADA2S` (branche master, dernier commit par Samuel Pelletier le 30 sept. 2025) et sert de **modèle de référence uniquement** pour la v2 — le code n'est pas repris tel quel.
 
La v2 est développée en solo par Isabel avec Claude comme collaborateur technique principal (Samuel n'est plus impliqué). Déline (artiste, directrice artistique, scripteure) dirige le contenu créatif avec deux autres femmes artistes autochtones. Diffusion prévue le 4 octobre 2026 (Journée commémorative FFADA2S).
 
**Structure du projet (script v2, sujet à évolution) :**
- Partie 1 — Landing page (titre, image, bouton d'accès, remerciements, équipe, logo)
- Partie 2 — Scrollytelling, nouveaux steps + anciens steps de la v1, piloté par une timeline à curseur (remplace Scrollama)
- Partie 3 — Application interactive : Lune (valeurs autochtones, survol = traduction, clic = audio) + étoiles (femmes disparues/assassinées, une seule "étoile modèle" avec récit complet au lancement, ton positif et non-dramatique, récit raconté par un membre de la communauté)
**Fonctionnalités générales :** i18n à 13 langues (11 autochtones + FR/EN) avec repli par nation (pas un repli français universel — ex. innu-aimun→français, mi'gmaq→anglais, cri→anglais), boutons de langue de largeur égale, inactifs si non documentés.
 
**Contrainte de legs :** le projet doit être maintenable sans backend ni base de données — ajout d'une langue, d'un enregistrement audio ou d'un récit doit se faire en éditant un fichier JSON et en déposant un fichier audio, sans toucher au code. L'équipe n'a pas les moyens de maintenir l'outil après la diffusion ; FAQ n'a probablement pas non plus les moyens techniques.
 
**Donnée sensible :** les 124 cas documentés par FAQ (via la professeure Audrey Rousseau, UQO) sont la propriété de FAQ, qui prépare son propre site public. L'accès pour ce projet passera vraisemblablement par une des artistes en contact direct avec FAQ, pas par une extraction technique de leur carte ArcGIS.
 
---
 
## Décisions


| Date | Département | Décision |
|---|---|---|
### Gouvernance
| 18 août | Gouvernance | Projet fait *avec et pour* les femmes autochtones, pas *sur elles* — contenu et données sous gouvernance des artistes/Déline, pas traité comme un jeu de données neutre |
| 21 août | Gouvernance | 221 étoiles = preuve de concept avec répartition par nation générique/synthétique (pas de vraie donnée individuelle sans autorisation FAQ) ; à actualiser par l'organisation qui héritera du projet, idéalement FAQ elle-même |
| 24 août | Gouvernance | Sensibilité accessibilité Web adoptée (lien avec plan EDIA d'Apogée Canada) — pas une conformité formelle visée, mais les décisions architecturales (ARIA, clavier, contraste, reduced-motion) sont intégrées au fil de la construction plutôt que reportées ; consolidation/audit/contrôle visuel A-/A+ prévus au Sprint 6 |
| 24 août | Gouvernance | Point ouvert soulevé par Isabel : la répartition synthétique actuelle (~20 étoiles/nation) risque de donner une fausse impression de proportion réelle aux communautés qui visiteront le site, particulièrement blessant pour une nation avec peu de cas réels documentés. À trancher avec Déline/les artistes avant d'enrichir univers/ de vrai contenu — options à explorer : distribution proportionnelle une fois les vraies données FAQ obtenues, avertissement visible dans l'interface, ou neutraliser la couleur par nation tant que la vraie proportion n'est pas connue |
| 25 août | Gouvernance | Point ouvert soulevé par Isabel : les 9 valeurs (Partage, Force, etc.) pourraient être vécues/interprétées différemment en contexte autochtone qu'allochtone — prévoir un texte descriptif au step "Liées aux valeurs" pour éviter une lecture univoque. Contenu à rédiger avec Déline/les artistes, pas par Claude — Sprint 4 |

### Production
| 18 août | Production | Repartir de la copie GitHub `origin/master` (à jour, inclut les correctifs de Samuel) plutôt que de la copie locale d'Isabel, potentiellement désynchronisée |
| 18 août | Production | Registre + Kanban Notion minimal mis en place cette semaine ; framework "AtelierL&C" généralisé reporté après la diffusion du 4 octobre (documenté à partir du vécu réel, comme MasterCayer et GameCayer) |
| 18 août | Production | Dépôt FF2EplusADA laissé public (aucune donnée sensible actuellement) ; à réévaluer dès l'arrivée de contenu réel (audio, récits) des femmes autochtones |
| 19 août | Production | SVGO (S1B3T2) mis en pause jusqu'à avoir l'ensemble des steps v2 et une décision sur le support mobile |
| 19 août | Production | Vertical slice validé (S1B4) : timeline générique + registry + i18n fonctionnent de bout en bout sur 3 steps, transitions show→hide→show comprises |

### Architecture
| 18 août | Architecture | v1 sert de modèle de référence pour la Partie 2 (pattern show/hide par step) — la v2 est reconstruite de zéro, pas adaptée sur le code existant |
| 18 août | Architecture | i18n avec repli configurable par langue autochtone (table `fallbackByLanguage`), pas un repli français universel — reflète la réalité linguistique de chaque nation |
| 19 août | Architecture | Convention de nommage SVG (S1B3T1) appliquée seulement aux nouveaux assets v2 — les steps hérités de la v1 restent protégés par le scoping systématique des requêtes (containerX.querySelector), pas par l'unicité des noms |
| 21 août | Architecture | Témoignages des étoiles : texte primaire toujours dans la langue de la nation (via nations.json→langue), traduction secondaire selon la langue d'interface choisie (resolve()) — distinct du reste du site qui suit uniquement la langue globale |
| 24 août | Architecture | motRevelateur (étoiles) sera éventuellement lié aux 9 valeurs de la Partie 4 — pour l'instant texte libre, vrai rattachement technique à construire au Sprint 4 |
| 24 août | Architecture | Les transitions entre parties ne se déclenchent jamais automatiquement (temps/interactions ne font que révéler un bouton) — la personne doit toujours poser un geste explicite pour avancer |
| 26 août | Architecture |	Timeline positionnée en bas, centrée, budget clamp(110px, 13vh, 150px) — libéré en déplaçant le titre de step vers un bloc fixe en haut-gauche de la scène (fondu croisé) plutôt qu'une étiquette qui suit le curseur
| 26 août | Architecture |	Contrôles play/recule/avance/retour fusionnés dans la rangée du rail, alignés à gauche (pattern "de la classe au territoire") — pas de rangée dédiée
| 26 août | Architecture |	Légendes d'orientation (Colonisation/Mémoire/Aujourd'hui) minuscules, positionnées directement sur leurs repères du rail, visibles seulement au step A
| 26 août | Architecture |	Repères jaune (Univers, 95%) et bleu (Valeurs, 100%) non cliquables, purement visuels — accès réel via bouton "Explorer les étoiles" (step11.js, déjà codé) et futur bouton après 4 clics sur étoiles (univers)
| 26 août | Architecture |	Position des steps sur le rail calculée par formule selon epoque (avant : index×80/n ; rupture : fixe 80% ; après : 80+(index+1)×15/(n+1)) — jamais codée en dur, cohérent avec le moteur générique
| 26 août | Architecture |	Clic direct sur le rail = snap au step le plus proche (pas de glissement libre)
| 26 août | Architecture | plume.svg (curseur de la timeline, calques plume/perle_noire1-3) déposé dans scrolly/svg/timeline/ — nouveau sous-dossier parallèle aux dossiers par step, pour distinguer le SVG de chrome d'interface (utilisé à travers les 9 steps) du SVG de contenu narratif (propre à un step). Exception délibérée à la convention de nommage zone-élément-variante (§2.3) : les id (plume, perle_noire1/2/3) restent tels quels plutôt que renommés, parce que le script de Déline y fait déjà référence nommément — renommer casserait cette correspondance pour un gain de cohérence mineur. |
| 26 août | Architecture | Bug clearProps: "all" (step7 stripes, step10 étoiles/Communaute) — vidait l'attribut style complet, effaçant le fill inline hérité du SVG source, invisible seulement après un cycle show→hide→show réel. Corrigé en retirant clearProps: "all" (show() réinitialise déjà tout ce qui compte). Détail technique au Playbook §3.1. |

### Contenu / Design
| 18 août | Contenu | Une seule "étoile modèle" avec récit complet au lancement ; les autres étoiles restent vides par conception, enrichies après la diffusion |
| 19 août | Contenu | Seuls step7, step9, step10 de la v1 sont conservés en v2 ; tous les nouveaux steps de Déline seront en SVG (animations riches) — pas de conversion raster envisagée pour l'instant |
| 24 août | Contenu | Référence officielle pour l'orthographe des 13 langues autochtones : infographie déjà produite et validée par Isabel — nations.json en reprend l'orthographe exacte |
| 26 août |	Contenu/Design | Bloc-titre de scène : fond opacité 0,7 (confirmé nécessaire — têtes des personnages de step7 remontent jusqu'en haut-gauche), police Agoradp_15, fondu croisé ~400ms (200ms sortie + 200ms entrée) à ajuster à l'œil et avec Déline — le projet privilégie la lenteur





## Journal des versions du Registre
 
| Version | Date | Ajouts |
|---|---|---|
| v0.1 | 18 août 2026 | Création initiale — mise en place Registre + Kanban |
