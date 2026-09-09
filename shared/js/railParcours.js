// ==================================================
// shared/js/railParcours.js
// Rail de navigation à 12 boutons — composant de présentation PUR
//
// Rôle : Construire le rail des 12 étapes du parcours (une pastille par
// étape, verrouillée ou non) et marquer l'étape active. Composant de
// PRÉSENTATION PUR : ne connaît ni goToStep, ni allerAuStep, ni aucune
// logique propre à scrolly/, univers/ ou valeurs/. Reçoit des callbacks
// de l'appelant (onClicEtape, onSurvolEtape) et se contente de les
// invoquer.
// Dépend de : shared/js/progression.js, shared/js/i18n.js (t — étiquette du
//   diviseur), shared/svg/rupture.svg (fetch — bande du point de rupture)
// Utilisé par : scrolly/js/script.js (univers/, valeurs/, landing à venir)
//
// FF2EplusADA (scrollyFFADA2S v2)
// Isabel Cayer · Atelier Love & Code · 2026
// ==================================================

import { obtenirParcours, estDeverrouille } from "./progression.js";
import { t } from "./i18n.js";

const DUREE_BULLE_MS = 1400;

// Construit (ou reconstruit) le rail dans `container`.
//   pageCourante  : valeur du champ "page" de parcours.json pour la page
//                   qui affiche ce rail — sert au repère "page-actuelle"
//                   et au routage dans onClicEtape (côté appelant).
//   onClicEtape   : (etape) => void — appelé SEULEMENT pour une étape
//                   déverrouillée, avec l'objet complet de parcours.json.
//   onSurvolEtape : (etape|null) => void — appelé à l'entrée (etape) et
//                   à la sortie (null) du survol/focus, verrouillé ou non.
export async function construireRailParcours(container, { pageCourante, onClicEtape, onSurvolEtape } = {}) {
  container.innerHTML = "";

  const etapes = obtenirParcours();
  let i = 0;

  // Regroupe les étapes consécutives qui partagent la même "page" — générique,
  // ne présume jamais un nombre fixe d'étapes par groupe. Si une autre page
  // héberge un jour plusieurs étapes, elle sera groupée et lignée pareil,
  // sans toucher à ce fichier.
  while (i < etapes.length) {
    const page = etapes[i].page;
    const groupe = [];
    while (i < etapes.length && etapes[i].page === page) {
      groupe.push(etapes[i]);
      i++;
    }

    const groupeEl = document.createElement("div");
    groupeEl.className = "groupe-etapes";
    if (groupe.length > 1) groupeEl.classList.add("avec-ligne-temps");

    // for...of (pas forEach) : construireDiviseurRupture() est async (fetch de
    // rupture.svg) — forEach n'attendrait pas le await, l'ordre d'insertion des
    // groupes suivants ne serait plus garanti.
    for (const etape of groupe) {
      const bouton = construireBouton(etape, { pageCourante, onClicEtape, onSurvolEtape });
      groupeEl.appendChild(bouton);

      // Bande "Colonisation" insérée après l'étape epoque:"rupture" — dérivé
      // de la donnée, jamais d'une position codée en dur (aujourd'hui : entre
      // rupture-coloniale et hommage-victimes).
      if (etape.epoque === "rupture") {
        groupeEl.appendChild(await construireDiviseurRupture());
      }
    }

    container.appendChild(groupeEl);
  }

  rafraichirVerrous();
}

// Extrait de l'ancienne boucle forEach — construction d'un seul bouton,
// inchangée dans son comportement, juste isolée pour être appelée par
// groupe plutôt que directement sur tout le parcours.
function construireBouton(etape, { pageCourante, onClicEtape, onSurvolEtape }) {
  const bouton = document.createElement("button");
  bouton.type = "button";
  bouton.className = "etape-bouton";
  bouton.dataset.etapeId = etape.id;
  // Libellé temporaire : l'id brut, tant qu'on n'a pas de vrai titre
  // pour les 12 étapes (pas juste les 9 du scrolly).
  bouton.setAttribute("aria-label", etape.id);
  if (etape.epoque) bouton.dataset.epoque = etape.epoque; // pilote le fill via CSS

  if (etape.page === pageCourante) bouton.classList.add("page-actuelle");

  // Ancre INVISIBLE pour le curseur plume (railPlume.js la cherche via .numero) —
  // plus de chiffre affiché (demande du 4 septembre), même emplacement qu'avant
  // pour ne pas déplacer, comme effet de bord, l'endroit où la plume se pose.
  const numero = document.createElement("span");
  numero.className = "numero";
  bouton.appendChild(numero);

  if (etape.id === "accueil") {
    // Grande icône maison, séparée de l'ancre invisible ci-dessus — standard de
    // lecture universel pour "retour à l'accueil".
    const icone = document.createElement("span");
    icone.className = "icone-accueil";
    icone.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" fill="#222"/></svg>';
    bouton.appendChild(icone);
  }

  // Vérifie estDeverrouille(etape.id) EN DIRECT à chaque clic plutôt que
  // de se fier à une variable capturée à la construction — sinon un
  // déblocage survenu après la construction du rail ne serait jamais
  // pris en compte tant que le bouton n'a pas explicitement été
  // reconstruit.
  bouton.addEventListener("click", () => {
    if (!estDeverrouille(etape.id)) {
      afficherBulleVerrouillee(bouton);
      return;
    }
    if (onClicEtape) onClicEtape(etape);
  });

  if (onSurvolEtape) {
    const entrer = () => onSurvolEtape(etape);
    const sortir = () => onSurvolEtape(null);
    bouton.addEventListener("mouseenter", entrer);
    bouton.addEventListener("focus", entrer);
    bouton.addEventListener("mouseleave", sortir);
    bouton.addEventListener("blur", sortir);
  }

  return bouton;
}

// Bande décorative (shared/svg/rupture.svg — coup de pinceau vertical, chargée en
// direct comme plume.svg) + étiquette "Colonisation" — marque visuellement le
// point de rupture sur la timeline du rail, insérée après l'étape epoque:"rupture"
// (voir l'appel dans construireRailParcours).
let ecouteurLangueBranche = false;

async function construireDiviseurRupture() {
  const diviseur = document.createElement("span");
  diviseur.className = "diviseur-rupture";
  // Décoratif — "Colonisation" est déjà porté par le titre/texte narratif du step
  // rupture-coloniale lui-même pour les technologies d'assistance, pas besoin de
  // le répéter ici.
  diviseur.setAttribute("aria-hidden", "true");

  // Chargée en direct (fetch + inline), même patron que railPlume.js. new URL(...,
  // import.meta.url) : chemin relatif au FICHIER, résout correctement quelle que
  // soit la page (scrolly/univers/valeurs) ou le sous-dossier de déploiement.
  try {
    const reponse = await fetch(new URL("../svg/rupture.svg", import.meta.url));
    // fetch ne rejette pas sur un 404 — vérifier .ok comme railPlume.js, sinon
    // reponse.text() renverrait le corps de la page d'erreur et querySelector("svg")
    // échouerait en silence (diviseur sans bande, aucun message).
    if (!reponse.ok) throw new Error(`HTTP ${reponse.status}`);
    const texte = await reponse.text();
    const enveloppe = document.createElement("div");
    enveloppe.innerHTML = texte;
    const svg = enveloppe.querySelector("svg");
    if (svg) {
      svg.classList.add("diviseur-rupture-stripe");
      diviseur.appendChild(svg);
    }
  } catch (err) {
    console.error("❌ Impossible de charger shared/svg/rupture.svg :", err);
  }

  const etiquette = document.createElement("span");
  etiquette.className = "diviseur-rupture-etiquette";
  etiquette.textContent = t("legende.colonisation");
  diviseur.appendChild(etiquette);

  // Retraduit si la langue change APRÈS la construction du rail (celui-ci n'est
  // construit qu'une fois par chargement de page) — écouteur branché une seule
  // fois, peu importe combien de fois construireRailParcours() est rappelée.
  if (!ecouteurLangueBranche) {
    ecouteurLangueBranche = true;
    window.addEventListener("languagechange", () => {
      document.querySelectorAll(".diviseur-rupture-etiquette").forEach((el) => {
        el.textContent = t("legende.colonisation");
      });
    });
  }

  return diviseur;
}

// Retire "actif" de tous les boutons du rail et l'ajoute à celui dont
// l'id correspond. Séparé de la construction : l'appelant le rappelle à
// chaque navigation réussie, sans reconstruire tout le rail.
export function definirEtapeActive(id) {
  document.querySelectorAll(".rail-parcours .etape-bouton").forEach((b) => {
    b.classList.toggle("actif", b.dataset.etapeId === id);
  });
}

// Re-synchronise l'état visuel (grisé + 🔒 + aria-disabled) de TOUS les
// boutons du rail avec l'état réel de progression.js — à appeler par
// l'appelant après chaque deverrouiller(), pas seulement à la
// construction initiale. Ne reconstruit rien, ne touche pas aux
// écouteurs d'événements (ceux-ci vérifient déjà l'état en direct,
// voir le handler de clic de construireRailParcours). Verrouillé mais
// jamais `disabled` : le bouton reste focusable pour montrer son titre
// au survol/focus et afficher la bulle au clic (Registre, persona).
export function rafraichirVerrous() {
  document.querySelectorAll(".rail-parcours .etape-bouton").forEach((bouton) => {
    const id = bouton.dataset.etapeId;
    const verrouille = !estDeverrouille(id);
    bouton.classList.toggle("verrouille", verrouille);
    if (verrouille) {
      bouton.setAttribute("aria-disabled", "true");
    } else {
      bouton.removeAttribute("aria-disabled");
    }
  });
}

// Bulle "Pas encore débloqué" à côté du bouton, ~1,4 s, une seule à la
// fois dans le rail.
function afficherBulleVerrouillee(bouton) {
  const rail = bouton.closest(".rail-parcours") || bouton.parentElement;
  rail.querySelectorAll(".bulle-verrouillee").forEach((b) => b.remove());

  const bulle = document.createElement("span");
  bulle.className = "bulle-verrouillee";
  bulle.textContent = "Pas encore débloqué";
  bouton.appendChild(bulle);

  requestAnimationFrame(() => bulle.classList.add("visible"));
  setTimeout(() => {
    bulle.classList.remove("visible");
    setTimeout(() => bulle.remove(), 250); // après le fondu (transition 0.2s)
  }, DUREE_BULLE_MS);
}
