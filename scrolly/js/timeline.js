// ==================================================
// scrolly/js/timeline.js
// Mécanique de timeline à curseur (remplace Scrollama)
//
// Rôle : Gérer la position du curseur, déterminer quel step est actif,
// et déclencher les transitions GSAP correspondantes.
// Dépend de : aucun (autonome — reçoit les steps en paramètre)
// Utilisé par : scrolly/js/script.js
//
// FF2EplusADA (scrollyFFADA2S v2)
// Isabel Cayer · Atelier Love & Code · 2026
// ==================================================

import { stepsRegistry } from "./stepsRegistry.js";

let order = [];
let currentIndex = -1;

export async function initTimeline() {
  order = await fetch("/scrolly/data/stepsOrder.json").then(r => r.json());
}

export function getOrder() {
  return order;
}

export function goToStep(index) {
  const prevEntry = order[currentIndex];
  const nextEntry = order[index];
  if (prevEntry && stepsRegistry[prevEntry.id]) stepsRegistry[prevEntry.id].hide();
  if (nextEntry && stepsRegistry[nextEntry.id]) stepsRegistry[nextEntry.id].show();
  currentIndex = index;
}