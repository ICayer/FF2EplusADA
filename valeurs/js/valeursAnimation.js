// ==================================================
// valeurs/js/valeursAnimation.js
// Partie 4 — Valeurs : mise en scène spirale / couple / collier de perles
//
// Rôle : Charger valeurs/svg/valeurs.svg, dimensionner l'ensemble pour que
// la spirale fasse 80% de la hauteur d'écran (même cible que la Lune
// agrandie en fin d'univers/), puis révéler en fondu la spirale, le couple
// et les 5 groupes de perles en vague. Le fondu d'entrée de la spirale est
// symétrique du fondu de sortie fait par univers/ avant la navigation —
// la coupure de page se produit entre deux écrans blancs. Les couleurs
// des 5 groupes sont tirées au hasard parmi les nations à chaque
// chargement (le collier change à chaque visite).
// Les 9 swirls + boutons de valeur, déjà présents dans le SVG, restent
// masqués — ils seront mis en scène dans une tâche séparée (S4B3T1).
// Dépend de : shared/js/utils.js (loadSVG), univers/data/nations.json,
// gsap (global, CDN)
// Utilisé par : valeurs/index.html
//
// FF2EplusADA (scrollyFFADA2S v2)
// Isabel Cayer · Atelier Love & Code · 2026
// ==================================================

import { loadSVG } from "../../shared/js/utils.js";

let container = null;

function reduitMouvement() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

async function assurerContainer() {
  if (!container) {
    container = await loadSVG("./svg/valeurs.svg", "valeursSVG", "graphic");
    if (!container) {
      console.error("❌ Impossible de charger valeurs.svg");
      return null;
    }

    // Regrouper TOUS les groupes de premier niveau dans un seul <g> — le
    // fichier source n'a pas de groupe englobant, chaque élément (couple,
    // perles, spirale, swirls, boutons) est positionné indépendamment dans
    // un large canevas (Playbook §3.3 : mesurer, jamais présumer).
    const svgRoot = container.querySelector("svg");
    const NS_SVG = "http://www.w3.org/2000/svg";
    const groupePrincipal = document.createElementNS(NS_SVG, "g");
    groupePrincipal.setAttribute("id", "scene-valeurs");
    Array.from(svgRoot.children)
      .filter((el) => el.tagName === "g")
      .forEach((el) => groupePrincipal.appendChild(el));
    svgRoot.appendChild(groupePrincipal);

    // Mesurer la hauteur RÉELLEMENT rendue de la spirale (avant tout
    // ajustement d'échelle) pour viser 80% de la hauteur d'écran — même
    // cible que la Lune agrandie dans univers/js/transitionValeurs.js, pour
    // que la taille corresponde visuellement d'une page à l'autre. Remplace
    // l'échelle fixe .6491 héritée du fichier Illustrator, qui ne visait
    // rien de précis.
    const spiraleEl = groupePrincipal.querySelector("#spirale");
    const rectSpiraleInitial = spiraleEl.getBoundingClientRect();
    const hauteurCiblePx = window.innerHeight * 0.8;
    const facteurEchelle = hauteurCiblePx / rectSpiraleInitial.height;

    const bbox = groupePrincipal.getBBox();
    const centreGroupeX = bbox.x + bbox.width / 2;
    const centreGroupeY = bbox.y + bbox.height / 2;
    const [vbX, vbY, vbW, vbH] = svgRoot.getAttribute("viewBox").split(" ").map(Number);
    const centreViewBoxX = vbX + vbW / 2;
    const centreViewBoxY = vbY + vbH / 2;
    groupePrincipal.setAttribute(
      "transform",
      `translate(${centreViewBoxX - facteurEchelle * centreGroupeX}, ${centreViewBoxY - facteurEchelle * centreGroupeY}) scale(${facteurEchelle})`
    );

    // loadSVG pose le conteneur à opacity:0 — le rendre visible (comme
    // assurerContainer() du scrolly).
    gsap.set(container, { opacity: 1, display: "block" });

    // Spirale : invisible au départ, révélée en fondu par initValeurs()
    // (ajusté après test — un fondu d'entrée adoucit la coupure de page
    // depuis univers/, qui fait maintenant son propre fondu de sortie
    // symétrique. Voir univers/js/transitionValeurs.js.)
    const spirale = container.querySelector("#spirale");
    if (spirale) gsap.set(spirale, { opacity: 0, display: "block" });

    // Couple : présent mais invisible, révélé plus tard en fondu.
    const couple = container.querySelector("#couple");
    if (couple) gsap.set(couple, { opacity: 0, display: "block" });

    // Perles : le GROUPE reste opacity:1 (sinon l'opacité du parent
    // multiplierait celle des enfants — même piège que dans le scrolly) ;
    // chaque <path> enfant démarre invisible, individuellement.
    for (let i = 1; i <= 5; i++) {
      const groupe = container.querySelector(`#perles${i}`);
      if (groupe) {
        gsap.set(groupe, { opacity: 1, display: "block", visibility: "visible" });
        gsap.set(groupe.querySelectorAll("path"), { opacity: 0 });
      }
    }

    // Hors périmètre S4B2 : les 9 swirls et les 9 boutons de valeur sont
    // déjà dans valeurs.svg (préparés en S4B1T3). Les garder masqués tant
    // que S4B3T1 ne les met pas en scène, sinon ils s'afficheraient bruts.
    ["#swirls", "#boutons"].forEach((sel) => {
      const el = container.querySelector(sel);
      if (el) gsap.set(el, { opacity: 0, display: "none" });
    });
  }

  return container;
}

// 5 couleurs de nations différentes, tirées au hasard à chaque chargement
// — pas de nation favorisée (script technique : le collier change à chaque
// exploration). Mélange approximatif (tri par Math.random) suffisant ici.
async function chargerCouleursNations() {
  const nations = await fetch("/univers/data/nations.json").then((r) => r.json());
  return [...nations]
    .sort(() => Math.random() - 0.5)
    .slice(0, 5)
    .map((n) => n.couleur);
}

function appliquerCouleursPerles(c, couleurs) {
  for (let i = 1; i <= 5; i++) {
    const groupe = c.querySelector(`#perles${i}`);
    if (!groupe) continue;
    groupe.querySelectorAll("path").forEach((p) => p.setAttribute("fill", couleurs[i - 1]));
  }
}

// Même technique que animerPerlesEnVague() du scrolly (avantColonisation.js) :
// trier les <path> par getBBox().x croissant et les révéler en vague.
// Dupliquée ici volontairement — la fonction du scrolly est scopée à sa
// partie, et il n'y a pas de logique métier partagée au-delà de la
// technique elle-même (Playbook §1).
function animerGroupePerlesEnVague(groupeEl, timeline, positionRelative) {
  if (!groupeEl) return;
  const paths = Array.from(groupeEl.querySelectorAll("path"))
    .sort((a, b) => a.getBBox().x - b.getBBox().x);
  timeline.to(paths, { opacity: 1, duration: 0.4, stagger: 0.05 }, positionRelative);
}

// selecteurGraphic : gardé pour rester cohérent avec initUnivers("#univers-canvas")
// — non utilisé ici (loadSVG cible déjà "graphic" par défaut).
export async function initValeurs(selecteurGraphic) {
  const c = await assurerContainer();
  if (!c) return;

  const couleurs = await chargerCouleursNations();
  appliquerCouleursPerles(c, couleurs);

  const couple = c.querySelector("#couple");
  const groupesPerles = [1, 2, 3, 4, 5].map((i) => c.querySelector(`#perles${i}`));

  if (reduitMouvement()) {
    // État final direct : spirale + couple + toutes les perles visibles,
    // aucun délai.
    const spirale = c.querySelector("#spirale");
    if (spirale) gsap.set(spirale, { opacity: 1 });
    if (couple) gsap.set(couple, { opacity: 1 });
    groupesPerles.forEach((groupe) => {
      if (groupe) gsap.set(groupe.querySelectorAll("path"), { opacity: 1 });
    });
    return;
  }

  const tl = gsap.timeline();
  const spirale = c.querySelector("#spirale");

  // La spirale entre en fondu dès le chargement — pas de délai
  // supplémentaire ici, univers/ a déjà fait sa propre pause avant de
  // naviguer (voir CORRECTION 1, transitionValeurs.js).
  if (spirale) {
    tl.to(spirale, { opacity: 1, duration: 1.5, ease: "power1.out" });
  }

  // +=2 : délai avant le fondu du couple (script technique), maintenant
  // relatif à la fin du fondu de la spirale plutôt qu'au chargement de la
  // page.
  if (couple) {
    tl.to(couple, { opacity: 1, duration: 1.5, ease: "power1.out" }, "+=2");
  }

  // Toutes les vagues de perles démarrent à la MÊME position — un label
  // posé +=2 après la fin du fondu du couple. Sans le label, chaque .to()
  // suivant se placerait +=2 après la fin du précédent (effet d'escalier).
  tl.addLabel("perles", "+=2");
  groupesPerles.forEach((groupe) => animerGroupePerlesEnVague(groupe, tl, "perles"));
}
