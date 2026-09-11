// ==================================================
// shared/js/timelineTest.js
// TEMPORAIRE — Tranche A de validation de timeline.svg (10-11 septembre 2026)
//
// Rôle : Charger shared/svg/timeline/timeline.svg à sa taille native, dans un
// conteneur clairement identifié "TEST", en PARALLÈLE du Rail à 12 boutons
// actuellement en production — jamais branché au flux de navigation réel.
// Sert uniquement à valider que le fichier s'affiche correctement et que ses
// IDs sont ciblables dans un vrai navigateur, avant toute intégration réelle
// (Tranche B, pas encore commencée). Refonte confirmée le 10 septembre :
// timeline.svg remplacera éventuellement les boutons DOM/CSS du Rail à 12
// boutons + plume.svg séparé, mais en tranches isolées (leçon du faux départ
// du 10 septembre : une architecture non vérifiée a fait perdre un prompt).
//
// ⚠️ Ce fichier n'est appelé par AUCUN autre fichier du projet — aucune page
// ne le charge automatiquement. Invocation manuelle depuis la console du
// navigateur uniquement (voir synthèse pour la commande exacte). À SUPPRIMER
// une fois la validation terminée : ne fait partie d'aucun flux de
// production et ne doit jamais être importé par script.js/index.html.
//
// ⚠️ perle_noire1/2/3 existent AUSSI dans shared/svg/timeline/plume.svg (le
// curseur du Rail à 12 boutons, chargé en direct par railPlume.js et déjà
// affiché sur la page pendant ce test). Les deux fichiers sont donc présents
// simultanément dans le DOM le temps du test — ces 3 id sont dupliqués.
// Toute requête ici est scopée au conteneur de test (jamais
// document.getElementById/querySelector global), pour ne jamais risquer de
// cibler la plume du Rail à 12 boutons par erreur (Playbook §2.4).
//
// Dépend de : shared/js/utils.js (loadSVG)
// Utilisé par : rien en production — invocation manuelle (console)
//
// FF2EplusADA (scrollyFFADA2S v2)
// Isabel Cayer · Atelier Love & Code · 2026
// ==================================================

import { loadSVG } from "./utils.js";

const CONTAINER_ID = "timeline-test-conteneur";
const SVG_WRAPPER_ID = "timeline-test-svg";

// Chemin relatif à la PAGE (loadSVG() fait fetch(path) directement, pas de
// new URL(..., import.meta.url) — même limitation que les autres appels
// existants de loadSVG() dans le projet, ex. avantColonisation.js). univers/
// et scrolly/ sont à la même profondeur depuis la racine, donc ce chemin
// fonctionne identiquement lancé depuis l'une ou l'autre page — même
// référence que curseurEl.src dans timelineRail.js.
const CHEMIN_TIMELINE_SVG = "../shared/svg/timeline/timeline.svg";

export async function testerTimelineSVG() {
  // Pré-créer et pré-styler le conteneur AVANT d'appeler loadSVG() : la
  // fonction ne crée/style un conteneur QUE s'il est absent (voir son code,
  // shared/js/utils.js) — sinon elle réutilise tel quel celui qu'on lui
  // passe. Ses valeurs par défaut (position absolute, 100%/100%, opacity:0,
  // z-index:1500) sont pensées pour l'empilement de steps de scrolly/, pas
  // pour un test isolé affiché à taille native — on prend donc le contrôle
  // complet plutôt que d'en hériter.
  let conteneur = document.getElementById(CONTAINER_ID);
  if (!conteneur) {
    conteneur = document.createElement("div");
    conteneur.id = CONTAINER_ID;
    Object.assign(conteneur.style, {
      position: "fixed",
      bottom: "10px",
      left: "10px",
      width: "1080px",
      maxWidth: "95vw",
      background: "#fff",
      border: "4px solid magenta",
      zIndex: "999999", // au-dessus de tout, y compris .rail-parcours (z-index:2000)
      padding: "6px",
      boxSizing: "border-box",
    });

    const etiquette = document.createElement("div");
    etiquette.textContent = "TEST — timeline v2 (temporaire, à retirer)";
    Object.assign(etiquette.style, {
      font: "bold 12px sans-serif",
      color: "magenta",
      marginBottom: "4px",
    });
    conteneur.appendChild(etiquette);

    document.body.appendChild(conteneur);
  }

  // Wrapper interne dédié au SVG : loadSVG() fait container.innerHTML = text
  // sur le conteneur qu'on lui passe — si on lui passait CONTAINER_ID
  // directement, ça effacerait l'étiquette ci-dessus à chaque appel.
  let wrapper = document.getElementById(SVG_WRAPPER_ID);
  if (!wrapper) {
    wrapper = document.createElement("div");
    wrapper.id = SVG_WRAPPER_ID;
    conteneur.appendChild(wrapper);
  }

  const resultat = await loadSVG(CHEMIN_TIMELINE_SVG, SVG_WRAPPER_ID, CONTAINER_ID);
  if (!resultat) {
    console.error("❌ TEST timeline.svg : échec du chargement (voir l'erreur loadSVG ci-dessus)");
    return null;
  }

  // À sa taille native (1080.25 × 140.25, viewBox du fichier) plutôt que les
  // 100%/100% par défaut de loadSVG() — demande explicite du prompt.
  const svgEl = resultat.querySelector("svg");
  if (svgEl) {
    svgEl.style.width = "1080px";
    svgEl.style.height = "auto";
    svgEl.style.display = "block";
  } else {
    console.error("❌ TEST timeline.svg : chargé, mais aucun <svg> trouvé dans le markup — fichier corrompu ?");
  }

  verifierSelecteurs(resultat);
  return resultat;
}

// Correction 2 : confirme EXPLICITEMENT (jamais présumé) que chaque
// sélecteur clé retourne un élément une fois chargé dans le DOM réel —
// scopé au conteneur de test (resultat), jamais document.querySelector
// global (voir l'avertissement perle_noire1/2/3 en en-tête de ce fichier).
function verifierSelecteurs(conteneurSvg) {
  const attendus = [
    ...Array.from({ length: 10 }, (_, i) => `perle_step${i + 1}`),
    "bouton_accueil", "bouton_valeur",
    "perle_noire1", "perle_noire2", "perle_noire3",
    "rupture_stripe",
  ];

  console.log("🧪 TEST timeline.svg — résultat des sélecteurs (scopés au conteneur de test, pas document global) :");
  let manquants = 0;
  attendus.forEach((id) => {
    const el = conteneurSvg.querySelector(`#${id}`);
    if (!el) manquants++;
    console.log(`${el ? "✅" : "❌"} #${id}`, el || "(introuvable)");
  });
  console.log(manquants === 0
    ? "🧪 Tous les sélecteurs attendus ont été trouvés."
    : `🧪 ${manquants} sélecteur(s) introuvable(s) — voir le détail ci-dessus.`);
}

// Exposé sur window pour invocation manuelle depuis la console — voir
// synthèse pour la commande exacte à coller.
window.testerTimelineSVG = testerTimelineSVG;
