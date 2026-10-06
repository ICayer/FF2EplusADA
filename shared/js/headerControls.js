// ==================================================
// shared/js/headerControls.js
// Zone d'en-tête partagée — sélecteur de langue + taille de texte (A-/A/A+)
//
// Rôle : Construire et brancher les contrôles d'en-tête communs aux 4
// parties du site (langues filtrées par afficherDansMenu, échelle de texte à 3 niveaux). N'importe
// rien de scrolly/, univers/ ni valeurs/ — après un changement de langue,
// émet un événement DOM global "languagechange" pour que chaque partie se
// rafraîchisse elle-même (ce module ne sait pas quoi rafraîchir).
// Dépend de : shared/js/i18n.js, shared/js/preferences.js
// Utilisé par : scrolly/index.html (univers/, valeurs/, landing à venir)
//
// FF2EplusADA (scrollyFFADA2S v2)
// Isabel Cayer · Atelier Love & Code · 2026
// ==================================================

import { setLanguage, getLanguage } from "./i18n.js";
import { langueSauvegardee, sauvegarderLangue, echelleSauvegardee, sauvegarderEchelle } from "./preferences.js";

// Orthographe exacte : infographie officielle d'Isabel (voir Registre, 24 août).
// Codes alignés sur les clés de shared/data/fallbackByLanguage.json.
//
// afficherDansMenu — décision de gouvernance du 6 octobre : seuls le
// français et l'anglais sont offerts dans le menu. Les 11 langues
// autochtones restent listées ici (aucune suppression) mais ne sont pas
// proposées : ne pas créer de demande pour une langue tant que personne
// ne porte le projet dans cette langue. Pour réactiver une langue, passer
// son afficherDansMenu à true — son bouton réapparaît dans le menu et
// langueInitiale() accepte de nouveau la valeur mémorisée.
const LANGUES = [
  { code: "fr", nom: "Français", afficherDansMenu: true },
  { code: "en", nom: "English", afficherDansMenu: true },
  { code: "w8banaki", nom: "Aln8ba8dwaw8gan", afficherDansMenu: false },
  { code: "anishinaabe", nom: "Anishinaabemowin", afficherDansMenu: false },
  { code: "atikamekw", nom: "Atikamekw", afficherDansMenu: false },
  { code: "eeyou", nom: "Iiyiyuu ayimuun", afficherDansMenu: false },
  { code: "innu-aimun", nom: "Innu-aimun", afficherDansMenu: false },
  { code: "kanienkeha", nom: "Kanien'kéhà", afficherDansMenu: false },
  { code: "mikmaq", nom: "Migmaq/Mi'kmaq", afficherDansMenu: false },
  { code: "naskapi", nom: "Naskapi Iyuw-Iyimuun", afficherDansMenu: false },
  { code: "inuktitut", nom: "Inuktitut", afficherDansMenu: false },
  { code: "wendat", nom: "Wendat", afficherDansMenu: false },
  { code: "wolastoqiyik", nom: "Wolastoqey Latuwewakon", afficherDansMenu: false },
];

// Seules ces langues reçoivent un bouton — les masquées n'existent pas
// dans le DOM (donc ni visibles ni atteignables au clavier).
const LANGUES_MENU = LANGUES.filter((l) => l.afficherDansMenu);

// Langue à passer à initI18n() au chargement de chaque page. Si la langue
// mémorisée n'est pas offerte dans le menu (langue masquée ou valeur
// inconnue), on applique le français et on remplace la valeur mémorisée —
// sinon l'en-tête afficherait une langue absente du menu (navigateurs de
// test qui avaient choisi une langue autochtone avant le 6 octobre).
export function langueInitiale() {
  const memorisee = langueSauvegardee();
  if (memorisee === null) return "fr";
  if (LANGUES_MENU.some((l) => l.code === memorisee)) return memorisee;
  sauvegarderLangue("fr");
  return "fr";
}

// 3 niveaux (pas plus, voir Design doc) — aucune valeur de référence
// trouvée ailleurs au moment d'écrire ceci : proposées en cohérence avec
// une variation perceptible mais sobre, sans casser la lisibilité du
// titre de scène ni du texte narratif aux deux extrêmes. À ajuster à
// l'œil si besoin.
const ECHELLES_TEXTE = [
  { niveau: "A-", valeur: 0.85 },
  { niveau: "A", valeur: 1 },
  { niveau: "A+", valeur: 1.25 },
];

function construireBlocLangue() {
  const bloc = document.createElement("div");
  bloc.className = "bloc-langue";

  const boutonLangue = document.createElement("button");
  boutonLangue.type = "button";
  boutonLangue.className = "bouton-langue";
  boutonLangue.setAttribute("aria-haspopup", "true");
  boutonLangue.setAttribute("aria-expanded", "false");

  const langueActuelle = LANGUES_MENU.find((l) => l.code === getLanguage()) || LANGUES_MENU[0];
  boutonLangue.innerHTML = `${langueActuelle.nom} <span aria-hidden="true">▾</span>`;

  const panneau = document.createElement("div");
  panneau.className = "panneau-langue cachee";

  function ouvrirPanneau() {
    panneau.classList.remove("cachee");
    boutonLangue.setAttribute("aria-expanded", "true");
  }
  function fermerPanneau() {
    panneau.classList.add("cachee");
    boutonLangue.setAttribute("aria-expanded", "false");
  }

  const boutonsLangue = LANGUES_MENU.map(({ code, nom }) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "langue-item";
    item.textContent = nom;
    item.dataset.lang = code;
    if (code === langueActuelle.code) item.classList.add("active");
    item.addEventListener("click", async () => {
      await setLanguage(code);
      sauvegarderLangue(code);
      window.dispatchEvent(new CustomEvent("languagechange", { detail: { lang: code } }));
      boutonLangue.innerHTML = `${nom} <span aria-hidden="true">▾</span>`;
      boutonsLangue.forEach((b) => b.classList.toggle("active", b === item));
      fermerPanneau();
    });
    panneau.appendChild(item);
    return item;
  });

  boutonLangue.addEventListener("click", () => {
    const estOuvert = boutonLangue.getAttribute("aria-expanded") === "true";
    if (estOuvert) fermerPanneau();
    else ouvrirPanneau();
  });

  document.addEventListener("click", (e) => {
    if (!bloc.contains(e.target)) fermerPanneau();
  });

  bloc.appendChild(boutonLangue);
  bloc.appendChild(panneau);
  return bloc;
}

function construireControleTailleTexte() {
  const bloc = document.createElement("div");
  bloc.className = "controle-taille-texte";
  bloc.setAttribute("role", "group");
  bloc.setAttribute("aria-label", "Taille du texte");

  // Appliquer la taille sauvegardée dès la construction (jeton CSS =
  // application instantanée, pas de flash) et en déduire le bouton actif.
  const echelleRestauree = echelleSauvegardee();
  if (echelleRestauree !== null) {
    document.documentElement.style.setProperty("--echelle-texte", echelleRestauree);
  }

  const boutons = ECHELLES_TEXTE.map(({ niveau, valeur }) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = niveau;
    btn.setAttribute("aria-label", `Taille du texte : ${niveau}`);
    const estActif = echelleRestauree !== null ? echelleRestauree === valeur : valeur === 1;
    if (estActif) btn.classList.add("active");
    btn.addEventListener("click", () => {
      document.documentElement.style.setProperty("--echelle-texte", valeur);
      sauvegarderEchelle(valeur);
      boutons.forEach((b) => b.classList.toggle("active", b === btn));
    });
    bloc.appendChild(btn);
    return btn;
  });

  return bloc;
}

export function initHeaderControls(container) {
  if (!container) return;
  container.classList.add("entete-controles");
  container.appendChild(construireBlocLangue());
  container.appendChild(construireControleTailleTexte());
}
