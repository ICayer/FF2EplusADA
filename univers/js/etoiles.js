// ==================================================
// univers/js/etoiles.js
// Rendu de la carte du ciel : 221 étoiles en constellations, Lune au centre
//
// Rôle : Charger les données, demander la disposition à constellations.js,
// puis dessiner le tout (Lune, étoiles, traits, arcs-étiquettes). Gère aussi
// le survol ; le clic vers le récit complet arrive en S2B3T1 (testimonyModal.js).
// Dépend de : univers/js/constellations.js, univers/data/etoiles.json,
//             univers/data/nations.json, d3 (global, CDN)
// Utilisé par : univers/index.html
//
// FF2EplusADA (scrollyFFADA2S v2)
// Isabel Cayer · Atelier Love & Code · 2026
// ==================================================

import { calculerDisposition, cheminArc } from "./constellations.js";
import { initTestimonyModal, showTestimony } from "./testimonyModal.js";

// --- Réglages visuels ---
// Tout est en coordonnées du viewBox (1000 x 1000), pas en pixels d'écran :
// le SVG s'adapte ensuite à la taille de la fenêtre sans que ces valeurs changent.
const VUE = { largeur: 1000, hauteur: 1000 };
const CENTRE = { x: VUE.largeur / 2, y: VUE.hauteur / 2 };
const RAYON_LUNE = 60;
const RAYON_ETIQUETTES = 470;
const RAYON_MIN_ETOILES = 130; // les étoiles ne s'approchent pas trop de la Lune
const RAYON_MAX_ETOILES = 430; // ni trop des étiquettes

const ORDRE_DECENNIES = ['1950s','1960s','1970s','1980s','1990s','2000s','2010s','2020s'];

// Coordonnées du centre de la Lune DANS le fichier lune.svg extrait
// (calculées le 24 août à partir de step10_lune_etoile.svg — voir Registre).
// Si lune.svg est un jour remplacé par un nouvel export, ces deux valeurs
// devront être recalculées en même temps.
const LUNE_CENTRE_SOURCE = { x: 238.07, y: 60.60 };

let universContainer = null;

/**
 * Point d'entrée : construit la carte du ciel dans le conteneur donné.
 * @param {string} selecteurConteneur - ex. "#univers-canvas"
 */
export async function initUnivers(selecteurConteneur = "#univers-canvas") {
  universContainer = document.querySelector(selecteurConteneur);
  if (!universContainer) {
    console.error(`❌ Conteneur introuvable : ${selecteurConteneur}`);
    return;
  }

  // Chemins RELATIFS à univers/index.html — pas de chemin absolu commençant par "/",
  // qui casserait si le site est publié dans un sous-dossier (ex. GitHub Pages).
  const [nations, etoiles] = await Promise.all([
    d3.json("./data/nations.json"),
    d3.json("./data/etoiles.json")
  ]);

  const { secteurs, noeuds, liens } = calculerDisposition(nations, etoiles, {
    centre: CENTRE,
    rayonMin: RAYON_MIN_ETOILES,
    rayonMax: RAYON_MAX_ETOILES,
    ordreDecennies: ORDRE_DECENNIES
  });

  initTestimonyModal(selecteurConteneur);
  await dessiner({ nations, secteurs, noeuds, liens });
  console.log(`🌌 Univers : ${noeuds.length} étoiles réparties dans ${nations.length} constellations.`);
}

async function dessiner({ nations, secteurs, noeuds, liens }) {
  // Scoping systématique : toutes les requêtes passent par universContainer,
  // jamais par document — convention non négociable du Playbook (§2.4).
  const svg = d3.select(universContainer)
    .append("svg")
    .attr("viewBox", `0 0 ${VUE.largeur} ${VUE.hauteur}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

  const tooltip = universContainer.querySelector("#univers-tooltip");

  // --- Lune (extraite de step10_lune_etoile.svg, calque "PleineLune" — voir Registre) ---
  const luneMarkup = await d3.text("./svg/lune.svg");
  const luneParsee = new DOMParser().parseFromString(luneMarkup, "image/svg+xml");
  const groupeLuneSource = luneParsee.querySelector("g#lune");

  const groupeLune = svg.append("g").attr("class", "lune").style("opacity", 0);
  // On importe le contenu réel (les 256 paths) tel quel — pas de <foreignObject>,
  // pas de <use> avec un fichier externe séparé : le SVG est directement inséré
  // dans le DOM, donc le style et les animations GSAP s'appliquent normalement.
  groupeLune.node().appendChild(document.importNode(groupeLuneSource, true));

  const echelle = (RAYON_LUNE * 2) / 55.64; // 55.64 = largeur du bbox source mesurée
  groupeLune.attr(
    "transform",
    `translate(${CENTRE.x - echelle * LUNE_CENTRE_SOURCE.x}, ${CENTRE.y - echelle * LUNE_CENTRE_SOURCE.y}) scale(${echelle})`
  );

  // --- Arcs-étiquettes : nomment chaque nation ET servent de légende ---
  const groupeEtiquettes = svg.append("g").attr("class", "etiquettes").style("opacity", 0);

  nations.forEach(n => {
    const sect = secteurs[n.id];
    const pathId = `arc-${n.id}`;

    // Dans la moitié basse du cercle, on inverse le sens de tracé pour que le
    // texte reste lisible à l'endroit (sinon textPath l'affiche renversé).
    const estEnBas = sect.milieu > Math.PI / 2 && sect.milieu < (3 * Math.PI) / 2;

    groupeEtiquettes.append("path")
      .attr("id", pathId)
      .attr("class", "arc-etiquette-path")
      .attr("d", cheminArc(sect.debut, sect.fin, RAYON_ETIQUETTES, CENTRE, estEnBas));

    groupeEtiquettes.append("text")
      .attr("class", "arc-etiquette-texte")
      .attr("fill", n.couleur) // repère visuel : l'étiquette porte la couleur de ses étoiles
      .attr("dy", estEnBas ? 14 : -6)
      .append("textPath")
      .attr("href", `#${pathId}`)
      .attr("startOffset", "50%")
      .attr("text-anchor", "middle")
      .text(n.nom);
  });

  // --- Traits de constellation (dessinés AVANT les étoiles pour passer dessous) ---
  const groupeLiens = svg.append("g").attr("class", "liens").style("opacity", 0);
  groupeLiens
    .selectAll("line")
    .data(liens)
    .join("line")
    .attr("class", "lien-constellation")
    .attr("x1", d => d.source.x).attr("y1", d => d.source.y)
    .attr("x2", d => d.target.x).attr("y2", d => d.target.y);

  // --- Les étoiles ---
  const couleurParNation = Object.fromEntries(nations.map(n => [n.id, n.couleur]));
  const nomParNation = Object.fromEntries(nations.map(n => [n.id, n.nom]));
  const nationParId = Object.fromEntries(nations.map(n => [n.id, n]));

  function contenuTooltip(d) {
    const p = d.data.portrait;
    const nomNation = nomParNation[d.data.nation];
    const aDuContenu = p.prenom || p.communaute || p.motRevelateur;

    if (!aDuContenu) {
      return `<strong>${nomNation}</strong><br/>` +
             `Décennie (approx.) : ${d.data.decennieNaissanceApprox}<br/>` +
             `<em>Récit à venir</em>`;
    }

    return [
      p.prenom ? `<strong>${p.prenom}</strong>` : `<strong>${nomNation}</strong>`,
      p.dateNaissance || null,
      p.communaute || null,
      p.motRevelateur ? `« ${p.motRevelateur} »` : null
    ].filter(Boolean).join("<br/>");
  }

  const groupeEtoilesEl = svg.append("g").attr("class", "etoiles");

  const selectionEtoiles = groupeEtoilesEl
    .selectAll("circle")
    .data(noeuds)
    .join("circle")
    .attr("class", "etoile")
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .attr("r", d => d.data.estModele ? 7 : 3.5)
    .attr("fill", d => couleurParNation[d.data.nation])
    .style("opacity", 0) // révélées par la timeline d'entrée, pas instantanément
    // Repère de DÉVELOPPEMENT seulement : marque l'étoile modèle pour la retrouver
    // pendant les tests. La distinction visuelle destinée au public reste à
    // valider avec Déline et les artistes (S2B1T3).
    .attr("stroke", d => d.data.estModele ? "#fff" : "none")
    .attr("stroke-width", d => d.data.estModele ? 1.5 : 0)
    .on("mouseenter", (event, d) => {
      if (!tooltip) return;
      tooltip.style.display = "block";
      tooltip.innerHTML = contenuTooltip(d);
    })
    .on("mousemove", (event) => {
      if (!tooltip) return;
      tooltip.style.left = (event.clientX + 14) + "px";
      tooltip.style.top = (event.clientY + 14) + "px";
    })
    .on("mouseleave", () => {
      if (tooltip) tooltip.style.display = "none";
    })
    .on("click", (event, d) => {
      showTestimony(d.data, nationParId[d.data.nation]);
    });

  // --- Entrée en scène progressive : la voie lactée seule d'abord, puis la
  // visualisation apparaît par couches (Lune → étiquettes → liens → étoiles),
  // jamais tout d'un coup. Respecte prefers-reduced-motion (voir style.css). ---
  const reduireAnimation = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const dureeBase = reduireAnimation ? 0.01 : 1;

  const timelineEntree = gsap.timeline({ delay: reduireAnimation ? 0 : 0.4 });
  timelineEntree
    .to(groupeLune.node(), { opacity: 1, duration: dureeBase * 1.8, ease: "power2.out" })
    .to(groupeEtiquettes.node(), { opacity: 1, duration: dureeBase * 1.2, ease: "power1.out" }, "-=0.8")
    .to(groupeLiens.node(), { opacity: 1, duration: dureeBase * 1, ease: "power1.out" }, "-=0.4")
    .to(selectionEtoiles.nodes(), {
      opacity: 1,
      duration: dureeBase * 1.2,
      stagger: reduireAnimation ? 0 : { amount: 1.6, from: "random" },
      ease: "power1.out"
    }, "-=0.3");
}