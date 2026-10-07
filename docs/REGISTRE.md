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

## Contexte du projet *(mis à jour le 6 octobre 2026)*

Refonte v2 du scrollytelling scrollyFFADA2S (Femmes, Filles et personnes bispirituelles Autochtones Disparues ou Assassinées), initialement développé en septembre 2025 comme premier projet appliquant les principes de MasterCayer. La v1 vit sur `github.com/ICayer/scrollyFFADA2S` (branche master, dernier commit par Samuel Pelletier le 30 sept. 2025) et sert de **modèle de référence uniquement** pour la v2 : le code n'est pas repris tel quel.

**Titre du site :** « M'entends-tu? » / « Can you hear me? ». Diffusion le 4 octobre 2026 (Journée commémorative FFADA2S).

**Dépôt :** `github.com/ICayer/FF2EplusADA` (branche `main`), déployé sur GitHub Pages : `icayer.github.io/FF2EplusADA/`.

**Rôles.** La v2 est développée en solo par Isabel avec Claude comme collaborateur technique principal (Samuel n'est plus impliqué). Isabel est la seule personne à travailler dans les logiciels (Photoshop, Illustrator, VS Code) et conçoit tous les assets à partir des dessins. Déline (artiste innue, directrice artistique, scripteure) fait les dessins matériels et dirige le contenu créatif. Boris dessine les swirls et les spots de valeurs sur Procreate. L'équipe de projet (Déline, Germaine, Lise, Sharon, Nishka et les collaboratrices) valide l'intention.

**Structure du projet (4 parties, une par dossier) :**
- Partie 1 — Landing page (`index.html`) : titre, image, introduction, remerciements, équipe, pied de page des partenaires
- Partie 2 — Scrollytelling (`scrolly/`) : 9 steps (5 avant la colonisation, 4 hérités ou après), piloté par un rail de perles (`timeline.svg`) plutôt que par le défilement
- Partie 3 — Univers (`univers/`) : Lune et étoiles ; seules les étoiles avec un témoignage réel sont organisées et cliquables, les autres forment un ciel anonyme
- Partie 4 — Valeurs (`valeurs/`) : spirale, swirls, spots de valeurs, audio en innu-aimun

**Fonctionnalités générales :** architecture i18n prévue pour 13 langues (11 autochtones + FR/EN) avec repli par langue (pas un repli français universel — ex. innu-aimun→français, mi'gmaq→anglais). Depuis le 6 octobre, seuls le français et l'anglais sont offerts dans le menu (voir Gouvernance).

**Contrainte de legs :** le projet doit être maintenable sans backend ni base de données — ajout d'une langue, d'un enregistrement audio ou d'un récit doit se faire en éditant un fichier JSON et en déposant un fichier audio, sans toucher au code. L'équipe n'a pas les moyens de maintenir l'outil après la diffusion ; FAQ n'a probablement pas non plus les moyens techniques.

**Donnée sensible :** les 124 cas documentés par FAQ (via la professeure Audrey Rousseau, UQO) sont la propriété de FAQ, qui prépare son propre site public. L'accès pour ce projet passera vraisemblablement par une des artistes en contact direct avec FAQ, pas par une extraction technique de leur carte ArcGIS.

---

## Décisions

*Mode de lecture : chaque section est en ordre chronologique. Une décision remplacée reste dans le tableau pour l'historique, avec la mention **Remplacée** ou **Suspendue** et un renvoi. Les dates précédées de « ~ » sont approximatives (reconstituées à partir des résumés de conversation).*

### Gouvernance

| Date | Département | Décision |
|---|---|---|
| 18 août | Gouvernance | Projet fait *avec et pour* les femmes autochtones, pas *sur elles* — contenu et données sous gouvernance des artistes/Déline, pas traité comme un jeu de données neutre |
| 21 août | Gouvernance | 221 étoiles = preuve de concept avec répartition par nation générique/synthétique (pas de vraie donnée individuelle sans autorisation FAQ) ; à actualiser par l'organisation qui héritera du projet, idéalement FAQ elle-même. **Précisée ~mi-sept.** : voir la ligne sur les étoiles anonymes. |
| 24 août | Gouvernance | Sensibilité accessibilité Web adoptée (lien avec plan EDIA d'Apogée Canada) — pas une conformité formelle visée, mais les décisions architecturales (ARIA, clavier, contraste, reduced-motion) sont intégrées au fil de la construction plutôt que reportées ; consolidation/audit/contrôle visuel A-/A+ prévus au Sprint 6 |
| 24 août | Gouvernance | Point ouvert soulevé par Isabel : la répartition synthétique actuelle (~20 étoiles/nation) risque de donner une fausse impression de proportion réelle aux communautés qui visiteront le site. **Résolu ~mi-sept.** par la décision sur les étoiles anonymes (ligne ci-dessous). |
| 25 août | Gouvernance | Point ouvert soulevé par Isabel : les 9 valeurs pourraient être vécues différemment en contexte autochtone qu'allochtone — prévoir un texte descriptif, à rédiger avec Déline/les artistes, pas par Claude. **Fermé le 5 oct.** : aucun texte descriptif ne sera fourni (ligne du 5 oct.). |
| 28 août | Gouvernance/Design | Persona de référence pour les décisions UX/UI : femme aînée autochtone, peu familière avec la navigation web. Favoriser prévisibilité et faible exigence de précision motrice (positions fixes plutôt que suivi du curseur, cibles cliquables généreuses, pas de menus déroulants complexes). |
| 28 août | Gouvernance/Design | Règle d'or : privilégier systématiquement la méthode de création la plus proche de la pratique physique de Déline (crayon, peinture), même si ça demande plus de travail technique en aval — préserver son style prime sur l'efficacité technique. |
| 31 août | Gouvernance/Design | Prudence sur les symboles visuels pan-autochtones (ex. tipi pour « accueil ») : 11 nations distinctes, un seul symbole architectural risque de réduire cette diversité à un stéréotype. Décision reportée à Déline/artistes. |
| 3 sept | Contenu/Gouvernance | La plume (curseur du rail) représente la mémoire de la fille d'une des artistes associées au projet. Elle est omniprésente dans tout le parcours. À traiter avec un soin technique particulier : jamais coupée, déformée ou retirée sans consultation. |
| ~mi-sept | Gouvernance | Seules les étoiles avec un vrai témoignage entrent dans le système organisé d'univers (secteur de nation, décennie, couleur, traits de constellation). Toutes les autres sont générées séparément en ciel anonyme, sans lien avec `etoiles.json` au-delà du total, ni cliquables ni survolables. Résout le point ouvert du 24 août. |
| 24 sept | Gouvernance | **Aucune catégorie de mode de décès dans les données du projet.** Le champ `categorie` est retiré complètement du schéma `etoiles.json` (221 entrées). Réaffirme le narratif positif (18 août). |
| 24 sept | Gouvernance | 10 premières vraies étoiles-témoignage intégrées (sources : CBC *Missing & Murdered*, Safe Passage, recherche d'Isabel). `etoile-modele` renommée `etoile-001` (Sindy). Champ `portrait.nomComplet` ajouté. **Recoupement avec les données FAQ à faire lors d'une future collecte**, pour éviter les doublons entre les trois sources. |
| 24 sept | Gouvernance | Idée écartée : faire varier le rayon des étoiles-témoignage selon la décennie de naissance. Écartée pour préserver l'accessibilité motrice (réaffirme le 28 août). |
| ~fin sept | Gouvernance/Production | Collecte de données par une tierce personne : colonnes recommandées `id, nomComplet, prenom, dateNaissance, nation, communaute, temoignage, langueTemoignage, redigePar, sourceUrl, photo, traduction faite?`, avec listes déroulantes pour `nation` (ids de `nations.json`). Dédoublonner avec les données FAQ à venir. |
| 5 oct | Gouvernance/Contenu | Aucun texte descriptif ne sera fourni pour les valeurs. Le champ `definition` est retiré de `valeurs.json` (10 entrées) ; le code l'affiche s'il est ajouté un jour. Ferme le point ouvert du 25 août. |
| 6 oct | Gouvernance | **Menu de langue limité au français et à l'anglais.** Les 11 langues autochtones restent dans le code et les données, réactivables par le champ `afficherDansMenu` (liste `LANGUES`, `headerControls.js`). Raison : ne pas créer de demande tant qu'aucune personne ou organisation tierce ne prend le projet en charge. Remplace « boutons inactifs si non documentés ». Une langue mémorisée qui n'est plus offerte retombe sur le français (`langueInitiale()`). |
| 6 oct | Gouvernance | **Suspendu :** le texte du témoignage dans la langue de la nation n'est plus affiché dans la modale (`AFFICHER_TEXTE_LANGUE_NATION = false`, `testimonyModal.js`, réactivable). Suspend la décision d'architecture du 21 août. |
| 6 oct | Gouvernance/Contenu | Présentation d'une personne commémorée (infobulle et modale) : phrase factuelle en appositions, « Gladys, Anishinaabe de Kitigan Zibi, né·e en 1940 ». Pas de voix prêtée à la personne (pas de « je »), pas de temps de verbe qui présume sa mort (certaines sont disparues), « né·e » devant l'année pour éviter qu'on la lise comme une année de décès. |
| 6 oct | Gouvernance | Point ouvert : forme du nom de nation pour désigner **une** personne (accord féminin « Innue », écriture inclusive « Innu·e » ou forme invariable « Innu »). Question jugée hors du ressort de l'équipe de recherche-création, soumise sur Discord à la personne responsable des projets de réconciliation avec les Premiers Peuples, pour une convention générale (toutes les nations). Valeur provisoire : forme invariable (`nomPersonne` : Innu, Inuk). |

### Contenu et design

| Date | Département | Décision |
|---|---|---|
| 18 août | Contenu | Une seule « étoile modèle » avec récit complet au lancement ; les autres étoiles restent vides par conception. **Remplacée le 24 sept.** : 10 étoiles-témoignage réelles. |
| 19 août | Contenu | Seuls step7, step9, step10 de la v1 sont conservés en v2 ; tous les nouveaux steps de Déline seront en SVG (animations riches) |
| 24 août | Contenu | Référence officielle pour l'orthographe des 13 langues autochtones : infographie produite et validée par Isabel — `nations.json` en reprend l'orthographe exacte |
| 26 août | Contenu/Design | Bloc-titre de scène : fond opacité 0,7, police Agoradp_15, fondu croisé ~400 ms — le projet privilégie la lenteur. **Remplacé ~1 oct.** : le titre est masqué visuellement (son `aria-live` reste la seule annonce du step pour les lecteurs d'écran), remplacé par la trame poétique du rail. |
| 2 sept | Contenu | Titre du site : « M'entends-tu? » (référence au projet « Un p'tit cœur qui bat »), « Can you hear me? » en anglais. |
| ~mi-sept | Contenu/Design | Univers, script technique de Déline (points A à E) : étiquettes de nations sur 2 lignes au-delà de 10 caractères ; 2 nations ajoutées à `nations.json` (Wolastoqey #EF9A9A, Huronne-Wendat #BCAAA4) ; visualisation réduite pour tenir au-dessus du rail ; étoile-témoignage grossie avec halo animé (« cœur qui bat ») ; bouton « Explorer les valeurs » ancré à l'extérieur du cercle des mémoires, bord droit (pas sous la Lune, où il cacherait des étoiles). |
| ~mi-sept | Contenu/Design | Univers, points F et G (zoom, « Aide et légende ») reportés : pas de nouvel apprentissage de navigation à la toute fin de l'expérience. |
| ~mi-sept | Contenu/Design | Chorégraphie de migration : une étoile « fantôme » du ciel migre vers sa position d'étoile-témoignage, change de couleur et de taille, puis allume son halo. Masque de terrain (`terrain_masque.png`) : aucune étoile sur l'horizon. |
| ~fin sept | Contenu/Design | Les cercles vectoriels des valeurs sont remplacés par les spots peints de Boris (`spot_<valeur>.webp`) dans `scrolly.svg` (step D) et `valeurs.svg`. |
| ~fin sept | Contenu/Design | Landing : textes révisés par les collaboratrices ; ordre des sections (titre, image, intro, Remerciements, Équipe, spirale et bouton, pied de page) ; titres « Remerciements » et « Équipe » en rouge #a40017. Nouvelle image `couple_plume_respect.svg` avec « ISHPENITAMUN / Respect » intégré à l'illustration : exception assumée à la règle « texte en overlay HTML » pour un mot figé. |
| ~fin sept | Contenu/Design | Menu de langue et A-/A/A+ : Agoradp_15 sur les 4 boutons du haut, noir/blanc au repos, halo #a40017 au survol, fond #a40017 au clic ; noms de langues en police système (lisibilité). |
| ~1 oct | Contenu/Design | Trame poétique (commit S6B0T20) : des mots-clés dans la zone du rail remplacent la boîte de texte narratif et le titre visible. « Colonisation » reste affiché de S1 à S6 ; « Reconnectons à nos valeurs » à partir de S10 (y compris valeurs.html) ; les mots d'un seul step disparaissent après un délai. Traductions anglaises à faire réviser par l'équipe. |
| 5 oct | Contenu/Design | Durée d'affichage des mots à step unique portée à 6 s (`DUREE_AFFICHAGE_MOT_MS`), y compris « Une étoile, une vie ». |
| 5 oct | Contenu/Design | Step 3 : les perles rouges des vêtements démarrent en même temps que le calque territoire (label GSAP), l'écart de 2 s entre groupes est conservé (`ECART_GROUPES_PERLES_S`). |
| 5 oct | Contenu/Design | Step 4 : un halo pulsant de la couleur de chaque valeur (champ `couleur` de `valeurs.json`) invite à survoler les spots. Pas de halos sur valeurs.html : choix UX délibéré, on parie que l'invitation du scrolly suffit. |
| 5 oct | Contenu/Design | Step 5 : le sous-titre « Spirale de la violence » est retiré de la scène. Le mot-clé du rail (S6) reste le seul endroit où il apparaît. Règle le doublon éditorial noté en octobre. |
| 5 oct | Contenu/Design | Pied de page de la landing : le logo de l'Agora est agrandi (2,5 × les autres logos, `--facteur-logo-porteur`). Hiérarchie voulue : l'Agora a porté le projet à 100 % et le logo est une œuvre de Déline. |
| 6 oct | Contenu/Design | Titres du pied de page (« Produit par » / « Produced by », « Partenaires financiers » / « Funding partners ») et texte alternatif du logo Agora traduits via `landing.json`. Formulation recommandée pour le alt : « L'Agora, porteur du projet » (à confirmer). |
| 6 oct | Contenu/Design | Infobulle des étoiles : bouton « Lire le témoignage → » affiché seulement si un témoignage existe, aux couleurs de la nation de l'étoile, texte noir ou blanc choisi par calcul de contraste. Raison : le rouge est associé à la rupture coloniale, alors qu'un témoignage porte un récit positif. Écart assumé à la règle « tous les boutons ont le même style » : forme, taille, police et arrondi identiques, seule la couleur change. |
| 6 oct | Contenu/Design | Modale de témoignage : vignette « nation de communauté », titre « prénom, né·e en année », ligne de métadonnées supprimée. Contraste de la vignette corrigé (texte blanc à 1,3-2,4:1 auparavant, minimum 8:1 maintenant). |
| 6 oct | Contenu/Design | Le bouton « Explorer les étoiles » (step 9) adopte le style du bouton « Explorer les valeurs » via une classe d'apparence partagée. Le jaune hérité des premières itérations est retiré. |

### Architecture

| Date | Département | Décision |
|---|---|---|
| 18 août | Architecture | v1 sert de modèle de référence pour la Partie 2 (pattern show/hide par step) — la v2 est reconstruite de zéro |
| 18 août | Architecture | i18n avec repli configurable par langue autochtone (table `fallbackByLanguage`), pas un repli français universel |
| 19 août | Architecture | Convention de nommage SVG (S1B3T1) appliquée seulement aux nouveaux assets v2 — les steps hérités de la v1 restent protégés par le scoping systématique des requêtes (`containerX.querySelector`) |
| 21 août | Architecture | Témoignages des étoiles : texte primaire toujours dans la langue de la nation, traduction secondaire selon la langue d'interface. **Suspendue le 6 oct.** (voir Gouvernance). |
| 24 août | Architecture | `motRevelateur` (étoiles) sera éventuellement lié aux 9 valeurs. **Note 6 oct.** : champ `null` partout, plus affiché par l'infobulle. |
| 24 août | Architecture | Les transitions entre parties ne se déclenchent jamais automatiquement (temps/interactions ne font que révéler un bouton) — la personne doit toujours poser un geste explicite. Réaffirmé le 6 oct. |
| 26 août | Architecture | Timeline positionnée en bas, centrée, budget clamp(110px, 13vh, 150px), titre de step déplacé en haut à gauche. **Remplacée le 10 sept.** par le rail en perles (`--h-rail-parcours`). |
| 26 août | Architecture | Contrôles play/recule/avance/retour fusionnés dans la rangée du rail, alignés à gauche (pattern « de la classe au territoire ») |
| 26 août | Architecture | Légendes d'orientation (Colonisation/Mémoire/Aujourd'hui) minuscules, sur leurs repères du rail, visibles seulement au step A |
| 26 août | Architecture | Repères jaune (Univers) et bleu (Valeurs) non cliquables. **Remplacée le 10 sept.** : la perle univers est cliquable. |
| 26 août | Architecture | Position des steps sur le rail calculée par formule selon `epoque`. **Remplacée le 10 sept.** : positions lues dans `timeline.svg`. |
| 26 août | Architecture | Clic direct sur le rail = snap au step le plus proche (pas de glissement libre) |
| 26 août | Architecture | `plume.svg` déposé dans `scrolly/svg/timeline/`, ids `plume`, `perle_noire1/2/3` gardés tels quels (le script de Déline y fait référence). **Remplacée le 10 sept.** : la plume vit dans `timeline.svg` ; l'ancien fichier est de la dette technique. |
| 26 août | Architecture | Bug `clearProps: "all"` (step7, step10) — vidait l'attribut style complet, effaçant le fill inline du SVG source. Corrigé en retirant `clearProps: "all"`. Détail au Playbook §3.1. |
| 1 sept | Architecture | Les calques persistants d'avant la colonisation (spirale/communauté/territoire) restent affichés en reculant, jamais cachés — décision narrative cohérente avec le script de Déline. |
| 2 sept | Architecture | Garde `if (index === currentIndex) return;` dans `goToStep()` : changer de langue en cours de step ne rejoue plus hide()+show() du même step (condition de course avec le nettoyage asynchrone). Détail au Playbook §3.5. |
| 2 sept | Architecture | `t()` retombe maintenant aussi sur `fallbackByLanguage.json` ; `shared/data/i18n/en.json` créé. |
| 2 sept | Architecture | Landing : contenu FR/EN branché via `resolve()` + `shared/data/landing.json`. |
| 2 sept | Architecture | Landing : thème clair scopé uniquement à `assets/css/style.css` — ne touche pas `variables.css` ni le système `[data-theme]` des autres parties. |
| 10 sept | Architecture | Refonte du rail : `shared/svg/timeline/timeline.svg` (perles dessinées par Déline) remplace le Rail à 12 boutons. Positions lues dans le SVG, plus calculées par formule. |
| 10 sept | Architecture | Une seule couleur pour toutes les perles du rail (choix artistique de Déline). |
| 10 sept | Architecture | La perle univers (`perle_step10`) est cliquable comme les autres. |
| 10 sept | Architecture | Le curseur plume vit dans `timeline.svg` ; son déplacement est une transformation SVG interne. `railPlume.js` et `plume.svg` conservés comme code mort (dette technique). |
| ~mi-sept | Architecture | Chemins absolus (`/shared/...`) cassés sur GitHub Pages (site servi sous `/FF2EplusADA/`) : corrigés par `new URL(chemin, import.meta.url)` dans 7 fichiers JS. Voir Playbook §9. |
| ~sept | Architecture | Rail : 140 px de SVG, padding réduit, `--h-rail-parcours` calculé dans `variables.css` et lu par les trois pages ; viewBox `-90 0 1260 140` ; plume animée en `power1.inOut`, 0,35 s, `prefers-reduced-motion` respecté ; `:focus-visible` pour le clavier. |
| 21 sept | Architecture | Les cercles du step D sont dessinés à la main dans `scrolly.svg` (`#cercles-valeurs`), en arc de chaque côté de la spirale, plutôt que générés par calcul. |
| 21 sept | Architecture | L'étiquette « Ishpenitamun/Respect » séparée est retirée, fusionnée au système des cercles de valeurs. `valeurs.json` passe à 10 entrées (« respect »). |
| 24 sept | Architecture | Réexport Illustrator : toujours fixer le plan de travail ET cocher « Utiliser les plans de travail » (dérive silencieuse du viewBox constatée sur `valeurs.svg`). Voir Playbook §7.4. |
| 24 sept | Architecture | `ORDRE_DECENNIES` étendu à partir de « 1930s » (champ conçu pour une date de décès puis réutilisé pour la naissance). |
| 24 sept | Architecture | `rayonCollision` toujours dérivé du rayon réel de l'étoile-témoignage + marge (défaut sous-dimensionné exposé à 10 étoiles). |
| 24 sept | Architecture | `portrait.redigePar` restructuré en `{fr, en}`, comme `temoignage`. |
| 24 sept | Architecture | `fallbackByLanguage.json` : ajout de `"fr": "en"` (témoignages sourcés directement en anglais). |
| ~fin sept | Architecture | `valeurs.svg` : plan de travail verrouillé (viewBox 3403.62 × 2138.59) ; hauteur de la composition = 0,75 de l'espace disponible (`valeursAnimation.js`). |
| ~fin sept | Architecture | Step D : les `<image id="barre1-5">` invisibles interceptaient les clics (`opacity:0` n'enlève pas `pointer-events`) — `pointer-events:none` à l'initialisation. Course sur `assurerContainer()` corrigée par une promesse mémoïsée. |
| ~1 oct | Architecture | Trame poétique : guides (`-point`, `-boite`, `-mot`) placés par Isabel dans `timeline.svg`, masqués en CSS et remplacés par des éléments HTML positionnés par mesure réelle (`motsSteps.js`, `motsSteps.json`). La plume et la bande de rupture sont déplacées dans un `<svg>` superposé de même viewBox (un SVG est atomique pour le z-index face à du HTML externe). |
| 5 oct | Architecture | Valeurs.html : les perles noires de la plume sont masquées et la plume s'ancre par sa pointe (coin supérieur droit de `#plume`) au centre de `bouton_valeur`. Scrolly et univers gardent l'ancrage par `perle_noire1`. Introduit la convention `data-page` sur `<body>`. Règle aussi la plume coupée en fin de parcours. |
| 6 oct | Architecture | `t(clé, params)` accepte des gabarits `{clé}` ; les phrases variables vivent en gabarits complets dans `fr.json`/`en.json`, jamais assemblées par morceaux dans le JS. |
| 6 oct | Architecture | Module `univers/js/presentationPersonne.js` : segments de présentation (nation via `nomPersonne` sinon `nom`, élision « d' », année) et fonctions de contraste, partagés par l'infobulle et la modale. Champ optionnel `nomPersonne {fr, en}` ajouté à `nations.json`. |
| 6 oct | Architecture | Infobulle des étoiles interactive : ancrée à l'étoile (ne suit plus le curseur), survolable, fermée par Échap, toucher en deux temps (infobulle puis bouton). Conforme au critère WCAG 1.4.13. |
| 6 oct | Architecture | Continuité de la plume entre les pages : l'étape de départ, la page visée et l'étape visée sont mémorisées dans `sessionStorage` (`memoriserNavigationRail()`), lues une seule fois à l'arrivée. Le scrolly s'ouvre à l'étape cliquée depuis univers ou valeurs ; un rechargement ou un signet ouvre normalement. |
| 6 oct | Architecture | Transitions entre les pages : fondu CSS natif (`@view-transition { navigation: auto; }`, désactivé sous `prefers-reduced-motion`) et couleur de fond fixée en ligne dans le `<head>` de chaque page (plus de flash blanc). Les 4 pages restent séparées, comme prévu dans l'architecture. |
| 6 oct | Architecture | Le bouton « Explorer les valeurs » navigue comme le rail (fondu, plume qui glisse de la perle 10 au bouton valeurs). L'animation de sortie conçue au Sprint 2 (convergence des étoiles, Lune agrandie, voile blanc) est retirée ; la condition de révélation (30 s ou 4 clics) est inchangée. |

### Production

| Date | Département | Décision |
|---|---|---|
| 18 août | Production | Repartir de la copie GitHub `origin/master` plutôt que de la copie locale d'Isabel |
| 18 août | Production | Registre + Kanban Notion minimal ; framework « AtelierL&C » généralisé reporté après la diffusion du 4 octobre |
| 18 août | Production | Dépôt FF2EplusADA laissé public ; à réévaluer dès l'arrivée de contenu réel (audio, récits) |
| 19 août | Production | SVGO (S1B3T2) mis en pause jusqu'à avoir l'ensemble des steps v2 et une décision sur le support mobile |
| 19 août | Production | Vertical slice validé (S1B4) : timeline générique + registry + i18n de bout en bout sur 3 steps |
| 2 sept | Production | CRSNG confirmé comme partenaire financier (logo au pied de page, aux côtés de CFREF/Apogée Canada) |
| 24 sept | Production | Procreate : Boris règle sa toile en sRGB IEC61966-2.1 à la source (désaturation causée par Display P3). Voir Playbook §7.5. |
| 24 sept | Production | Export SVG Illustrator : toujours « Fichier > Exporter > Exporter sous » (l'échappement d'ID en `_x5F_` semble lié à « Enregistrer sous »). |
| ~fin sept | Production | Outil publié : convertisseur de texte vers chaîne JSON, pour coller du texte de Google Docs dans `landing.json` : https://claude.ai/artifact/BEAd3c1oornQKPdo3Y44D5 |
| 5 oct | Production | Le site étant en ligne, toute modification est testée en local avant le push ; rechargement forcé avant tout diagnostic (cache GitHub Pages). |
| 5 oct | Production | Script de réécriture automatique des `href` d'un SVG réexporté : reporté au prochain projet de recherche-création (trop risqué à introduire en fin de projet). |
| 5 oct | Production | Prompts Claude Code : niveau de vérification choisi selon le risque de la tâche (vert : lignes modifiées et console ; orange : quelques vérifications ciblées ; rouge : tests poussés). Évite les suites de tests automatisés coûteuses quand Isabel valide à l'œil. Voir Playbook §5. |
| 6 oct | Production | Tâches « Version finale » du bug tracker fermées en 8,5 h réelles, pour environ 13,9 h budgétées (ratio ~1,6), en absorbant au moins 7 tâches imprévues. Calibrage pour le prochain projet : diviser les budgets de Claude par 2 et garder une marge explicite pour l'imprévu. |

---

## Points ouverts *(au 6 octobre 2026)*

**Contenu et gouvernance**
- « Respect » (10e valeur) : présent dans `valeurs.json`, absent des deux SVG. Risque latent : valeurs.html associe `boutonN` à la N-ième entrée de `valeurs.json` ; si Respect est inséré ailleurs qu'en 10e position, le décalage passerait inaperçu.
- Forme du nom de nation pour une personne (`nomPersonne`) : réponse attendue de la personne responsable des projets de réconciliation. Le champ `nom` des nations est en français seulement : remplir `nomPersonne.en` pour toute nation au nom français (Huronne-Wendat, Métis de l'Ouest) quand une étoile de cette nation sera ajoutée.
- Traductions anglaises des mots-clés du rail (`motsSteps.json`) à faire réviser par l'équipe.
- `landing.json` : « Sharon » (fr) vs « Shannon » (en) Fontaine-Ishpatao ; double espace dans `intro.fr` après « disparu. ».
- Texte alternatif du logo Agora : formulation finale à confirmer.
- `etoiles.json` : uniformiser la typographie de saisie (« soeur » / « sœur », apostrophes ’ et ').
- 2 des 11 crédits encore « à déterminer ».
- `respect.mp3` / `valeurs.mp3` présents dans `valeurs/audio/innu-aimun/` mais non référencés.
- Données FAQ attendues (recoupement des doublons, idéalement au nom de la FAQ pour la suite).

**Technique et accessibilité**
- Décision « version mobile? » (bloque aussi SVGO, S6B1T1).
- Audit d'accessibilité formel (EDIA), jamais fait. Lot identifié le 6 oct. : `<html lang>` qui ne suit pas la langue, titre d'onglet non traduit, `aria-label` de A-/A/A+ en français, Échap qui ne ferme pas le menu de langue, étoiles non atteignables au clavier (Tab, Entrée), `h1` de la modale (un `h2` serait plus orthodoxe), step C sans branche `prefers-reduced-motion` (vérifier les autres steps d'avant la colonisation), alt des logos Apogée et CRSNG à traduire.
- `phrase-progressive` qui ne reste pas ancrée à sa place.
- Textes d'« intention » des steps 6 à 9 encore dans `steps.json`, plus affichés.

---

## Dette technique à nettoyer avant le legs

*Une seule passe, avec grep exhaustif avant chaque suppression (Playbook §4).*

- Fichiers orphelins : `shared/js/railPlume.js`, `shared/svg/timeline/plume.svg`, `shared/js/timelineTest.js` (font encore référence à `perle_noire1-3` et `bouton_valeur`).
- `scrolly/js/timelineRail.js` (rail hérité) : **vérifier s'il est encore chargé avant de le supprimer** — il a été modifié le 5 oct. (`allerAuStep()`, ligne 196).
- `univers/svg/spirale.webp` : plus utilisé depuis le 6 oct.
- `valeurs/svg/couple.webp` : encore utilisé en Partie 4, **ne pas supprimer**.
- Champ `motPermanent` dans `steps.json`.
- Commentaires périmés : bas de `univers/index.html` (« aucun déplacement animé » de la plume) ; `valeursAnimation.js` lignes 6-9 et 106-108 (fondu « symétrique de la sortie d'univers »).
- `getBBox()` encore utilisé pour l'ancrage de la plume (scrolly, univers) et dans `animerPerlesEnVague()` : fonctionne tant que les éléments mesurés n'ont pas de transform propre.
- Liste `LANGUES` dans `headerControls.js` (JS) : à déplacer vers un JSON partagé pour respecter la contrainte de legs.
- Deux rouges dans le projet : `--color-primary` (#a02421) et #a40017.
- Vérifier que `DEBUG_POINT_PLUME_VALEURS` est à `false` (`railParcours.js`).
- Livrables de legs : README non technique (ajouter une langue, y compris `afficherDansMenu` ; un audio ; un récit ; champs optionnels `definition` de `valeurs.json` et `nomPersonne` de `nations.json`), mise à jour de `PROMPT_TEMPLATE.md` (Étape 0, conditions d'arrêt, niveaux de vérification), documents de transfert (sources par id dans le Google Sheet).

---

## Journal des versions du Registre

| Version | Date | Ajouts |
|---|---|---|
| v0.1 | 18 août 2026 | Création initiale — mise en place Registre + Kanban |
| v0.2 | 24 sept 2026 | Ajouts de la semaine du 10 au 24 septembre (rail en perles, étoiles-témoignage, retrait de `categorie`, pipeline couleur) |
| v0.3 | 6 oct 2026 | Fusion des ajouts de septembre dans les sections ; décisions du résumé d'octobre et des séances « Version finale » des 5 et 6 octobre ; contexte mis à jour ; décisions remplacées marquées ; nouvelles sections « Points ouverts » et « Dette technique » |