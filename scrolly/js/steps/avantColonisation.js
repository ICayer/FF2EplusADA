// ==================================================
// scrolly/js/steps/avantColonisation.js
// Steps A à E — scène cumulative "avant la colonisation"
//
// Rôle : Gérer les 5 points de contrôle A (nuit-des-temps), B
// (lien-communaute), C (lien-territoire), D (lien-valeurs) et E
// (rupture-coloniale), qui ne sont PAS 5 steps indépendants mais 5
// moments d'UNE seule scène cumulative chargée depuis scrolly.svg. Sauf
// pour les 9 cercles de valeurs (D) et les 5 barres (E), un calque une
// fois révélé (spirale, communauté, territoire, perles) reste affiché en
// continu même en naviguant vers un step antérieur — les hide() de
// A/B/C sont donc volontairement vides.
// Dépend de : shared/js/utils.js (loadSVG), shared/js/i18n.js (resolve),
// shared/data/valeurs.json, scrolly/data/steps.json (phrases progressives
// traduites : phraseProgressive / sousTitreRupture)
// Utilisé par : scrolly/js/stepsRegistry.js
//
// FF2EplusADA (scrollyFFADA2S v2)
// Isabel Cayer · Atelier Love & Code · 2026
// ==================================================

import { loadSVG } from "../../../shared/js/utils.js";
import { resolve, getLanguage } from "../../../shared/js/i18n.js";
import { reduitMouvement } from "../../../shared/js/navigationEtat.js";

let container = null;
let timelineActuelle = null; // une seule à la fois, kill() au début de chaque show

// Suivi des calques à révélation UNIQUE — jamais réanimés une fois vrai.
// D (cercles) et E (barres) n'utilisent PAS ce mécanisme : ils basculent
// vraiment visible/invisible à chaque entrée/sortie.
const revele = { spirale: false, communaute: false, territoire: false };

const ORDRE_CALQUES = { spirale: 0, communaute: 1, territoire: 2 };

// Garantit que les calques persistants AVANT `jusquExclu` sont révélés —
// instantanément, sans animation, puisqu'on ne raconte pas ces steps-là
// en ce moment. Ne touche JAMAIS au calque correspondant à `jusquExclu`
// lui-même — chaque step garde son propre traitement minuté pour son
// propre calque. jusquExclu vaut "communaute" | "territoire" | "valeurs"
// | "barres" (les 2 derniers = garantir jusqu'à territoire inclus).
function assurerCalquesAvant(jusquExclu) {
  if (!container) return;
  const limite = ORDRE_CALQUES[jusquExclu] ?? 3;

  if (limite > 0 && !revele.spirale) {
    const el = container.querySelector("#spirale");
    if (el) gsap.set(el, { opacity: 1 });
    revele.spirale = true;
  }
  if (limite > 1 && !revele.communaute) {
    const el = container.querySelector("#communaute");
    if (el) gsap.set(el, { opacity: 1 });
    revele.communaute = true;
  }
  if (limite > 2 && !revele.territoire) {
    const el = container.querySelector("#territoire");
    if (el) gsap.set(el, { opacity: 1 });
    for (let i = 1; i <= 5; i++) {
      const groupePerles = container.querySelector(`#perles${i}`);
      if (groupePerles) gsap.set(groupePerles.querySelectorAll("path"), { opacity: 1 });
    }
    revele.territoire = true;
    definirPhrase(phraseProgressive("lien-territoire"), "gauche");
  }
}

let valeurs = []; // chargé une fois depuis shared/data/valeurs.json
let groupeCercles = null;

// scrolly/data/steps.json — pour les phrases progressives traduites. Le
// fetch est lancé dès le chargement du module (concurremment à l'init de
// script.js, qui charge le même fichier), donc stepsData est en pratique
// déjà prêt quand la 1re animation de step joue (délai +=3 s de la
// timeline). chargerStepsData() n'attend alors qu'une promesse résolue
// (microtâche) — n'élargit pas la fenêtre de course GSAP (§3.1).
let stepsData = null;
const stepsDataPromise = fetch("/scrolly/data/steps.json")
  .then((r) => r.json())
  .catch((err) => {
    console.error("❌ Impossible de charger scrolly/data/steps.json", err);
    return {}; // phraseProgressive()/sousTitreRupture() retomberont sur '' — pas de plantage
  });
stepsDataPromise.then((d) => { stepsData = d; });
async function chargerStepsData() {
  if (!stepsData) stepsData = await stepsDataPromise;
}

// Phrase progressive / sous-titre d'un step dans la langue active (repli
// fr via resolve). Lecture SYNCHRONE de stepsData : chaque show...() fait
// `await chargerStepsData()` juste après assurerContainer(), donc
// stepsData est déjà là quand ces helpers sont appelés — y compris depuis
// assurerCalquesAvant() et hideRuptureColoniale(), qui restent synchrones
// (stepsData a forcément été chargé au premier passage sur B/C/D/E).
function phraseProgressive(stepId) {
  return resolve(stepsData?.[stepId]?.phraseProgressive);
}
function sousTitreRupture() {
  return resolve(stepsData?.["rupture-coloniale"]?.sousTitreRupture);
}

async function assurerContainer() {
  if (!container) {
    container = await loadSVG("./svg/avant-colonisation/scrolly.svg", "avantColonisationSVG", "graphic");
    if (!container) {
      console.error("❌ Impossible de charger le SVG avant-colonisation");
      return null;
    }

    const groupesAReveler = ["#territoire", "#communaute", "#spirale", "#barre1", "#barre2", "#barre3", "#barre4", "#barre5"];
    groupesAReveler.forEach((sel) => {
      const el = container.querySelector(sel);
      if (el) gsap.set(el, { opacity: 0, display: "block", visibility: "visible" });
    });

    // Les perles : le GROUPE reste opacity:1 (sinon l'opacité du parent à 0
    // multiplierait celle des enfants, aucune vague ne serait visible) — ce
    // sont les <path> enfants, individuellement, qui démarrent invisibles.
    for (let i = 1; i <= 5; i++) {
      const groupePerles = container.querySelector(`#perles${i}`);
      if (groupePerles) {
        gsap.set(groupePerles, { opacity: 1, display: "block", visibility: "visible" });
        gsap.set(groupePerles.querySelectorAll("path"), { opacity: 0 });
      }
    }
  }

  // Tue un éventuel fondu de sortie encore en cours (masquerSceneComplete()
  // avec prefers-reduced-motion off) : sans ça, un aller-retour rapide
  // E→F→E laisse le tween d'opacité reprendre le dessus juste après ce
  // gsap.set et son onComplete finit par remettre display:none sur une
  // scène qu'on vient pourtant de rouvrir.
  gsap.killTweensOf(container);
  gsap.set(container, { opacity: 1, display: "block", pointerEvents: "auto" });
  return container;
}

async function chargerValeurs() {
  if (valeurs.length === 0) {
    valeurs = await fetch("/shared/data/valeurs.json").then((r) => r.json());
  }
}

function definirPhrase(texte, alignement) {
  const el = document.getElementById("phrase-progressive");
  if (!el) return;
  el.textContent = texte;
  el.classList.remove("aligne-gauche", "aligne-centre");
  el.classList.add(alignement === "centre" ? "aligne-centre" : "aligne-gauche");
  positionnerPhraseRelativeSpirale();
}

// Mesure la position RÉELLE de #spirale à l'écran (Playbook §3.3) plutôt
// que de présumer sa position depuis le viewBox — la phrase doit rester
// ancrée visuellement à la spirale peu importe la taille d'écran.
function positionnerPhraseRelativeSpirale() {
  const spiraleEl = container?.querySelector("#spirale");
  const graphicEl = document.getElementById("graphic");
  const phraseEl = document.getElementById("phrase-progressive");
  if (!spiraleEl || !graphicEl || !phraseEl) return;

  const rectSpirale = spiraleEl.getBoundingClientRect();
  const rectGraphic = graphicEl.getBoundingClientRect();
  const centreX = rectSpirale.left + rectSpirale.width / 2 - rectGraphic.left;
  const centreY = rectSpirale.top + rectSpirale.height / 2 - rectGraphic.top;

  if (phraseEl.classList.contains("aligne-gauche")) {
    phraseEl.style.left = `${centreX - 200}px`;
    phraseEl.style.transform = "translateX(-100%)";
  } else {
    phraseEl.style.left = `${centreX}px`;
    phraseEl.style.transform = "translateX(-50%)";
  }
  phraseEl.style.top = `${centreY}px`;
}

function animerPerlesEnVague(groupeEl, timeline, positionRelative) {
  if (!groupeEl) return;
  const paths = Array.from(groupeEl.querySelectorAll("path"))
    .sort((a, b) => a.getBBox().x - b.getBBox().x);
  timeline.to(paths, { opacity: 1, duration: 0.4, stagger: 0.05 }, positionRelative);
}

function construireCerclesValeurs() {
  if (groupeCercles) return Array.from(groupeCercles.children);

  const spiraleEl = container?.querySelector("#spirale");
  const svgRoot = container?.querySelector("svg");
  if (!spiraleEl || !svgRoot) return null;

  // Même document SVG que #spirale (contrairement à step11.js, qui
  // réconciliait deux documents séparés) — coordonnées natives directes.
  const bbox = spiraleEl.getBBox();
  const centre = { x: bbox.x + bbox.width / 2, y: bbox.y + bbox.height / 2 };
  const rayon = Math.min(bbox.width, bbox.height) * 0.4; // placeholder, à ajuster à l'œil
  const rayonCercle = rayon * 0.08; // placeholder, à ajuster à l'œil

  const NS_SVG = "http://www.w3.org/2000/svg";
  const g = document.createElementNS(NS_SVG, "g");
  g.setAttribute("id", "cercles-valeurs");
  svgRoot.appendChild(g);

  const cercles = valeurs.map((valeur, i) => {
    const angle = (i / 9) * Math.PI * 2 - Math.PI / 2; // départ en haut, sens horaire
    const cercle = document.createElementNS(NS_SVG, "circle");
    cercle.setAttribute("cx", centre.x + Math.cos(angle) * rayon);
    cercle.setAttribute("cy", centre.y + Math.sin(angle) * rayon);
    cercle.setAttribute("r", rayonCercle);
    cercle.setAttribute("fill", valeur.couleur);
    cercle.setAttribute("fill-opacity", "0.7");
    cercle.setAttribute("opacity", "0");
    cercle.style.cursor = "pointer";
    cercle.dataset.valeurId = valeur.id;
    cercle.addEventListener("mouseenter", () => afficherCarteValeur(valeur.id));
    cercle.addEventListener("mouseleave", () => cacherCarteValeur());
    g.appendChild(cercle);
    return cercle;
  });

  groupeCercles = g;
  return cercles;
}

function afficherCarteValeur(valeurId) {
  const valeur = valeurs.find((v) => v.id === valeurId);
  const carte = document.getElementById("carte-valeur");
  if (!valeur || !carte) return;

  // Ligne 1 : le mot dans la langue autochtone active si valeur.nom la
  // contient (ex. "inuktitut" un jour), sinon repli sur innu-aimun. On
  // exclut explicitement "fr"/"en" : valeur.nom a AUSSI ces clés (elles
  // alimentent la ligne 2 ci-dessous), donc sans ce garde la ligne 1
  // afficherait "Partage" en français — un doublon avec la ligne 2.
  const langueActive = getLanguage();
  const langueAutochtone = (langueActive === "fr" || langueActive === "en") ? null : langueActive;
  const motAutochtone = (langueAutochtone && valeur.nom[langueAutochtone]) || valeur.nom["innu-aimun"];
  carte.querySelector(".carte-valeur-autochtone").textContent = motAutochtone;
  // resolve({fr, en}) plutôt que resolve(valeur.nom) directement, pour ne
  // jamais dupliquer le mot autochtone sur les deux lignes de la carte.
  carte.querySelector(".carte-valeur-traduction").textContent = resolve({ fr: valeur.nom.fr, en: valeur.nom.en });
  carte.querySelector(".carte-valeur-definition").textContent = resolve(valeur.definition);
  carte.classList.add("visible");
}

function cacherCarteValeur() {
  document.getElementById("carte-valeur")?.classList.remove("visible");
}

// Cache tout le conteneur avant-colonisation d'un coup — à appeler UNE
// SEULE FOIS, au moment où on quitte tout le domaine avant-colonisation
// (transition rupture→apres), jamais entre A/B/C/D/E entre eux (voir
// timelineRail.js). Les calques internes (spirale, communaute, territoire)
// gardent leur état interne intact (opacity:1) — seul le conteneur parent
// bascule, donc un retour ultérieur sur E les retrouve déjà révélés,
// aucune réanimation.
export function masquerSceneComplete() {
  if (!container) return;

  if (reduitMouvement()) {
    gsap.set(container, { opacity: 0, display: "none", pointerEvents: "none" });
    return;
  }

  // pointerEvents retiré immédiatement (pas besoin d'attendre la fin du
  // fondu pour que la scène cesse d'intercepter les clics), display
  // retiré seulement à la fin (impossible à animer, doit attendre que
  // l'opacité soit vraiment à 0 sinon la scène disparaît d'un coup avant
  // la fin visuelle du fondu).
  gsap.set(container, { pointerEvents: "none" });
  gsap.to(container, {
    opacity: 0,
    duration: 1,
    ease: "power1.out",
    onComplete: () => gsap.set(container, { display: "none" }),
  });
}

// --- A — Depuis la nuit des temps ---
export async function showNuitDesTemps() {
  if (timelineActuelle) timelineActuelle.kill();
  timelineActuelle = gsap.timeline();
  const c = await assurerContainer();
  if (!c) return;

  const spiraleEl = c.querySelector("#spirale");
  if (!spiraleEl) return;

  if (!revele.spirale) {
    // revele.spirale n'est marqué vrai qu'à la fin RÉELLE du fondu (onComplete),
    // pas au moment où le tween est programmé — sinon un aller-retour rapide qui
    // interrompt le délai +=3 (timelineActuelle.kill() du show suivant) marque la
    // révélation comme faite alors que la spirale n'a jamais atteint opacity:1,
    // et plus rien ne la rattrape puisque hideNuitDesTemps() ne touche à rien.
    timelineActuelle.to(spiraleEl, {
      opacity: 1,
      duration: 1.5,
      onComplete: () => { revele.spirale = true; },
    }, "+=3");
  } else {
    gsap.set(spiraleEl, { opacity: 1 });
  }
}

// La spirale persiste en continu (principe d'architecture #1) — rien à
// nettoyer en sortie ; le titre de scène est géré par timelineRail.js.
export function hideNuitDesTemps() {}

// --- B — Lié·es à leur communauté ---
export async function showLienCommunaute() {
  if (timelineActuelle) timelineActuelle.kill();
  timelineActuelle = gsap.timeline();
  const c = await assurerContainer();
  if (!c) return;
  await chargerStepsData();
  assurerCalquesAvant("communaute");

  const communauteEl = c.querySelector("#communaute");
  if (!communauteEl) return;

  if (!revele.communaute) {
    // Même précaution que showNuitDesTemps() : le flag se pose dans onComplete,
    // jamais synchroniquement à la planification du tween.
    timelineActuelle.to(communauteEl, {
      opacity: 1,
      duration: 1.5,
      onComplete: () => { revele.communaute = true; },
    }, "+=3");
    timelineActuelle.call(() => definirPhrase(phraseProgressive("lien-communaute"), "gauche"), null, "<");
  } else {
    // Remet la phrase au bon état si on revient sur B depuis un step plus avancé.
    definirPhrase(phraseProgressive("lien-communaute"), "gauche");
  }
}

export function hideLienCommunaute() {}

// --- C — Lié·es à leur communauté et à leur territoire ---
export async function showLienTerritoire() {
  if (timelineActuelle) timelineActuelle.kill();
  timelineActuelle = gsap.timeline();
  const c = await assurerContainer();
  if (!c) return;
  await chargerStepsData();
  assurerCalquesAvant("territoire");

  const territoireEl = c.querySelector("#territoire");
  if (!territoireEl) return;

  if (!revele.territoire) {
    timelineActuelle.to(territoireEl, { opacity: 1, duration: 1.5 }, "+=3");
    timelineActuelle.call(() => definirPhrase(phraseProgressive("lien-territoire"), "gauche"), null, "<");
    for (let i = 1; i <= 5; i++) {
      animerPerlesEnVague(c.querySelector(`#perles${i}`), timelineActuelle, "+=2");
    }
    // Posé après TOUTE la séquence (territoire + 5 vagues de perles), pas au
    // moment de la planifier — même précaution que showNuitDesTemps().
    timelineActuelle.call(() => { revele.territoire = true; });
  } else {
    definirPhrase(phraseProgressive("lien-territoire"), "gauche");
  }
}

export function hideLienTerritoire() {}

// --- D — Lié·es à leurs valeurs ---
export async function showLienValeurs() {
  if (timelineActuelle) timelineActuelle.kill();
  timelineActuelle = gsap.timeline();
  const c = await assurerContainer();
  if (!c) return;
  await chargerStepsData();
  assurerCalquesAvant("valeurs");
  await chargerValeurs();

  const cercles = construireCerclesValeurs();
  if (!cercles) return;

  // Contrairement à A/B/C, D bascule vraiment à chaque entrée/sortie —
  // pas de garde "déjà révélé" ici, c'est voulu.
  gsap.set(cercles, { opacity: 0 });
  timelineActuelle.to(cercles, { opacity: 1, duration: 0.4, stagger: 0.15 }, "+=3");
}

export function hideLienValeurs() {
  if (groupeCercles) gsap.set(groupeCercles.children, { opacity: 0 });
  cacherCarteValeur();
}

// --- E — Rupture coloniale ---
export async function showRuptureColoniale() {
  if (timelineActuelle) timelineActuelle.kill();
  timelineActuelle = gsap.timeline();
  const c = await assurerContainer();
  if (!c) return;
  await chargerStepsData();
  assurerCalquesAvant("barres");

  definirPhrase(phraseProgressive("rupture-coloniale"), "gauche");

  const barres = [1, 2, 3, 4, 5].map((i) => c.querySelector(`#barre${i}`));
  const sousTitre = document.getElementById("sous-titre-rupture");
  if (sousTitre) sousTitre.textContent = sousTitreRupture();

  // clip-path plutôt qu'opacity (décision Sprint 3) — chaque barre alterne
  // de sens (gauche→droite / droite→gauche), pas de stagger.
  const directions = [
    "inset(0% 100% 0% 0%)", // barre1 : gauche→droite
    "inset(0% 0% 0% 100%)", // barre2 : droite→gauche
    "inset(0% 100% 0% 0%)", // barre3 : gauche→droite
    "inset(0% 0% 0% 100%)", // barre4 : droite→gauche
    "inset(0% 100% 0% 0%)", // barre5 : gauche→droite
  ];

  barres.forEach((barre, i) => {
    if (!barre) return;
    const position = i === 0 ? "+=3" : "+=1";
    timelineActuelle.set(barre, { opacity: 1 }, position);
    timelineActuelle.fromTo(
      barre,
      { clipPath: directions[i] },
      { clipPath: "inset(0% 0% 0% 0%)", duration: 1.2, ease: "power2.out" },
      "<"
    );
    if (i === 1 && sousTitre) {
      timelineActuelle.call(() => sousTitre.classList.add("visible"), null, "<");
    }
  });
}

export function hideRuptureColoniale() {
  for (let i = 1; i <= 5; i++) {
    const barre = container?.querySelector(`#barre${i}`);
    if (barre) gsap.set(barre, { opacity: 0, clipPath: "inset(0% 100% 0% 0%)" });
  }

  // Le sous-titre n'est jamais animé directement par GSAP (show() ne fait
  // qu'ajouter la classe .visible, laissée au CSS) — symétrie show/hide
  // (Playbook §3.1) : hide() retire la même classe plutôt que d'écrire un
  // opacity inline qui figerait l'élément invisible même après réajout de
  // .visible au prochain passage sur E.
  document.getElementById("sous-titre-rupture")?.classList.remove("visible");

  // Si on recule de E vers D, D ne touche pas à la phrase — elle doit
  // refléter C (le dernier step qui l'a définie), pas rester à la version
  // complète de E. Lecture synchrone de stepsData : on vient forcément de
  // E, donc showRuptureColoniale() l'a déjà chargé.
  definirPhrase(phraseProgressive("lien-territoire"), "gauche");
}
