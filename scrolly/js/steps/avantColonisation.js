// ==================================================
// scrolly/js/steps/avantColonisation.js
// Steps A à E — scène cumulative "avant la colonisation"
//
// Rôle : Gérer les 5 points de contrôle A (nuit-des-temps), B
// (lien-communaute), C (lien-territoire), D (lien-valeurs) et E
// (rupture-coloniale), qui ne sont PAS 5 steps indépendants mais 5
// moments d'UNE seule scène cumulative chargée depuis scrolly.svg. Sauf
// pour les 10 cercles de valeurs (D) et les 5 barres (E), un calque une
// fois révélé (spirale, communauté, territoire, perles) reste affiché en
// continu même en naviguant vers un step antérieur — les hide() de
// A/B/C sont donc volontairement vides. Les 10 cercles de valeurs
// (#cercles-valeurs, 10 <rect> arrondis nommés cercle-valeur-[id]) vivent
// DANS scrolly.svg depuis le 14 septembre 2026 (script/asset d'Isabel) —
// plus de génération JS ni de mot permanent séparé, voir
// construireCerclesValeurs()/afficherCarteValeur().
// Dépend de : shared/js/utils.js (loadSVG), shared/js/i18n.js (resolve),
// shared/data/valeurs.json (10 entrées, dont "respect"), scrolly/data/steps.json
// (phrases progressives traduites : phraseProgressive / sousTitreRupture)
// Utilisé par : scrolly/js/stepsRegistry.js
//
// FF2EplusADA (scrollyFFADA2S v2)
// Isabel Cayer · Atelier Love & Code · 2026
// ==================================================

import { loadSVG } from "../../../shared/js/utils.js";
import { resolve, getLanguage } from "../../../shared/js/i18n.js";
import { reduitMouvement } from "../../../shared/js/navigationEtat.js";

let container = null;
// Mémoïse le CHARGEMENT EN VOL de scrolly.svg (même principe que
// stepsDataPromise plus bas pour steps.json) : si assurerContainer() est
// appelée plusieurs fois avant que loadSVG() ait résolu — ex. clics rapides
// sur "suivant" pendant une première navigation linéaire A→B→C→D, chaque
// showX() appelant assurerContainer() en parallèle — TOUTES les invocations
// concurrentes doivent attendre la MÊME promesse plutôt que de déclencher
// chacune leur propre fetch(). Sans ce cache, `container` restait `null` pour
// chaque appel tant qu'aucun n'avait résolu, donc chaque showX() lançait sa
// propre loadSVG() ; loadSVG() retrouve le même #avantColonisationSVG via
// getElementById() et réécrit innerHTML à chaque résolution — détruisant les
// <rect> de #cercles-valeurs qu'un appel précédent venait de câbler (voir
// construireCerclesValeurs()). C'est la cause du bug rapporté : survol/clic
// muet au tout premier passage sur "Lié·es à leurs valeurs", mais
// fonctionnel en y revenant plus tard (le module est alors stabilisé, la
// course n'a plus lieu d'être une fois `container` fixé).
let containerPromise = null;
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
    definirPhraseParStep("lien-territoire", "gauche");
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
const stepsDataPromise = fetch(new URL("../../data/steps.json", import.meta.url))
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
    // Une seule loadSVG() en vol à la fois, partagée par tous les appels
    // concurrents (voir containerPromise ci-dessus) — créée au premier appel
    // seulement, jamais recréée tant que `container` n'est pas fixé.
    if (!containerPromise) {
      containerPromise = loadSVG("./svg/avant-colonisation/scrolly.svg", "avantColonisationSVG", "graphic").then((c) => {
        if (!c) return null;

        const groupesAReveler = ["#territoire", "#communaute", "#spirale", "#barre1", "#barre2", "#barre3", "#barre4", "#barre5"];
        groupesAReveler.forEach((sel) => {
          const el = c.querySelector(sel);
          if (el) gsap.set(el, { opacity: 0, display: "block", visibility: "visible" });
        });

        // #barres (E, effet de pinceau) est déclaré APRÈS #cercles-valeurs (D)
        // dans scrolly.svg — en SVG l'ordre du document fixe l'ordre de
        // peinture, donc barres se dessine PAR-DESSUS cercles-valeurs, peu
        // importe leur opacité respective (opacity:0 ≠ pointer-events:none,
        // deux propriétés indépendantes — confirmé par Isabel via DevTools :
        // cliquer un cercle sélectionnait en réalité <image id="barre5">).
        // Purement visuel, jamais cliqué nulle part dans ce fichier (voir
        // showRuptureColoniale()/hideRuptureColoniale() : seuls opacity et
        // clipPath y sont animés) — inerte aux événements de pointeur en
        // permanence, pas seulement hors du step E, pour ne pas gérer un
        // état conditionnel qui n'a aucune raison d'être. Posé ici (une
        // seule fois, à l'initialisation du conteneur) plutôt que dans
        // showRuptureColoniale()/hideRuptureColoniale() : ces deux fonctions
        // gèrent la RÉVÉLATION du step, pas des propriétés qui doivent
        // rester vraies tout le temps.
        ["#barre1", "#barre2", "#barre3", "#barre4", "#barre5"].forEach((sel) => {
          const el = c.querySelector(sel);
          if (el) gsap.set(el, { pointerEvents: "none" });
        });

        // Les perles : le GROUPE reste opacity:1 (sinon l'opacité du parent à 0
        // multiplierait celle des enfants, aucune vague ne serait visible) — ce
        // sont les <path> enfants, individuellement, qui démarrent invisibles.
        for (let i = 1; i <= 5; i++) {
          const groupePerles = c.querySelector(`#perles${i}`);
          if (groupePerles) {
            gsap.set(groupePerles, { opacity: 1, display: "block", visibility: "visible" });
            gsap.set(groupePerles.querySelectorAll("path"), { opacity: 0 });
          }
        }

        // Les 10 cercles de valeurs (réexportés par Isabel DANS scrolly.svg,
        // Tranche du 14 septembre) : même principe que les perles ci-dessus —
        // le GROUPE reste opacity:1, ce sont les <rect> enfants qui démarrent
        // invisibles. Nécessaire dès la création du conteneur (pas seulement
        // au premier passage sur showLienValeurs()) : sans ça, les 10 cercles
        // seraient visibles par défaut (aucune opacité dans le SVG source) dès
        // le step A, bien avant que D ne les révèle.
        const groupeCerclesInitial = c.querySelector("#cercles-valeurs");
        if (groupeCerclesInitial) {
          gsap.set(groupeCerclesInitial, { opacity: 1, display: "block", visibility: "visible" });
          gsap.set(groupeCerclesInitial.children, { opacity: 0 });
        }

        container = c;
        return c;
      });
    }

    const c = await containerPromise;
    if (!c) {
      console.error("❌ Impossible de charger le SVG avant-colonisation");
      return null;
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
    valeurs = await fetch(new URL("../../../shared/data/valeurs.json", import.meta.url)).then((r) => r.json());
  }
}

function definirPhrase(texte, alignement) {
  const el = document.getElementById("phrase-progressive");
  if (!el) return;
  el.textContent = texte;
  el.classList.remove("aligne-gauche", "aligne-centre");
  el.classList.add(alignement === "centre" ? "aligne-centre" : "aligne-gauche");
  positionnerElementsRelatifsSpirale();
}

let dernierStepIdPhrase = null;
let dernierAlignementPhrase = null;

// Enveloppe definirPhrase(phraseProgressive(stepId), alignement) — mémorise stepId
// pour pouvoir retraduire sur languagechange sans rejouer le show() du step (bloqué
// par le garde goToStep sur re-navigation vers le même index, S5B2T2).
function definirPhraseParStep(stepId, alignement) {
  dernierStepIdPhrase = stepId;
  dernierAlignementPhrase = alignement;
  definirPhrase(phraseProgressive(stepId), alignement);
}

window.addEventListener("languagechange", () => {
  if (!dernierStepIdPhrase) return;
  // Ne retraduire QUE si la phrase est effectivement à l'écran : sur un step F-I,
  // timelineRail.js (allerAuStep, epoque "apres") a retiré aligne-gauche/-centre
  // pour la masquer — sans ce garde, definirPhrase() les rajouterait et ferait
  // réapparaître une phrase périmée par-dessus la scène « après ».
  const el = document.getElementById("phrase-progressive");
  if (!el || (!el.classList.contains("aligne-gauche") && !el.classList.contains("aligne-centre"))) return;
  definirPhrase(phraseProgressive(dernierStepIdPhrase), dernierAlignementPhrase);
});

const PADDING_CARTE_SPIRALE_PX = 50;
const PADDING_PHRASE_SPIRALE_PX = 50;

// Positionne, en une seule passe mesurée (Playbook §3.3), les deux éléments ancrés à
// la spirale : la phrase de gauche et la carte de valeur au survol/focus. Appelée à
// CHAQUE step qui affiche une phrase (A-E), pas seulement D — carte-valeur est
// repositionnée à chaque appel même invisible, cohérent peu importe l'ordre dans
// lequel les steps ont été visités. Depuis cette tranche (14 septembre 2026) : plus
// de mot-permanent-valeur séparé à mesurer/positionner (retiré, voir Correction 1) —
// hautCible retombe simplement sur centreY, le centre vertical de la spirale.
function positionnerElementsRelatifsSpirale() {
  const spiraleEl = container?.querySelector("#spirale");
  const graphicEl = document.getElementById("graphic");
  const carteEl = document.getElementById("carte-valeur");
  const phraseEl = document.getElementById("phrase-progressive");
  if (!spiraleEl || !graphicEl) return;

  const rectSpirale = spiraleEl.getBoundingClientRect();
  const rectGraphic = graphicEl.getBoundingClientRect();
  const centreY = rectSpirale.top + rectSpirale.height / 2 - rectGraphic.top;
  const droiteCarte = rectSpirale.right - rectGraphic.left + PADDING_CARTE_SPIRALE_PX;

  if (carteEl) { carteEl.style.left = `${droiteCarte}px`; carteEl.style.top = `${centreY}px`; }

  if (!phraseEl) return;

  const hautCible = centreY;

  if (phraseEl.classList.contains("aligne-gauche")) {
    const gaucheSpirale = rectSpirale.left - rectGraphic.left;
    phraseEl.style.left = `${gaucheSpirale - PADDING_PHRASE_SPIRALE_PX}px`;
    phraseEl.style.transform = "translateX(-100%)"; // ancré par la droite du bloc de texte
  } else {
    const centreX = rectSpirale.left + rectSpirale.width / 2 - rectGraphic.left;
    phraseEl.style.left = `${centreX}px`;
    phraseEl.style.transform = "translateX(-50%)";
  }
  phraseEl.style.top = `${hautCible}px`;
}

function animerPerlesEnVague(groupeEl, timeline, positionRelative) {
  if (!groupeEl) return;
  const paths = Array.from(groupeEl.querySelectorAll("path"))
    .sort((a, b) => a.getBBox().x - b.getBBox().x);
  timeline.to(paths, { opacity: 1, duration: 0.4, stagger: 0.05 }, positionRelative);
}

// 0° = haut (nord), sens horaire — même convention que positionSurCercle()
// (univers/js/constellations.js), mais inversée : on connaît déjà (x,y) et
// on veut l'angle, pas l'inverse.
function angleHoraireDepuisCentre(x, y, centre) {
  let angle = Math.atan2(x - centre.x, -(y - centre.y));
  if (angle < 0) angle += Math.PI * 2;
  return angle;
}

// Les 10 cercles de valeurs (#cercles-valeurs > 10 <rect> arrondis, nommés
// cercle-valeur-[id], réexportés par Isabel dans scrolly.svg) vivent
// maintenant ENTIÈREMENT dans le fichier source — plus de génération JS ni
// de formule de placement (même principe que la Tranche B de la timeline,
// même semaine). Cette fonction ne fait que RETROUVER ces 10 éléments,
// les TRIER par angle horaire (Correction 2 — ordre de stagger, PAS leur
// position) et câbler le survol/focus, jamais créer de géométrie.
function construireCerclesValeurs() {
  if (groupeCercles) return Array.from(groupeCercles.children).sort((a, b) => a.dataset.ordreHoraire - b.dataset.ordreHoraire);

  groupeCercles = container?.querySelector("#cercles-valeurs");
  const spiraleEl = container?.querySelector("#spirale");
  if (!groupeCercles || !spiraleEl) return null;

  // Centre visuel de la spirale — même calcul que l'ancien système (bbox +
  // décalage manuel, le coup de pinceau n'étant pas parfaitement
  // symétrique, Isabel a calibré ce décalage à l'œil). Sert UNIQUEMENT à
  // trier les 10 cercles par angle (Correction 2) : leur position réelle
  // vient entièrement du SVG, ce centre ne positionne plus rien.
  const bbox = spiraleEl.getBBox();
  const DECALAGE_X = -6;
  const DECALAGE_Y = -6;
  const centre = {
    x: bbox.x + bbox.width / 2 + DECALAGE_X,
    y: bbox.y + bbox.height / 2 + DECALAGE_Y,
  };

  const cercles = Array.from(groupeCercles.children);

  cercles.forEach((cercle) => {
    const rectBBox = cercle.getBBox();
    const angle = angleHoraireDepuisCentre(
      rectBBox.x + rectBBox.width / 2,
      rectBBox.y + rectBBox.height / 2,
      centre
    );
    // Mémorisé sur l'élément (pas juste dans un tableau trié perdu au
    // prochain appel) : groupeCercles.children ci-dessus, à l'appel
    // suivant, redonnera cet ordre sans recalculer.
    cercle.dataset.ordreHoraire = angle;

    const valeurId = cercle.id.replace(/^cercle-valeur-/, "");
    cercle.dataset.valeurId = valeurId;
    cercle.style.cursor = "pointer";
    // tabindex : accessibilité clavier neuve ici (l'ancien système, souris
    // seulement, n'avait ni tabindex ni focus/blur) — même patron que les
    // perles du rail (shared/js/railParcours.js) : Tab pour atteindre
    // chaque cercle, la carte apparaît identiquement au survol ET au focus.
    cercle.setAttribute("tabindex", "0");
    cercle.setAttribute("role", "button");
    cercle.addEventListener("mouseenter", () => afficherCarteValeur(valeurId));
    cercle.addEventListener("focus", () => afficherCarteValeur(valeurId));
    cercle.addEventListener("mouseleave", () => cacherCarteValeur());
    cercle.addEventListener("blur", () => cacherCarteValeur());
  });

  // Tri par angle horaire (Correction 2) — ordre de stagger cohérent avec
  // "un après l'autre dans le sens horaire" (script de Déline), valide même
  // si l'arc n'est pas un cercle complet (5-5 de chaque côté, trou en haut
  // ET en bas plutôt qu'un seul — vérifié par calcul, jamais présumé).
  cercles.sort((a, b) => a.dataset.ordreHoraire - b.dataset.ordreHoraire);

  return cercles;
}

function afficherCarteValeur(valeurId) {
  const valeur = valeurs.find((v) => v.id === valeurId);
  const carte = document.getElementById("carte-valeur");
  if (!valeur || !carte) return;

  // Couleur du cercle survolé, lue par le CSS via cette variable (stroke plein,
  // fill à 70% d'opacité via color-mix() — voir timeline.css).
  carte.style.setProperty("--couleur-valeur-active", valeur.couleur);

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

// "Retour à l'état par défaut" du step D : la carte disparaît. Appelée au
// mouseleave/blur d'un cercle ET par hideLienValeurs() en quittant le step.
// Depuis cette tranche (14 septembre 2026) : plus de mot permanent séparé
// à réafficher ici — "Ishpenitamun"/Respect est maintenant l'un des 10
// cercles interactifs (cercle-valeur-respect), au même titre que les 9
// autres, plus un élément isolé sous la timeline (voir Registre — Correction
// 1 : ancienne étiquette + son bouton audio dédié retirés du HTML/CSS).
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
    timelineActuelle.call(() => definirPhraseParStep("lien-communaute", "gauche"), null, "<");
  } else {
    // Remet la phrase au bon état si on revient sur B depuis un step plus avancé.
    definirPhraseParStep("lien-communaute", "gauche");
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
    timelineActuelle.call(() => definirPhraseParStep("lien-territoire", "gauche"), null, "<");
    for (let i = 1; i <= 5; i++) {
      animerPerlesEnVague(c.querySelector(`#perles${i}`), timelineActuelle, "+=2");
    }
    // Posé après TOUTE la séquence (territoire + 5 vagues de perles), pas au
    // moment de la planifier — même précaution que showNuitDesTemps().
    timelineActuelle.call(() => { revele.territoire = true; });
  } else {
    definirPhraseParStep("lien-territoire", "gauche");
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
  positionnerElementsRelatifsSpirale();

  // Contrairement à A/B/C, D bascule vraiment à chaque entrée/sortie —
  // pas de garde "déjà révélé" ici, c'est voulu.
  gsap.set(cercles, { opacity: 0 });
  // reduitMouvement() : apparition directe des 10 cercles, sans stagger
  // animé (même réflexe que la plume du rail, shared/js/railParcours.js) —
  // absent de l'ancien système (jamais vérifié ici avant cette tranche),
  // ajouté en même temps que la révision du mécanisme d'apparition.
  if (reduitMouvement()) {
    gsap.set(cercles, { opacity: 1 });
  } else {
    timelineActuelle.to(cercles, { opacity: 1, duration: 0.4, stagger: 0.15 }, "+=3");
  }
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

  definirPhraseParStep("rupture-coloniale", "gauche");

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
  definirPhraseParStep("lien-territoire", "gauche");
}
