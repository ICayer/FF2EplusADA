// ==================================================
// shared/js/i18n.js
// Moteur de traduction avec repli configurable par langue
//
// Rôle : Charger les dictionnaires de shared/data/i18n/, résoudre une clé
// dans la langue active, et retomber sur la langue de repli (voir
// fallbackByLanguage.json) si la clé n'existe pas dans la langue demandée.
// Dépend de : shared/data/fallbackByLanguage.json, shared/data/i18n/*.json
// Utilisé par : scrolly/js/script.js, univers/js/lune.js, univers/js/etoiles.js, index.html
//
// FF2EplusADA (scrollyFFADA2S v2)
// Isabel Cayer · Atelier Love & Code · 2026
// ==================================================

let currentLang = 'fr';
let fallbackMap = {};
let uiDictionary = {};

// À appeler une seule fois au démarrage de chaque partie (Partie 1, 2, 3)
export async function initI18n(defaultLang = 'fr') {
  const res = await fetch('/shared/data/fallbackByLanguage.json');
  fallbackMap = await res.json();
  await setLanguage(defaultLang);
}

// Change la langue active ET recharge le dictionnaire d'interface correspondant
export async function setLanguage(lang) {
  currentLang = lang;
  try {
    const res = await fetch(`/shared/data/i18n/${lang}.json`);
    uiDictionary = await res.json();
  } catch {
    uiDictionary = {}; // langue pas encore documentée — t() retombera sur la clé brute
  }
}

export function getLanguage() {
  return currentLang;
}

// Pour le chrome d'interface : t('nav.explorer') -> "Explorer"
export function t(key) {
  return uiDictionary[key] || key; // clé brute affichée si manquante = visible en dev, pas de crash
}

// Pour le contenu éditorial langue-clé : resolve(etoile.recit) -> le bon texte, avec repli
export function resolve(field) {
  if (typeof field === 'string') return field; // ex: un prénom, jamais traduit
  if (!field) return '';
  if (field[currentLang]) return field[currentLang];
  const fallbackLang = fallbackMap[currentLang] || 'fr';
  return field[fallbackLang] || field['fr'] || '';
}