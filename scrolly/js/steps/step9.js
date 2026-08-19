import { loadSVG } from "../../../shared/js/utils.js";

let step9Container = null;
let step9Timeline = null;
let isStep9Active = false;
let originalStripesD = {}; // sauvegarde des formes originales

export async function showStep9() {
  console.log("✅ showStep9 déclenché");

  if (isStep9Active) {
    console.log("⚠️ Step9 déjà actif, ignoré");
    return;
  }

  if (step9Timeline) {
    step9Timeline.kill();
    step9Timeline = null;
  }

  isStep9Active = true;

  if (!step9Container) {
    step9Container = await loadSVG("./svg/step9/step9_coeur2.svg", "step9SVG", "graphic");
    if (!step9Container) {
      console.error("❌ Impossible de charger le SVG step9");
      return;
    }
    console.log("🔥 step9Container chargé :", step9Container);
  }

  gsap.set(step9Container, { 
    opacity: 1, 
    display: "block", 
    pointerEvents: "auto" 
  });

  const initialEls = ["#step9Lune", "#step9Famille", "#step9Femme"];
  const stripes = ["#stripe1", "#stripe2", "#stripe3"];
  const coeurs = ["#coeur1", "#coeur2", "#coeur3"];

  // sauvegarde des d originaux
  stripes.forEach(sel => {
    const el = step9Container.querySelector(sel);
    if (el) originalStripesD[sel] = el.getAttribute("d");
  });

  console.log("🎯 Éléments step9 trouvés:", {
    initial: initialEls.filter(sel => step9Container.querySelector(sel)).length,
    stripes: stripes.filter(sel => step9Container.querySelector(sel)).length,
    coeurs: coeurs.filter(sel => step9Container.querySelector(sel)).length,
    etoileDebut: !!step9Container.querySelector("#etoileDebut"),
    etoileFin: !!step9Container.querySelector("#etoileFin")
  });

  const allEls = [...stripes, ...coeurs, "#etoileDebut", "#etoileFin"];
  allEls.forEach(sel => {
    const el = step9Container.querySelector(sel);
    if (el) gsap.set(el, { opacity: 0, display: "block", visibility: "visible" });
  });

  initialEls.forEach(sel => {
    const el = step9Container.querySelector(sel);
    if (el) gsap.set(el, { opacity: 1, display: "block", visibility: "visible" });
  });

  step9Timeline = gsap.timeline({
    onComplete: () => {
      console.log("🎬 Animation step9 terminée");
      const etoileDebut = step9Container.querySelector("#etoileDebut");
      const etoileFin = step9Container.querySelector("#etoileFin");
      console.log("✨ Vérification finale:", {
        etoileDebutVisible: etoileDebut ? window.getComputedStyle(etoileDebut).opacity : null,
        etoileFinVisible: etoileFin ? window.getComputedStyle(etoileFin).opacity : null,
        etoileFinBBox: etoileFin ? etoileFin.getBBox() : null
      });
    }
  });

  const stripesEls = stripes.map(sel => step9Container.querySelector(sel)).filter(Boolean);
  const femmeEl = step9Container.querySelector("#step9Femme");

step9Timeline.to({}, { 
  duration: 5, 
  onStart: () => console.log("⏸ Pause de 3 secondes avant animations")
}, 0);

  if (stripesEls.length) {
    step9Timeline.to(stripesEls, { 
      opacity: 1, 
      duration: 2,
      ease: "power2.out",
      onStart: () => console.log("📺 Stripes fade-in")
    }, 0);
  }

  if (femmeEl) {
    step9Timeline.to(femmeEl, { 
      opacity: 0, 
      duration: 2,
      ease: "power2.out",
      onStart: () => console.log("📻 Femme fade-out")
    }, 0);
  }

  step9Timeline.to({}, { duration: 1, onStart: () => console.log("⏸ Pause 1s avant morphing") });

  stripes.forEach((stripeSel, idx) => {
    const stripe = step9Container.querySelector(stripeSel);
    const coeur = step9Container.querySelector(coeurs[idx]);
    if (stripe && coeur && window.flubber) {
      const interp = flubber.interpolate(stripe.getAttribute("d"), coeur.getAttribute("d"));
      step9Timeline.to(stripe, {
        duration: 2,
        ease: "power2.inOut",
        onStart: () => console.log(`🔄 Morphing ${stripeSel} → ${coeurs[idx]}`),
        onUpdate: function () {
          stripe.setAttribute("d", interp(this.progress()));
        },
        onComplete: () => {
          gsap.set(stripe, { opacity: 0 });
          gsap.set(coeur, { opacity: 1 });
          console.log(`💖 ${coeurs[idx]} visible`);
        }
      }, "+=0.5");
    }
  });

  const etoileDebut = step9Container.querySelector("#etoileDebut");
  if (etoileDebut) {
    step9Timeline.to(etoileDebut, { opacity: 1, duration: 2, onComplete: () => console.log("🌟 etoileDebut affiché") }, "+=0.5");
  }

  const etoileFin = step9Container.querySelector("#etoileFin");
  const cerclesDebut = etoileDebut ? etoileDebut.querySelectorAll("circle") : [];
  const cerclesFin = etoileFin ? etoileFin.querySelectorAll("circle") : [];

  if (cerclesDebut.length && cerclesFin.length) {
    cerclesDebut.forEach((cDebut, idx) => {
      const cFin = cerclesFin[idx];
      if (cFin) {
        const dx = cFin.cx.baseVal.value - cDebut.cx.baseVal.value;
        const dy = cFin.cy.baseVal.value - cDebut.cy.baseVal.value;

        step9Timeline.to(cDebut, {
          duration: 5,
          x: dx,
          y: dy,
          fill:"#eadd42",
          ease: "power2.inOut",
          onComplete: () => {
            if (idx === cerclesDebut.length - 1) {
              console.log("🌌 etoileFin atteint position finale");
            }
          }
        }, "<+=0.05");
      }
    });
  }

  console.log("▶️ Timeline step9 démarrée");
}

export function hideStep9({ soft = false } = {}) {
  console.log("👋 hideStep9 déclenché", { soft });

  isStep9Active = false;

  if (step9Timeline) {
    step9Timeline.kill();
    step9Timeline = null;
    console.log("🛑 Timeline step9 reset");
  }

  if (!step9Container) return Promise.resolve();

  return new Promise((resolve) => {
    if (soft) {
      gsap.to(step9Container, { opacity: 0, duration: 0.3, ease: "power2.out", onComplete: resolve });
    } else {
      gsap.to(step9Container, {
        opacity: 0,
        duration: 0.5,
        ease: "power2.out",
        onComplete: () => {
          const initialEls = ["#step9Lune", "#step9Famille", "#step9Femme"];
          const stripes = ["#stripe1", "#stripe2", "#stripe3"];
          const coeurs = ["#coeur1", "#coeur2", "#coeur3"];

          // reset stripes avec d original
          stripes.forEach(sel => {
            const el = step9Container.querySelector(sel);
            if (el) {
              if (originalStripesD[sel]) el.setAttribute("d", originalStripesD[sel]);
              gsap.set(el, { opacity: 0, visibility: "visible", x: 0, y: 0 });
            }
          });

          // reset coeurs cachés
          coeurs.forEach(sel => {
            const el = step9Container.querySelector(sel);
            if (el) gsap.set(el, { opacity: 0, visibility: "hidden" });
          });

          // reset etoileDebut (prêt à réapparaître)
          const etoileDebutEl = step9Container.querySelector("#etoileDebut");
          if (etoileDebutEl) {
            gsap.set(etoileDebutEl, { opacity: 0, visibility: "visible" });
            const circles = etoileDebutEl.querySelectorAll("circle");
            gsap.set(circles, { x: 0, y: 0, visibility: "visible", clearProps: "opacity,fill" });
          }

          // reset etoileFin (caché)
          const etoileFinEl = step9Container.querySelector("#etoileFin");
          if (etoileFinEl) {
            gsap.set(etoileFinEl, { opacity: 0, visibility: "hidden" });
          }

          // reset initiaux
          initialEls.forEach(sel => {
            const el = step9Container.querySelector(sel);
            if (el) gsap.set(el, { opacity: 1, visibility: "visible" });
          });

          gsap.set(step9Container, { display: "none", pointerEvents: "none" });
          console.log("🧹 Step9 complètement nettoyé");
          resolve();
        }
      });
    }
  });
}
