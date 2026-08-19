import { loadSVG } from "../../../shared/js/utils.js";

let step7Container = null;
let step7Timeline = null;
let isStep7Active = false;

export async function showStep7() {
  console.log("✅ showStep7 déclenché");

  // Éviter les appels multiples
  if (isStep7Active) {
    console.log("⚠️ Step7 déjà actif, ignoré");
    return;
  }

  // Nettoyer l'ancienne timeline si elle existe
  if (step7Timeline) {
    step7Timeline.kill();
    step7Timeline = null;
  }

  isStep7Active = true;

  // Charger le SVG si pas déjà chargé
  if (!step7Container) {
    step7Container = await loadSVG("./svg/step7/step7_ffada2s.svg", "step7SVG", "graphic");
    if (!step7Container) {
      console.error("❌ Impossible de charger le SVG step7");
      return;
    }
  }

  // Container visible
  gsap.set(step7Container, { 
    opacity: 1, 
    display: "block", 
    pointerEvents: "auto" 
  });

  // IDs contrôlés dans la timeline
  const initialEls = ["#step7Sol", "#Perso1", "#Perso2", "#Perso3"];
  const persoEls = [
    "#Perso4", "#Perso5", "#Perso6", "#Perso7",
    "#Perso8", "#Perso9", "#Perso10", "#Perso11",
    "#Perso12", "#Perso13", "#Perso14"
  ];
  const stripes = [
    "#stripe1", "#stripe2", "#stripe3", "#stripe4",
    "#stripe5", "#stripe6", "#stripe7"
  ];

  console.log("🎯 Éléments step7 à animer:", {
    initial: initialEls.length,
    persos: persoEls.length,
    stripes: stripes.length
  });

  // Tout masquer au départ
  const allEls = [...initialEls, ...persoEls, ...stripes];
  allEls.forEach(sel => {
    const el = step7Container.querySelector(sel);
    if (el) gsap.set(el, { opacity: 0, display: "block", visibility: "visible" });
  });

  // Construire la timeline
  step7Timeline = gsap.timeline({
    onComplete: () => {
      console.log("🎬 Animation step7 terminée");
    }
  });

  // 1. Apparition initiale (Sol + 3 premiers persos)
  step7Timeline.to(initialEls.map(sel => step7Container.querySelector(sel)).filter(el => el), {
    opacity: 1,
    duration: 1.5,
    stagger: 0.2,
    onStart: () => console.log("📺 step7Sol + Perso1-3 visibles")
  });

  // 2. Persos suivants toutes les 1.5s
  persoEls.forEach(sel => {
    const el = step7Container.querySelector(sel);
    if (el) {
      step7Timeline.to(el, {
        opacity: 1,
        duration: 1,
        onStart: () => console.log(`📺 ${sel} visible`)
      }, "+=1");
    }
  });

  // 3. Pause de 2s
  step7Timeline.to({}, { duration: 2, onStart: () => console.log("⏸ pause 2s avant stripes") });

  // 4. Apparition des stripes (1s chacun)
  stripes.forEach(sel => {
    const el = step7Container.querySelector(sel);
    if (el) {
      step7Timeline.to(el, {
        opacity: 1,
        duration: 1,
        onStart: () => console.log(`📺 ${sel} visible`)
      });
    }
  });

  console.log("▶️ Timeline step7 démarrée");
}

export function hideStep7({ soft = false } = {}) {
  console.log("👋 hideStep7 déclenché", { soft });

  isStep7Active = false;

  // Arrêter l'animation en cours
  if (step7Timeline) {
    step7Timeline.kill();
    step7Timeline = null;
    console.log("🛑 Timeline step7 reset");
  }

  if (!step7Container) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    if (soft) {
      // Fade out rapide sans reset complet
      gsap.to(step7Container, { 
        opacity: 0, 
        duration: 0.3,
        ease: "power2.out",
        onComplete: resolve
      });
    } else {
      // Reset complet
      gsap.to(step7Container, {
        opacity: 0,
        duration: 0.5,
        ease: "power2.out",
        onComplete: () => {
          // Reset tous les éléments spécifiques
          const initialEls = ["#step7Sol", "#Perso1", "#Perso2", "#Perso3"];
          const persoEls = [
            "#Perso4", "#Perso5", "#Perso6", "#Perso7",
            "#Perso8", "#Perso9", "#Perso10", "#Perso11",
            "#Perso12", "#Perso13", "#Perso14"
          ];
          const stripes = [
            "#stripe1", "#stripe2", "#stripe3", "#stripe4",
            "#stripe5", "#stripe6", "#stripe7"
          ];
          
          const allEls = [...initialEls, ...persoEls, ...stripes];
          allEls.forEach(sel => {
            const el = step7Container.querySelector(sel);
            if (el) {
              gsap.set(el, { 
                opacity: 0, 
                visibility: "hidden",
                clearProps: "all" 
              });
            }
          });

          gsap.set(step7Container, { 
            display: "none",
            pointerEvents: "none"
          });
          
          console.log("🧹 Step7 complètement nettoyé");
          resolve();
        }
      });
    }
  });
}