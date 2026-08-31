// ==================================================
// scrolly/js/steps/step11.js
// Step 11 — Transition finale : la Lune se centre, les étoiles se multiplient
//
// Rôle : Après step10, faire disparaître la Communauté et les vestiges du
// territoire, centrer la Lune pleine (recentrée dynamiquement via getBBox(),
// pas une valeur codée en dur), générer ~221 étoiles JAUNES autour d'elle —
// un simple effet visuel de densité, volontairement SANS lien aux vraies
// données de etoiles.json ni distinction de couleur par nation (voir Registre,
// réflexion d'Isabel sur le risque de fausse proportion perçue par les
// communautés). Révèle ensuite le bouton "Explorer les étoiles" vers univers/.
//
// Suit le principe déjà utilisé en v1 (Isabel) : on tue tout ce qui touche au
// step précédent et on reconstruit indépendamment dans son propre conteneur,
// avec des fondus doux pour la transition — pas de dépendance au DOM live de
// step10.js, qui reste intact et non modifié.
// Dépend de : shared/js/utils.js (loadSVG), shared/js/progression.js
// (deverrouiller "univers" au moment de la récompense), shared/js/railParcours.js
// (rafraichirVerrous — le rail est visible sur cette page)
// Utilisé par : scrolly/js/stepsRegistry.js
//
// FF2EplusADA (scrollyFFADA2S v2)
// Isabel Cayer · Atelier Love & Code · 2026
// ==================================================

import { loadSVG } from "../../../shared/js/utils.js";
import { initProgression, deverrouiller } from "../../../shared/js/progression.js";
import { rafraichirVerrous } from "../../../shared/js/railParcours.js";

let step11Container = null;
let step11Timeline = null;
let isStep11Active = false;

const NB_ETOILES_TOTAL = 221;
const RAYON_MIN = 40;
const RAYON_MAX = 130;
const COULEUR_ETOILES = "#eadd42"; // jaune uniforme — décision du 19 août, pas de couleur par nation ici

// Mesure la position RÉELLE à l'écran de `element` et de `conteneur`, puis convertit
// les deux centres en coordonnées internes du SVG via getScreenCTM() (la matrice de
// transformation courante). Robuste peu importe la config de la balise <svg> source —
// contrairement à un calcul basé sur le viewBox seul, qui suppose un comportement
// d'auto-centrage qui ne tenait pas dans notre cas (voir capture du 24 août).
function calculerCentrage(element, conteneur) {
  const ctm = element.getScreenCTM();
  const ctmInverse = ctm.inverse();
  const svgRoot = element.ownerSVGElement;

  const rectElement = element.getBoundingClientRect();
  const rectConteneur = conteneur.getBoundingClientRect();

  const pt = svgRoot.createSVGPoint();

  pt.x = rectElement.left + rectElement.width / 2;
  pt.y = rectElement.top + rectElement.height / 2;
  const centreElementSVG = pt.matrixTransform(ctmInverse);

  pt.x = rectConteneur.left + rectConteneur.width / 2;
  pt.y = rectConteneur.top + rectConteneur.height / 2;
  const centreConteneurSVG = pt.matrixTransform(ctmInverse);

  return {
    decalage: {
      x: centreConteneurSVG.x - centreElementSVG.x,
      y: centreConteneurSVG.y - centreElementSVG.y
    },
    centreConteneurSVG
  };
}

export async function showStep11() {
  console.log("✅ showStep11 déclenché");

  if (isStep11Active) {
    console.log("⚠️ Step11 déjà actif, ignoré");
    return;
  }

  if (step11Timeline) {
    step11Timeline.kill();
    step11Timeline = null;
  }

  isStep11Active = true;

  if (!step11Container) {
    // Réutilise le même asset visuel que step10 (continuité de style), mais
    // chargé dans SON PROPRE conteneur indépendant — step11 ne dépend jamais
    // de l'état DOM où step10 s'est arrêté.
    step11Container = await loadSVG("./svg/step10/step10_lune_etoile.svg", "step11SVG", "graphic");
    if (!step11Container) {
      console.error("❌ Impossible de charger le SVG step11");
      return;
    }
  }

  gsap.set(step11Container, { opacity: 1, display: "block", pointerEvents: "auto" });

  // On repart d'un état totalement neutre : tout ce qui appartenait à la scène
  // de step10 (Sol, Famille, Communauté, Lune "avant", les 67 étoiles Début/Fin)
  // est masqué d'entrée — step11 reconstruit sa propre scène de zéro.
  const groupesAMasquer = ["#step10Sol", "#step10Famille", "#step10Coeur", "#step10Lune", "#step10Communaute"];
  groupesAMasquer.forEach(sel => {
    const el = step11Container.querySelector(sel);
    if (el) gsap.set(el, { opacity: 0, display: "none" });
  });
  for (let i = 1; i <= 67; i++) {
    ["etoileDebut", "etoileFin"].forEach(prefixe => {
      const el = step11Container.querySelector(`#${prefixe}${i}`);
      if (el) gsap.set(el, { opacity: 0, display: "none" });
    });
  }

  const pleineLune = step11Container.querySelector("#step10PleineLune");
  if (!pleineLune) {
    console.error("❌ #step10PleineLune introuvable dans le SVG");
    return;
  }
  const svgRootEl = step11Container.querySelector("svg");
  gsap.set(pleineLune, { opacity: 0, display: "block", clearProps: "x,y" });

  // --- Centrage dynamique, mesuré sur le rendu réel à l'écran ---
  // Plutôt que de calculer à partir des coordonnées internes du viewBox (fragile :
  // dépend de si la balise <svg> a une taille fixe ou en pourcentage), on mesure
  // la position RÉELLE de la Lune et du conteneur visible sur l'écran, puis on
  // convertit en coordonnées internes du SVG via sa matrice de transformation
  // (getScreenCTM). Robuste peu importe comment le fichier source est configuré.
  const { decalage, centreConteneurSVG } = calculerCentrage(pleineLune, step11Container);

  // --- Génération procédurale des ~221 étoiles jaunes ---
  // Volontairement AUCUN lien avec etoiles.json ni les couleurs de nations.json :
  // c'est un effet de densité visuelle, pas une représentation de vraies données.
  const NS_SVG = "http://www.w3.org/2000/svg";
  const groupeEtoiles = document.createElementNS(NS_SVG, "g");
  groupeEtoiles.setAttribute("id", "step11-etoiles");
  svgRootEl.appendChild(groupeEtoiles);

  const etoilesGenerees = [];
  for (let i = 0; i < NB_ETOILES_TOTAL; i++) {
    const angle = Math.random() * Math.PI * 2;
    const rayon = RAYON_MIN + Math.random() * (RAYON_MAX - RAYON_MIN);
    const cercle = document.createElementNS(NS_SVG, "circle");
    cercle.setAttribute("cx", centreConteneurSVG.x + Math.cos(angle) * rayon);
    cercle.setAttribute("cy", centreConteneurSVG.y + Math.sin(angle) * rayon);
    cercle.setAttribute("r", (0.6 + Math.random() * 0.8).toFixed(2));
    cercle.setAttribute("fill", COULEUR_ETOILES);
    cercle.setAttribute("opacity", "0");
    groupeEtoiles.appendChild(cercle);
    etoilesGenerees.push(cercle);
  }

  // --- Timeline ---
  step11Timeline = gsap.timeline({
    onComplete: () => console.log("🎬 Animation step11 terminée")
  });

  step11Timeline.to(pleineLune, {
    opacity: 1,
    x: decalage.x,
    y: decalage.y,
    duration: 2,
    ease: "power2.out",
    onStart: () => console.log("🌕 Lune pleine centrée")
  });

  step11Timeline.to(etoilesGenerees, {
    opacity: 1,
    duration: 1.5,
    stagger: { amount: 1.5, from: "random" },
    onStart: () => console.log(`✨ ${NB_ETOILES_TOTAL} étoiles apparaissent`)
  }, "-=0.5");

  step11Timeline.call(async () => {
    const bouton = document.getElementById("bouton-explorer-etoiles");
    if (bouton) {
      bouton.classList.add("visible");
      console.log('🔘 Bouton "Explorer les étoiles" révélé');
    }
    await initProgression();
    deverrouiller("univers");
    rafraichirVerrous();
    console.log('🔓 Étape "univers" débloquée dans le parcours');
  });

  console.log("▶️ Timeline step11 démarrée");
}

export function hideStep11({ soft = false } = {}) {
  console.log("👋 hideStep11 déclenché", { soft });

  isStep11Active = false;

  if (step11Timeline) {
    step11Timeline.kill();
    step11Timeline = null;
  }

  const bouton = document.getElementById("bouton-explorer-etoiles");
  if (bouton) bouton.classList.remove("visible");

  if (!step11Container) return Promise.resolve();

  return new Promise((resolve) => {
    gsap.to(step11Container, {
      opacity: 0,
      duration: soft ? 0.3 : 0.5,
      ease: "power2.out",
      onComplete: () => {
        if (!soft) {
          // Les étoiles sont générées dynamiquement (pas un asset statique) —
          // on les détruit plutôt que de simplement les cacher, pour éviter
          // une accumulation de doublons si le step est rejoué plusieurs fois.
          const groupeEtoiles = step11Container.querySelector("#step11-etoiles");
          if (groupeEtoiles) groupeEtoiles.remove();

          const pleineLune = step11Container.querySelector("#step10PleineLune");
          if (pleineLune) gsap.set(pleineLune, { opacity: 0, display: "none", clearProps: "x,y" });
        }
        gsap.set(step11Container, { display: "none", pointerEvents: "none" });
        console.log("🧹 Step11 complètement nettoyé");
        resolve();
      }
    });
  });
}