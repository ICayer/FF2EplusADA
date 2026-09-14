// ==================================================
// scrolly/js/steps/step11.js
// Step 11 — Transition finale : la Lune se centre, les étoiles se multiplient
//
// Rôle : Après step10, faire disparaître la Communauté et les vestiges du
// territoire, centrer la Lune pleine (recentrée dynamiquement via getBBox(),
// pas une valeur codée en dur), générer ~221 étoiles JAUNES dispersées sur
// toute la zone-scène visible (rejet par échantillonnage, même principe que
// univers/js/etoiles.js — positionCiel()) — un simple effet visuel de
// densité, volontairement SANS lien aux vraies données de etoiles.json ni
// distinction de couleur par nation (voir Registre, réflexion d'Isabel sur
// le risque de fausse proportion perçue par les communautés). Révèle ensuite
// le bouton "Explorer les étoiles" vers univers/, positionné dynamiquement
// sous la Lune réellement mesurée (getBoundingClientRect(), Playbook §3.3).
//
// Suit le principe déjà utilisé en v1 (Isabel) : on tue tout ce qui touche au
// step précédent et on reconstruit indépendamment dans son propre conteneur,
// avec des fondus doux pour la transition — pas de dépendance au DOM live de
// step10.js, qui reste intact et non modifié.
// Dépend de : shared/js/utils.js (loadSVG), shared/js/progression.js
// (deverrouiller "univers" au moment de la récompense), shared/js/railParcours.js
// (rafraichirVerrous — le rail est visible sur cette page), shared/js/i18n.js
// (t — texte du bouton "Explorer les étoiles")
// Utilisé par : scrolly/js/stepsRegistry.js
//
// FF2EplusADA (scrollyFFADA2S v2)
// Isabel Cayer · Atelier Love & Code · 2026
// ==================================================

import { loadSVG } from "../../../shared/js/utils.js";
import { initProgression, deverrouiller } from "../../../shared/js/progression.js";
import { rafraichirVerrous } from "../../../shared/js/railParcours.js";
import { t } from "../../../shared/js/i18n.js";

let step11Container = null;
let step11Timeline = null;
let isStep11Active = false;

const NB_ETOILES_TOTAL = 221;
const COULEUR_ETOILES = "#eadd42"; // jaune uniforme — décision du 19 août, pas de couleur par nation ici

// Rayon des étoiles — Étape 0 (14 septembre) : univers/js/etoiles.js utilise
// (2.5 + random*2.5) dans un viewBox de 1000×1000 (VUE.largeur/hauteur). Le
// viewBox de step10_lune_etoile.svg est 471.36×268.8 — beaucoup plus petit.
// Copier tel quel le même intervalle numérique donnerait des étoiles environ
// 2× plus GROSSES à l'écran ici que dans univers.html (même formule, unités
// du viewBox ~2× plus "zoomées"), l'inverse de l'intention de rapprochement
// visuel d'Isabel. Écart documenté plutôt que copie littérale : intervalle
// mis à l'échelle par le ratio des largeurs de viewBox (471.36/1000), pour
// occuper une proportion comparable de la scène plutôt qu'un même nombre
// d'unités incomparables — à ajuster à l'œil si le résultat rendu diffère.
const RATIO_VIEWBOX_STEP11_VS_UNIVERS = 471.36 / 1000;
const RAYON_ETOILE_MIN = +(2.5 * RATIO_VIEWBOX_STEP11_VS_UNIVERS).toFixed(2); // ≈ 1.18
const RAYON_ETOILE_VARIATION = +(2.5 * RATIO_VIEWBOX_STEP11_VS_UNIVERS).toFixed(2); // ≈ 1.18 (donc rayon final ≈ 1.18 à 2.36)

// Marges — mêmes valeurs pour le bouton (Correction 1) et l'exclusion des
// étoiles autour de lui/de la Lune (Correction 2), en pixels d'écran réels.
const MARGE_BOUTON_LUNE_PX = 20; // dans la fourchette 16-24px suggérée
const MARGE_EXCLUSION_ETOILE_PX = 12; // évite qu'une étoile touche visuellement la Lune ou le bouton

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

// Rectangle RÉELLEMENT visible de la zone-scène, en coordonnées internes du
// SVG — mesuré via getScreenCTM() sur les 4 coins du conteneur rendu, jamais
// présumé depuis le viewBox seul (Playbook §3.3, même principe que
// calculerCentrage() ci-dessus, appliqué à un rectangle plutôt qu'un point).
// Sert de domaine d'échantillonnage pour la dispersion des étoiles
// (Correction 2) — équivalent du calcul cielMinX/MaxX/MinY/MaxY d'univers.js,
// mais dérivé de la mesure réelle plutôt que d'une comparaison de ratios.
function rectangleVisibleSVG(svgRootEl, conteneur) {
  const ctmInverse = svgRootEl.getScreenCTM().inverse();
  const rectConteneur = conteneur.getBoundingClientRect();
  const pt = svgRootEl.createSVGPoint();

  pt.x = rectConteneur.left;
  pt.y = rectConteneur.top;
  const coinHautGauche = pt.matrixTransform(ctmInverse);

  pt.x = rectConteneur.right;
  pt.y = rectConteneur.bottom;
  const coinBasDroit = pt.matrixTransform(ctmInverse);

  return {
    minX: Math.min(coinHautGauche.x, coinBasDroit.x),
    maxX: Math.max(coinHautGauche.x, coinBasDroit.x),
    minY: Math.min(coinHautGauche.y, coinBasDroit.y),
    maxY: Math.max(coinHautGauche.y, coinBasDroit.y),
  };
}

// true si le point ÉCRAN (xEcran, yEcran) tombe dans `rect` (élargi de
// MARGE_EXCLUSION_ETOILE_PX) — `rect` est un DOMRect ou null (aucune
// exclusion). Testé en coordonnées écran plutôt qu'internes au SVG : rect
// vient de getBoundingClientRect() (Lune ou bouton HTML), donc comparer
// directement en pixels évite d'avoir à convertir un rectangle HTML dans
// l'espace interne du SVG.
function dansRectangleExclu(xEcran, yEcran, rect) {
  if (!rect) return false;
  return (
    xEcran >= rect.left - MARGE_EXCLUSION_ETOILE_PX &&
    xEcran <= rect.right + MARGE_EXCLUSION_ETOILE_PX &&
    yEcran >= rect.top - MARGE_EXCLUSION_ETOILE_PX &&
    yEcran <= rect.bottom + MARGE_EXCLUSION_ETOILE_PX
  );
}

// Positionne le bouton "Explorer les étoiles" juste sous le bas RÉEL de la
// Lune (`rectLune`, un DOMRect déjà mesuré par l'appelant — jamais recalculé
// ici, pour rester correct aussi bien à l'ouverture qu'au redimensionnement,
// voir l'écouteur "resize" plus bas). Centré horizontalement via le
// translateX(-50%) posé une fois pour toutes en CSS (scrolly/index.html).
function positionnerBoutonExploration(rectLune) {
  const bouton = document.getElementById("bouton-explorer-etoiles");
  if (!bouton || !rectLune) return;
  bouton.style.top = `${rectLune.bottom + MARGE_BOUTON_LUNE_PX}px`;
  bouton.style.left = `${rectLune.left + rectLune.width / 2}px`;
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
  const { decalage } = calculerCentrage(pleineLune, step11Container);

  // --- Position ANTICIPÉE de la Lune une fois centrée (Correction 1/2) ---
  // Les étoiles (plus bas) et le placement initial du bouton ont besoin du
  // rectangle FINAL de la Lune AVANT que l'animation ne joue réellement
  // (l'animation ne démarre qu'à la construction de la timeline, en bas de
  // cette fonction). Saut instantané → mesure → retour à la position de
  // départ, entièrement synchrone (aucun repaint entre les deux gsap.set) :
  // la vraie animation, plus bas, part bien de la position d'origine.
  gsap.set(pleineLune, { x: decalage.x, y: decalage.y });
  const rectLuneFinal = pleineLune.getBoundingClientRect();
  gsap.set(pleineLune, { x: 0, y: 0 });

  // --- Bouton "Explorer les étoiles" (Correction 1) ---
  // Texte posé dès maintenant (bouton encore invisible, opacity:0 en CSS —
  // ça ne change rien à son opacity ni à sa mise en page/mesure) pour que sa
  // largeur réelle soit connue AVANT de calculer sa zone d'exclusion
  // ci-dessous, plutôt que de mesurer un bouton encore vide.
  const bouton = document.getElementById("bouton-explorer-etoiles");
  if (bouton) bouton.textContent = t("nav.explorerEtoiles");
  positionnerBoutonExploration(rectLuneFinal);
  const rectBoutonFinal = bouton ? bouton.getBoundingClientRect() : null;

  // --- Génération procédurale des ~221 étoiles jaunes (Correction 2) ---
  // Volontairement AUCUN lien avec etoiles.json ni les couleurs de nations.json :
  // c'est un effet de densité visuelle, pas une représentation de vraies données.
  // Dispersion par rejet sur TOUT le rectangle visible de la zone-scène, avec
  // exclusion autour de la Lune ET du bouton — même principe que
  // positionCiel() dans univers/js/etoiles.js, adapté : le rejet s'y teste en
  // coordonnées écran (dansRectangleExclu) plutôt qu'un masque terrain, mais
  // la logique de rejet par échantillonnage uniforme est la même.
  const NS_SVG = "http://www.w3.org/2000/svg";
  const groupeEtoiles = document.createElementNS(NS_SVG, "g");
  groupeEtoiles.setAttribute("id", "step11-etoiles");
  svgRootEl.appendChild(groupeEtoiles);

  const ctmEcran = svgRootEl.getScreenCTM();
  const zoneVisible = rectangleVisibleSVG(svgRootEl, step11Container);

  const etoilesGenerees = [];
  for (let i = 0; i < NB_ETOILES_TOTAL; i++) {
    let x, y, ptEcran;
    do {
      x = zoneVisible.minX + Math.random() * (zoneVisible.maxX - zoneVisible.minX);
      y = zoneVisible.minY + Math.random() * (zoneVisible.maxY - zoneVisible.minY);
      const pt = svgRootEl.createSVGPoint();
      pt.x = x;
      pt.y = y;
      ptEcran = pt.matrixTransform(ctmEcran);
    } while (
      dansRectangleExclu(ptEcran.x, ptEcran.y, rectLuneFinal) ||
      dansRectangleExclu(ptEcran.x, ptEcran.y, rectBoutonFinal)
    );

    const cercle = document.createElementNS(NS_SVG, "circle");
    cercle.setAttribute("cx", x);
    cercle.setAttribute("cy", y);
    cercle.setAttribute("r", (RAYON_ETOILE_MIN + Math.random() * RAYON_ETOILE_VARIATION).toFixed(2));
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
    onStart: () => console.log("🌕 Lune pleine centrée"),
    // Reconfirme la position du bouton avec le rectangle RÉEL (pas seulement
    // l'anticipation ci-dessus) — filet de sécurité si un redimensionnement
    // survient pendant les 2s de l'animation, cas marginal déjà couvert
    // sinon par l'écouteur "resize" plus bas dès l'événement suivant.
    onComplete: () => positionnerBoutonExploration(pleineLune.getBoundingClientRect()),
  });

  step11Timeline.to(etoilesGenerees, {
    opacity: 1,
    duration: 1.5,
    stagger: { amount: 1.5, from: "random" },
    onStart: () => console.log(`✨ ${NB_ETOILES_TOTAL} étoiles apparaissent`)
  }, "-=0.5");

  step11Timeline.call(async () => {
    // Texte + position déjà posés plus haut (avant même le début de la
    // timeline, nécessaire pour mesurer sa zone d'exclusion) — ici on ne
    // fait plus que le révéler visuellement.
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

// Repositionne le bouton si la fenêtre change de taille pendant que le step
// est actif — même patron que positionnerBoutonExplorer()/resize dans
// univers/js/etoiles.js. Ajouté UNE SEULE FOIS au chargement du module (pas
// à chaque showStep11()) : step11 peut être affiché/masqué plusieurs fois
// dans une même session, un ajout par appel accumulerait des écouteurs en
// double. isStep11Active évite tout travail (et toute erreur si
// step11Container n'existe pas encore) quand le step n'est pas affiché.
window.addEventListener("resize", () => {
  if (!isStep11Active || !step11Container) return;
  const pleineLune = step11Container.querySelector("#step10PleineLune");
  if (pleineLune) positionnerBoutonExploration(pleineLune.getBoundingClientRect());
});

// Retraduisage léger du bouton si la langue change pendant que le step est
// affiché (bouton déjà révélé) — même patron que univers/js/etoiles.js et
// valeurs/js/valeursAnimation.js : on ne touche QUE le texte du bouton,
// jamais un re-rendu de scène.
window.addEventListener("languagechange", () => {
  const bouton = document.getElementById("bouton-explorer-etoiles");
  if (bouton && bouton.classList.contains("visible")) {
    bouton.textContent = t("nav.explorerEtoiles");
  }
});