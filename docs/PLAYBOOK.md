# scrollyFFADA2S v2 — Playbook

**Isabel Cayer · Atelier Love & Code · 2026**
*Document vivant — conventions réutilisables, alimentées par le vécu réel du projet (pas décidées à l'avance).*

**Sommaire :** 1 Architecture générale · 2 Conventions de code et de données · 3 Animation et positionnement GSAP/SVG · 4 Règle d'audit · 5 Gouvernance et workflow · 6 Méthodologie de validation · 7 Production d'assets SVG · 8 Accessibilité · 9 Déploiement (GitHub Pages) · 10 Règles de rédaction

---

## 1 — Architecture générale

**Séparation des dossiers** (voir Registre pour le détail complet) :
- `shared/` — ce qui traverse les parties (i18n, tokens visuels, rail, utilitaires)
- `index.html` + `assets/` — Partie 1 (landing)
- `scrolly/` — Partie 2 uniquement
- `univers/` — Partie 3 uniquement
- `valeurs/` — Partie 4 uniquement
- Chaque partie a son propre `index.html`, `js/`, `svg/`, `css/` — une équipe externe peut reprendre une seule partie sans toucher aux autres.

**i18n — deux fonctions, deux usages distincts** (`shared/js/i18n.js`) :
- `t(clé)` — pour le chrome d'interface (dictionnaires plats dans `shared/data/i18n/{lang}.json`)
- `resolve(champ)` — pour le contenu éditorial langue-clé (récits, textes de step, valeurs), avec repli automatique via `fallbackByLanguage.json`
- Le repli n'est **pas** un français universel — chaque langue autochtone a son propre repli selon la réalité linguistique de sa communauté (ex: innu-aimun→français, mi'gmaq→anglais).
- **`t()` et `resolve()` partagent la même logique de repli** (corrigé le 2 septembre — `t()` n'avait aucun repli avant ça, une langue sans dictionnaire propre affichait des clés brutes comme `"nav.explorerValeurs"`).
- **Patron établi pour tout nouveau contenu bilingue statique** : un fichier `shared/data/*.json` avec des champs `{fr, en, ...}` par clé, un script d'initialisation qui peuple le DOM via `resolve()` au chargement ET réécoute `"languagechange"` pour retraduire sans recharger la page — voir `shared/data/landing.json` + `assets/js/landingContent.js` comme référence. Les attributs traduisibles (`alt`, titres) passent par le même mécanisme que le texte, jamais par un second système.
- **Phrases variables : des gabarits complets, jamais des morceaux collés** *(6 oct)*. `t(clé, params)` remplace des `{clés}` dans un gabarit. Une phrase qui combine plusieurs données (« Gladys, Anishinaabe de Kitigan Zibi, né·e en 1940 ») vit en gabarits complets dans `fr.json`/`en.json`, un par combinaison de données présentes : l'ordre des mots diffère d'une langue à l'autre, et un gabarit entier se traduit sans toucher au code. Les règles propres à une langue (élision « d' » devant une voyelle) sont portées par des clés dédiées (`personne.de`, `personne.deVoyelle`).

**Steps — moteur générique, jamais de logique par nom** (`scrolly/js/timeline.js` + `stepsRegistry.js` + `stepsOrder.json`) :
- `timeline.js` ne connaît jamais un step par son nom — il cherche dans `stepsRegistry` par la clé lue dans `stepsOrder.json`.
- Ajouter/retirer/réordonner un step = modifier `stepsOrder.json` (et `stepsRegistry.js` si nouveau) — **jamais** `timeline.js`.
- La clé du registre est **descriptive du contenu**, jamais de la position (`"hommage-victimes"`, pas `"step7"`) — un step peut être réordonné sans jamais être renommé.

**Transitions entre parties — toujours un geste explicite** *(leçon transitionValeurs.js, 24 août ; réaffirmé le 6 oct)* :
- Une condition automatique (temps écoulé, nombre d'interactions) peut **révéler** un bouton, mais ne doit **jamais** déclencher elle-même la navigation.
- La personne doit toujours poser un clic volontaire pour avancer d'une partie à l'autre.

**Navigation entre les pages — simuler la continuité sans fusionner les pages** *(6 oct)* :
- Les 4 parties sont des documents séparés (choix d'architecture). Les transformer en une seule application serait une refonte ; on simule plutôt la continuité.
- **Fondu natif du navigateur** : `@view-transition { navigation: auto; }` dans une feuille chargée par les 4 pages, à l'intérieur de `@media (prefers-reduced-motion: no-preference)`, avec la durée dans une variable (`--duree-transition-page`). Navigateurs sans support : navigation normale, rien ne casse.
- **Pas de flash blanc** : une petite balise `<style>` en ligne dans le `<head>` de chaque page, avant les feuilles de style, fixe la couleur de fond de `html`.
- **Mémoire de navigation** : juste avant de quitter une page, `memoriserNavigationRail()` (`railParcours.js`, exportée) écrit dans `sessionStorage` l'étape de départ, la page visée et l'étape visée. À l'arrivée, **une seule fonction** lit et efface la clé, puis rend les trois valeurs à tous ses appelants (plume, scrolly). Si deux modules lisaient la clé chacun de leur côté, le premier effacerait la donnée de l'autre. La clé effacée à la lecture garantit qu'un rechargement ou un signet ouvre la page normalement.
- **Réutiliser, jamais recopier** : tout lien qui navigue comme le rail (ex. bouton « Explorer les valeurs ») appelle la fonction exportée ; le format de la clé n'existe qu'à un seul endroit.
- **Piège des modules partagés** : deux fichiers partagent l'état d'un module (ex. l'étape active de `railParcours.js`) seulement s'ils l'importent à la même adresse. Ajouter `?v=2` à un seul des imports crée deux instances distinctes, sans erreur visible.

**Réglages de gouvernance dans les données, pas en règle automatique** *(6 oct)* :
- Quand une décision relève de la gouvernance (ex. n'offrir que FR/EN tant que personne ne porte le projet), la traduire par un réglage explicite et nommé (`afficherDansMenu`, `AFFICHER_TEXTE_LANGUE_NATION`), avec un commentaire juste au-dessus : la date, la raison, et comment réactiver. Une règle automatique (« afficher les langues qui ont un dictionnaire ») confondrait une condition technique avec une décision humaine.
- Un élément masqué par réglage ne doit pas exister dans le DOM (pas de masquage CSS) : il ne doit ni recevoir le focus ni être lu par un lecteur d'écran.

**Scoper du CSS à une page : `data-page` sur `<body>`** *(5 oct)* — ex. `<body data-page="valeurs">` puis `[data-page="valeurs"] #perle_noire1 { display: none }`. Utile pour un fichier partagé (`timeline.svg`) qui doit se comporter différemment sur une seule page.

---

## 2 — Conventions de code et de données

### 2.1 En-tête de fichier

Tout fichier `.js` du projet porte cet en-tête :

```javascript
// ==================================================
// [chemin/fichier.js]
// Description courte du rôle de ce module
//
// Rôle : Ce que ce fichier FERA quand il sera complet
// Dépend de : [chemin] (ou "aucun")
// Utilisé par : [chemin] (ou "à déterminer")
//
// FF2EplusADA (scrollyFFADA2S v2)
// Isabel Cayer · Atelier Love & Code · 2026
// ==================================================
```

### 2.2 Convention de nommage des fichiers

| Type | Convention | Exemple |
|---|---|---|
| Config / Utils / Moteur | camelCase.js | `i18n.js`, `timeline.js`, `utils.js` |
| Données | camelCase.json | `steps.json`, `valeurs.json`, `etoiles.json` |
| Registre de steps | camelCase.js | `stepsRegistry.js` |

### 2.3 Convention de nommage des ID SVG — **nouveaux assets v2 seulement**

Format : `[zone]-[élément]-[variante]` (ex: `step3-etoile-01`, `lune-valeur-respect`).

**Non-négociable pour tout nouvel asset créé pour v2** (Lune, étoiles, nouveaux steps de Déline). **Ne s'applique pas rétroactivement aux steps hérités de la v1** (voir 2.4). Exception documentée : les ids de la plume (`plume`, `perle_noire1/2/3`), auxquels le script de Déline fait référence nommément.

### 2.4 Steps hérités de la v1 — la sécurité vient du scoping, pas du nommage

Audit du 19 août 2026 (step7, step9, step10) : des ID identiques se répètent volontairement entre plusieurs steps de la v1 (`#stripe1`, `#frame1`...) et ça fonctionne, **parce que** chaque requête est systématiquement scopée à son propre conteneur :

```javascript
step7Container.querySelector(sel)   // ✅ toujours comme ça
document.querySelector(sel)          // ❌ jamais, pour un élément animé par ID
```

**Règle non-négociable** : toute nouvelle fonction `showStepX()`/`hideStepX()` doit scoper ses requêtes au conteneur du step, jamais au document global.

### 2.5 Nommage des fichiers JS — **nouveau contenu v2 seulement** *(24 août)*

Le système `stepN.js` numérique est réservé aux steps **hérités de la v1** (step7, step9, step10) — jamais étendu à du contenu neuf.

**Tout nouveau fichier v2** porte un **nom descriptif**, scopé au dossier `js/` de sa propre partie, aligné sur sa clé de registre quand applicable.

| ❌ À éviter | ✅ À la place |
|---|---|
| `scrolly/js/steps/step12.js` (nouveau contenu, pas hérité) | `scrolly/js/steps/[nomDescriptif].js` |
| `univers/js/step12.js` | `univers/js/transitionValeurs.js` |

*(Aveu du 24 août : `step11.js` lui-même est un léger écart à cette règle, nommé par habitude avant qu'elle soit formalisée — laissé tel quel.)*

### 2.6 Champs de données synthétiques — toujours nommés explicitement

Toute donnée générée/approximative porte un nom qui le dit clairement, pour qu'on ne la confonde jamais avec une vraie donnée reçue plus tard :

- `decennieNaissanceApprox` (synthétique) vs `portrait.dateNaissance` (réel, vide tant qu'inconnu)
- Répartition par nation dans `etoiles.json` : générique/illustrative, documentée comme telle au Registre — jamais présentée comme une vraie proportion.

**Complément du 24 septembre** : quand une vraie donnée remplace un placeholder, **auditer systématiquement les champs dérivés** qui dépendaient de l'ancienne valeur synthétique. Exemple : `ORDRE_DECENNIES` ne couvrait pas les décennies antérieures à 1950 (champ conçu pour une date de décès, réutilisé pour la naissance), dépendance restée invisible tant qu'aucune vraie donnée ne l'avait mise à l'épreuve.

### 2.7 Pas de donnée, pas d'élément — retirer à la source *(5-6 oct)*

- Un texte d'attente (« [Texte à venir des artistes] ») se retire **dans les données**, pas en CSS. Le code applique la règle « champ absent ou vide = aucun élément, aucun espace résiduel » : si la donnée arrive un jour, elle s'affiche sans toucher au code.
- Un élément masqué en CSS mais encore construit et animé reste de la dette pour la personne qui reprendra le projet. Exception : un texte qui est la seule annonce d'une information pour les lecteurs d'écran (voir §8).
- Tout champ optionnel qui n'apparaît plus dans aucune entrée (ex. `definition` de `valeurs.json`, `nomPersonne` de `nations.json`) doit être documenté au README de legs, sinon personne ne saura qu'il existe.

### 2.8 Échapper toute valeur insérée en HTML *(6 oct)*

Dès qu'une donnée est insérée avec `innerHTML` (ex. un prénom en `<strong>` dans une phrase), elle passe par une fonction d'échappement (`echapperHtml()`). Les données seront un jour saisies par une tierce personne ; un caractère `<` ou `&` ne doit jamais être interprété comme du HTML.

### 2.9 Une seule source quand deux composants présentent la même information *(6 oct)*

L'infobulle et la modale présentent la même personne : la construction des segments et les fonctions de contraste vivent dans un module de la partie (`univers/js/presentationPersonne.js`), importé par les deux. Sinon, la première correction (ex. la forme du nom de nation) fera diverger les deux affichages.

### 2.10 Collecte de données par une tierce personne

Colonnes recommandées : `id, nomComplet, prenom, dateNaissance, nation, communaute, temoignage, langueTemoignage, redigePar, sourceUrl, photo, traduction faite?`. Listes déroulantes pour `nation` (ids de `nations.json`). Prévoir l'uniformisation typographique (« œ », apostrophes) et le dédoublonnage entre sources.

---

## 3 — Principes d'animation et de positionnement GSAP/SVG

### 3.1 Symétrie show/hide *(leçon step9, 19 août 2026)*

Quand `show()` anime une propriété (opacité, couleur, position) au niveau d'un **groupe**, `hide()` doit réinitialiser cette même propriété **au même niveau** — jamais plus profond dans l'arbre DOM.

Réinitialiser individuellement des enfants alors que seul le parent est animé au `show` crée un état qui fonctionne au premier passage, mais casse silencieusement au deuxième cycle show→hide→show.

```javascript
// ❌ Piège : reset trop profond, désynchronisé du show (qui anime seulement le groupe)
gsap.set(circles, { opacity: 0, fill: "#c9cbc3" });

// ✅ clearProps laisse le style CSS d'origine reprendre le dessus automatiquement
gsap.set(circles, { clearProps: "opacity,fill" });
```
**Piège plus large découvert le 26 août (step7, step10) :** `clearProps: "all"` vide l'attribut `style` au complet, y compris un style inline écrit à même le SVG source (ex: `fill` d'un export Illustrator) que GSAP n'a jamais touché. Invisible tant qu'on ne teste pas un vrai cycle show→hide→show.

Ne jamais utiliser `"all"` par réflexe :
- soit nommer explicitement les propriétés que GSAP a animées (`clearProps: "opacity,visibility"`)
- soit vérifier si `show()` réinitialise déjà tout ce qui compte au départ de chaque appel.

### 3.2 Un groupe = une intention d'animation

Si des sous-éléments ne sont **jamais** ciblés individuellement par GSAP, ils n'ont pas besoin d'ID uniques — l'opacité du groupe parent suffit. Réserver le nommage individuel aux éléments réellement animés un par un.

**Corollaire (6 oct)** : quand le code parcourt les enfants d'un groupe (`groupe.children` pour trier, masquer, mémoriser), ne jamais y ajouter d'éléments d'une autre nature (ex. des halos). Les placer dans un groupe frère, peint avant (derrière) ou après (devant).

### 3.3 Centrage et mise à l'échelle SVG — toujours mesurer, jamais présumer *(leçon step11, 24 août)*

Un calcul de centrage basé uniquement sur les coordonnées internes du `viewBox` est **fragile** — ça dépend de détails du fichier source qui varient d'un export à l'autre.

**La méthode robuste** : mesurer la position **réellement rendue à l'écran** (`getBoundingClientRect()`), puis convertir en coordonnées internes du SVG via sa matrice de transformation courante (`getScreenCTM().inverse()`).

```javascript
const ctmInverse = element.getScreenCTM().inverse();
const rect = element.getBoundingClientRect();
const pt = svgRoot.createSVGPoint();
pt.x = rect.left + rect.width / 2;
pt.y = rect.top + rect.height / 2;
const centreReelEnCoordonneesSVG = pt.matrixTransform(ctmInverse);
```

Même principe pour une croissance ciblée : mesurer la hauteur actuelle en pixels réels, calculer le facteur par rapport à la cible en pixels.

**Complément** :
- `getBBox()` ignore le transform propre à l'élément mesuré : il ne donne la bonne réponse que si l'élément n'a pas de transform. Préférer la mesure du rendu réel.
- Une boîte de `getBoundingClientRect()` est **alignée sur les axes**, contrairement à la boîte pivotée qu'affiche Illustrator. Pour ancrer un point précis d'un dessin incliné (ex. la pointe de la plume au coin supérieur droit), vérifier visuellement avec un point de contrôle temporaire (drapeau `DEBUG_...`, à remettre à `false` avant le commit).

### 3.4 Convention de z-index — éviter la collision récurrente avec `loadSVG()`

`loadSVG()` (dans `shared/js/utils.js`) donne à chaque conteneur de step/asset un `z-index: 1500`. **Ce chiffre a causé le même bug à répétition** — toujours vérifier qu'un élément d'interface censé rester au-dessus a un `z-index` **supérieur à 1500**, et qu'un élément de **fond** a un `z-index` **inférieur** au contenu SVG qu'il met en valeur.

Repère : fond de page < overlay de fond (voile, assombrissement) < contenu SVG animé (steps, Lune, étoiles) < interface de contrôle (boutons, curseur).

**Un SVG est atomique pour le z-index face à du HTML externe** *(~1 oct)* : on ne peut pas glisser un élément HTML « entre » deux calques d'un même SVG. Pour placer du HTML entre deux couches (ex. les mots de la trame poétique entre le rail et la plume), déplacer la couche du dessus dans un second `<svg>` superposé, de même viewBox.

### 3.5 Ne jamais rejouer hide+show sur une navigation vers le MÊME step *(leçon goToStep, 2 septembre 2026)*

Toute fonction qui orchestre une transition entre deux états doit vérifier que l'état cible est RÉELLEMENT différent de l'état courant avant de déclencher quoi que ce soit. Sans ce garde, un changement de langue qui rappelle la navigation sur le même index déclenche un hide() suivi d'un show() du même step — et si hide() nettoie son DOM dans un callback GSAP asynchrone (`onComplete`), ce nettoyage tardif peut effacer la scène que show() vient de reconstruire.

```javascript
// ❌ Piège : aucune vérification, hide()+show() se rejouent même si rien ne change
export function goToStep(index) {
  const prevEntry = order[currentIndex];
  const nextEntry = order[index];
  if (prevEntry && stepsRegistry[prevEntry.id]) stepsRegistry[prevEntry.id].hide();
  if (nextEntry && stepsRegistry[nextEntry.id]) stepsRegistry[nextEntry.id].show();
  currentIndex = index;
}

// ✅ Un garde suffit — rien à cacher ni à révéler si l'index n'a pas changé
export function goToStep(index) {
  if (index === currentIndex) return;
  // ... reste identique
}
```

Ce correctif protège TOUS les steps d'un coup — un bug qui semble propre à un seul endroit mérite de vérifier s'il vient d'une fonction partagée plus haut dans la chaîne d'appel.

### 3.6 `opacity: 0` n'enlève pas les clics *(~fin sept)*

Un élément transparent intercepte toujours les clics et le survol (cas des `<image id="barre1-5">` du step D, qui rendaient les cercles de valeurs muets). Tout élément invisible ou décoratif posé par-dessus du contenu interactif reçoit `pointer-events: none`.

Pour masquer un élément qui ne doit plus compter dans aucune mesure, préférer `display: none` à `visibility: hidden` : un élément en `visibility: hidden` garde sa géométrie et peut fausser la boîte englobante d'un groupe parent.

### 3.7 Timelines GSAP : synchroniser par labels *(5 oct)*

- Pour faire démarrer deux animations ensemble (ex. les perles avec le territoire), poser un label (`tl.addLabel("territoire", "+=3")`) et positionner les deux sur ce label, plutôt que de recalculer des secondes : si l'un change de délai, l'autre suit.
- `"+=2"` compte depuis la **fin de toute la timeline** ; `">"` compte depuis la **fin de l'animation précédente**. Après un retour en arrière sur un label, `"+="` peut décaler toute la suite.
- Les rythmes qu'Isabel voudra ajuster à l'œil vivent dans des constantes nommées en tête de fichier (`ECART_GROUPES_PERLES_S`, `DUREE_AFFICHAGE_MOT_MS`).

### 3.8 Effets continus (halos, pulsations) *(univers, puis step D le 5 oct)*

- Animer `r` et `fill-opacity`, **jamais** `opacity` : l'opacité reste libre pour les fondus de groupe, sans conflit entre deux animations.
- Démarrer l'effet d'un élément à la fin de son propre fondu d'entrée.
- `hide()` appelle `killTweensOf()` puis retire les éléments créés ; un `show()` suivant reconstruit sans doublon (compter les éléments après plusieurs cycles).
- Sous `prefers-reduced-motion` : effet statique, aucune pulsation.
- Proportions plutôt que marges fixes quand l'effet est réutilisé sur des éléments de tailles différentes (un halo d'étoile de 10 px ne se transpose pas à un spot de valeur).

### 3.9 Un `show()` qui attend une ressource doit vérifier qu'il est encore actif *(5 oct)*

Si `show()` attend un chargement (`await` d'un JSON), la personne peut avoir quitté le step entre-temps. Après chaque `await`, vérifier que le step est toujours le step actif avant de construire quoi que ce soit, sinon des éléments orphelins restent affichés sur le step suivant.

### 3.10 Guides dessinés dans le SVG, éléments HTML positionnés par mesure *(~1 oct)*

Quand un élément HTML doit se placer exactement à un endroit d'une illustration (mots de la trame poétique), Isabel dessine dans Illustrator des **calques guides** (point d'ancrage, boîte, texte témoin) ; le code les masque en CSS, mesure leur rendu réel et y positionne le HTML. Le placement reste une décision visuelle prise dans l'outil de dessin, et il suit automatiquement les redimensionnements et A-/A/A+.

---

## 4 — Règle d'audit (obligatoire avant renommage/suppression/restructuration)

```bash
grep -rn "[nom de l'export ou de la fonction concernée]" [dossier]
```
Avant toute modification qui touche un export existant utilisé ailleurs — voir le gabarit de prompt Claude Code pour l'intégration systématique de cette règle.

**Rappel** : un nom construit dynamiquement (`` `#perles${i}` ``) n'apparaît pas tel quel au grep ; chercher aussi le motif de construction.

---

## 5 — Gouvernance et workflow

- **Claude.ai** : architecture, gouvernance, validation des sorties de Claude Code.
- **Claude Code** : exécute, **ne commit jamais** — Isabel valide avec Claude.ai puis commit manuellement.
- **Commits** au format `S[n]B[n]T[n] - description courte`.
- **Effort réel** : jamais estimé — toujours demandé après coup pour le Kanban.
- **Gouvernance du contenu** : le projet se fait *avec et pour* les femmes et artistes autochtones impliquées — la gouvernance créative et les données sensibles restent sous leur autorité. Une question qui touche la façon de nommer les personnes ou les nations peut dépasser l'équipe de recherche-création : la soumettre à la personne responsable des projets de réconciliation (cas du nom de nation au singulier, 6 oct).

### 5.1 Structure d'un prompt Claude Code *(pratique consolidée, oct.)*

- **Étape 0 — Audit en lecture seule**, avant toute correction : où vit le code, comment il fonctionne, ce qui en dépend. Claude.ai ne voit pas le dépôt ; les corrections décrivent donc le **comportement attendu**, et c'est l'audit qui trouve le code.
- **Conditions d'arrêt explicites** : « si l'audit montre X, arrête-toi et propose ». Un arrêt de Claude Code faute de contexte est un bon signe, pas un échec.
- **Toujours envoyer un prompt complet.** Un bloc de remplacement envoyé seul (sans le prompt d'origine) laisse Claude Code sans contexte (leçon du 6 oct).
- **Creuser la vraie cause** plutôt que patcher le symptôme localement : la cause est souvent en amont, dans une fonction partagée.
- **Niveau de vérification choisi selon le risque** *(5 oct)* :
  - vert (rapide) : lignes modifiées et erreurs console ; Isabel teste à l'œil ;
  - orange : en plus, deux ou trois vérifications ciblées, sans captures ;
  - rouge (structure) : cas limites, non-régression, tests poussés.
  
  Ligne type pour le vert et l'orange : « Vérifications légères : ne pas écrire de suite de tests automatisés ni de captures. Isabel teste visuellement. » Sans elle, Claude Code construit des environnements de test complets à chaque tâche, ce qui coûte beaucoup de tokens.
- **Site en ligne** : ajouter « tester en local uniquement, aucun push ».

### 5.2 Planification

Calibrage observé sur la semaine « Version finale » (6 oct) : budget de Claude ~13,9 h, réel 8,5 h, en absorbant au moins 7 tâches imprévues. Pour le prochain projet : diviser les budgets de Claude par 2 pour le travail prévu, garder une marge explicite pour l'imprévu (environ la moitié du travail réel), et classer les tâches par risque (vert/orange/rouge) plutôt que par durée. Les budgets restent un outil de planification, jamais une valeur pour la colonne « Effort ».

---

## 6 — Méthodologie de validation

**Vertical slice** : découper une validation risquée en **tranches isolées** — si quelque chose casse, on sait quelle variable est en cause. Exemple du 19 août : Tranche A (mécanique timeline/registry/i18n sur un step) validée avant Tranche B (navigation inter-parties).

**Toujours tester, pour tout step touché** :
- un vrai cycle show→hide→show, en avançant et en reculant (jamais seulement un chargement frais, §3.1) ;
- un changement de langue en plein step (§3.5) ;
- `prefers-reduced-motion`.

**Données peu nombreuses et denses** *(24 sept)* : un mécanisme testé avec 221 données synthétiques peut cacher un défaut qui n'apparaît qu'avec quelques vraies données groupées dans le même secteur (`rayonCollision`). Tester explicitement ce cas.

**Rechargement forcé avant tout diagnostic** (Ctrl+Maj+R) : un « bug » visible peut n'être qu'un ancien CSS en cache (§9).

---

## 7 — Production d'assets SVG

### 7.1 Extraire un calque d'un fichier existant en asset autonome

Méthode utilisée pour `lune.svg` (extrait de `step10_lune_etoile.svg`) :

1. Vérifier qu'aucune dépendance externe n'existe (`<style>`, `<defs>` partagés) — chaque `path` doit porter son propre style en ligne.
2. Calculer la vraie boîte englobante du contenu avec `svgpathtools` (Python) plutôt que de deviner.
3. Ajouter une marge de sécurité (~15%) si une partie des paths n'a pas pu être mesurée.
4. Envelopper le contenu extrait dans un nouveau `<g id="...">` nommé clairement, avec son propre `viewBox` recadré.

### 7.2 Vectorisation (Illustrator Image Trace vs Adobe Express) *(24 août)*

Adobe Express « Convert to SVG » n'expose **aucun réglage** — le seul levier disponible est l'image source elle-même. Pour préserver le détail d'un coup de pinceau scanné : rajouter du grain/texture dans Photoshop (Bruit, Texturizer) avant de vectoriser.

Illustrator Image Trace reste le filet de sécurité : de vrais curseurs (Seuil, Bruit, Tracés), avec le préréglage « Noir et Blanc » plutôt que « Photo » pour ce type d'illustration.

### 7.3 Méthode complète — de la réception d'un dessin de Déline à son intégration *(25 août, leçon S3B1T1)*

**Étape 0 — Décider ce qui doit être animé individuellement.** Est-ce que ce morceau doit bouger **indépendamment** à l'écran ? Si oui → vecteur (étape 1a). S'il bouge toujours **comme un seul bloc** → raster (étape 1b).

**Étape 1a — Élément à animer individuellement → vectoriser.** Tracé dans Illustrator (ou Image Trace, §7.2), en nommant chaque calque selon la convention `[zone]-[élément]-[variante]` (§2.3).

**Étape 1b — Élément qui bouge comme un bloc → traiter en raster.**
1. Dans Photoshop, après détourage du fond : **Image > Taille de l'image**, largeur cible **~2000-2500 px**, rééchantillonnage **« Bicubique plus net (réduction) »**.
2. Vérifier les bords pour une frange résiduelle (**Calque > Matriçage > Supprimer la frange**).
3. **Fichier > Exporter > Exporter sous** → **PNG-24** (jamais PNG-8), transparence cochée.
4. Convertir en **WebP** (~70% de moins que le PNG, sans perte visible).

**Étape 2 — Assembler dans Illustrator.** Importer les PNG/WebP allégés à côté des éléments vectorisés, chacun dans un calque nommé.

**Étape 3 — Export SVG.** Stylisation **« Attributs de présentation »**, Police **« SVG »**, **Images : « Lier »** (jamais **« Conserver »** — encode les images en base64 dans le SVG, cause vérifiée d'un fichier passé de 32 Mo à 1,25 Mo une fois corrigé), ID objet **« Noms de calque »**, Responsive coché.

**Étape 4 — Corriger les chemins dans VS Code.**
- Ouvrir le `.svg` en **éditeur de texte** (clic droit → *Open With* → *Text Editor*).
- Réécrire les `href` en chemins relatifs à la **page qui charge le SVG** (via `loadSVG()`), pas à l'emplacement du fichier SVG : `./svg/[nomStep]/[fichier].webp`.
- **Vérifier chaque ligne individuellement après un remplacement en série.**

**Étape 5 — Déposer les fichiers.** Le `.svg` corrigé et toutes les images qu'il référence, ensemble dans `scrolly/svg/[nomStep]/`.

**Étape 6 — Vérifier.** Ni l'aperçu VS Code ni un navigateur ouvrant le `.svg` directement ne sont des tests valides. Le seul test fiable : la vraie page, onglet **Network** des DevTools, code **200** sur chaque ressource — et **vider tout filtre de recherche actif** avant de conclure qu'une requête manque.

### 7.4 Verrouiller le plan de travail à l'export *(24 septembre 2026, `valeurs.svg`)*

Par défaut, l'export SVG d'Illustrator calcule le `viewBox` à partir de la boîte englobante du **contenu visible** — pas des dimensions du plan de travail, sauf si « Utiliser les plans de travail » est coché ET que le plan de travail a des dimensions intentionnelles.

Symptôme si cette étape est oubliée : retoucher un seul calque fait bouger le `viewBox` global, ce qui décale **tous les autres calques** (constaté : décalage uniforme de +114,78 sur 10 éléments non modifiés).

**Geste préventif** : avant tout réexport, fixer les dimensions du plan de travail (Objet > Plan de travail > Options), PUIS cocher « Utiliser les plans de travail » (Fichier > Exporter > Exporter sous). Pour agrandir un plan de travail (ex. ajouter « Reconnectons à nos valeurs » à droite du rail), l'agrandir **à droite seulement**, puis ajuster le `viewBox` à la main si nécessaire : l'origine des coordonnées ne bouge pas.

**Geste correctif** : comparer avec `git diff` au commit précédent pour isoler ce qui a changé, avant de décider si c'est voulu.

**Noms de calques dupliqués** : si deux calques portent le même nom, Illustrator ajoute un suffixe (`-2`) à l'export, et un id peut finir sur le mauvais élément (cas vie/bienveillance, « Reconnectons »). Après chaque export, vérifier chaque id contre son `href` et contre les données (`valeurs.json`).

### 7.5 Pipeline de couleur Procreate → web *(24 septembre 2026)*

Procreate dessine par défaut en **Display P3**, une gamme plus large que **sRGB**, le seul espace que le web comprend nativement. À l'ouverture dans Photoshop (« Non-concordance des profils incorporés ») :
- **« Supprimer le profil incorporé »** : les chiffres RGB bruts sont réinterprétés en sRGB → couleur désaturée. **Cause la plus probable d'un résultat « pastel » inattendu.**
- **« Convertir les couleurs du document selon l'espace de travail »** : conversion contrôlée et prévisible.

**Geste préventif retenu** : régler la toile Procreate en **sRGB IEC61966-2.1** avant de commencer à dessiner (Informations sur la toile > Profil de couleur). Une couleur prélevée à la pipette pour le code (ex. `couleur` de `valeurs.json`) doit aussi l'être en sRGB.

### 7.6 Pipeline de production itérative d'un fichier SVG

1. **Dessin** (Déline sur papier, ou Boris sur Procreate en sRGB, §7.5) — voir `docs/GUIDE_DELINE.md`.
2. **Export vers Isabel** — PNG ou TIFF, jamais JPEG. Un fichier par élément si possible.
3. **Préparation Photoshop** (raster) — détourage, redimensionnement (~2000-2500 px), export PNG-24 puis WebP. **Rogner aux pixels transparents** (Image > Rognage, « Pixels transparents ») : une marge non rognée gonfle la boîte englobante et fausse les calculs de recentrage. **Nuance (5 oct, logo Agora)** : avant de rogner, vérifier que l'espace vide ne fait pas partie de la composition (la lune isolée en haut à gauche du logo est voulue).
4. **Assemblage Illustrator** — plan de travail aux dimensions cibles FIXÉES, calques nommés selon §2.3.
5. **Export SVG** — **Fichier > Exporter > Exporter sous** (jamais « Enregistrer sous », cause probable des ids en `_x5F_`), « Utiliser les plans de travail » coché, Images « Lier ».
6. **Correction des chemins dans VS Code** — §7.3. **Technique accélérée** : recherche-remplacement en expression régulière (Ctrl+H, icône `.*`) :
   - Rechercher : `xlink:href="([a-zA-Z0-9_-]+\.(webp|png))"`
   - Remplacer : `xlink:href="./svg/[nomStep]/$1"`
   
   *(Un script qui automatiserait cette étape et vérifierait l'existence des fichiers et les `href` en double est reporté au prochain projet, 5 oct.)*
7. **Dépôt des fichiers** — `scrolly/svg/[nomStep]/` (ou dossier équivalent).
8. **Vérification** — §7.3 Étape 6. Si le fichier remplace un calque existant, comparer le `viewBox` avant/après (`git diff`).

**SVG chargé par `<img>` plutôt que par `loadSVG()`** *(~fin sept, landing)* : un SVG affiché par une balise `<img>` ne charge **aucun** fichier externe (ses `href` vers des `.webp` restent vides). Pour ce cas, produire une version autonome avec l'image embarquée en base64 (ex. `couple_plume_respect.svg`, 66 Ko). C'est la seule exception à la règle « Images : Lier ».

### 7.7 Les éléments fondamentaux d'un script technique

*Ce qu'un script de Déline (ou toute préparation de contenu SVG) devrait préciser avant qu'un fichier existe.*

- **Quels éléments bougent individuellement vs en bloc** (§3.2) — à revalider pour chaque nouveau fichier.
- **Quel texte reste éditorial/i18n vs quel texte est intégré au SVG.** Règle : tout texte narratif ou variable vit en overlay HTML/CSS avec `resolve()`. **Exception assumée** : un mot figé qui fait partie de l'illustration, par choix graphique (« ISHPENITAMUN / Respect » dans `couple_plume_respect.svg`) ; dans ce cas, prévoir un texte alternatif traduit, et vectoriser le texte (Créer les contours) pour ne pas dépendre de la police.
- **Dimensions cibles du plan de travail, fixées explicitement** (§7.4), et documentées.
- **Quels éléments seront probablement retouchés plus tard** — nom de calque stable et descriptif dès le départ.
- **La couleur cible du dessin (Procreate) est-elle en sRGB ?** (§7.5).
- **Les points d'ancrage** dont le code aura besoin (ex. où la plume se pose sur un bouton) : un guide dessiné vaut mieux qu'un calcul géométrique (§3.10).

---

## 8 — Accessibilité *(principes consolidés, 5-6 oct)*

*Sensibilité EDIA (Registre, 24 août) : pas une conformité formelle visée, mais des décisions intégrées au fil de la construction.*

- **Contraste calculé, pas présumé.** Quand un texte se pose sur une couleur venue des données (couleur de nation), choisir le noir ou le blanc par le ratio de contraste WCAG (luminance relative), avec une petite fonction nommée. Seuils : 4,5:1 pour le texte, 3:1 pour la bordure d'un élément d'interface (critère 1.4.11). Fournir un repli neutre si la couleur est absente ou invalide.
- **Contenu au survol (WCAG 1.4.13).** Une infobulle doit pouvoir être survolée sans disparaître, rester affichée tant que le pointeur est sur l'élément ou sur elle, et se fermer avec Échap. Elle s'ancre à côté de l'élément (jamais en suivant le curseur), avec un court délai de fermeture (~300 ms). Au toucher, il n'y a pas de survol : premier toucher = afficher, bouton = agir (utiliser `pointerType` plutôt qu'une détection d'appareil). Cible tactile d'au moins 44 px.
- **Avant de retirer un texte, vérifier s'il est la seule annonce pour les lecteurs d'écran** (`aria-live`, titre de scène). S'il ne l'est pas, le retirer du DOM plutôt que de le rendre transparent : un texte à `opacity: 0` reste lu par les lecteurs d'écran sur toutes les pages suivantes (cas du sous-titre « Spirale de la violence », 5 oct).
- **Le nom accessible suit la langue.** Préférer `aria-labelledby` pointant vers un titre visible traduit à un `aria-label` figé dans une seule langue. Les `alt` passent par les mêmes données traduites que le texte.
- **`prefers-reduced-motion`** pour toute animation, y compris les fondus entre les pages et les effets continus (§3.8).
- **Écriture inclusive et lecteurs d'écran** : certains lecteurs d'écran prononcent le point médian (« né point e »). C'est un compromis accepté, à garder en tête.
- Lot à traiter et audit formel : voir les points ouverts du Registre.

---

## 9 — Déploiement (GitHub Pages)

- **Chemins** : le site est servi sous `icayer.github.io/FF2EplusADA/`, pas à la racine du domaine. Jamais de chemin absolu (`/shared/...`) ; utiliser `new URL(chemin, import.meta.url)` dans les modules JS.
- **Cache** : GitHub Pages sert les fichiers avec `max-age=600`. `loadSVG()` ajoute `?v=Date.now()` aux SVG, mais pas aux CSS/JS : un mélange d'anciens CSS/JS et d'un SVG neuf donne des symptômes trompeurs. **Rechargement forcé (Ctrl+Maj+R) avant tout diagnostic**, en local comme en ligne. Des numéros de version sur les CSS/JS sont envisageables, en gardant le piège des modules partagés en tête (§1).
- **Une fois le site en ligne** : chaque push est public dans les minutes qui suivent. Tester en local avant de pousser, et vérifier qu'aucun drapeau de débogage (`DEBUG_...`) n'est resté à `true`.

---

## 10 — Règles de rédaction

### 10.1 Voix rédactionnelle (repères tirés des fiches services d'Isabel)
- Jamais de tiret cadratin (—) comme procédé stylistique/rythmique
- Cadence naturelle des phrases, pas de fragments poétiques en cascade
- Images ancrées dans le concret et le spécifique, pas l'abstrait générique
- Ton chaleureux et direct, jamais grandiloquent
- Clôture par une adresse directe, pas une formule solennelle

### 10.2 Présenter une personne commémorée *(6 oct)*
- **Une phrase factuelle en appositions** plutôt qu'une fiche sèche ou une voix prêtée : « Gladys, Anishinaabe de Kitigan Zibi, né·e en 1940 ». Elle situe la personne dans le temps et l'espace, et se dégrade naturellement quand une donnée manque (« Gladys, de Kitigan Zibi »).
- **Jamais de première personne** au nom d'une personne disparue ou assassinée : c'est lui prêter une voix sans son accord, et les protocoles sur la façon d'évoquer les personnes décédées varient d'une nation à l'autre.
- **Aucun temps de verbe qui présume la mort** : certaines personnes sont disparues, et leur famille n'a peut-être pas accepté ou confirmé un décès.
- **« né·e en » devant toute année**, pour qu'on ne la lise jamais comme une année de décès.
- **Le nom de nation pour une personne** passe par les données (`nomPersonne`), jamais en dur dans le code : sa forme (accord, écriture inclusive, forme invariable) relève d'une décision de gouvernance.
- **Nommer la personne qui raconte** (`redigePar`) reconnaît la mémoire portée par la communauté ; s'assurer de son accord pour être nommée à l'endroit choisi.
- **Une invitation sans verbe de geste** (« Lire le témoignage → » plutôt que « Cliquez sur l'étoile ») : elle vaut pour la souris, le toucher et le clavier.

---

## Journal des versions du Playbook

| Version | Date | Ajouts |
|---|---|---|
| v0.1 | 19 août 2026 | Création initiale — conventions établies durant le Sprint 1 (arborescence, i18n, steps registry, scoping SVG, symétrie show/hide) |
| v0.2 | 24 août 2026 | Transitions toujours manuelles ; nommage des nouveaux fichiers JS v2 ; nommage explicite des données synthétiques ; centrage SVG toujours mesuré ; convention de z-index ; extraction d'un calque ; notes de vectorisation |
| v0.3 | 25 août 2026 | Méthode complète de préparation d'un dessin de Déline — voir aussi `docs/GUIDE_DELINE.md` |
| v0.4 | 24 sept 2026 | Verrouillage du plan de travail (§7.4) ; pipeline couleur Procreate (§7.5) ; pipeline itératif (§7.6) ; éléments fondamentaux d'un script technique (§7.7) ; compléments données synthétiques et données denses |
| v0.5 | 6 oct 2026 | Fusion des ajouts de septembre dans la numérotation ; leçons du résumé d'octobre (SVG atomique, `opacity` et clics, `getBBox`, noms de calques dupliqués, SVG par `<img>`, guides dessinés, cache et chemins GitHub Pages) ; navigation entre pages (fondu natif, mémoire `sessionStorage`) ; gabarits i18n ; réglages de gouvernance dans les données ; `data-page` ; données retirées à la source ; échappement HTML ; timelines GSAP par labels ; effets continus ; structure des prompts et niveaux de vérification ; calibrage de planification ; nouvelles sections Accessibilité (§8), Déploiement (§9) et présentation d'une personne commémorée (§10.2) |