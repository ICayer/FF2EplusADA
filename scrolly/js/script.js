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
import { initTimeline, goToStep, getOrder } from "./timeline.js";

async function afficherTexte(stepId) {
  const steps = await fetch("/scrolly/data/steps.json").then(r => r.json());
  const contenu = steps[stepId];
  document.getElementById("texteStep").innerHTML = contenu
    ? `<h2>${resolve(contenu.titre)}</h2><p>${resolve(contenu.texte)}</p>`
    : "";
}

async function init() {
  await initI18n('fr');
  await initTimeline();
  const order = getOrder();

  const curseur = document.getElementById("curseurTest");
  curseur.max = order.length - 1;
  curseur.addEventListener("input", (e) => {
    const index = parseInt(e.target.value, 10);
    goToStep(index);
    afficherTexte(order[index].id);
  });

  goToStep(0);
  afficherTexte(order[0].id);
}

init();