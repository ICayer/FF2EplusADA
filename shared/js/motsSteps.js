// ==================================================
// shared/js/motsSteps.js
// Rail — mots-clés de step positionnés à la main dans timeline.svg
//
// Rôle : Remplacer l'ancien bloc-titre visuel et la boîte "texte step
// narratif" par des mots-clés placés par Isabel dans timeline.svg
// (groupe #mots_steps_scrolly, direction artistique de Déline, 1er
// octobre 2026). Pour chaque mot, 3 calques FRÈRES servent de GUIDES
// seulement (jamais affichés tels quels) :
//   [base]-boite : rectangle — taille de départ et zone d'ancrage
//   [base]-point : cercle    — QUEL bord/coin du rectangle est l'ancre
//   [base]-mot   : texte     — référence visuelle pour Isabel (le texte
//                  affiché vient de motsSteps.json via resolve(), jamais
//                  du SVG — Playbook, texte narratif en overlay HTML)
// Le suffixe de [base] dit sur quel(s) step(s) le mot s'affiche :
//   -S4      → step 4 seulement
//   -S9-S10  → steps 9 ET 10, en continu (jamais ré-animé entre les deux)
//   -VI      → #Visible-initiale, plage PLAGE_VISIBLE_INITIALE ci-dessous
// Champ "minuteur" de motsSteps.json — disparition après
// DUREE_AFFICHAGE_MOT_MS :
//   "chaque-step"  → à chaque arrivée sur un de ses steps (S1 à S8)
//   "dernier-step" → seulement à l'arrivée sur son DERNIER step ("Une
//                    étoile, une vie" : continu S9 → S10, puis minuteur
//                    à l'arrivée sur S10)
//   "aucun"        → affiché en continu sur toute sa plage
// Numéro de step N → étape de parcours.json : fourni par l'appelant
// (railParcours.js, qui détient la table perle→étape) — jamais dupliqué ici.
//
// Les guides sont masqués en CSS (visibility:hidden, PAS display:none :
// un élément display:none renvoie une boîte vide à getBoundingClientRect()
// et on ne pourrait plus le mesurer).
//
// Dépend de : shared/js/i18n.js (resolve), shared/js/navigationEtat.js
//   (reduitMouvement), shared/data/motsSteps.json
// Utilisé par : shared/js/railParcours.js
//
// FF2EplusADA (scrollyFFADA2S v2)
// Isabel Cayer · Atelier Love & Code · 2026
// ==================================================

import { resolve } from "./i18n.js";
import { reduitMouvement } from "./navigationEtat.js";

const ID_GROUPE_MOTS = "mots_steps_scrolly";
const ID_VISIBLE_INITIALE = "Visible-initiale";

// Plage d'affichage continu de #Visible-initiale ("Colonisation") — UN
// seul repère permanent, jamais ré-animé d'un step à l'autre dans cette
// plage. Plage demandée : nuit-des-temps → hommage-victimes (perle_step1
// à perle_step6, table de railParcours.js). ⚠️ À confirmer par Isabel :
// l'epoque "avant" de stepsOrder.json ne couvre que les 4 premiers steps
// (rupture-coloniale = "rupture", hommage-victimes = "apres").
const PLAGE_VISIBLE_INITIALE = new Set([
  "nuit-des-temps",
  "lien-communaute",
  "lien-territoire",
  "lien-valeurs",
  "rupture-coloniale",
  "hommage-victimes",
]);

// Écart max (px écran) entre le point-guide et le bord/centre détecté —
// absorbe l'imprécision du placement à la main dans Illustrator.
const TOLERANCE_ANCRAGE_PX = 8;
const LIGNES_MAX = 2;
const PAS_ELARGISSEMENT_PX = 8;
const DUREE_FONDU_MS = 400; // doit correspondre à .mot-step (railParcours.css)
// Durée d'affichage avant disparition (champ "minuteur") — point de
// départ, Isabel ajustera à l'œil.
const DUREE_AFFICHAGE_MOT_MS = 4000;
const MINUTEURS_VALIDES = new Set(["chaque-step", "dernier-step", "aucun"]);

let railEl = null;
let mots = []; // [{ cle, entree, etapes:Set, boite, point, el, minuteur, expire }]
let etapeEnAttente = null; // étape demandée avant la fin de initMotsSteps()
let pret = false;
let derniereEtape = null; // garde "même étape" — Playbook §3.5

// Charge motsSteps.json et relie chaque entrée à ses 3 guides SVG.
// `container` : le .rail-parcours où timeline.svg vient d'être chargé.
// `etapeDepuisNumero` : (n) => id d'étape de parcours.json pour le step N.
export async function initMotsSteps(container, etapeDepuisNumero) {
  railEl = container;
  const groupe = container.querySelector(`#${ID_GROUPE_MOTS}`);
  if (!groupe) {
    console.error(`❌ Mots de step : #${ID_GROUPE_MOTS} introuvable dans timeline.svg`);
    return;
  }

  const donnees = await fetch(new URL("../data/motsSteps.json", import.meta.url)).then((r) => r.json());
  // Sélecteur [id="..."] plutôt que #id : les ids d'Illustrator contiennent
  // des caractères (·, é, virgule retirée...) qu'un sélecteur #id refuserait.
  const guide = (id) => groupe.querySelector(`[id="${id}"]`);

  mots = Object.entries(donnees).map(([cle, entree]) => {
    const boite = guide(`${entree.svg}-boite`);
    const point = guide(`${entree.svg}-point`);
    if (!boite || !point) {
      console.error(`❌ Mots de step : guides "${entree.svg}-boite/-point" introuvables pour "${cle}" — vérifier timeline.svg / motsSteps.json`);
      return null;
    }
    const etapes = boite.closest(`#${ID_VISIBLE_INITIALE}`)
      ? PLAGE_VISIBLE_INITIALE
      : etapesDepuisSuffixe(entree.svg, etapeDepuisNumero);
    if (!MINUTEURS_VALIDES.has(entree.minuteur)) {
      console.warn(`⚠️ Mots de step : minuteur "${entree.minuteur}" inconnu pour "${cle}" — traité comme "aucun"`);
    }
    return { cle, entree, etapes, boite, point, el: null, minuteur: null, expire: false };
  }).filter(Boolean);

  // Audit inverse : un mot placé dans le SVG mais absent du JSON ne
  // s'afficherait jamais, sans erreur visible — le signaler.
  const basesConnues = new Set(Object.values(donnees).map((e) => e.svg));
  groupe.querySelectorAll('[id$="-point"]').forEach((p) => {
    const base = p.id.replace(/-point$/, "");
    if (!basesConnues.has(base)) console.warn(`⚠️ Mots de step : "${base}" placé dans timeline.svg mais absent de motsSteps.json`);
  });

  pret = true;
  if (etapeEnAttente) afficherMotsEtape(etapeEnAttente);
}

// "-S9-S10" → étapes des steps 9 à 10 ; "-S4" → step 4 seulement.
function etapesDepuisSuffixe(base, etapeDepuisNumero) {
  const m = base.match(/-S(\d+)(?:-S(\d+))?$/);
  if (!m) {
    console.error(`❌ Mots de step : suffixe de step illisible dans "${base}"`);
    return new Set();
  }
  const debut = Number(m[1]);
  const fin = m[2] ? Number(m[2]) : debut;
  const etapes = new Set();
  for (let n = debut; n <= fin; n++) {
    const etape = etapeDepuisNumero(n);
    if (etape) etapes.add(etape);
    else console.error(`❌ Mots de step : step ${n} ("${base}") sans étape correspondante`);
  }
  return etapes;
}

// Affiche les mots de `etapeId`, retire les autres. Un mot déjà affiché
// et toujours pertinent n'est PAS recréé (persistance des mots à double
// step et de "Colonisation" — aucun fondu entre deux steps de sa plage).
// Rappel sur la MÊME étape (ex. "languagechange" → definirEtapeActive du
// step courant) : rien à faire — sinon un mot déjà expiré réapparaîtrait
// et son minuteur repartirait (même garde que goToStep, Playbook §3.5).
export function afficherMotsEtape(etapeId) {
  if (!pret) {
    etapeEnAttente = etapeId;
    return;
  }
  if (etapeId === derniereEtape) return;
  derniereEtape = etapeId;

  mots.forEach((mot) => {
    // Nouvelle étape = tout minuteur précédent est caduc (jamais un timer
    // orphelin qui masquerait un mot qui ne le concerne plus).
    annulerMinuteur(mot);
    const doitEtreVisible = mot.etapes.has(etapeId);
    if (!doitEtreVisible) {
      if (mot.el) retirerMot(mot);
      return;
    }
    if (!mot.el) creerMot(mot);
    else if (mot.expire) reafficherMot(mot);
    if (minuteurApplique(mot, etapeId)) demarrerMinuteur(mot);
  });
}

function minuteurApplique(mot, etapeId) {
  if (mot.entree.minuteur === "chaque-step") return true;
  if (mot.entree.minuteur === "dernier-step") return etapeId === [...mot.etapes].at(-1);
  return false;
}

// Masque le mot (même fondu que le masquage normal) SANS le retirer : il
// reste "actif" pour son step, il ne doit simplement plus se voir.
function demarrerMinuteur(mot) {
  mot.minuteur = setTimeout(() => {
    mot.minuteur = null;
    if (!mot.el) return;
    mot.el.classList.remove("visible");
    mot.expire = true;
  }, DUREE_AFFICHAGE_MOT_MS);
}

function annulerMinuteur(mot) {
  if (mot.minuteur === null) return;
  clearTimeout(mot.minuteur);
  mot.minuteur = null;
}

function reafficherMot(mot) {
  mot.expire = false;
  mot.el.classList.add("visible");
}

function creerMot(mot) {
  const el = document.createElement("div");
  el.className = "mot-step";
  const texte = document.createElement("span");
  texte.className = "mot-step-texte";
  texte.textContent = resolve(mot.entree);
  el.appendChild(texte);
  railEl.appendChild(el);
  mot.el = el;
  positionnerMot(mot);
  if (reduitMouvement()) el.classList.add("visible");
  else requestAnimationFrame(() => el.classList.add("visible"));
}

function retirerMot(mot) {
  annulerMinuteur(mot);
  const el = mot.el;
  mot.el = null;
  mot.expire = false;
  if (reduitMouvement()) {
    el.remove();
    return;
  }
  el.classList.remove("visible");
  setTimeout(() => el.remove(), DUREE_FONDU_MS);
}

// Bord le plus proche du point-guide sur un axe : "debut" (gauche/haut),
// "centre", ou "fin" (droite/bas).
function detecterAncrage(p, debut, fin, base) {
  const candidats = [
    ["debut", Math.abs(p - debut)],
    ["centre", Math.abs(p - (debut + fin) / 2)],
    ["fin", Math.abs(p - fin)],
  ].sort((a, b) => a[1] - b[1]);
  if (candidats[0][1] > TOLERANCE_ANCRAGE_PX) {
    console.warn(`⚠️ Mots de step : point-guide de "${base}" à ${candidats[0][1].toFixed(1)}px de tout bord — ancrage "${candidats[0][0]}" retenu`);
  }
  return candidats[0][0];
}

function nombreLignes(texteEl) {
  const hauteurLigne = parseFloat(getComputedStyle(texteEl).lineHeight);
  return Math.round(texteEl.getBoundingClientRect().height / hauteurLigne);
}

// Position d'un côté de la boîte selon l'ancrage : le bord ancré reste
// fixe, la boîte s'étend du côté opposé (ou des deux côtés si centrée).
function positionSelonAncrage(ancrage, debut, fin, taille) {
  if (ancrage === "debut") return debut;
  if (ancrage === "fin") return fin - taille;
  return (debut + fin) / 2 - taille / 2;
}

// Mesure le rendu RÉEL des guides (getBoundingClientRect(), Playbook
// §3.3 — même méthode que la bulle "Pas encore débloqué" du même rail)
// et pose la boîte HTML par rapport à .rail-parcours.
function positionnerMot(mot) {
  const { el, boite, point, entree } = mot;
  const texteEl = el.firstChild;
  const rRail = railEl.getBoundingClientRect();
  const rBoite = boite.getBoundingClientRect();
  const rPoint = point.getBoundingClientRect();

  const ancrageX = detecterAncrage(rPoint.left + rPoint.width / 2, rBoite.left, rBoite.right, entree.svg);
  const ancrageY = detecterAncrage(rPoint.top + rPoint.height / 2, rBoite.top, rBoite.bottom, entree.svg);

  // Largeur de départ = largeur du guide ; hauteur minimale = hauteur du
  // guide (le texte y est centré verticalement, 1 ou 2 lignes, en CSS).
  let largeur = rBoite.width;
  el.style.width = `${largeur}px`;
  el.style.minHeight = `${rBoite.height}px`;

  // Jamais plus de 2 lignes : élargir jusqu'à ce que le texte réel
  // (langue active + taille A-/A/A+) tienne — borné à la largeur du rail.
  while (nombreLignes(texteEl) > LIGNES_MAX && largeur < rRail.width) {
    largeur += PAS_ELARGISSEMENT_PX;
    el.style.width = `${largeur}px`;
  }

  const largeurFinale = el.offsetWidth;
  const hauteurFinale = el.offsetHeight;
  el.style.left = `${positionSelonAncrage(ancrageX, rBoite.left, rBoite.right, largeurFinale) - rRail.left}px`;
  el.style.top = `${positionSelonAncrage(ancrageY, rBoite.top, rBoite.bottom, hauteurFinale) - rRail.top}px`;
}

function repositionnerTout() {
  mots.forEach((mot) => { if (mot.el) positionnerMot(mot); });
}

// Retraduire au changement de langue (la largeur peut changer → repositionner).
window.addEventListener("languagechange", () => {
  mots.forEach((mot) => {
    if (mot.el) mot.el.firstChild.textContent = resolve(mot.entree);
  });
  repositionnerTout();
});

// Le rail est recentré par le navigateur au redimensionnement.
window.addEventListener("resize", repositionnerTout);

// A-/A/A+ (headerControls.js) ne dispatche aucun événement : il réécrit
// seulement --echelle-texte dans le style inline de <html> — on observe
// donc cet attribut, sans toucher à headerControls.js.
new MutationObserver(repositionnerTout).observe(document.documentElement, {
  attributes: true,
  attributeFilter: ["style"],
});

// Agoradp_15 peut finir de charger après le premier positionnement —
// la largeur réelle du texte change alors.
document.fonts?.ready.then(repositionnerTout);
