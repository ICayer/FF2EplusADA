// ==================================================
// shared/js/preferences.js
// Mémoire des préférences d'affichage (langue, taille de texte)
//
// Rôle : Persister le choix de langue et de taille de texte (A-/A+) à
// travers tout le site, via localStorage — même principe que
// progression.js, sur des données différentes. Chaque page lit la langue
// sauvegardée dans son propre initI18n() ; headerControls.js lit et
// applique l'échelle de texte au chargement et sauvegarde chaque nouveau
// choix.
// Dépend de : aucun
// Utilisé par : shared/js/headerControls.js, scrolly/js/script.js,
// univers/js/etoiles.js, valeurs/js/valeursAnimation.js
//
// FF2EplusADA (scrollyFFADA2S v2)
// Isabel Cayer · Atelier Love & Code · 2026
// ==================================================

const CLE_LANGUE = "ff2eplusada_langue";
const CLE_ECHELLE = "ff2eplusada_echelle_texte";

export function langueSauvegardee() {
  return localStorage.getItem(CLE_LANGUE); // null si jamais choisie
}

export function sauvegarderLangue(code) {
  localStorage.setItem(CLE_LANGUE, code);
}

export function echelleSauvegardee() {
  const val = localStorage.getItem(CLE_ECHELLE);
  return val ? parseFloat(val) : null; // null si jamais choisie
}

export function sauvegarderEchelle(valeur) {
  localStorage.setItem(CLE_ECHELLE, String(valeur));
}
