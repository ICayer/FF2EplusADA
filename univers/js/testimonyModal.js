// ==================================================
// univers/js/testimonyModal.js
// Modale d'affichage du récit d'une étoile (pattern show/hide)
//
// Rôle : Afficher/masquer le récit d'une femme au clic sur son étoile.
// Mise en page inspirée de serviceModal.js (projet "de la classe au territoire") :
// couleur injectée via variable CSS (--nation-color au lieu de --service-color),
// en-tête (photo, vignette « nation de communauté », titre « prénom, né·e en
// année » — segments construits par presentationPersonne.js, comme l'infobulle
// des étoiles), corps (témoignage),
// pied de page (personne qui a recueilli le témoignage — structure à valider avec
// Déline, présente ici pour donner un aperçu du rendu visuel final).
//
// Le texte primaire est TOUJOURS dans la langue de la nation (pas la langue
// d'interface) — décision du 19 août : honorer chaque femme dans sa langue, peu
// importe la langue de navigation choisie. Une traduction secondaire suit la
// langue d'interface, seulement si elle diffère du texte primaire.
// SUSPENDU le 6 octobre (voir AFFICHER_TEXTE_LANGUE_NATION ci-dessous).
// Dépend de : shared/js/i18n.js (resolve, t), univers/js/presentationPersonne.js
// Utilisé par : univers/js/etoiles.js
//
// FF2EplusADA (scrollyFFADA2S v2)
// Isabel Cayer · Atelier Love & Code · 2026
// ==================================================

import { resolve, t } from "../../shared/js/i18n.js";
import { valeursPersonne, cleGabarit, rendreGabarit, hexVersRgb, couleurTexteLisible } from "./presentationPersonne.js";

// Décision du 6 octobre : le texte dans la langue de la nation (et son
// étiquette de langue) est masqué pour l'instant — suspend la décision du
// Registre du 21 août. À false, la modale n'affiche que le témoignage dans
// la langue d'interface (resolve()). Pour réactiver l'affichage bilingue,
// passer à true : tout le code ci-dessous est conservé tel quel.
const AFFICHER_TEXTE_LANGUE_NATION = false;

let overlayEl = null;
let modalEl = null;
let contentEl = null;
let dernierElementFocus = null; // pour redonner le focus à l'étoile après fermeture (accessibilité clavier)
let etoileAffichee = null; // étoile + nation de la modale ouverte — pour la
let nationAffichee = null; // retraduire si la langue change pendant la lecture

export function initTestimonyModal(selecteurConteneur = "#univers-canvas") {
  const parent = document.querySelector(selecteurConteneur);
  if (!parent) {
    console.error(`❌ Conteneur introuvable pour la modale : ${selecteurConteneur}`);
    return;
  }

  overlayEl = document.createElement("div");
  overlayEl.id = "testimony-overlay";
  overlayEl.addEventListener("click", hideTestimony);

  modalEl = document.createElement("div");
  modalEl.id = "testimony-modal";
  modalEl.setAttribute("role", "dialog");
  modalEl.setAttribute("aria-modal", "true");
  // Nom accessible = le titre « Sindy, né·e en 1970 » (h1#tm-titre), dans la
  // langue choisie — remplace l'aria-label fixe en français.
  modalEl.setAttribute("aria-labelledby", "tm-titre");
  modalEl.setAttribute("tabindex", "-1"); // permet de recevoir le focus au clavier à l'ouverture

  const closeBtn = document.createElement("button");
  closeBtn.id = "testimony-modal-close";
  closeBtn.setAttribute("aria-label", "Fermer");
  closeBtn.textContent = "✕";
  closeBtn.addEventListener("click", hideTestimony);
  modalEl.appendChild(closeBtn);

  contentEl = document.createElement("div");
  contentEl.id = "testimony-modal-content";
  modalEl.appendChild(contentEl);

  parent.appendChild(overlayEl);
  parent.appendChild(modalEl);

  // Accessibilité clavier : Échap ferme la modale, peu importe où est le focus
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalEl.classList.contains("open")) hideTestimony();
  });

  // Changement de langue avec la modale ouverte : tout se retraduit sur
  // place (vignette, titre, témoignage, pied de page), sans déplacer le focus.
  window.addEventListener("languagechange", () => {
    if (modalEl.classList.contains("open") && etoileAffichee) {
      rendreModale(etoileAffichee, nationAffichee);
    }
  });
}

/**
 * @param {object} etoile - une entrée de etoiles.json
 * @param {object} nation - l'entrée correspondante de nations.json
 */
export function showTestimony(etoile, nation) {
  if (!modalEl) {
    console.warn("⚠️ testimonyModal non initialisée — appeler initTestimonyModal() d'abord");
    return;
  }

  if (!rendreModale(etoile, nation)) return; // rien à montrer — pas d'action, pas d'erreur

  overlayEl.classList.add("open");
  modalEl.classList.add("open");
  document.body.style.overflow = "hidden";

  // Accessibilité clavier : mémorise l'élément actif (l'étoile cliquée) pour lui
  // redonner le focus à la fermeture, et déplace le focus dans la modale.
  dernierElementFocus = document.activeElement;
  modalEl.focus();
}

// Construit le contenu de la modale dans la langue active. Retourne false
// s'il n'y a rien à montrer. Appelée à l'ouverture ET au changement de langue.
function rendreModale(etoile, nation) {
  const p = etoile?.portrait;
  const temoignage = p?.temoignage;
  if (!temoignage) return false; // étoile vide par conception

  const langueNation = AFFICHER_TEXTE_LANGUE_NATION ? (nation?.langue || null) : null;
  const texteNation = langueNation ? temoignage[langueNation] : null;
  const texteInterface = resolve(temoignage);

  if (!texteNation && !texteInterface) return false; // rien à montrer encore

  const afficherSecondaire = Boolean(texteNation) && Boolean(texteInterface) && texteNation !== texteInterface;

  // Couleur de la nation injectée comme variable CSS — même pattern que
  // --service-color dans serviceModal.js, appliqué à --nation-color ici.
  // Texte de la vignette : noir ou blanc selon le meilleur contraste WCAG.
  const couleurNation = hexVersRgb(nation?.couleur) ? nation.couleur : "#888888";
  modalEl.style.setProperty("--nation-color", couleurNation);
  modalEl.style.setProperty("--nation-texte", couleurTexteLisible(couleurNation).couleur);

  // Vignette « Anishinaabe de Pikugan » (nation Inconnue → communauté seule ;
  // ni nation ni communauté → pas de vignette) et titre « Sindy, né·e en
  // 1970 » (année absente → prénom seul) : mêmes segments que l'infobulle,
  // valeurs échappées (presentationPersonne.js).
  const { presents, html } = valeursPersonne(p, nation);
  const vignette = presents.N || presents.C
    ? rendreGabarit(t(cleGabarit("modale.vignette", "NC", presents)), html)
    : "";
  const titre = rendreGabarit(t(cleGabarit("modale.titre", "A", presents)), html);

  contentEl.innerHTML = `
    <header class="tm-header">
      <div class="tm-photo">
        ${p.photo
          ? `<img src="${p.photo}" alt="" />`
          : `<div class="tm-photo-placeholder"></div>`}
      </div>
      <div class="tm-header-meta">
        ${vignette ? `<span class="tm-badge">${vignette}</span>` : ""}
        <h1 class="tm-title" id="tm-titre">${titre}</h1>
      </div>
    </header>

    <main class="tm-body">
      <section class="tm-section tm-section--primaire">
        <p>${texteNation || texteInterface}</p>
        ${langueNation ? `<p class="tm-langue-label">${langueNation}</p>` : ""}
      </section>

      ${afficherSecondaire ? `
      <section class="tm-section tm-section--secondaire">
        <div class="tm-sep"></div>
        <p>${texteInterface}</p>
      </section>` : ""}
    </main>

    <footer class="tm-footer">
      ${resolve(p.redigePar)
        ? `<span>${t("modale.temoignageDe")} ${resolve(p.redigePar)}</span>`
        : `<span class="tm-footer-placeholder">Rédaction — à déterminer avec Déline</span>`}
    </footer>
  `;

  etoileAffichee = etoile;
  nationAffichee = nation;
  return true;
}

export function hideTestimony() {
  if (!modalEl) return;
  overlayEl.classList.remove("open");
  modalEl.classList.remove("open");
  document.body.style.overflow = "";

  if (dernierElementFocus && typeof dernierElementFocus.focus === "function") {
    dernierElementFocus.focus();
  }
}