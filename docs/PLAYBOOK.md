# scrollyFFADA2S v2 — Playbook

**Isabel Cayer · Atelier Love & Code · 2026**
*Document vivant — conventions réutilisables, alimentées par le vécu réel du projet (pas décidées à l'avance).*

---

## 1 — Architecture générale

**Séparation des dossiers** (voir Registre pour le détail complet) :
- `shared/` — ce qui traverse les 3 parties (i18n, tokens visuels, utilitaires)
- `scrolly/` — Partie 2 uniquement
- `univers/` — Partie 3 uniquement
- Chaque partie a son propre `index.html`, `js/`, `svg/`, `css/` — une équipe externe peut reprendre une seule partie sans toucher aux autres.

**i18n — deux fonctions, deux usages distincts** (`shared/js/i18n.js`) :
- `t(clé)` — pour le chrome d'interface (dictionnaires plats dans `shared/data/i18n/{lang}.json`)
- `resolve(champ)` — pour le contenu éditorial langue-clé (récits, textes de step, valeurs), avec repli automatique via `fallbackByLanguage.json`
- Le repli n'est **pas** un français universel — chaque langue autochtone a son propre repli selon la réalité linguistique de sa communauté (ex: innu-aimun→français, mi'gmaq→anglais).

**Steps — moteur générique, jamais de logique par nom** (`scrolly/js/timeline.js` + `stepsRegistry.js` + `stepsOrder.json`) :
- `timeline.js` ne connaît jamais un step par son nom — il cherche dans `stepsRegistry` par la clé lue dans `stepsOrder.json`.
- Ajouter/retirer/réordonner un step = modifier `stepsOrder.json` (et `stepsRegistry.js` si nouveau) — **jamais** `timeline.js`.
- La clé du registre est **descriptive du contenu**, jamais de la position (`"hommage-victimes"`, pas `"step7"`) — un step peut être réordonné sans jamais être renommé.

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

---

## 3 — Principes d'animation GSAP

### 3.1 Symétrie show/hide *(leçon step9, 19 août 2026)*

Quand `show()` anime une propriété (opacité, couleur, position) au niveau d'un **groupe**, `hide()` doit réinitialiser cette même propriété **au même niveau** — jamais plus profond dans l'arbre DOM.

Réinitialiser individuellement des enfants (ex: chaque `<circle>` d'un groupe) alors que seul le parent est animé au `show` crée un état qui fonctionne au premier passage, mais casse silencieusement au deuxième cycle show→hide→show.

```javascript
// ❌ Piège : reset trop profond, désynchronisé du show (qui anime seulement le groupe)
gsap.set(circles, { opacity: 0, fill: "#c9cbc3" });

// ✅ clearProps laisse le style CSS d'origine reprendre le dessus automatiquement
gsap.set(circles, { clearProps: "opacity,fill" });
```

### 3.2 Un groupe = une intention d'animation

Si des sous-éléments (ex: les perles d'un personnage) ne sont **jamais** ciblés individuellement par GSAP, ils n'ont pas besoin d'ID uniques — l'opacité du groupe parent suffit à les afficher/masquer tous ensemble. Réserver le nommage individuel aux éléments réellement animés un par un (ex: les 67 étoiles de step10, chacune déplacée individuellement).

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

## Journal des versions du Playbook

| Version | Date | Ajouts |
|---|---|---|
| v0.1 | 19 août 2026 | Création initiale — conventions établies durant le Sprint 1 (arborescence, i18n, steps registry, scoping SVG, symétrie show/hide) |