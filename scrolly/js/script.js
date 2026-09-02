// ==================================================
// scrolly/js/script.js
// Point d'entrée de la Partie 2 — Scrollytelling
//
// Rôle : Initialiser la timeline à curseur, charger les steps (nouveaux +
// anciens de la v1), brancher le rail de navigation à 12 boutons
// (shared/js/railParcours.js) sur la mécanique existante, et déclencher
// l'apparition du bouton vers la Partie 3 une fois le dernier step atteint.
// Dépend de : scrolly/js/timeline.js, scrolly/js/timelineRail.js,
//   scrolly/js/steps/*.js, shared/js/i18n.js, shared/js/progression.js,
//   shared/js/railParcours.js
// Utilisé par : scrolly/index.html
//
// FF2EplusADA (scrollyFFADA2S v2)
// Isabel Cayer · Atelier Love & Code · 2026
// ==================================================

import { resolve } from "../../shared/js/i18n.js";
import { initTimeline, getOrder } from "./timeline.js";
import { initTimelineRail } from "./timelineRail.js";
import { initProgression, deverrouiller } from "../../shared/js/progression.js";
import { construireRailParcours, definirEtapeActive, rafraichirVerrous } from "../../shared/js/railParcours.js";

const PAGE_COURANTE = "scrolly/index.html";

async function afficherTexte(steps, stepId) {
  const contenu = steps[stepId];
  document.getElementById("texteStep").innerHTML = (contenu && contenu.titre)
    ? `<h2>${resolve(contenu.titre)}</h2><p>${resolve(contenu.texte)}</p>`
    : "";
}

async function init() {
  await initTimeline();
  await initProgression();

  const steps = await fetch("/scrolly/data/steps.json").then(r => r.json());

  const railEl = document.getElementById("rail");
  const titreEl = document.getElementById("titre-scene");
  const titreTexteEl = titreEl.querySelector("#titre-texte");
  const { allerAuStep } = initTimelineRail(railEl, titreEl);

  // afficherTexte reste appelé séparément à chaque navigation — timelineRail.js
  // ne connaît pas steps.json, il gère seulement le rail/curseur/titre/légendes
  const order = getOrder();
  let indexActuel = 0;
  let libelleActif = "";

  const allerEtAfficher = (index) => {
    indexActuel = index;
    const stepId = order[index].id;
    const contenu = steps[stepId];
    const texteTitre = contenu ? resolve(contenu.nomStep) : "";
    libelleActif = texteTitre;
    allerAuStep(index, texteTitre);
    afficherTexte(steps, stepId);
    definirEtapeActive(stepId);

    // Déblocage en chaîne, uniquement à l'intérieur du scrolly : `order` ne
    // contient que les 9 steps du scrolly, donc order[index + 1] est
    // toujours un step de la même page. La transition vers univers/valeurs
    // reste verrouillée ici — elle sera branchée plus tard sur les vrais
    // crochets de récompense (step11.js / transitionValeurs.js).
    const suivante = order[index + 1];
    if (suivante) {
      deverrouiller(suivante.id);
      rafraichirVerrous();
    }
  };

  // resolve() lit la langue active à chaque appel — rappeler allerEtAfficher()
  // sur le step courant suffit à tout retraduire. On reste sur le step actuel
  // plutôt que de revenir à 0, pour ne pas désorienter la personne qui change
  // de langue en cours de route.
  window.addEventListener("languagechange", () => {
    allerEtAfficher(indexActuel);
  });

  // Exposer pour que timelineRail.js (rail hérité, masqué) reste synchronisé
  // et déclenche afficherTexte à chaque clic/bouton via ce même pont.
  window.__scrollyAllerEtAfficher = allerEtAfficher;

  construireRailParcours(document.getElementById("rail-parcours"), {
    pageCourante: PAGE_COURANTE,
    onClicEtape: (etape) => {
      if (etape.page !== PAGE_COURANTE) {
        window.location.href = "../" + etape.page;
        return;
      }
      const idx = order.findIndex((e) => e.id === etape.id);
      if (idx !== -1) allerEtAfficher(idx);
    },
    onSurvolEtape: (etape) => {
      if (etape) {
        // Aperçu temporaire au survol : resolve(nomStep) pour les 9 du
        // scrolly, resolve(etape.nom) pour accueil/univers/valeurs (nom
        // traduisible dans parcours.json, la source partagée du rail).
        const contenu = steps[etape.id];
        titreTexteEl.textContent = contenu ? resolve(contenu.nomStep) : resolve(etape.nom);
      } else {
        titreTexteEl.textContent = libelleActif;
      }
    },
  });

  allerEtAfficher(0);
}

export { init };
