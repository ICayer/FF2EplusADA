// ==================================================
// assets/js/landingLienRecit.js
// Landing — centre le lien "Découvrir le récit" sur la spirale
//
// Rôle : Mesurer la position RÉELLE de #spirale (Playbook §3.3, jamais
// présumée depuis le viewBox) et centrer le lien "Découvrir le récit" +
// bouton "page suivante" par-dessus. Une seule mesure suffit :
// .landing-spirale-conteneur est position:sticky, donc le lien
// (position:absolute à l'intérieur) suit automatiquement le scroll sans
// recalcul — seul un redimensionnement de fenêtre change la position
// réelle du centre.
// Dépend de : aucun
// Utilisé par : index.html (racine)
//
// FF2EplusADA (scrollyFFADA2S v2)
// Isabel Cayer · Atelier Love & Code · 2026
// ==================================================

export function initLandingLienRecit() {
  positionner();
  window.addEventListener("resize", positionner);
}

function positionner() {
  const spiraleEl = document.getElementById("spirale");
  const conteneurEl = document.querySelector(".landing-spirale-conteneur");
  const lienEl = document.getElementById("lien-decouvrir-recit");
  if (!spiraleEl || !conteneurEl || !lienEl) return;

  const rectSpirale = spiraleEl.getBoundingClientRect();
  const rectConteneur = conteneurEl.getBoundingClientRect();

  lienEl.style.left = `${rectSpirale.left + rectSpirale.width / 2 - rectConteneur.left}px`;
 const DECALAGE_Y = -15; // négatif = vers le haut — Isabel ajustera à l'œil
lienEl.style.top = `${rectSpirale.top + rectSpirale.height / 2 - rectConteneur.top + DECALAGE_Y}px`;
}
