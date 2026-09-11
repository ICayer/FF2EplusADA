// ==================================================
// shared/js/railParcours.js
// Rail de navigation à 12 étapes — composant de présentation PUR
//
// Rôle : Charger shared/svg/timeline/timeline.svg dans le conteneur du
// rail et câbler ses éléments interactifs (10 perle_stepN + bouton_accueil
// + bouton_valeur) sur la mécanique de navigation de l'appelant, et
// marquer l'étape active. Composant de PRÉSENTATION PUR : ne connaît ni
// goToStep, ni allerAuStep, ni aucune logique propre à scrolly/, univers/
// ou valeurs/. Reçoit des callbacks de l'appelant (onClicEtape,
// onSurvolEtape) et se contente de les invoquer — EXACTEMENT le même
// contrat qu'avant (Tranche B2, 11 septembre 2026 : remplace le rendu DOM
// à 12 boutons par timeline.svg, script/asset de Déline confirmé la
// veille). Depuis la Tranche B3 (11 septembre 2026), #curseur_plume DANS
// timeline.svg se déplace réellement d'une perle à l'autre — transform
// interne au même document SVG (translate sur le groupe), plus besoin de
// traduire entre deux référentiels de coordonnées comme l'ancienne
// architecture (railPlume.js, un fichier séparé superposé en CSS) —
// voir deplacerCurseurPlume() plus bas.
//
// shared/js/railPlume.js reste orphelin (plus aucun appelant) — conservé
// pour référence historique de l'ancienne méthode à deux arbres DOM
// (getScreenCTM()/getBoundingClientRect() entre 2 documents). À NE PAS
// importer nulle part : sa logique ne s'applique plus à cette architecture.
//
// Dépend de : shared/js/progression.js, shared/js/navigationEtat.js
//   (reduitMouvement), shared/js/utils.js (loadSVG), GSAP (global, CDN),
//   shared/svg/timeline/timeline.svg
// Utilisé par : scrolly/js/script.js, univers/index.html, valeurs/index.html
//
// FF2EplusADA (scrollyFFADA2S v2)
// Isabel Cayer · Atelier Love & Code · 2026
// ==================================================

import { obtenirParcours, estDeverrouille } from "./progression.js";
import { loadSVG } from "./utils.js";
import { reduitMouvement } from "./navigationEtat.js";

const DUREE_BULLE_MS = 1400;

// Point de départ : même convention que shared/js/railPlume.js (l'ancien
// curseur, orphelin) — un déplacement de curseur de navigation est une
// animation D'INTERFACE, pas narrative, jamais le registre "doux et
// solennel" (1,5-2s) établi pour la chorégraphie des étoiles-témoignage
// (univers/js/etoiles.js). Ajusté deux fois depuis (retours successifs
// d'Isabel) : power2.out (B3) freinait à l'arrivée mais n'accélérait
// jamais au départ ("saut sec") ; power2.inOut (B3 bis) adoucissait les
// deux bouts mais restait plus cubique qu'une vraie parabole ; power1.inOut
// (B3 ter, ci-dessous) est le degré le plus bas de la famille GSAP
// "power" — la courbe la plus proche d'une parabole littérale. Note :
// c'est la MÊME fonction d'easing que le registre narratif ci-dessus —
// ce qui distingue toujours les deux registres, c'est la DURÉE (0,35s
// ici contre 1,5-2s là-bas), pas la forme de la courbe.
const DUREE_DEPLACEMENT_S = 0.35;

// Chemin relatif à la PAGE (loadSVG() fait fetch(path) directement, pas de
// new URL(..., import.meta.url)) — scrolly/, univers/ et valeurs/ sont à
// la même profondeur depuis la racine, donc ce chemin fonctionne
// identiquement peu importe laquelle des 3 pages appelle cette fonction.
const CHEMIN_TIMELINE_SVG = "../shared/svg/timeline/timeline.svg";

// Table de correspondance perle/bouton → clé de shared/data/parcours.json
// (Étape 0, audit Tranche B2 — confirmée en lisant scrolly/data/stepsOrder.json
// ET shared/data/parcours.json ligne par ligne, JAMAIS présumée depuis
// l'ordre visuel des perles dans le SVG) :
//   perle_step1  → nuit-des-temps        perle_step6  → hommage-victimes
//   perle_step2  → lien-communaute       perle_step7  → transformation-coeur
//   perle_step3  → lien-territoire       perle_step8  → communaute-etoiles
//   perle_step4  → lien-valeurs          perle_step9  → seuil-univers
//   perle_step5  → rupture-coloniale     perle_step10 → univers
//   bouton_accueil → accueil             bouton_valeur → valeurs
const CORRESPONDANCE_PERLE_ETAPE = {
  perle_step1: "nuit-des-temps",
  perle_step2: "lien-communaute",
  perle_step3: "lien-territoire",
  perle_step4: "lien-valeurs",
  perle_step5: "rupture-coloniale",
  perle_step6: "hommage-victimes",
  perle_step7: "transformation-coeur",
  perle_step8: "communaute-etoiles",
  perle_step9: "seuil-univers",
  perle_step10: "univers",
  bouton_accueil: "accueil",
  bouton_valeur: "valeurs",
};

// Correspondance INVERSE (etapeId → idSVG), dérivée automatiquement de la
// table ci-dessus — jamais dupliquée à la main. Nécessaire pour retrouver
// quelle perle/bouton correspond à l'étape qui vient de devenir active
// (definirEtapeActive() → deplacerCurseurPlume()).
const CORRESPONDANCE_ETAPE_PERLE = Object.fromEntries(
  Object.entries(CORRESPONDANCE_PERLE_ETAPE).map(([idSVG, etapeId]) => [etapeId, idSVG])
);

// Construit le rail dans `container` en y chargeant timeline.svg, puis
// câble chaque perle/bouton de CORRESPONDANCE_PERLE_ETAPE sur le même
// contrat qu'avant (Tranche B1 et versions DOM antérieures) :
//   pageCourante  : valeur du champ "page" de parcours.json pour la page
//                   qui affiche ce rail — sert au repère "page-actuelle"
//                   et au routage dans onClicEtape (côté appelant).
//   onClicEtape   : (etape) => void — appelé SEULEMENT pour une étape
//                   déverrouillée, avec l'objet complet de parcours.json.
//   onSurvolEtape : (etape|null) => void — appelé à l'entrée (etape) et
//                   à la sortie (null) du survol/focus, verrouillé ou non.
export async function construireRailParcours(container, { pageCourante, onClicEtape, onSurvolEtape } = {}) {
  const etapes = obtenirParcours();
  const parEtapeId = Object.fromEntries(etapes.map((e) => [e.id, e]));

  // container existe déjà (le <div id="rail-parcours"> statique de chaque
  // page) — loadSVG() le réutilise tel quel et remplace son contenu par le
  // markup de timeline.svg (container.innerHTML = texte), aucun bouton DOM
  // n'est plus généré.
  const resultat = await loadSVG(CHEMIN_TIMELINE_SVG, container.id, container.id);
  if (!resultat) {
    console.error("❌ Impossible de charger timeline.svg — rail non fonctionnel");
    return;
  }

  Object.entries(CORRESPONDANCE_PERLE_ETAPE).forEach(([idSVG, etapeId]) => {
    const cible = resultat.querySelector(`#${idSVG}`);
    const etape = parEtapeId[etapeId];
    if (!cible || !etape) {
      console.error(`❌ Rail SVG : #${idSVG} ou l'étape "${etapeId}" introuvable — vérifier timeline.svg / parcours.json`);
      return;
    }

    cible.dataset.etapeId = etape.id;
    cible.setAttribute("tabindex", "0");
    cible.setAttribute("role", "button");
    // Libellé temporaire : l'id brut, tant qu'on n'a pas de vrai titre
    // pour les 12 étapes (pas juste les 9 du scrolly) — même limitation
    // que la version DOM précédente.
    cible.setAttribute("aria-label", etape.id);
    cible.style.cursor = "pointer";

    if (etape.page === pageCourante) cible.classList.add("page-actuelle");

    // Vérifie estDeverrouille(etape.id) EN DIRECT à chaque clic plutôt que
    // de se fier à une variable capturée à la construction — sinon un
    // déblocage survenu après le chargement du rail ne serait jamais pris
    // en compte (même principe que la version DOM précédente).
    const declencher = () => {
      if (!estDeverrouille(etape.id)) {
        afficherBulleVerrouillee(container, cible);
        return;
      }
      if (onClicEtape) onClicEtape(etape);
    };

    cible.addEventListener("click", declencher);
    // Les groupes SVG ne répondent pas nativement à Entrée/Espace comme un
    // <button> — reproduit ici pour ne pas perdre l'accessibilité clavier
    // que la version DOM précédente offrait nativement.
    cible.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        declencher();
      }
    });

    if (onSurvolEtape) {
      const entrer = () => onSurvolEtape(etape);
      const sortir = () => onSurvolEtape(null);
      cible.addEventListener("mouseenter", entrer);
      cible.addEventListener("focus", entrer);
      cible.addEventListener("mouseleave", sortir);
      cible.addEventListener("blur", sortir);
    }
  });

  rafraichirVerrous();
}

// Retire "actif" de toutes les perles/boutons du rail et l'ajoute à celui
// dont l'id correspond. Séparé de la construction : l'appelant le rappelle
// à chaque navigation réussie, sans reconstruire tout le rail. Sélecteur
// [data-etape-id] (générique) plutôt que .etape-bouton (spécifique au DOM
// disparu) — fonctionne pareil sur les groupes SVG câblés ci-dessus.
export function definirEtapeActive(id) {
  document.querySelectorAll(".rail-parcours [data-etape-id]").forEach((b) => {
    b.classList.toggle("actif", b.dataset.etapeId === id);
  });
  deplacerCurseurPlume(id);
}

// Centre RÉEL rendu d'un élément SVG — mesuré via getBBox() sur le GROUPE
// (jamais sur le <circle> lui-même quand il porte son propre transform,
// Étape 0 point 1, Tranche B3) : getBBox() exclut le transform de
// l'élément appelant, mais inclut celui de ses enfants — appelé sur le
// <circle>, il renverrait cx/cy bruts (faux dès que ce circle a son
// propre transform) ; appelé sur le <g id="perle_stepN"> parent (qui n'a
// lui-même aucun transform), il renvoie la géométrie réellement rendue.
// Vérifié à la main (matrice rotate+translate) pour les 10 perle_stepN :
// la plupart des transforms rotate+translate se compensent presque
// exactement (perle_step1/5/7/8), mais perle_step6 (translate SEUL, sans
// rotate) diverge réellement de ~1,1 unité — une seule méthode pour les
// 10, jamais un raccourci cx/cy au cas par cas.
function centreReel(el) {
  const bbox = el.getBBox();
  return { x: bbox.x + bbox.width / 2, y: bbox.y + bbox.height / 2 };
}

// { x, y } — translate courant réellement appliqué à #curseur_plume. Objet
// UNIQUE et stable (jamais réassigné) : c'est la cible que GSAP anime,
// jamais l'élément DOM directement (un attribut SVG "transform" ne
// s'interpole pas nativement comme une propriété CSS — on anime ce proxy
// numérique et on réécrit l'attribut à chaque frame, même patron que
// univers/js/transitionValeurs.js, proxyEchelle). {x:0,y:0} = position
// native du fichier (aucun transform), donc perle_step1 au chargement.
const positionPlume = { x: 0, y: 0 };
let derniereEtapePlume = null; // évite de rejouer un déplacement vers la
  // MÊME étape (ex. languagechange qui rappelle definirEtapeActive sur le
  // step courant) — même principe que le garde goToStep, Playbook §3.5.

// Le curseur plume ne doit JAMAIS apparaître sur bouton_valeur (demande
// d'Isabel, Tranche B3 ter). Étape 0 (audit avant cette correction) :
// bouton_accueil n'a jamais eu de plume aujourd'hui, mais PAS via une
// exclusion codée quelque part — index.html (la page d'accueil) ne
// construit aucun rail du tout (aucune trace de rail-parcours/
// construireRailParcours/definirEtapeActive dans ce fichier, vérifié),
// donc definirEtapeActive("accueil") n'est simplement JAMAIS appelée
// nulle part dans le projet. "valeurs", lui, EST appelé légitimement une
// fois par valeurs/index.html à son propre chargement (pour que .actif se
// pose sur bouton_valeur) — il n'y a donc pas de mécanisme équivalent à
// "accueil" à reproduire pour ce cas précis : une exclusion explicite est
// nécessaire ici, il n'y en avait pas besoin ailleurs.
const ETAPES_SANS_PLUME = new Set(["valeurs"]);

// Déplace #curseur_plume pour que perle_noire1 tombe exactement sur le
// centre réel de la perle/bouton correspondant à idEtapeCible. Un seul
// référentiel de coordonnées (même document SVG que les perles) : le
// calcul est direct — plus besoin de traduire entre deux systèmes de
// mesure différents comme l'ancienne architecture (railPlume.js, orpheline).
function deplacerCurseurPlume(idEtapeCible) {
  if (idEtapeCible === derniereEtapePlume) return;
  if (ETAPES_SANS_PLUME.has(idEtapeCible)) return;

  const idSVG = CORRESPONDANCE_ETAPE_PERLE[idEtapeCible];
  if (!idSVG) return; // étape sans perle correspondante dans le rail (garde défensif)

  const railEl = document.querySelector(".rail-parcours");
  const curseurPlumeEl = railEl?.querySelector("#curseur_plume");
  const perleNoire1El = railEl?.querySelector("#perle_noire1");
  const cibleEl = railEl?.querySelector(`#${idSVG}`);
  if (!railEl || !curseurPlumeEl || !perleNoire1El || !cibleEl) {
    console.error(`❌ Déplacement de la plume impossible : élément(s) SVG introuvable(s) pour "${idEtapeCible}"`);
    return;
  }

  derniereEtapePlume = idEtapeCible;

  const cible = centreReel(cibleEl);
  // Position de perle_noire1 dans le référentiel LOCAL de #curseur_plume
  // (aucun transform entre les deux dans la hiérarchie du SVG — vérifié,
  // Étape 0 point 2) : invariante, indépendante du transform ACTUEL de
  // #curseur_plume (celui qu'on est justement en train de recalculer).
  const ancre = centreReel(perleNoire1El);

  const dx = cible.x - ancre.x;
  const dy = cible.y - ancre.y;

  // Annule un déplacement en cours si on clique une 2e perle pendant
  // l'animation (Étape 0 point 5, même patron que
  // univers/js/transitionValeurs.js sur le glow des étoiles).
  gsap.killTweensOf(positionPlume);

  if (reduitMouvement()) {
    positionPlume.x = dx;
    positionPlume.y = dy;
    curseurPlumeEl.setAttribute("transform", `translate(${dx}, ${dy})`);
    return;
  }

  gsap.to(positionPlume, {
    x: dx,
    y: dy,
    duration: DUREE_DEPLACEMENT_S,
    ease: "power1.inOut", // power1 = quadratique, le degré le plus bas de la
      // famille GSAP "power" — la courbe la plus proche d'une vraie parabole
      // (accélération/décélération symétriques, pointe de vitesse exactement
      // à mi-chemin). power2 (cubique) accentuait davantage les extrémités.
    onUpdate: () => {
      curseurPlumeEl.setAttribute("transform", `translate(${positionPlume.x}, ${positionPlume.y})`);
    },
  });
}

// Re-synchronise l'état visuel (grisé + verrouillé) de TOUTES les
// perles/boutons du rail avec l'état réel de progression.js — à appeler
// par l'appelant après chaque deverrouiller(), pas seulement à la
// construction initiale. Ne reconstruit rien, ne touche pas aux
// écouteurs d'événements (ceux-ci vérifient déjà l'état en direct, voir
// declencher() dans construireRailParcours). Verrouillé mais jamais
// `disabled` : la perle reste focusable pour montrer son titre au
// survol/focus et afficher la bulle au clic (Registre, persona).
export function rafraichirVerrous() {
  document.querySelectorAll(".rail-parcours [data-etape-id]").forEach((cible) => {
    const id = cible.dataset.etapeId;
    const verrouille = !estDeverrouille(id);
    cible.classList.toggle("verrouille", verrouille);
    if (verrouille) {
      cible.setAttribute("aria-disabled", "true");
    } else {
      cible.removeAttribute("aria-disabled");
    }
  });
}

// Bulle "Pas encore débloqué" au-dessus de la perle/bouton cliqué, ~1,4 s,
// une seule à la fois dans le rail. Positionnée par MESURE réelle
// (getBoundingClientRect(), Playbook §3.3) plutôt que par imbrication dans
// l'élément cliqué : contrairement à un <button> HTML, un <g> SVG ne peut
// pas recevoir un <span> comme enfant et le faire correctement s'afficher
// dans le rendu — la bulle est donc un élément HTML séparé, ajouté à
// `railEl` (toujours HTML) et positionné au-dessus de `cibleEl` par calcul.
function afficherBulleVerrouillee(railEl, cibleEl) {
  railEl.querySelectorAll(".bulle-verrouillee").forEach((b) => b.remove());

  const rectRail = railEl.getBoundingClientRect();
  const rectCible = cibleEl.getBoundingClientRect();

  const bulle = document.createElement("span");
  bulle.className = "bulle-verrouillee";
  bulle.textContent = "Pas encore débloqué";
  bulle.style.left = `${rectCible.left + rectCible.width / 2 - rectRail.left}px`;
  bulle.style.bottom = `${rectRail.bottom - rectCible.top + 8}px`; // 8px d'air au-dessus de la perle
  railEl.appendChild(bulle);

  requestAnimationFrame(() => bulle.classList.add("visible"));
  setTimeout(() => {
    bulle.classList.remove("visible");
    setTimeout(() => bulle.remove(), 250); // après le fondu (transition 0.2s)
  }, DUREE_BULLE_MS);
}
