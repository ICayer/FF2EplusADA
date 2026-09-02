// ==================================================
// assets/js/landingScroll.js
// Landing — révélation des 9 swirls au scroll (GSAP ScrollTrigger)
//
// Rôle : Animer l'apparition progressive (fondu, un par un, réversible)
// des 9 swirls de la composition décorative de la page d'accueil, pilotée
// par la position de scroll via GSAP ScrollTrigger.
//
// ⚠️ SEULE utilisation de ScrollTrigger / de navigation pilotée par le
// scroll dans tout le projet. Toute autre navigation est pilotée par
// clic/bouton (choix délibéré lié au persona : prévisibilité, faible
// exigence de précision motrice). Exception consciente d'Isabel pour
// cette page décorative uniquement — ne PAS généraliser ailleurs sans en
// rediscuter.
//
// Dépend de : gsap + ScrollTrigger (globaux, CDN)
// Utilisé par : index.html (racine)
//
// FF2EplusADA (scrollyFFADA2S v2)
// Isabel Cayer · Atelier Love & Code · 2026
// ==================================================

export function initLandingScroll() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return; // le CSS gère déjà l'état final statique — rien à animer
  }

  const section = document.querySelector(".spirale-swirl-section");
  const swirls = gsap.utils.toArray(".landing-spirale-swirl .swirl");
  if (!section || swirls.length === 0) return;

  gsap.registerPlugin(ScrollTrigger);

  gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: "top 80%",
      end: "bottom 20%",
      scrub: true,
    },
  }).to(swirls, { opacity: 1, stagger: 1, ease: "none" });
}
