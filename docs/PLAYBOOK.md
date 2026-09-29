# scrollyFFADA2S v2 — Playbook

**Isabel Cayer · Atelier Love & Code · 2026**
*Document vivant — conventions réutilisables, alimentées par le vécu réel du projet (pas décidées à l'avance).*

---

## 1 — Architecture générale

**Séparation des dossiers** (voir Registre pour le détail complet) :
- `shared/` — ce qui traverse les 3 parties (i18n, tokens visuels, utilitaires)
- `scrolly/` — Partie 2 uniquement
- `univers/` — Partie 3 uniquement
- `valeurs/` — Partie 4 uniquement
- Chaque partie a son propre `index.html`, `js/`, `svg/`, `css/` — une équipe externe peut reprendre une seule partie sans toucher aux autres.

**i18n — deux fonctions, deux usages distincts** (`shared/js/i18n.js`) :
- `t(clé)` — pour le chrome d'interface (dictionnaires plats dans `shared/data/i18n/{lang}.json`)
- `resolve(champ)` — pour le contenu éditorial langue-clé (récits, textes de step, valeurs), avec repli automatique via `fallbackByLanguage.json`
- Le repli n'est **pas** un français universel — chaque langue autochtone a son propre repli selon la réalité linguistique de sa communauté (ex: innu-aimun→français, mi'gmaq→anglais).
- **`t()` et `resolve()` partagent maintenant la même logique de repli**
  (corrigé le 2 septembre — `t()` n'avait aucun repli avant ça, une
  langue sans dictionnaire propre affichait des clés brutes comme
  `"nav.explorerValeurs"`). `shared/data/i18n/` contient `fr.json` ET
  `en.json` — toute nouvelle langue autochtone documentée retombe
  proprement sur sa langue de repli pour le chrome ET le contenu
  éditorial, pas seulement l'un des deux.
- **Patron établi pour tout nouveau contenu bilingue statique**
  (landing page, futurs textes de valeurs) : un fichier
  `shared/data/*.json` avec des champs `{fr, en, ...}` par clé, un
  script d'initialisation qui peuple le DOM via `resolve()` au
  chargement ET réécoute `"languagechange"` pour retraduire sans
  recharger la page — voir `shared/data/landing.json` +
  `assets/js/landingContent.js` comme référence.

**Steps — moteur générique, jamais de logique par nom** (`scrolly/js/timeline.js` + `stepsRegistry.js` + `stepsOrder.json`) :
- `timeline.js` ne connaît jamais un step par son nom — il cherche dans `stepsRegistry` par la clé lue dans `stepsOrder.json`.
- Ajouter/retirer/réordonner un step = modifier `stepsOrder.json` (et `stepsRegistry.js` si nouveau) — **jamais** `timeline.js`.
- La clé du registre est **descriptive du contenu**, jamais de la position (`"hommage-victimes"`, pas `"step7"`) — un step peut être réordonné sans jamais être renommé.

**Transitions entre parties — toujours un geste explicite** *(leçon transitionValeurs.js, 24 août)* :
- Une condition automatique (temps écoulé, nombre d'interactions) peut **révéler** un bouton, mais ne doit **jamais** déclencher elle-même l'animation de sortie ni la navigation.
- La personne doit toujours poser un clic volontaire pour avancer d'une partie à l'autre — aucune transition ne doit "partir toute seule".

---

## 2 — Conventions de code

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

**Non-négociable pour tout nouvel asset créé pour v2** (Lune, étoiles, nouveaux steps de Déline). **Ne s'applique pas rétroactivement aux steps hérités de la v1** (voir 2.4) — pas de renommage de masse dans Illustrator pour ceux-là.

### 2.4 Steps hérités de la v1 — la sécurité vient du scoping, pas du nommage

Audit du 19 août 2026 (step7, step9, step10) : des ID identiques se répètent volontairement entre plusieurs steps de la v1 (`#stripe1`, `#frame1`...) et ça fonctionne, **parce que** chaque requête est systématiquement scopée à son propre conteneur :

```javascript
step7Container.querySelector(sel)   // ✅ toujours comme ça
document.querySelector(sel)          // ❌ jamais, pour un élément animé par ID
```

**Règle non-négociable** : toute nouvelle fonction `showStepX()`/`hideStepX()` doit scoper ses requêtes au conteneur du step, jamais au document global. C'est ce scoping — pas l'unicité des noms — qui empêche les collisions entre steps chargés simultanément dans le DOM.

### 2.5 Nommage des fichiers JS — **nouveau contenu v2 seulement** *(24 août)*

Le système `stepN.js` numérique est réservé aux steps **hérités de la v1** (step7, step9, step10) — jamais étendu à du contenu neuf, même dans `scrolly/`.

**Tout nouveau fichier v2** (nouveau step de Déline, transition, animation propre à une partie) porte un **nom descriptif**, scopé au dossier `js/` de sa propre partie, aligné sur sa clé de registre quand applicable — jamais un numéro qui laisse croire à une continuité avec le système `stepsRegistry.js` de `scrolly/`.

| ❌ À éviter | ✅ À la place |
|---|---|
| `scrolly/js/steps/step12.js` (nouveau contenu, pas hérité) | `scrolly/js/steps/[nomDescriptif].js` |
| `univers/js/step12.js` | `univers/js/transitionValeurs.js` |

*(Aveu du 24 août : `step11.js` lui-même est un léger écart à cette règle, nommé par habitude avant qu'elle soit formalisée — laissé tel quel, rien d'autre n'en dépend directement, mais la règle s'applique strictement à partir de maintenant.)*

### 2.6 Champs de données synthétiques — toujours nommés explicitement

Toute donnée générée/approximative (pas une vraie donnée individuelle) porte un nom qui le dit clairement, pour qu'on ne la confonde jamais avec une vraie donnée reçue plus tard :

- `decennieNaissanceApprox` (synthétique) vs `portrait.dateNaissance` (réel, vide tant qu'inconnu)
- Répartition par nation dans `etoiles.json` : générique/illustrative, documentée comme telle au Registre — jamais présentée comme une vraie proportion.

---

## 3 — Principes d'animation et de positionnement GSAP/SVG

### 3.1 Symétrie show/hide *(leçon step9, 19 août 2026)*

Quand `show()` anime une propriété (opacité, couleur, position) au niveau d'un **groupe**, `hide()` doit réinitialiser cette même propriété **au même niveau** — jamais plus profond dans l'arbre DOM.

Réinitialiser individuellement des enfants (ex: chaque `<circle>` d'un groupe) alors que seul le parent est animé au `show` crée un état qui fonctionne au premier passage, mais casse silencieusement au deuxième cycle show→hide→show.

```javascript
// ❌ Piège : reset trop profond, désynchronisé du show (qui anime seulement le groupe)
gsap.set(circles, { opacity: 0, fill: "#c9cbc3" });

// ✅ clearProps laisse le style CSS d'origine reprendre le dessus automatiquement
gsap.set(circles, { clearProps: "opacity,fill" });
```
**Piège plus large découvert le 26 août (step7, step10) :** `clearProps: "all"` ne nettoie pas seulement les propriétés que GSAP a lui-même animées — il vide l'attribut `style` au complet, y compris un style inline écrit à même le SVG source (ex: `fill` d'un export Illustrator) que GSAP n'a jamais touché. Un élément dont la couleur vit en style inline la perd au premier `hide()`, retombe sur le noir par défaut du SVG — invisible tant qu'on ne teste pas un vrai cycle show→hide→show, pas juste un chargement frais.

Ne jamais utiliser `"all"` par réflexe :
- soit nommer explicitement les propriétés que GSAP a animées (`clearProps: "opacity,visibility"`)
- soit vérifier si `show()` réinitialise déjà tout ce qui compte au départ de chaque appel — auquel cas `clearProps` en sortie n'est souvent pas nécessaire du tout.

### 3.2 Un groupe = une intention d'animation

Si des sous-éléments (ex: les perles d'un personnage) ne sont **jamais** ciblés individuellement par GSAP, ils n'ont pas besoin d'ID uniques — l'opacité du groupe parent suffit à les afficher/masquer tous ensemble. Réserver le nommage individuel aux éléments réellement animés un par un (ex: les 67 étoiles de step10, chacune déplacée individuellement).

### 3.3 Centrage et mise à l'échelle SVG — toujours mesurer, jamais présumer *(leçon step11, 24 août)*

Un calcul de centrage basé uniquement sur les coordonnées internes du `viewBox` (en assumant que le SVG se centre automatiquement dans son conteneur) est **fragile** — ça dépend de détails du fichier source (dimensions fixes vs pourcentage sur la balise `<svg>`) qui varient d'un export à l'autre et cassent silencieusement.

**La méthode robuste** : mesurer la position **réellement rendue à l'écran** (`getBoundingClientRect()`), puis convertir en coordonnées internes du SVG via sa matrice de transformation courante (`getScreenCTM()` / `getScreenCTM().inverse()`). Ça fonctionne peu importe la configuration du fichier source, parce que ça mesure le résultat réel plutôt que de présumer un comportement.

```javascript
const ctmInverse = element.getScreenCTM().inverse();
const rect = element.getBoundingClientRect();
const pt = svgRoot.createSVGPoint();
pt.x = rect.left + rect.width / 2;
pt.y = rect.top + rect.height / 2;
const centreReelEnCoordonneesSVG = pt.matrixTransform(ctmInverse);
```

Même principe pour une croissance ciblée (ex: "grossir à 80% de la hauteur de l'écran") : mesurer la hauteur actuelle en pixels réels, calculer le facteur par rapport à la cible en pixels, appliquer ce facteur à l'échelle SVG — jamais déduire une taille cible à partir du seul `viewBox`.

### 3.4 Convention de z-index — éviter la collision récurrente avec `loadSVG()`

`loadSVG()` (dans `shared/js/utils.js`) donne à chaque conteneur de step/asset un `z-index: 1500`, pour permettre l'empilement propre entre steps successifs. **Ce chiffre a causé le même bug à répétition** (curseur de test caché, bouton caché derrière la Lune, voile de transition mal empilé) — toujours vérifier qu'un élément d'interface censé rester au-dessus (bouton, curseur, overlay UI) a un `z-index` **supérieur à 1500**, et qu'un élément censé former un **fond** (voile de transition, overlay coloré) a un `z-index` **inférieur** à celui du contenu SVG qu'il est censé mettre en valeur, pas au-dessus.

Repère à garder en tête : fond de page < overlay de fond (voile, assombrissement) < contenu SVG animé (steps, Lune, étoiles) < interface de contrôle (boutons, curseur).

### 3.5 Ne jamais rejouer hide+show sur une navigation vers le MÊME step *(leçon goToStep, 2 septembre 2026)*

Toute fonction qui orchestre une transition entre deux états (ici,
`goToStep()` appelant `hide()` du step qu'on quitte puis `show()` du
step qu'on rejoint) doit vérifier que l'état cible est RÉELLEMENT
différent de l'état courant avant de déclencher quoi que ce soit.
Sans ce garde, naviguer vers le step où l'on est déjà (ex. : un
changement de langue qui rappelle la navigation sur le même index pour
forcer un nouveau `resolve()`) déclenche un hide() suivi immédiatement
d'un show() du même step — et si hide() nettoie son DOM à l'intérieur
d'un callback GSAP asynchrone (`onComplete`, comme c'est le cas pour
step7/9/10/11 et avantColonisation.js), ce nettoyage tardif peut
s'exécuter APRÈS que show() ait déjà reconstruit la scène, l'effaçant
silencieusement.

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

Ce correctif protège TOUS les steps d'un coup (la cause est en amont,
dans l'orchestrateur, pas dans chaque step individuellement) — un signe
qu'un bug qui semble propre à un seul endroit (ici, découvert sur
seuil-univers/step11) mérite de vérifier s'il vient en fait d'une
fonction partagée plus haut dans la chaîne d'appel.

---

## 4 — Règle d'audit (obligatoire avant renommage/suppression/restructuration)

```bash
grep -rn "[nom de l'export ou de la fonction concernée]" [dossier]
```
Avant toute modification qui touche un export existant utilisé ailleurs — voir gabarit de prompt Claude Code pour l'intégration systématique de cette règle.

---

## 5 — Gouvernance et workflow

- **Claude.ai** : architecture, gouvernance, validation des sorties de Claude Code.
- **Claude Code** : exécute, **ne commit jamais** — Isabel valide avec Claude.ai puis commit manuellement.
- **Commits** au format `S[n]B[n]T[n] - description courte`.
- **Effort réel** : jamais estimé — toujours demandé après coup pour le Kanban.
- **Gouvernance du contenu** : le projet se fait *avec et pour* les femmes et artistes autochtones impliquées — la gouvernance créative et les données sensibles (récits, données FAQ) restent sous leur autorité, jamais traitées comme un jeu de données neutre.

---

## 6 — Méthodologie de validation (vertical slice)

Découper un vertical slice risqué en **tranches isolées** plutôt qu'une seule grosse validation d'un coup — si quelque chose casse, on sait quelle variable est en cause plutôt que de devoir tout re-décortiquer. Exemple du 19 août : Tranche A (mécanique timeline/registry/i18n sur un step) validée avant Tranche B (navigation inter-parties).

---

## 7 — Production d'assets SVG

### 7.1 Extraire un calque d'un fichier existant en asset autonome

Méthode utilisée pour `lune.svg` (extrait de `step10_lune_etoile.svg`) :

1. Vérifier qu'aucune dépendance externe n'existe (`<style>`, `<defs>` partagés) — chaque `path` doit porter son propre style en ligne pour que l'extraction soit sûre à 100%.
2. Calculer la vraie boîte englobante du contenu avec `svgpathtools` (Python) plutôt que de deviner à partir du fichier brut — un recadrage à l'œil risque de couper un détail.
3. Ajouter une marge de sécurité (~15%) si une partie des paths n'a pas pu être mesurée par l'outil.
4. Envelopper le contenu extrait dans un nouveau `<g id="...">` nommé clairement, avec son propre `viewBox` recadré.

### 7.2 Vectorisation (Illustrator Image Trace vs Adobe Express) *(24 août)*

Adobe Express "Convert to SVG" n'expose **aucun réglage** (pas de seuil, de nombre de couleurs, de lissage) — le seul levier disponible est l'image source elle-même. Pour préserver le détail d'un coup de pinceau scanné (plus pauvre en nuances de gris qu'une photo, qui elle captait la lumière directionnelle) : rajouter du grain/texture dans Photoshop (Bruit, Texturizer) avant de vectoriser, plutôt que de changer d'outil — garde la cohérence visuelle avec les assets déjà produits par le même pipeline.

Illustrator Image Trace reste le filet de sécurité si cette approche ne suffit pas : de vrais curseurs (Seuil, Bruit, Tracés), avec le préréglage "Noir et Blanc" recommandé plutôt que "Photo" pour ce type d'illustration.

### 7.3 Méthode complète — de la réception d'un dessin de Déline à son intégration *(25 août, leçon S3B1T1)*

**Étape 0 — Décider ce qui doit être animé individuellement.** Pour chaque élément du dessin, une seule question : est-ce que ce morceau doit bouger **indépendamment** à l'écran (ex: les perles d'un collier, un personnage isolé) ? Si oui → vecteur (étape 1a). Si l'élément bouge toujours **comme un seul bloc** (fond de territoire, spirale, grandes surfaces texturées) → raster (étape 1b). Les deux cohabitent dans un même fichier final sans problème.

**Étape 1a — Élément à animer individuellement → vectoriser.** Tracé à la main dans Illustrator (ou Image Trace, §7.2), en nommant chaque calque selon la convention `[zone]-[élément]-[variante]` (§2.3) — ce nom devient l'`id` que le code ira chercher.

**Étape 1b — Élément qui bouge comme un bloc → traiter en raster.**
1. Dans Photoshop, après détourage du fond : **Image > Taille de l'image**, largeur cible **~2000-2500 px** (jamais la pleine résolution de scan/impression — inutile à l'écran, juste plus lourd), rééchantillonnage **"Bicubique plus net (réduction)"**.
2. Vérifier les bords pour une frange sombre/blanche résiduelle (**Calque > Matriçage > Supprimer la frange**) avant d'exporter.
3. **Fichier > Exporter > Exporter sous** → **PNG-24** (jamais PNG-8, qui écrase les nuances de gris du grain de pinceau), transparence cochée.
4. Convertir ensuite en **WebP** pour un gain supplémentaire (~70% de moins que le PNG, sans perte visible) — même redimensionné, un PNG reste plus lourd que nécessaire.

**Étape 2 — Assembler dans Illustrator.** Importer les PNG/WebP allégés en fond transparent à côté des éléments vectorisés, chacun dans un calque nommé.

**Étape 3 — Export SVG.** Options d'export : Stylisation **"Attributs de présentation"**, Police **"SVG"**, **Images : "Lier"** (jamais **"Conserver"** — ce réglage encode les images en base64 *dans* le SVG, à leur pleine résolution, et peut multiplier le poids par 10 ou plus — c'est la cause vérifiée d'un fichier passé de 32 Mo à 1,25 Mo une fois corrigé), ID objet **"Noms de calque"**, Responsive coché.

**Étape 4 — Corriger les chemins dans VS Code.**
- Ouvrir le `.svg` exporté en **éditeur de texte**, pas l'aperçu par défaut (clic droit → *Open With* → *Text Editor* — VS Code ouvre les `.svg` en aperçu image sinon).
- Les `href` générés par Illustrator sont juste des noms de fichiers (`"territoire.png"`) — les réécrire en chemins relatifs à la **page qui charge le SVG** (via `loadSVG()`), pas à l'emplacement du fichier SVG lui-même : `./svg/[nomStep]/[fichier].webp`.
- **Vérifier chaque ligne individuellement après un remplacement en série** — un copier-coller répété sur plusieurs éléments similaires (ex: 5 barres) peut laisser le même nom de fichier partout sans qu'on s'en aperçoive visuellement.

**Étape 5 — Déposer les fichiers.** Le `.svg` corrigé et toutes les images qu'il référence, ensemble dans `scrolly/svg/[nomStep]/`.

**Étape 6 — Vérifier avant de considérer que c'est fait.** Ni l'aperçu VS Code ni un navigateur ouvrant le `.svg` directement ne sont des tests valides (les chemins relatifs se résolvent différemment hors contexte). Le seul test fiable : charger via `loadSVG()` dans la vraie page (console du navigateur), onglet **Network** des DevTools, confirmer un code **200** sur chaque ressource — et **vider tout filtre de recherche actif** dans ce panneau avant de conclure qu'une requête manque.

---
## 8 — Règles de rédaction

### Voix rédactionnelle (repères tirés des fiches services d'Isabel, [date])
- Jamais de tiret cadratin (—) comme procédé stylistique/rythmique
- Cadence naturelle des phrases, pas de fragments poétiques en cascade
- Images ancrées dans le concret et le spécifique, pas l'abstrait générique
- Ton chaleureux et direct, jamais grandiloquent
- Clôture par une adresse directe, pas une formule solennelle

## Journal des versions du Playbook

| Version | Date | Ajouts |
|---|---|---|
| v0.1 | 19 août 2026 | Création initiale — conventions établies durant le Sprint 1 (arborescence, i18n, steps registry, scoping SVG, symétrie show/hide) |
| v0.2 | 24 août 2026 | Transitions toujours manuelles (jamais automatiques) ; nommage des nouveaux fichiers JS v2 (descriptif, scopé, pas de numérotation globale) ; nommage explicite des champs de données synthétiques ; centrage/mise à l'échelle SVG toujours mesuré (getScreenCTM), jamais présumé ; convention de z-index face à `loadSVG()` ; méthode d'extraction d'un calque en asset autonome ; notes de vectorisation (Illustrator vs Adobe Express) |
| v0.3 | 25 août 2026 | Méthode complète de préparation d'un dessin de Déline (raster vs vecteur, Photoshop, export Illustrator "Lier" pas "Conserver", conversion WebP, correction des chemins, vérification par Network/DevTools) — voir aussi `docs/GUIDE_DELINE.md` pour les recommandations en amont destinées à Déline |

# Ajouts au Playbook — semaine du 10 au 24 septembre 2026

*À fusionner dans `docs/PLAYBOOK.md`. Inclut les deux nouvelles sections qu'Isabel avait proposées (7 sept.) et mises de côté "pour dans quelques jours" — assez de matière s'est accumulée depuis pour les remplir. Les autres ajouts complètent des sections déjà existantes.*

---

## Nouvelle section — Les éléments fondamentaux d'un script technique

*Ce qu'un script de Déline (ou toute préparation de contenu SVG) devrait préciser avant qu'un fichier existe — pour que l'intégration ne redécouvre pas ces questions à chaque fois.*

Avant de commencer à intégrer un nouveau step ou une nouvelle scène, confirmer explicitement :

- **Quels éléments bougent individuellement vs en bloc** (déjà couvert au §3.2, "un groupe = une intention d'animation" — à revalider pour chaque nouveau fichier, pas présumé stable d'un asset à l'autre).
- **Quel texte reste éditorial/i18n vs quel texte est baked-in au SVG.** Convention déjà établie : tout texte narratif ou de contenu variable (témoignages, titres de step, mots de valeurs) vit en overlay HTML/CSS avec `resolve()`, jamais dans le fichier SVG — le SVG ne porte que des éléments graphiques stables. Leçon du step D (Ishpenitamun/Respect, 21 sept.) : quand une exception à cette règle existe, la retrouver et la fusionner au système générique dès qu'on la croise, plutôt que la laisser vivre en parallèle.
- **Dimensions cibles du plan de travail, fixées explicitement** — jamais laissées au préréglage par défaut d'Illustrator (voir §7.4, leçon `valeurs.svg`/`swirl9`). Documenter la dimension choisie quelque part (commentaire dans le fichier, ou ici même) pour qu'un futur réexport sache quoi restaurer.
- **Quels éléments seront probablement retouchés plus tard** (asset définitif vs prototype rapide) — un élément appelé à changer souvent mérite un nom de calque stable et descriptif dès le départ (§2.3), pour que son remplacement futur ne force pas un renommage en cascade.
- **La couleur cible du dessin (Procreate) est-elle en sRGB ?** Voir §7.5 — à vérifier à la source, avant même que le dessin commence, pas après réception.

## Nouvelle section — Pipeline de production itérative d'un fichier SVG

*Le cycle complet, du dessin à la vérification en navigateur, pour qu'il soit documenté une fois plutôt que redécouvert à chaque nouvel asset.*

1. **Dessin** (Déline sur papier, ou Boris sur Procreate) — voir `docs/GUIDE_DELINE.md` pour les recommandations non-techniques (résolution, format, fond). Pour Procreate spécifiquement : profil de couleur de la toile réglé à sRGB IEC61966-2.1 avant de commencer (§7.5) — évite une désaturation surprise à l'intégration.
2. **Export vers Isabel** — PNG ou TIFF, jamais JPEG (perte de transparence et de nuances). Un fichier par élément si possible.
3. **Préparation Photoshop** (raster) — détourage, redimensionnement (~2000-2500px), export PNG-24 puis conversion WebP. **Rogner aux pixels transparents avant l'export** (Image > Rogner, référence "Pixels transparents") — une marge transparente non rognée gonfle artificiellement la boîte englobante de l'élément une fois importé dans Illustrator, ce qui peut fausser tout calcul de recentrage/mise à l'échelle basé sur `getBBox()` côté code (leçon `swirl9`, 24 sept.).
4. **Assemblage Illustrator** — plan de travail aux dimensions cibles FIXÉES à l'avance (jamais un préréglage par défaut comme "Google pixel/Pixel 2"), calques nommés selon la convention `[zone]-[élément]-[variante]` (§2.3).
5. **Export SVG** — **Fichier > Exporter > Exporter sous** (jamais "Enregistrer sous" — cause probable de l'échappement d'ID en `_x5F_`, confirmé empiriquement le 24 sept.). Dans la boîte de dialogue d'export : cocher **"Utiliser les plans de travail"** (verrouille le `viewBox` sur les dimensions du plan de travail plutôt que sur la boîte englobante du contenu — évite une dérive silencieuse à chaque réexport, §7.4). Dans "Options SVG" : Stylisation "Attributs de présentation", Images "Lier" (jamais "Conserver" — §7.3 déjà établi).
6. **Correction des chemins dans VS Code** — déjà établi au §7.3 (chemins relatifs à la page, pas au fichier SVG). **Technique accélérée** : plutôt qu'une correction manuelle fichier par fichier, utiliser la recherche-remplacement en mode expression régulière de VS Code (Ctrl+H, icône `.*`) :
   - Rechercher : `xlink:href="([a-zA-Z0-9_-]+\.(webp|png))"`
   - Remplacer : `xlink:href="./svg/[nomStep]/$1"`

   Un seul geste recolle tous les `href` d'un fichier réexporté, peu importe combien il y en a — plus fiable qu'une répétition manuelle (§7.3 met déjà en garde contre le copier-coller répété qui peut laisser une erreur invisible).
7. **Dépôt des fichiers** — `scrolly/svg/[nomStep]/` (ou dossier équivalent selon la partie).
8. **Vérification** — déjà établi au §7.3 Étape 6 (onglet Network, code 200, filtre vidé). **Ajout** : si le fichier remplace un calque existant plutôt que d'être un tout nouvel asset, comparer le `viewBox` avant/après (`git diff` sur la balise `<svg>` racine) — un changement inattendu de dimensions ou de décalage sur des calques non touchés est le signe d'un plan de travail non verrouillé à l'export (§7.4).

## §7.4 (nouveau) — Verrouiller le plan de travail à l'export

*Prolonge §7.3 — leçon du 24 septembre 2026, fichier `valeurs.svg`.*

Par défaut, l'export SVG d'Illustrator calcule le `viewBox` à partir de la boîte englobante réelle de **tout le contenu visible du document** — pas des dimensions déclarées du plan de travail, sauf si l'option "Utiliser les plans de travail" est cochée à l'export ET que le plan de travail lui-même a des dimensions intentionnelles (pas un préréglage par défaut sans rapport avec le contenu).

Symptôme si cette étape est oubliée : remplacer ou retoucher un seul calque peut faire grossir ou rétrécir le `viewBox` global, ce qui décale l'origine des coordonnées de **tous les autres calques** — même ceux jamais touchés intentionnellement. Le symptôme visuel typique (constaté sur `valeurs.svg`) : la composition semble "trop grande" ou "coupée" une fois affichée dans la page, alors que le code qui la met à l'échelle (`getBoundingClientRect()`, `getBBox()`) n'a pourtant pas changé — parce qu'il mesure fidèlement un fichier dont le cadrage de référence, lui, a bougé.

**Geste préventif** : avant tout réexport d'un fichier existant, fixer explicitement les dimensions du plan de travail (Objet > Plan de travail > Options, ou double-clic sur l'outil Plan de travail) aux dimensions cibles connues du projet, PUIS cocher "Utiliser les plans de travail" dans la boîte de dialogue d'export SVG (Fichier > Exporter > Exporter sous).

**Geste correctif si le viewBox a déjà dérivé** : comparer le fichier via `git diff` au commit précédent pour isoler précisément ce qui a changé (viewBox, décalages uniformes sur les autres calques) avant de décider si c'est une intention artistique ou un effet de bord à corriger — ne jamais présumer.

**Rappel d'hygiène (leçon plus large, à part le viewBox)** : rogner tout asset raster aux pixels transparents (Photoshop, Image > Rogner) avant son export en WebP — une marge transparente non rognée gonfle la boîte englobante de l'élément une fois importé, avec le même genre de conséquence sur les calculs de recentrage basés sur `getBBox()`.

## §7.5 (nouveau) — Pipeline de couleur Procreate → web

*Leçon du 24 septembre 2026 — swirls de Boris "trop pastel" une fois intégrés.*

Procreate dessine par défaut dans l'espace de couleur **Display P3** — une gamme plus large que **sRGB**, le seul espace que le web (et donc le SVG final) comprend nativement. Un rouge ou un vert très saturé dessiné en P3 n'a parfois tout simplement pas d'équivalent aussi vif en sRGB.

Le problème n'est pas la différence de gamme en soi, mais la façon dont elle est gérée au moment de l'ouverture du fichier dans Photoshop (boîte de dialogue "Non-concordance des profils incorporés") :
- **"Supprimer le profil incorporé (pas de gestion des couleurs)"** — garde les mêmes chiffres RGB bruts mais leur retire leur étiquette P3 ; réinterprétés sous les primaires plus ternes de sRGB, ces mêmes chiffres produisent une couleur visiblement désaturée. **Cause la plus probable d'un résultat "pastel" inattendu.**
- **"Convertir les couleurs du document selon l'espace de travail"** — recalcule chaque pixel pour la couleur la plus proche possible en sRGB. Une perte de saturation reste possible pour les couleurs hors gamme, mais contrôlée et prévisible, pas un effondrement.

**Geste préventif retenu pour ce projet** : régler le profil de couleur de la toile Procreate à **sRGB IEC61966-2.1** directement à la source (Informations sur la toile > Profil de couleur, dans Procreate), avant même de commencer à dessiner. L'artiste voit alors, en dessinant, la vraie plage de couleurs qui sera effectivement disponible sur le site — élimine le problème plutôt que de le corriger après coup.

## §2.6 — Complément : champs de données réels vs synthétiques (mise à jour)

Rappel du principe déjà établi : toute donnée générée/approximative porte un nom qui le dit clairement (`decennieNaissanceApprox` vs `portrait.dateNaissance`). Précision ajoutée le 24 septembre : quand une vraie donnée remplace un placeholder (ex. les 10 premières étoiles-témoignage), **auditer systématiquement les champs dérivés** qui dépendaient de l'ancienne valeur synthétique avant de considérer l'intégration terminée — dans ce cas précis, `decennieNaissanceApprox` devait être recalculé à partir de la vraie `dateNaissance`, et une dépendance oubliée (`ORDRE_DECENNIES` ne couvrant pas les décennies antérieures à 1950) est restée invisible tant qu'aucune vraie donnée ne l'avait mise à l'épreuve.

## §3.5 — Complément : un mécanisme jamais mis à l'épreuve par la faible densité de données réelles

Prolonge la leçon `goToStep()` déjà documentée. Deuxième instance trouvée le 24 septembre : le paramètre `rayonCollision` de `calculerDisposition()` (`univers/js/constellations.js`) avait une valeur par défaut sous-dimensionnée, invisible tant qu'une seule vraie étoile-témoignage existait — deux vraies étoiles ne pouvaient statistiquement jamais entrer en collision avec un échantillon de un. Le passage à 10 vraies étoiles l'a exposé immédiatement. **Leçon générale** : un mécanisme conçu et testé avec des données synthétiques abondantes (221 placeholders) peut cacher un défaut qui ne se révèle qu'avec un petit nombre de vraies données concentrées dans le même secteur — tester explicitement le cas "peu de vraies données, densément groupées" plutôt que présumer que "ça marchait avec 221" suffit.