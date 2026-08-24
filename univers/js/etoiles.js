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

  dessiner({ nations, secteurs, noeuds, liens });
  console.log(`🌌 Univers : ${noeuds.length} étoiles réparties dans ${nations.length} constellations.`);
}

function dessiner({ nations, secteurs, noeuds, liens }) {
  // Scoping systématique : toutes les requêtes passent par universContainer,
  // jamais par document — convention non négociable du Playbook (§2.4).
  const svg = d3.select(universContainer)
    .append("svg")
    .attr("viewBox", `0 0 ${VUE.largeur} ${VUE.hauteur}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

  const tooltip = universContainer.querySelector("#univers-tooltip");

  // --- Lune (placeholder : à remplacer par le SVG de Déline) ---
  svg.append("circle")
    .attr("class", "lune-placeholder")
    .attr("cx", CENTRE.x)
    .attr("cy", CENTRE.y)
    .attr("r", RAYON_LUNE);

  // --- Arcs-étiquettes : nomment chaque nation ET servent de légende ---
  const groupeEtiquettes = svg.append("g").attr("class", "etiquettes");

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
  svg.append("g")
    .attr("class", "liens")
    .selectAll("line")
    .data(liens)
    .join("line")
    .attr("class", "lien-constellation")
    .attr("x1", d => d.source.x).attr("y1", d => d.source.y)
    .attr("x2", d => d.target.x).attr("y2", d => d.target.y);

  // --- Les étoiles ---
  const couleurParNation = Object.fromEntries(nations.map(n => [n.id, n.couleur]));
  const nomParNation = Object.fromEntries(nations.map(n => [n.id, n.nom]));

  svg.append("g")
    .attr("class", "etoiles")
    .selectAll("circle")
    .data(noeuds)
    .join("circle")
    .attr("class", "etoile")
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .attr("r", d => d.data.estModele ? 7 : 3.5)
    .attr("fill", d => couleurParNation[d.data.nation])
    // Repère de DÉVELOPPEMENT seulement : marque l'étoile modèle pour la retrouver
    // pendant les tests. La distinction visuelle destinée au public reste à
    // valider avec Déline et les artistes (S2B1T3).
    .attr("stroke", d => d.data.estModele ? "#fff" : "none")
    .attr("stroke-width", d => d.data.estModele ? 1.5 : 0)
    .on("mouseenter", (event, d) => {
      if (!tooltip) return;
      tooltip.style.display = "block";
      tooltip.innerHTML =
        `<strong>${nomParNation[d.data.nation]}</strong><br/>` +
        `Décennie (approx.) : ${d.data.decennieNaissanceApprox}`;
    })
    .on("mousemove", (event) => {
      if (!tooltip) return;
      tooltip.style.left = (event.clientX + 14) + "px";
      tooltip.style.top = (event.clientY + 14) + "px";
    })
    .on("mouseleave", () => {
      if (tooltip) tooltip.style.display = "none";
    });
}