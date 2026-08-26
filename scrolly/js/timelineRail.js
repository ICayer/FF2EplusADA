// ==================================================
// scrolly/js/timelineRail.js
// Rail de navigation temporelle (bas de scène)
//
// Rôle : Construire le DOM du rail à partir de getOrder() (timeline.js),
// gérer le positionnement du curseur, le clic direct (snap au step le
// plus proche), les boutons de navigation (retour/recule/play/avance),
// l'affichage conditionnel des légendes d'orientation, et la mise à jour
// du bloc-titre en haut-gauche de la scène (#titre-scene). allerAuStep()
// est la SEULE fonction que le reste du code doit appeler pour naviguer —
// jamais goToStep() de timeline.js directement depuis l'extérieur de ce
// module, pour garder le curseur/titre/légendes synchronisés avec l'état
// réel.
// Dépend de : scrolly/js/timeline.js
// Utilisé par : scrolly/js/script.js
//
// FF2EplusADA (scrollyFFADA2S v2)
// Isabel Cayer · Atelier Love & Code · 2026
// ==================================================

import { goToStep, getOrder } from "./timeline.js";

const DUREE_AUTOPLAY_MS = 2500;
const DUREE_FONDU_MS = 200;

let order = [];
let positions = [];
let currentIndex = 0;
let autoplayTimer = null;

let railEl = null;
let curseurEl = null;
let titreCompteurEl = null;
let titreTexteEl = null;
let legendes = [];
let btnRetour = null;
let btnRecule = null;
let btnAvance = null;
let btnPlay = null;

function reduitMouvement() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Groupe order par epoque (dans l'ordre d'apparition) et calcule la position
// (%) de chaque step selon la formule du Registre — jamais de valeur codée
// en dur par step.
function calculerPositions(ordreSteps) {
  const groupes = {};
  ordreSteps.forEach((entree) => {
    if (!groupes[entree.epoque]) groupes[entree.epoque] = [];
    groupes[entree.epoque].push(entree);
  });

  return ordreSteps.map((entree) => {
    const groupe = groupes[entree.epoque];
    const indexDansGroupe = groupe.indexOf(entree);
    const tailleGroupe = groupe.length;

    if (entree.epoque === "avant") {
      return indexDansGroupe * (80 / tailleGroupe);
    }
    if (entree.epoque === "rupture") {
      return 80;
    }
    return 80 + (indexDansGroupe + 1) * (15 / (tailleGroupe + 1));
  });
}

function estPremierAvant(index) {
  const entree = order[index];
  if (!entree || entree.epoque !== "avant") return false;
  return order.findIndex((e) => e.epoque === "avant") === index;
}

function construireRail() {
  railEl.innerHTML = "";

  const traitRupture = document.createElement("div");
  traitRupture.className = "trait-rupture";
  railEl.appendChild(traitRupture);

  const repereUnivers = document.createElement("div");
  repereUnivers.className = "repere-univers";
  repereUnivers.setAttribute("aria-hidden", "true");
  railEl.appendChild(repereUnivers);

  const repereValeurs = document.createElement("div");
  repereValeurs.className = "repere-valeurs";
  repereValeurs.setAttribute("aria-hidden", "true");
  railEl.appendChild(repereValeurs);

  const POSITION_RUPTURE = 80;  // doit correspondre à .trait-rupture (timeline.css)
  const POSITION_UNIVERS = 95;  // doit correspondre à .repere-univers (timeline.css)
  const POSITION_VALEURS = 100; // doit correspondre à .repere-valeurs (timeline.css)

  legendes = [
    { texte: "Colonisation", position: POSITION_RUPTURE },
    { texte: "Mémoire", position: POSITION_UNIVERS },
    { texte: "Aujourd'hui", position: POSITION_VALEURS },
  ].map(({ texte, position }) => {
    const el = document.createElement("span");
    el.className = "legende-orientation cachee";
    el.textContent = texte;
    el.style.left = `${position}%`;
    el.setAttribute("aria-hidden", "true");
    railEl.appendChild(el);
    return el;
  });

  curseurEl = document.createElement("div");
  curseurEl.className = "curseur";
  railEl.appendChild(curseurEl);

  railEl.addEventListener("click", (e) => {
    const rect = railEl.getBoundingClientRect();
    const pourcentage = ((e.clientX - rect.left) / rect.width) * 100;
    let plusProche = 0;
    let ecartMin = Infinity;
    positions.forEach((pos, i) => {
      const ecart = Math.abs(pos - pourcentage);
      if (ecart < ecartMin) {
        ecartMin = ecart;
        plusProche = i;
      }
    });
    arreterAutoplay();
    naviguer(plusProche);
  });
}

function positionnerCurseur(index) {
  curseurEl.style.transition = reduitMouvement() ? "none" : "";
  curseurEl.style.left = `${positions[index]}%`;
}

function mettreAJourLegendes(index) {
  const visible = estPremierAvant(index);
  legendes.forEach((el) => {
    el.classList.toggle("cachee", !visible);
    el.classList.toggle("visible", visible);
  });
}

function mettreAJourTitre(index, texteTitre) {
  const majTexte = () => {
    titreCompteurEl.textContent = `${index + 1} / ${order.length}`;
    titreTexteEl.textContent = texteTitre || "";
  };

  if (reduitMouvement()) {
    majTexte();
    return;
  }

  titreTexteEl.classList.add("transition-sortie");
  setTimeout(() => {
    majTexte();
    titreTexteEl.classList.remove("transition-sortie");
  }, DUREE_FONDU_MS);
}

function mettreAJourBoutons(index) {
  if (btnRetour) btnRetour.disabled = index === 0;
  if (btnRecule) btnRecule.disabled = index === 0;
  if (btnAvance) btnAvance.disabled = index === order.length - 1;
  if (btnPlay) btnPlay.disabled = index === order.length - 1 && !autoplayTimer;
}

// Navigation interne (clic rail, boutons, autoplay) : passe par le pont
// window.__scrollyAllerEtAfficher quand il existe (posé par script.js) pour
// que #texteStep reste synchronisé avec le rail/titre — sinon (avant que
// script.js ait posé le pont, ex. pendant la construction initiale) on
// retombe sur allerAuStep seul. Dette technique mineure assumée pour cette
// itération (voir CORRECTION 2, docs/REGISTRE.md 26 août).
function naviguer(index) {
  if (index < 0 || index >= order.length) return;
  if (window.__scrollyAllerEtAfficher) {
    window.__scrollyAllerEtAfficher(index);
  } else {
    allerAuStep(index);
  }
}

function demarrerAutoplay() {
  if (currentIndex >= order.length - 1) return;
  if (btnPlay) {
    btnPlay.textContent = "⏸";
    btnPlay.setAttribute("aria-label", "Mettre en pause");
  }
  autoplayTimer = setInterval(() => {
    if (currentIndex >= order.length - 1) {
      arreterAutoplay();
      return;
    }
    naviguer(currentIndex + 1);
  }, DUREE_AUTOPLAY_MS);
}

function arreterAutoplay() {
  if (autoplayTimer) {
    clearInterval(autoplayTimer);
    autoplayTimer = null;
  }
  if (btnPlay) {
    btnPlay.textContent = "▶";
    btnPlay.setAttribute("aria-label", "Lecture automatique");
  }
}

function brancherControles() {
  btnRetour = document.getElementById("btn-retour");
  btnRecule = document.getElementById("btn-recule");
  btnAvance = document.getElementById("btn-avance");
  btnPlay = document.getElementById("btn-play");

  if (btnRetour) {
    btnRetour.addEventListener("click", () => {
      arreterAutoplay();
      naviguer(0);
    });
  }
  if (btnRecule) {
    btnRecule.addEventListener("click", () => {
      arreterAutoplay();
      naviguer(currentIndex - 1);
    });
  }
  if (btnAvance) {
    btnAvance.addEventListener("click", () => {
      arreterAutoplay();
      naviguer(currentIndex + 1);
    });
  }
  if (btnPlay) {
    btnPlay.addEventListener("click", () => {
      if (autoplayTimer) {
        arreterAutoplay();
      } else {
        demarrerAutoplay();
      }
    });
  }
}

// Seule fonction que le reste du code doit appeler pour naviguer.
export function allerAuStep(index, texteTitre) {
  if (index < 0 || index >= order.length) return;
  currentIndex = index;
  goToStep(index);
  positionnerCurseur(index);
  mettreAJourLegendes(index);
  mettreAJourTitre(index, texteTitre);
  mettreAJourBoutons(index);
}

export function initTimelineRail(railContainer, titreContainer) {
  railEl = railContainer;
  titreCompteurEl = titreContainer.querySelector("#titre-compteur");
  titreTexteEl = titreContainer.querySelector("#titre-texte");

  order = getOrder();
  positions = calculerPositions(order);

  construireRail();
  brancherControles();

  // Pas d'appel à allerAuStep(0) ici : script.js appelle allerEtAfficher(0)
  // juste après avoir reçu cette API, et LUI seul connaît le vrai texte du
  // titre (via steps.json) — un appel ici afficherait un titre vide pour
  // une fraction de seconde avant d'être écrasé par le bon texte. Éviter
  // le double appel plutôt que de le laisser en redondance silencieuse.

  return { allerAuStep };
}
