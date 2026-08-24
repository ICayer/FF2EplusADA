// ==================================================
// univers/js/testimonyModal.js
// Modale d'affichage du récit d'une étoile (pattern show/hide)
//
// Rôle : Afficher/masquer le récit d'une femme au clic sur son étoile.
// Mise en page inspirée de serviceModal.js (projet "de la classe au territoire") :
// couleur injectée via variable CSS (--nation-color au lieu de --service-color),
// en-tête (photo, prénom, date de naissance, nation, communauté), corps (témoignage),
// pied de page (personne qui a recueilli le témoignage — structure à valider avec
// Déline, présente ici pour donner un aperçu du rendu visuel final).
//
// Le texte primaire est TOUJOURS dans la langue de la nation (pas la langue
// d'interface) — décision du 19 août : honorer chaque femme dans sa langue, peu
// importe la langue de navigation choisie. Une traduction secondaire suit la
// langue d'interface, seulement si elle diffère du texte primaire.
// Dépend de : shared/js/i18n.js (resolve)
// Utilisé par : univers/js/etoiles.js
//
// FF2EplusADA (scrollyFFADA2S v2)
// Isabel Cayer · Atelier Love & Code · 2026
// ==================================================

import { resolve } from "../../shared/js/i18n.js";

let overlayEl = null;
let modalEl = null;
let contentEl = null;
let dernierElementFocus = null; // pour redonner le focus à l'étoile après fermeture (accessibilité clavier)

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
  modalEl.setAttribute("aria-label", "Récit d'une femme honorée");
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

  const p = etoile?.portrait;
  const temoignage = p?.temoignage;
  if (!temoignage) return; // étoile vide par conception — pas d'action, pas d'erreur

  const langueNation = nation?.langue || null;
  const texteNation = langueNation ? temoignage[langueNation] : null;
  const texteInterface = resolve(temoignage);

  if (!texteNation && !texteInterface) return; // rien à montrer encore

  const afficherSecondaire = Boolean(texteNation) && Boolean(texteInterface) && texteNation !== texteInterface;

  // Couleur de la nation injectée comme variable CSS — même pattern que
  // --service-color dans serviceModal.js, appliqué à --nation-color ici.
  modalEl.style.setProperty("--nation-color", nation?.couleur || "#888");

  const meta = [p.dateNaissance, nation?.nom, p.communaute].filter(Boolean).join(" · ");

  contentEl.innerHTML = `
    <header class="tm-header">
      <div class="tm-photo">
        ${p.photo
          ? `<img src="${p.photo}" alt="" />`
          : `<div class="tm-photo-placeholder"></div>`}
      </div>
      <div class="tm-header-meta">
        <span class="tm-badge">${nation?.nom || ""}</span>
        <h1 class="tm-title">${p.prenom || ""}</h1>
        <p class="tm-meta">${meta}</p>
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
      ${p.redigePar
        ? `<span>Témoignage recueilli par ${p.redigePar}</span>`
        : `<span class="tm-footer-placeholder">Rédaction — à déterminer avec Déline</span>`}
    </footer>
  `;

  overlayEl.classList.add("open");
  modalEl.classList.add("open");
  document.body.style.overflow = "hidden";

  // Accessibilité clavier : mémorise l'élément actif (l'étoile cliquée) pour lui
  // redonner le focus à la fermeture, et déplace le focus dans la modale.
  dernierElementFocus = document.activeElement;
  modalEl.focus();
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