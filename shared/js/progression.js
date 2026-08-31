// ==================================================
// shared/js/progression.js
// Mémoire de progression à travers les 12 étapes du parcours
//
// Rôle : Mémoriser quelles étapes du parcours sont débloquées, de façon
// persistante via localStorage (l'état survit aux changements de page —
// chaque partie du site est un chargement de page complet, pas une SPA).
// L'ordre des étapes et leur nommage viennent d'une seule source de
// vérité : shared/data/parcours.json.
// Dépend de : shared/data/parcours.json
// Utilisé par : à déterminer (UI du rail à 12 boutons, à venir)
//
// FF2EplusADA (scrollyFFADA2S v2)
// Isabel Cayer · Atelier Love & Code · 2026
// ==================================================

const CLE_STOCKAGE = "ff2eplusada_progression";

// Remplis une seule fois par initProgression(). Les autres fonctions
// travaillent ensuite en synchrone sur ces deux tableaux — aucune ne
// refait de fetch ni de localStorage.getItem().
let parcours = []; // tableau d'objets chargé de parcours.json (ordre du parcours)
let etats = [];    // tableau de booléens, un par étape, même ordre que parcours

function chargerEtatSauvegarde() {
  const brut = localStorage.getItem(CLE_STOCKAGE);
  if (brut === null) return null;
  try {
    return JSON.parse(brut);
  } catch {
    return null;
  }
}

function sauvegarderEtat() {
  localStorage.setItem(CLE_STOCKAGE, JSON.stringify(etats));
}

// À appeler une seule fois au démarrage de chaque partie, avant tout
// autre appel de ce module.
export async function initProgression() {
  const res = await fetch("/shared/data/parcours.json");
  parcours = await res.json();

  const sauvegarde = chargerEtatSauvegarde();
  if (sauvegarde) {
    etats = sauvegarde;
  } else {
    // Aucun état sauvegardé : déblocage initial = seulement l'accueil
    // (index 0) et le 1er step du scrolly / nuit-des-temps (index 1).
    // Le reste se débloque progressivement via deverrouiller().
    etats = parcours.map((_, i) => i === 0 || i === 1);
    sauvegarderEtat();
  }
}

// Retrouve l'index de cet id dans le parcours chargé et retourne son
// état booléen (false si l'id est inconnu).
export function estDeverrouille(id) {
  const index = parcours.findIndex((etape) => etape.id === id);
  if (index === -1) return false;
  return etats[index] === true;
}

// Passe l'étape correspondante à « débloquée » et sauvegarde aussitôt.
export function deverrouiller(id) {
  const index = parcours.findIndex((etape) => etape.id === id);
  if (index === -1) return;
  etats[index] = true;
  sauvegarderEtat();
}

// Retourne le tableau chargé depuis parcours.json (utile pour construire
// l'UI du rail plus tard).
export function obtenirParcours() {
  return parcours;
}
