// ==================================================
// scrolly/js/timelineRail.js
// Rail de navigation temporelle (bas de scène)
//
// Rôle : Construire le DOM du rail à partir de getOrder() (timeline.js),
// gérer le positionnement du curseur, le clic direct (snap au step le
// plus proche), les boutons de navigation (recule/avance SEULEMENT —
// retour et lecture automatique retirés, trop de contrôles pour le
// public cible, voir Registre persona), l'affichage conditionnel des
// légendes d'orientation, et la mise à jour du bloc-titre en haut-gauche
// de la scène (#titre-scene). allerAuStep() est la SEULE fonction que le
// reste du code doit appeler pour naviguer — jamais goToStep() de
// timeline.js directement depuis l'extérieur de ce module.
// Dépend de : scrolly/js/timeline.js, scrolly/js/steps/avantColonisation.js,
// shared/js/navigationEtat.js (logique générique thème + bloc-titre)
// Utilisé par : scrolly/js/script.js
//
// FF2EplusADA (scrollyFFADA2S v2)
// Isabel Cayer · Atelier Love & Code · 2026
// ==================================================

import { goToStep, getOrder } from "./timeline.js";
import { masquerSceneComplete } from "./steps/avantColonisation.js";
import { appliquerTheme, reduitMouvement as reduitMouvementPartage, mettreAJourTitreScene } from "../../shared/js/navigationEtat.js";

const DUREE_FONDU_MS = 200;

let order = [];
let positions = [];
let currentIndex = 0;

let railEl = null;
let curseurEl = null;
let titreCompteurEl = null;
let titreTexteEl = null;
let legendes = [];
let btnRecule = null;
let btnAvance = null;

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

  curseurEl = document.createElement("img");
  curseurEl.className = "curseur";
  curseurEl.src = "./svg/timeline/plume.svg";
  curseurEl.alt = "";
  curseurEl.setAttribute("aria-hidden", "true");
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
    naviguer(plusProche);
  });
}

function positionnerCurseur(index) {
  curseurEl.style.transition = reduitMouvementPartage() ? "none" : "";
  curseurEl.style.left = `${positions[index]}%`;
}

function mettreAJourLegendes(index) {
  const visible = estPremierAvant(index);
  legendes.forEach((el) => {
    el.classList.toggle("cachee", !visible);
    el.classList.toggle("visible", visible);
  });
}

function mettreAJourBoutons(index) {
  if (btnRecule) btnRecule.disabled = index === 0;
  if (btnAvance) btnAvance.disabled = index === order.length - 1;
}

// Navigation interne (clic rail, boutons) : passe par le pont
// window.__scrollyAllerEtAfficher quand il existe (posé par script.js) pour
// que #texteStep reste synchronisé avec le rail/titre — sinon (avant que
// script.js ait posé le pont, ex. pendant la construction initiale) on
// retombe sur allerAuStep seul. Dette technique mineure assumée pour cette
// itération (voir Registre, 26 août).
function naviguer(index) {
  if (index < 0 || index >= order.length) return;
  if (window.__scrollyAllerEtAfficher) {
    window.__scrollyAllerEtAfficher(index);
  } else {
    allerAuStep(index);
  }
}

function brancherControles() {
  btnRecule = document.getElementById("btn-recule");
  btnAvance = document.getElementById("btn-avance");

  if (btnRecule) {
    btnRecule.addEventListener("click", () => naviguer(currentIndex - 1));
  }
  if (btnAvance) {
    btnAvance.addEventListener("click", () => naviguer(currentIndex + 1));
  }
}

// Seule fonction que le reste du code doit appeler pour naviguer.
export function allerAuStep(index, texteTitre) {
  if (index < 0 || index >= order.length) return;
  currentIndex = index;
  const epoqueActuelle = order[index]?.epoque;
  appliquerTheme(epoqueActuelle);

  goToStep(index);

  if (epoqueActuelle === "apres") {
    // Nettoyage APRÈS goToStep(), pas avant : goToStep() vient d'appeler
    // le hide() du step qu'on quitte, qui peut réappliquer un état interne
    // (ex. hideRuptureColoniale remet la phrase au texte de C, correct
    // pour un recul E→D) — un nettoyage fait plus tôt serait aussitôt
    // écrasé. On quitte tout le domaine avant-colonisation : cacher son
    // conteneur au complet (calques internes ET overlays HTML).
    masquerSceneComplete();
    document.getElementById("phrase-progressive")?.classList.remove("aligne-gauche", "aligne-centre");
    document.getElementById("sous-titre-rupture")?.classList.remove("visible");
    document.getElementById("carte-valeur")?.classList.remove("visible");
  }

  positionnerCurseur(index);
  mettreAJourLegendes(index);
  mettreAJourTitreScene(titreCompteurEl, titreTexteEl, index, order.length, texteTitre, DUREE_FONDU_MS);
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
  // juste après avoir reçu cette API — voir script.js pour la raison.

  return { allerAuStep };
}
