// ==================================================
// univers/js/transitionValeurs.js
// Condition de sortie de la Partie 3 (univers) vers la Partie 4 (valeurs)
//
// Rôle : Suit le temps écoulé ET le nombre d'étoiles explorées depuis l'arrivée
// sur univers/. Dès que l'un des deux seuils est atteint, RÉVÈLE le bouton
// "Explorer les valeurs" — mais rien ne s'anime tout seul (décision du 24 août :
// toujours laisser la personne décider quand poursuivre). C'est le clic sur ce
// bouton qui déclenche la séquence : les étoiles convergent au centre (la
// plupart disparaissent, quelques-unes restent pour devenir les perles du
// collier en Partie 4), la Lune grossit à ~80% de la hauteur visible de l'écran
// (mesurée en pixels réels, pas supposée à partir du viewBox — même principe
// que le centrage de step11.js), le fond blanchit, un fondu-enchaîné révèle la
// spirale, puis la page navigue vers valeurs/index.html.
//
// NOTE : spirale.svg est un asset TEMPORAIRE (vectorisation Adobe Express, peu
// détaillée — 9 paths, aucune nuance) — à remplacer une fois le bloc de
// retraitement d'images complété (voir Registre, 24 août).
//
// Dépend de : d3 (global, CDN), gsap (global, CDN),
// shared/js/progression.js (deverrouiller "valeurs" à la condition de sortie)
// Utilisé par : univers/js/etoiles.js
//
// FF2EplusADA (scrollyFFADA2S v2)
// Isabel Cayer · Atelier Love & Code · 2026
// ==================================================

import { initProgression, deverrouiller } from "../../shared/js/progression.js";

// Seuils de la condition de sortie — valeurs de départ, faciles à ajuster,
// à valider avec Déline une fois le rythme réel de la partie 3 mieux connu.
const SEUIL_TEMPS_MS = 30000; // 30 secondes
const SEUIL_INTERACTIONS = 4;  // 4 étoiles explorées (clics, pas juste survol)

// Centre réel du contenu de spirale.svg, mesuré le 24 août — à recalculer si
// le fichier est remplacé par une version retravaillée.
const SPIRALE_CENTRE_SOURCE = { x: 3512.6, y: 3630.9 };
const SPIRALE_LARGEUR_SOURCE = 5877.6;

// Note : le nombre de "perles" n'est plus fixé par une constante — c'est
// maintenant une étoile par nation représentée (voir plus bas), donc son
// nombre réel dépend de nations.json (11 actuellement).

let compteurInteractions = 0;
let minuteurId = null;
let transitionDejaDeclenchee = false;

/**
 * Démarre le suivi de la condition de sortie. `callback` est appelé une seule
 * fois, dès que le premier des deux seuils (temps ou interactions) est atteint —
 * mais il ne déclenche PAS l'animation lui-même. Il ne fait que RÉVÉLER un
 * bouton ; c'est le clic de la personne sur ce bouton qui lance réellement la
 * transition (décision du 24 août : jamais d'animation qui part toute seule).
 */
export function initConditionSortie(callback) {
  compteurInteractions = 0;
  transitionDejaDeclenchee = false;

  minuteurId = setTimeout(() => declencher("temps", callback), SEUIL_TEMPS_MS);

  return {
    signalerInteraction: () => {
      compteurInteractions++;
      console.log(`⭐ Interaction ${compteurInteractions}/${SEUIL_INTERACTIONS}`);
      if (compteurInteractions >= SEUIL_INTERACTIONS) {
        declencher("interactions", callback);
      }
    }
  };
}

async function declencher(source, callback) {
  if (transitionDejaDeclenchee) return;
  transitionDejaDeclenchee = true;
  if (minuteurId) clearTimeout(minuteurId);
  console.log(`🌕 Condition de sortie atteinte (${source}) — lancement de la transition vers les valeurs`);
  // Déverrouille AVANT callback() : callback() révèle le bouton "Explorer
  // les valeurs" (défini dans etoiles.js), donc au moment où la personne
  // peut cliquer dessus, "valeurs" est déjà débloqué dans progression.js.
  await initProgression();
  deverrouiller("valeurs");
  callback();
}

/**
 * Joue la séquence complète de sortie. Appelée une fois par initConditionSortie().
 *
 * @param {object} refs
 *   svg              - sélection D3 du <svg> principal d'univers/
 *   groupeLune       - sélection D3 du groupe contenant la Lune (déjà en scène)
 *   echelleLuneActuelle - échelle actuellement appliquée à la Lune (nombre)
 *   luneCentreSource - { x, y } centre du contenu source de lune.svg
 *   selectionEtoiles - sélection D3 de tous les <circle> étoiles
 *   groupeEtiquettes - sélection D3 des arcs-étiquettes de nations (à faire disparaître)
 *   canvasEl         - élément DOM #univers-canvas (pour le fond blanc)
 *   centre           - { x, y } centre de la scène (CENTRE dans etoiles.js)
 */
export async function lancerTransitionValeurs({
  svg, groupeLune, echelleLuneActuelle, luneCentreSource,
  selectionEtoiles, groupeEtiquettes, canvasEl, centre
}) {
  const reduireAnimation = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const d = (val) => (reduireAnimation ? 0.01 : val);

  // --- Voile blanc, prêt mais invisible, ajouté tôt pour éviter un saut visuel ---
  // z-index VOLONTAIREMENT sous celui du <svg> (voir style.css, #univers-canvas svg
  // a z-index:2) : le voile forme le nouveau FOND, la Lune/spirale doivent rester
  // visibles PAR-DESSUS lui, pas cachées derrière.
  const voileBlanc = document.createElement("div");
  voileBlanc.id = "voile-blanc-transition";
  Object.assign(voileBlanc.style, {
    position: "absolute", inset: "0", background: "#f7f5f0",
    opacity: "0", pointerEvents: "none", zIndex: "1"
  });
  canvasEl.appendChild(voileBlanc);

  const tl = gsap.timeline();

  // 0. Les étiquettes de nations disparaissent — plus pertinentes une fois
  // qu'on quitte l'exploration des constellations.
  tl.to(groupeEtiquettes.node(), { opacity: 0, duration: d(1), ease: "power1.out" }, 0);

  // 1. Les étoiles convergent vers le centre — UNE étoile par nation reste
  // visible (peu importe sa position dans le tableau, on prend la première
  // rencontrée de chaque nation) pour garder la diversité de couleurs plutôt
  // qu'une tranche arbitraire. Elles deviendront les perles du collier en
  // Partie 4 (page 21 du script). Réparties en petit cercle provisoire —
  // la vraie composition du collier reste à faire au Sprint 4.
  const tousLesNoeuds = selectionEtoiles.nodes();
  const nationsVues = new Set();
  const noeudsPerles = [];
  const noeudsQuiDisparaissent = [];

  tousLesNoeuds.forEach(noeud => {
    const nationId = d3.select(noeud).datum().data.nation;
    if (!nationsVues.has(nationId)) {
      nationsVues.add(nationId);
      noeudsPerles.push(noeud);
    } else {
      noeudsQuiDisparaissent.push(noeud);
    }
  });

  const RAYON_CERCLE_PERLES = 18;
  noeudsPerles.forEach((noeud, i) => {
    const angle = (i / noeudsPerles.length) * Math.PI * 2;
    const cibleX = centre.x + Math.cos(angle) * RAYON_CERCLE_PERLES;
    const cibleY = centre.y + Math.sin(angle) * RAYON_CERCLE_PERLES;
    tl.to(noeud, {
      attr: { cx: cibleX, cy: cibleY },
      duration: d(2.2),
      ease: "power2.in"
    }, 0);
  });

  tl.to(noeudsQuiDisparaissent, {
    attr: { cx: centre.x, cy: centre.y },
    opacity: 0,
    duration: d(2.2),
    stagger: { amount: d(1), from: "random" },
    ease: "power2.in"
  }, 0);

  // 2. La Lune grossit à ~80% de la HAUTEUR RÉELLE de l'écran — mesurée en
  // pixels, pas déduite du viewBox (leçon de step11 : ne jamais présumer).
  const rectLuneActuel = groupeLune.node().getBoundingClientRect();
  const hauteurLuneActuellePx = rectLuneActuel.height;
  const hauteurCiblePx = window.innerHeight * 0.8;
  const facteurCroissance = hauteurCiblePx / hauteurLuneActuellePx;
  const echelleCible = echelleLuneActuelle * facteurCroissance;

  const proxyEchelle = { valeur: echelleLuneActuelle };
  tl.to(proxyEchelle, {
    valeur: echelleCible,
    duration: d(2.5),
    ease: "power2.inOut",
    onUpdate: () => {
      groupeLune.attr(
        "transform",
        `translate(${centre.x - proxyEchelle.valeur * luneCentreSource.x}, ${centre.y - proxyEchelle.valeur * luneCentreSource.y}) scale(${proxyEchelle.valeur})`
      );
    }
  }, 0.3);

  // 3. Le fond blanchit pendant que la Lune est au sommet de sa croissance
  tl.to(voileBlanc, { opacity: 1, duration: d(1.5), ease: "power1.inOut" }, "-=1");

  // 4. Fondu-enchaîné : la Lune disparaît, la spirale prend sa place
  const spiraleMarkup = await d3.text("./svg/spirale.svg");
  const spiraleParsee = new DOMParser().parseFromString(spiraleMarkup, "image/svg+xml");
  const groupeSpiraleSource = spiraleParsee.querySelector("g#spirale");

  if (!groupeSpiraleSource) {
    console.error(
      '❌ <g id="spirale"> introuvable dans univers/svg/spirale.svg — ' +
      "as-tu bien déposé la version recadrée (avec le groupe nommé), " +
      "pas le fichier spiraleValeurs.svg original ?"
    );
    return; // on arrête proprement plutôt que de planter plus loin
  }

  const groupeSpirale = svg.append("g").attr("class", "spirale").style("opacity", 0);
  groupeSpirale.node().appendChild(document.importNode(groupeSpiraleSource, true));

  const echelleSpirale = echelleCible; // même taille cible que la Lune agrandie, point de départ raisonnable
  const facteurTailleSpirale = (hauteurCiblePx / window.innerHeight) * 1000 / SPIRALE_LARGEUR_SOURCE; // grossier, à ajuster visuellement
  groupeSpirale.attr(
    "transform",
    `translate(${centre.x - facteurTailleSpirale * SPIRALE_CENTRE_SOURCE.x}, ${centre.y - facteurTailleSpirale * SPIRALE_CENTRE_SOURCE.y}) scale(${facteurTailleSpirale})`
  );

  tl.to(groupeLune.node(), { opacity: 0, duration: d(1), ease: "power1.out" }, "-=0.3");
  tl.to(groupeSpirale.node(), { opacity: 1, duration: d(1.2), ease: "power1.in" }, "<");

  // 5. Navigation directe vers valeurs/ — pas de deuxième bouton : la personne
  // a déjà donné son accord en cliquant sur "Explorer les valeurs" au début.
  // Courte pause pour laisser voir la spirale avant de quitter la page.
  tl.call(() => {
    console.log("🌀 Transition terminée — navigation vers valeurs/");
  });
  tl.to({}, { duration: d(5) }); // pause avant navigation — allonge ce chiffre pour observer plus longtemps
  tl.call(() => {
    window.location.href = "../valeurs/index.html";
  });
}