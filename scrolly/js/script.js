// ==================================================
// scrolly/js/script.js
// Point d'entrée de la Partie 2 — Scrollytelling
//
// Rôle : Initialiser la timeline à curseur, charger les steps (nouveaux +
// anciens de la v1), et déclencher l'apparition du bouton vers la Partie 3
// une fois le dernier step atteint.
// Dépend de : scrolly/js/timeline.js, scrolly/js/steps/*.js, shared/js/i18n.js
// Utilisé par : scrolly/index.html
//
// FF2EplusADA (scrollyFFADA2S v2)
// Isabel Cayer · Atelier Love & Code · 2026
// ==================================================

import { initI18n, resolve } from "../../shared/js/i18n.js";
import { initTimeline, getOrder } from "./timeline.js";
import { initTimelineRail } from "./timelineRail.js";

async function afficherTexte(steps, stepId) {
  const contenu = steps[stepId];
  document.getElementById("texteStep").innerHTML = contenu
    ? `<h2>${resolve(contenu.titre)}</h2><p>${resolve(contenu.texte)}</p>`
    : "";
}

async function init() {
  await initI18n('fr');
  await initTimeline();

  const steps = await fetch("/scrolly/data/steps.json").then(r => r.json());

  const railEl = document.getElementById("rail");
  const titreEl = document.getElementById("titre-scene");
  const { allerAuStep } = initTimelineRail(railEl, titreEl);

  // afficherTexte reste appelé séparément à chaque navigation — timelineRail.js
  // ne connaît pas steps.json, il gère seulement le rail/curseur/titre/légendes
  const order = getOrder();
  let indexActuel = 0;
  const allerEtAfficher = (index) => {
    indexActuel = index;
    const stepId = order[index].id;
    const contenu = steps[stepId];
    const texteTitre = contenu ? resolve(contenu.nomStep) : "";
    allerAuStep(index, texteTitre);
    afficherTexte(steps, stepId);
  };

  // resolve() lit la langue active à chaque appel — rappeler allerEtAfficher()
  // sur le step courant suffit à tout retraduire, sans logique de traduction
  // supplémentaire. On reste sur le step actuel plutôt que de revenir à 0,
  // pour ne pas désorienter la personne qui change de langue en cours de route.
  window.addEventListener("languagechange", () => {
    allerEtAfficher(indexActuel);
  });

  // Exposer pour que timelineRail.js déclenche afficherTexte à chaque clic/bouton
  window.__scrollyAllerEtAfficher = allerEtAfficher;
  allerEtAfficher(0);
}

init();