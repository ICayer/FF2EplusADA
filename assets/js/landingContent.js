// ==================================================
// assets/js/landingContent.js
// Landing — peuplement du contenu réel (FR/EN) via resolve()
//
// Rôle : Remplir titre, sous-titre, intro, bouton, remerciements et
// crédits de la page d'accueil à partir de shared/data/landing.json, dans
// la langue active (même patron resolve() que scrolly/data/steps.json et
// shared/data/valeurs.json). Se rafraîchit si la langue change en cours
// de visite.
// Dépend de : shared/js/i18n.js (resolve), shared/data/landing.json
// Utilisé par : index.html (racine)
//
// FF2EplusADA (scrollyFFADA2S v2)
// Isabel Cayer · Atelier Love & Code · 2026
// ==================================================

import { resolve } from "../../shared/js/i18n.js";

let donneesLanding = null; // landing.json mis en cache après le 1er fetch

function creerParagraphes(texte) {
  const conteneur = document.createDocumentFragment();
  texte.split("\n\n").forEach((bloc) => {
    const p = document.createElement("p");
    p.textContent = bloc;
    conteneur.appendChild(p);
  });
  return conteneur;
}

// Rend le contenu depuis `donneesLanding` dans la langue active. Sûr à
// rappeler (vide chaque zone avant de la remplir) — appelé au chargement
// et à chaque "languagechange".
function rendre() {
  const data = donneesLanding;
  if (!data) return;

  document.querySelector(".home-header h1").textContent = resolve(data.titre);
  document.querySelector(".home-header .subtitle").textContent = resolve(data.sousTitre);

  const intro = document.querySelector(".context-section");
  intro.innerHTML = "";
  intro.appendChild(creerParagraphes(resolve(data.intro)));

  document.querySelector(".entry-btn").textContent = resolve(data.boutonEntree);

  document.querySelector(".thanks-section h3").textContent = resolve(data.remerciementsTitre);

  const remerciements = document.querySelector(".thanks-section .remerciements-texte");
  remerciements.innerHTML = "";
  remerciements.appendChild(creerParagraphes(resolve(data.remerciementsTexte)));

  const listeCredits = document.querySelector(".credits-liste");
  listeCredits.innerHTML = "";
  const titreCredits = document.createElement("h4");
  titreCredits.textContent = resolve(data.credits.titre);
  listeCredits.appendChild(titreCredits);
  const ul = document.createElement("ul");
  data.credits.personnes.forEach((personne) => {
    const li = document.createElement("li");
    li.textContent = resolve(personne);
    ul.appendChild(li);
  });
  listeCredits.appendChild(ul);
}

export async function initLandingContent() {
  if (!donneesLanding) {
    const reponse = await fetch("./shared/data/landing.json");
    donneesLanding = await reponse.json();
  }
  rendre();
}

// Rafraîchit le contenu si la langue change en cours de visite — même
// patron que univers/js/etoiles.js et valeurs/js/valeursAnimation.js :
// écouteur sur `window` (c'est là que headerControls.js dispatche
// "languagechange"), enregistré UNE SEULE FOIS au chargement du module
// (pas à l'intérieur de initLandingContent(), sinon les écouteurs
// s'empilent à chaque changement de langue).
window.addEventListener("languagechange", rendre);
