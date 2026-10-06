// ==================================================
// univers/js/presentationPersonne.js
// Présentation d'une personne honorée : segments de phrase + contraste
//
// Rôle : Source unique pour (1) la construction des segments qui présentent
// une personne — nation (nomPersonne, sinon nom), « de / d' » communauté,
// « né·e en » année — à partir de gabarits de shared/data/i18n/{lang}.json,
// et (2) les fonctions de contraste WCAG qui choisissent une couleur de
// texte lisible sur la couleur d'une nation. Partagé par l'infobulle des
// étoiles et la modale de témoignage, pour qu'elles ne divergent jamais.
// Dépend de : shared/js/i18n.js (t, resolve)
// Utilisé par : univers/js/etoiles.js, univers/js/testimonyModal.js
//
// FF2EplusADA (scrollyFFADA2S v2)
// Isabel Cayer · Atelier Love & Code · 2026
// ==================================================

import { t, resolve } from "../../shared/js/i18n.js";

// Échappe une valeur venant des données avant de l'insérer en innerHTML —
// le texte s'affiche tel quel, aucune balise n'est interprétée.
export function echapperHtml(texte) {
  return String(texte)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// --- Segments de présentation ---

// Nom de nation à afficher pour UNE personne : nomPersonne (forme au
// singulier, ex. Inuk — optionnel) sinon nom de la nation. Nation
// « Inconnue » ou absente : "" (segment omis).
export function nomNationAffiche(nation) {
  if (!nation || nation.id === "inconnue") return "";
  return resolve(nation.nomPersonne) || nation.nom || "";
}

// Valeurs d'une personne prêtes pour un gabarit : HTML échappé (prénom en
// <strong>), plus les lettres des segments présents — N = nation,
// C = communauté, A = année — qui choisissent la variante du gabarit.
export function valeursPersonne(portrait, nation) {
  const nomNation = nomNationAffiche(nation);
  const communaute = portrait.communaute || "";
  const annee = portrait.dateNaissance || "";
  // Élision : « d'Uashat » — voyelle, accentuée comprise (NFD sépare l'accent)
  const commenceParVoyelle = /^[aeiouy]/i.test(communaute.normalize("NFD"));

  return {
    presents: { N: Boolean(nomNation), C: Boolean(communaute), A: Boolean(annee) },
    html: {
      prenom: `<strong>${echapperHtml(portrait.prenom || "")}</strong>`,
      nation: echapperHtml(nomNation),
      de: echapperHtml(t(commenceParVoyelle ? "personne.deVoyelle" : "personne.de")),
      communaute: echapperHtml(communaute),
      annee: echapperHtml(annee)
    }
  };
}

// Clé de gabarit selon les segments présents parmi `lettres` :
// cleGabarit("infobulle.phrase", "NCA", presents) → "infobulle.phrase_NC"
// si l'année manque ; → "infobulle.phrase" si aucun n'est présent.
export function cleGabarit(base, lettres, presents) {
  const suffixe = [...lettres].filter(l => presents[l]).join("");
  return suffixe ? `${base}_${suffixe}` : base;
}

// Remplit un gabarit avec des valeurs HTML, sans coupure à l'intérieur d'un
// segment. Le gabarit est découpé en segments aux virgules (« Gladys, » /
// « Anishinaabe de Kitigan Zibi, » / « né·e en 1940 ») : chacun est un bloc
// insécable (.segment-phrase) et le retour à la ligne ne tombe qu'entre deux
// segments. Dans un segment, les unités (« Anishinaabe » / « de Kitigan
// Zibi ») — séparées dans le gabarit par une espace entre deux {clés} — sont
// elles aussi insécables (.unite-phrase) : si un segment entier dépasse la
// largeur disponible, il se coupe seulement entre ses unités, jamais dans
// « d'Uashat mak Mani-Utenam ». CSS : univers/css/style.css.
export function rendreGabarit(gabarit, valeursHtml) {
  const remplir = (morceau) =>
    morceau.replace(/\{(\w+)\}/g, (brut, cle) => (cle in valeursHtml ? valeursHtml[cle] : brut));
  const segments = gabarit.split(", ");
  return segments.map((segment, i) => {
    const unites = segment.replace(/\} \{/g, "}\u0000{").split("\u0000")
      .map(unite => `<span class="unite-phrase">${remplir(unite)}</span>`);
    const virgule = i < segments.length - 1 ? "," : "";
    return `<span class="segment-phrase">${unites.join(" ")}${virgule}</span>`;
  }).join(" ");
}

// --- Contraste (WCAG 2.x) ---
// Le texte posé sur la couleur d'une nation est noir ou blanc selon le
// meilleur contraste — calculé, jamais choisi à la main.
export const NOIR_SITE = "#0d0d0d"; // --color-bg (shared/css/variables.css)
export const BLANC = "#ffffff";

// "#FFB74D" ou "#FB4" → [r, g, b] (0-255), ou null si le format est inconnu.
export function hexVersRgb(hex) {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(hex || "").trim());
  if (!m) return null;
  const h = m[1].length === 3 ? m[1].replace(/./g, c => c + c) : m[1];
  return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16));
}

// Luminance relative WCAG 2.x (0 = noir, 1 = blanc).
export function luminanceRelative([r, g, b]) {
  const lin = c => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

// Ratio de contraste WCAG entre deux couleurs [r, g, b] (de 1 à 21).
export function ratioContraste(a, b) {
  const [claire, foncee] = [luminanceRelative(a), luminanceRelative(b)].sort((x, y) => y - x);
  return (claire + 0.05) / (foncee + 0.05);
}

// Couleur de texte la plus lisible sur `fond` : compare le noir du site et
// le blanc, garde celui qui donne le meilleur ratio WCAG.
export function couleurTexteLisible(fond) {
  const rgb = hexVersRgb(fond);
  const surNoir = ratioContraste(rgb, hexVersRgb(NOIR_SITE));
  const surBlanc = ratioContraste(rgb, hexVersRgb(BLANC));
  return surNoir >= surBlanc
    ? { couleur: NOIR_SITE, ratio: surNoir }
    : { couleur: BLANC, ratio: surBlanc };
}

// Assombrit une couleur hexadécimale (facteur 0.8 = 20 % plus sombre).
export function assombrir(hex, facteur) {
  const rgb = hexVersRgb(hex);
  return "#" + rgb.map(c => Math.round(c * facteur).toString(16).padStart(2, "0")).join("");
}

// Contour net sur un fond donné : la couleur assombrie juste assez pour un
// ratio ≥ 3:1 (WCAG 1.4.11, contour d'un composant). Les couleurs pastel
// (ex. Atikamekw #FFE082) demandent plus d'assombrissement que les plus
// soutenues.
const CONTRASTE_MIN_BORDURE = 3;
export function bordureNette(couleur, fondRgb) {
  let facteur = 0.85;
  while (facteur > 0.3 && ratioContraste(hexVersRgb(assombrir(couleur, facteur)), fondRgb) < CONTRASTE_MIN_BORDURE) {
    facteur -= 0.05;
  }
  return assombrir(couleur, facteur);
}
