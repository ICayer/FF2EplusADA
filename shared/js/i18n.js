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