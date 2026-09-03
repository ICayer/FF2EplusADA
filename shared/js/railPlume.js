// ==================================================
// shared/js/railPlume.js
// Curseur "plume" du Rail de navigation à 12 boutons
//
// Rôle : Charger la plume (calques plume/perle/perle_noire1-3) en SVG
// inline dans le Rail, et la déplacer vers le bouton actif à chaque
// navigation. perle_noire1 sert d'ancre — sa position réelle est mesurée
// une fois au chargement (jamais présumée depuis le viewBox, Playbook
// §3.3), puis utilisée pour que ce point tombe toujours exactement au
// centre du bouton visé, peu importe la taille finale de la plume.
//
// Ce symbole porte une signification personnelle importante pour une
// des artistes du projet (Registre, 3 septembre) — sa position doit
// toujours être exacte et le SVG jamais coupé ou déformé.
//
// Dépend de : shared/js/navigationEtat.js (reduitMouvement), GSAP
//   (chargé globalement via <script> dans index.html, pas un import ES)
// Utilisé par : scrolly/js/script.js (univers/, valeurs/, landing à venir)
//
// FF2EplusADA (scrollyFFADA2S v2)
// Isabel Cayer · Atelier Love & Code · 2026
// ==================================================

import { reduitMouvement } from "./navigationEtat.js";

const CHEMIN_PLUME = "/shared/svg/timeline/plume.svg";
const DUREE_DEPLACEMENT_S = 0.25;

let railEl = null;
let svgPlume = null;
let ancrePerleNoire1 = null; // { x, y } — offset de perle_noire1 depuis le coin haut-gauche

export async function initRailPlume(railParcoursEl) {
  railEl = railParcoursEl;

  const reponse = await fetch(CHEMIN_PLUME);
  if (!reponse.ok) {
    console.error(`❌ Impossible de charger la plume : ${CHEMIN_PLUME}`);
    return { deplacerPlume: () => {} };
  }
  const texte = await reponse.text();

  const enveloppe = document.createElement("div");
  enveloppe.innerHTML = texte; // même pattern que loadSVG() (shared/js/utils.js)
  svgPlume = enveloppe.querySelector("svg");
  svgPlume.classList.add("curseur-plume");
  svgPlume.setAttribute("aria-hidden", "true");
  railEl.appendChild(svgPlume); // détachée de enveloppe, qui peut être jetée

  mesurerAncrePerleNoire1();

  window.addEventListener("resize", () => {
    if (railEl.dataset.etapeActive) positionner(railEl.dataset.etapeActive, false);
  });

  return { deplacerPlume: (etapeId) => positionner(etapeId, true) };
}

function mesurerAncrePerleNoire1() {
  const perleNoire1 = svgPlume.querySelector("#perle_noire1");
  if (!perleNoire1) {
    console.warn("⚠️ #perle_noire1 introuvable dans plume.svg — ancrage impossible");
    ancrePerleNoire1 = { x: 0, y: 0 };
    return;
  }
  const rectPlume = svgPlume.getBoundingClientRect();
  const rectPerle = perleNoire1.getBoundingClientRect();
  ancrePerleNoire1 = {
    x: rectPerle.left + rectPerle.width / 2 - rectPlume.left,
    y: rectPerle.top + rectPerle.height / 2 - rectPlume.top,
  };
}

function positionner(etapeId, anime) {
  railEl.dataset.etapeActive = etapeId;
  const bouton = railEl.querySelector(`.etape-bouton[data-etape-id="${etapeId}"]`);
  if (!bouton || !svgPlume) return;

  // Ancrage sur .numero (pas le bouton au complet) : perle_noire1 doit tomber
  // exactement sur le badge numéro, jamais sous le bouton — repli sur le bouton
  // lui-même si .numero est un jour absent (défensif, cohérent avec le repli
  // existant sur #perle_noire1 introuvable).
  const numero = bouton.querySelector(".numero");
  const cibleEl = numero || bouton;

  const rectRail = railEl.getBoundingClientRect();
  const rectCible = cibleEl.getBoundingClientRect();
  const cible = {
    left: rectCible.left + rectCible.width / 2 - rectRail.left - ancrePerleNoire1.x,
    top: rectCible.top + rectCible.height / 2 - rectRail.top - ancrePerleNoire1.y,
  };

  if (!anime || reduitMouvement()) {
    svgPlume.style.left = `${cible.left}px`;
    svgPlume.style.top = `${cible.top}px`;
  } else {
    gsap.to(svgPlume, { left: cible.left, top: cible.top, duration: DUREE_DEPLACEMENT_S, ease: "power2.out" });
  }
}
