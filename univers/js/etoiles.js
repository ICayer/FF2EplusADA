// ==================================================
// univers/js/etoiles.js
// Rendu de la carte du ciel : 221 étoiles en constellations, Lune au centre
//
// Rôle : Charger les données, demander la disposition à constellations.js,
// puis dessiner le tout (Lune, étoiles, traits, arcs-étiquettes). Gère aussi
// le survol ; le clic vers le récit complet arrive en S2B3T1 (testimonyModal.js).
// Dépend de : univers/js/constellations.js, univers/data/etoiles.json,
//             univers/data/nations.json, shared/js/i18n.js (t),
//             d3 (global, CDN)
// Utilisé par : univers/index.html
//
// FF2EplusADA (scrollyFFADA2S v2)
// Isabel Cayer · Atelier Love & Code · 2026
// ==================================================

import { calculerDisposition, cheminArc } from "./constellations.js";
import { initTestimonyModal, showTestimony } from "./testimonyModal.js";
import { initConditionSortie, lancerTransitionValeurs } from "./transitionValeurs.js";
import { t } from "../../shared/js/i18n.js";

// Positionne le bouton juste à l'extérieur du cercle des mémoires (bord droit, 3h),
// converti en coordonnées d'écran réelles via la matrice de transformation du SVG —
// reste juste peu importe la taille de la fenêtre, contrairement à une position
// d'écran codée en dur. Évite le centre de la visualisation, où une étoile-témoignage
// pourrait un jour se trouver.
function positionnerBoutonExplorer(boutonEl, svgEl) {
  if (!boutonEl || !svgEl) return;
  const pt = svgEl.createSVGPoint();
  pt.x = CENTRE.x + RAYON_ETIQUETTES;
  pt.y = CENTRE.y;
  const ptEcran = pt.matrixTransform(svgEl.getScreenCTM());

  boutonEl.style.left = `${ptEcran.x + 148}px`; // quelques pixels au-delà du cercle — à l'œil
  boutonEl.style.top = `${ptEcran.y}px`;
}

// --- Réglages visuels ---
// Tout est en coordonnées du viewBox (1000 x 1000), pas en pixels d'écran :
// le SVG s'adapte ensuite à la taille de la fenêtre sans que ces valeurs changent.
const VUE = { largeur: 1000, hauteur: 1000 };
const CENTRE = { x: VUE.largeur / 2, y: VUE.hauteur / 2 };
const RAYON_LUNE = 60;
const RAYON_ETIQUETTES = 470;
const RAYON_MIN_ETOILES = 130; // les étoiles ne s'approchent pas trop de la Lune
const RAYON_MAX_ETOILES = 430; // ni trop des étiquettes
const RAYON_ETOILE_TEMOIGNAGE = 10; // était 7 codé en dur — grossie, à ajuster à l'œil
const RAYON_ETOILE_DEFAUT = 3.5;

const ORDRE_DECENNIES = ['1950s','1960s','1970s','1980s','1990s','2000s','2010s','2020s'];

// Coordonnées du centre de la Lune DANS le fichier lune.svg extrait
// (calculées le 24 août à partir de step10_lune_etoile.svg — voir Registre).
// Si lune.svg est un jour remplacé par un nouvel export, ces deux valeurs
// devront être recalculées en même temps.
const LUNE_CENTRE_SOURCE = { x: 238.07, y: 60.60 };

// --- Masque terrain (univers/assets/terrain_masque.png) ---
// ÉTAPE 0 (audit fait avant d'écrire ce mapping, grep -rn "milkyway" univers/css/) :
// la règle qui affiche le fond (univers/css/style.css, #univers-canvas) est
//   background-image: url("milkyway.webp");
//   background-size: cover;
//   background-position: bottom 140px center;
//   background-repeat: no-repeat;
// posée sur #univers-canvas LUI-MÊME, pas sur le <svg> enfant — le fond se peint
// donc sur la boîte de PADDING de #univers-canvas (background-origin: padding-box,
// valeur par défaut), qui INCLUT le padding 24px/140px ajouté au point D. C'est
// l'INVERSE du calcul de lettrboxing du ciel étoilé plus bas (qui mesure
// svg.node(), plus petit que le conteneur à cause de ce même padding) : ici, il
// faut mesurer universContainer, jamais svg.node() — présumer le mauvais élément
// donnerait un mapping qui semble correct à une taille de fenêtre mais décroche à
// une autre. "background-position: bottom 140px" ancre le bord BAS de l'image à
// (hauteurConteneur - 140) EXACTEMENT, quelle que soit la marge verticale laissée
// par "cover" — donc le bas réel de l'image (terrain/horizon) tombe toujours sur
// la même ligne que le bord bas du <svg> (padding-bottom: 140px). Dimensions
// natives de terrain_masque.png vérifiées via son en-tête PNG (IHDR) : 2000×1000,
// RGBA — alignées pixel pour pixel avec milkyway.webp (mêmes dimensions), comme
// affirmé par Isabel.
function ecranVersPixelMasque(xEcran, yEcran, elementFond) {
  const rect = elementFond.getBoundingClientRect();
  const echelle = Math.max(rect.width / 2000, rect.height / 1000); // background-size: cover
  const renduLargeur = 2000 * echelle;
  const renduHauteur = 1000 * echelle;

  const decalageGauche = (rect.width - renduLargeur) / 2; // background-position: ... center
  const decalageHaut = (rect.height - 140) - renduHauteur; // background-position: bottom 140px ...

  return {
    x: ((xEcran - rect.left) - decalageGauche) / echelle,
    y: ((yEcran - rect.top) - decalageHaut) / echelle
  };
}

// Chargé UNE SEULE FOIS (canvas hors-écran, jamais ajouté au DOM) — getImageData()
// est l'opération coûteuse, appelée une fois sur toute l'image plutôt qu'une fois
// par étoile candidate (le rejet peut tourner plusieurs centaines de fois pour 221
// étoiles). testTerrain() ne fait ensuite que lire un pixel déjà en mémoire.
let donneesMasqueTerrain = null; // ImageData, ou null tant que non chargé

async function chargerMasqueTerrain() {
  try {
    const img = new Image();
    const pret = new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });
    img.src = new URL("../assets/terrain_masque.png", import.meta.url).href;
    await pret;

    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    donneesMasqueTerrain = ctx.getImageData(0, 0, canvas.width, canvas.height);
  } catch (err) {
    console.error("❌ Impossible de charger univers/assets/terrain_masque.png :", err);
    // donneesMasqueTerrain reste null — testTerrain() ne rejette alors plus rien
    // (dégradation : des étoiles peuvent retomber sur le terrain plutôt que de
    // bloquer tout le rendu du ciel).
  }
}

// true si le pixel du masque à (xMasque, yMasque) est opaque (terrain, à rejeter).
// Coordonnées hors limites ou masque non chargé traités comme "pas du terrain" —
// jamais présumés terrain par défaut, pour ne jamais bloquer le rendu du ciel.
function testTerrain(xMasque, yMasque) {
  if (!donneesMasqueTerrain) return false;
  const x = Math.round(xMasque);
  const y = Math.round(yMasque);
  if (x < 0 || y < 0 || x >= donneesMasqueTerrain.width || y >= donneesMasqueTerrain.height) return false;
  const indexAlpha = (y * donneesMasqueTerrain.width + x) * 4 + 3;
  return donneesMasqueTerrain.data[indexAlpha] > 0;
}

let universContainer = null;
let signalerInteractionFn = null; // référence mise à jour après initConditionSortie()

/**
 * Point d'entrée : construit la carte du ciel dans le conteneur donné.
 * @param {string} selecteurConteneur - ex. "#univers-canvas"
 */
export async function initUnivers(selecteurConteneur = "#univers-canvas") {
  // initI18n() est appelé par le bootstrap de univers/index.html, AVANT
  // initHeaderControls() et cette fonction — pas ici (sinon course : l'UI
  // de l'en-tête se construirait avant que la langue sauvegardée soit
  // appliquée). getLanguage()/t() reflètent déjà la bonne langue ici.
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

  // Seules les étoiles ayant un vrai témoignage entrent dans le système organisé
  // (secteur de nation, décennie, couleur, traits de constellation) — les autres
  // deviennent un ciel étoilé anonyme, générées dans dessiner() (S2B1T3bis).
  const etoilesTemoignage = etoiles.filter(e => e.estModele);
  const nbEtoilesCiel = etoiles.length - etoilesTemoignage.length;

  const { secteurs, noeuds, liens } = calculerDisposition(nations, etoilesTemoignage, {
    centre: CENTRE,
    rayonMin: RAYON_MIN_ETOILES,
    rayonMax: RAYON_MAX_ETOILES,
    ordreDecennies: ORDRE_DECENNIES
  });

  initTestimonyModal(selecteurConteneur);
  const resultats = await dessiner({ nations, secteurs, noeuds, liens, nbEtoilesCiel });

  const boutonTransition = document.getElementById("bouton-explorer-valeurs");
  const svgEl = resultats.svg.node();

  if (boutonTransition) {
    boutonTransition.textContent = t("nav.explorerValeurs");
    positionnerBoutonExplorer(boutonTransition, svgEl);
    window.addEventListener("resize", () => positionnerBoutonExplorer(boutonTransition, svgEl));
  }
  window.addEventListener("languagechange", () => {
    if (boutonTransition) boutonTransition.textContent = t("nav.explorerValeurs");
  });

  const { signalerInteraction } = initConditionSortie(() => {
    // La condition est atteinte : on RÉVÈLE le bouton, on ne lance rien tout
    // seul — la personne décide elle-même du moment (décision du 24 août).
    if (boutonTransition) boutonTransition.classList.add("visible");
  });
  signalerInteractionFn = signalerInteraction;

  if (boutonTransition) {
    boutonTransition.addEventListener("click", (e) => {
      e.preventDefault();
      boutonTransition.classList.remove("visible"); // évite un double-clic pendant l'animation
      lancerTransitionValeurs({
        svg: resultats.svg,
        groupeLune: resultats.groupeLune,
        echelleLuneActuelle: resultats.echelle,
        luneCentreSource: LUNE_CENTRE_SOURCE,
        selectionEtoiles: resultats.selectionEtoiles,
        groupeEtiquettes: resultats.groupeEtiquettes,
        groupeGlow: resultats.groupeGlow,
        canvasEl: universContainer,
        centre: CENTRE
      });
    });
  }

  console.log(`🌌 Univers : ${noeuds.length} étoile(s)-témoignage dans ${nations.length} constellations, ${nbEtoilesCiel} étoiles anonymes dans le ciel.`);
}

async function dessiner({ nations, secteurs, noeuds, liens, nbEtoilesCiel }) {
  // Scoping systématique : toutes les requêtes passent par universContainer,
  // jamais par document — convention non négociable du Playbook (§2.4).
  const svg = d3.select(universContainer)
    .append("svg")
    .attr("viewBox", `0 0 ${VUE.largeur} ${VUE.hauteur}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

  // Lancé tôt (pas attendu tout de suite) pour chevaucher son temps de chargement
  // avec la mise en place synchrone du SVG ci-dessous — attendu juste avant d'en
  // avoir besoin (positionCiel(), plus bas).
  const masqueTerrainPromise = chargerMasqueTerrain();

  const tooltip = universContainer.querySelector("#univers-tooltip");

  // --- Ciel étoilé : densité visuelle seulement, AUCUN lien avec etoiles.json au-delà
  // du compte total — même principe que step11.js (gouvernance, voir Registre 24 août).
  // Dispersion par rejet plutôt que angle+rayon aléatoires : une distribution uniforme
  // du RAYON donnerait un anneau visiblement plus dense près du cercle des mémoires
  // (l'aire d'un anneau croît avec le rayon) — le rejet sur des points (x,y) uniformes
  // dans le carré donne une dispersion réellement uniforme, comme un vrai ciel.
  const COULEUR_ETOILES_CIEL = "#eadd42"; // même jaune que step11
  const RAYON_CIEL_MIN = RAYON_ETIQUETTES + 20; // juste à l'extérieur du cercle des mémoires

  // Zone RÉELLEMENT visible du viewBox, en tenant compte du lettrboxing de
  // preserveAspectRatio="xMidYMid meet" : sur un écran plus large que haut, le viewBox
  // déborde horizontalement au-delà de 0-1000 (et inversement sur un écran plus haut
  // que large) — mesuré sur le <svg> RÉEL (svg.node()), pas sur #univers-canvas : ce
  // dernier inclut le padding vertical 24px/140px (point D), qui rétrécit le <svg> par
  // rapport au conteneur — mesurer le conteneur donnerait un ratio faussé, jamais
  // présumé à 0-1000 seulement.
  const svgEl = svg.node();
  const rectSvg = svgEl.getBoundingClientRect();
  const rapportConteneur = rectSvg.width / rectSvg.height;

  let cielMinX = 0, cielMaxX = VUE.largeur, cielMinY = 0, cielMaxY = VUE.hauteur;
  if (rapportConteneur > 1) {
    const largeurVisible = VUE.hauteur * rapportConteneur;
    const exces = (largeurVisible - VUE.largeur) / 2;
    cielMinX = -exces;
    cielMaxX = VUE.largeur + exces;
  } else if (rapportConteneur < 1) {
    const hauteurVisible = VUE.largeur / rapportConteneur;
    const exces = (hauteurVisible - VUE.hauteur) / 2;
    cielMinY = -exces;
    cielMaxY = VUE.hauteur + exces;
  }

  // Masque terrain : attendu ici, juste avant le premier appel à positionCiel() —
  // lancé plus tôt (masqueTerrainPromise), donc son temps de chargement a déjà
  // pu se chevaucher avec la mise en place du SVG ci-dessus.
  await masqueTerrainPromise;

  // CTM capturée UNE FOIS (pas à chaque tentative de tirage) : rien ne change la
  // mise en page du SVG entre les tentatives de rejet d'un même appel, donc la
  // recalculer à chaque itération serait un coût inutile — même principe que
  // getImageData() ci-dessus (chargement une fois, lecture répétée).
  const ctmEcran = svgEl.getScreenCTM();

  function positionCiel() {
    let x, y, pt, ptEcran, pixelMasque;
    do {
      x = cielMinX + Math.random() * (cielMaxX - cielMinX);
      y = cielMinY + Math.random() * (cielMaxY - cielMinY);

      // Position réelle à l'écran (Playbook §3.3 — jamais une simple proportion du
      // viewBox), convertie en pixel du masque pour tester le terrain.
      pt = svgEl.createSVGPoint();
      pt.x = x;
      pt.y = y;
      ptEcran = pt.matrixTransform(ctmEcran);
      pixelMasque = ecranVersPixelMasque(ptEcran.x, ptEcran.y, universContainer);
    } while (
      Math.hypot(x - CENTRE.x, y - CENTRE.y) < RAYON_CIEL_MIN ||
      testTerrain(pixelMasque.x, pixelMasque.y)
    );
    return { x, y };
  }

  const positionsCiel = d3.range(nbEtoilesCiel).map(positionCiel);

  const groupeCiel = svg.append("g").attr("class", "ciel-etoile");
  const etoilesCiel = groupeCiel
    .selectAll("circle")
    .data(positionsCiel)
    .join("circle")
    .attr("class", "etoile-ciel")
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .attr("r", () => (2.5 + Math.random() * 2.5).toFixed(2)) // grossies — était 1.5-3, à l'œil
    .attr("fill", COULEUR_ETOILES_CIEL)
    .style("opacity", 0);

  // Une position de départ réservée par étoile-témoignage — même algorithme de rejet
  // que le ciel anonyme, pour rester cohérent visuellement. Associée à l'id de
  // l'étoile (Map, jamais stocké dans etoiles.json) : c'est cette association qui
  // permet à migrerEtoilesTemoignage() de savoir QUELLE étoile migre depuis QUELLE
  // position précise — condition de l'option "continuité d'identité" retenue le 10
  // septembre 2026, plutôt qu'une simple coïncidence de timing.
  const positionsDepartTemoignage = new Map(noeuds.map(n => [n.data.id, positionCiel()]));

  // Cercles fantômes des étoiles-témoignage : MÊME style de départ que le ciel
  // anonyme (indiscernables au premier coup d'œil — l'effet de révélation tombe à
  // plat sinon), à leur position réservée. data-id permet de cibler individuellement
  // chacun au moment de sa migration (voir migrerEtoilesTemoignage() plus bas).
  const etoilesCielTemoignage = groupeCiel
    .selectAll(".etoile-ciel-temoignage")
    .data(noeuds, d => d.data.id)
    .join("circle")
    .attr("class", "etoile-ciel-temoignage")
    .attr("data-id", d => d.data.id)
    .attr("cx", d => positionsDepartTemoignage.get(d.data.id).x)
    .attr("cy", d => positionsDepartTemoignage.get(d.data.id).y)
    .attr("r", () => (2.5 + Math.random() * 2.5).toFixed(2)) // même gabarit que le ciel anonyme
    .attr("fill", COULEUR_ETOILES_CIEL)
    .style("opacity", 0);

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

  const DECALAGE_LIGNE_ETIQUETTE = 28; // écart radial entre les 2 lignes — à l'œil
  const SEUIL_COUPURE_ETIQUETTE = 10;

  nations.forEach(n => {
    const sect = secteurs[n.id];

    // Dans la moitié basse du cercle, on inverse le sens de tracé pour que le
    // texte reste lisible à l'endroit (sinon textPath l'affiche renversé).
    const estEnBas = sect.milieu > Math.PI / 2 && sect.milieu < (3 * Math.PI) / 2;

    // Coupe sur le premier espace OU trait d'union rencontré (non-greedy — s'arrête
    // au premier trouvé) — couvre "Atikamekw Nehirowisiw" (espace) ET
    // "Huronne-Wendat" (trait d'union) sans lister aucune nation par son nom.
    const separateur = n.nom.match(/^(\S+?)([\s-])(.+)$/);
    const surDeuxLignes = !!separateur && n.nom.length > SEUIL_COUPURE_ETIQUETTE;
    const lignes = surDeuxLignes
      ? [separateur[2] === "-" ? `${separateur[1]}-` : separateur[1], separateur[3]]
      : [n.nom];

    lignes.forEach((ligne, i) => {
      // 1re ligne plus proche du centre, 2e plus loin — ordre de lecture naturel en
      // s'éloignant de la Lune. Rayon inchangé si une seule ligne.
      const rayonLigne = surDeuxLignes
        ? RAYON_ETIQUETTES + (i === 0 ? -DECALAGE_LIGNE_ETIQUETTE / 2 : DECALAGE_LIGNE_ETIQUETTE / 2)
        : RAYON_ETIQUETTES;

      const pathId = `arc-${n.id}-${i}`;

      groupeEtiquettes.append("path")
        .attr("id", pathId)
        .attr("class", "arc-etiquette-path")
        .attr("d", cheminArc(sect.debut, sect.fin, rayonLigne, CENTRE, estEnBas));

      groupeEtiquettes.append("text")
        .attr("class", "arc-etiquette-texte")
        .attr("fill", n.couleur) // repère visuel : l'étiquette porte la couleur de ses étoiles
        .attr("dy", estEnBas ? 14 : -6)
        .append("textPath")
        .attr("href", `#${pathId}`)
        .attr("startOffset", "50%")
        .attr("text-anchor", "middle")
        .text(ligne);
    });
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

  // Glow derrière l'étoile-témoignage — APPENDÉ AVANT groupeEtoilesEl pour peindre
  // derrière elle. Filtré sur estModele : si plusieurs étoiles ont un vrai témoignage
  // un jour (enrichissement post-diffusion), chacune reçoit son propre glow
  // automatiquement, rien à modifier ici. Groupe toujours visible désormais — chaque
  // glow individuel se révèle à la fin de SA migration (migrerEtoilesTemoignage()),
  // plus au niveau du groupe entier d'un coup (voir timelineEntree plus bas).
  const groupeGlow = svg.append("g").attr("class", "glow-temoignage");
  const noeudsTemoignage = noeuds.filter(d => d.data.estModele);

  groupeGlow
    .selectAll("circle")
    .data(noeudsTemoignage)
    .join("circle")
    .attr("class", "etoile-glow")
    .attr("data-id", d => d.data.id) // cible de migrerEtoilesTemoignage()
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .attr("r", RAYON_ETOILE_TEMOIGNAGE + 6)
    .attr("fill", d => couleurParNation[d.data.nation])
    .attr("fill-opacity", 0.45)
    .style("opacity", 0); // révélé au onComplete de la migration, jamais avant

  const groupeEtoilesEl = svg.append("g").attr("class", "etoiles");

  const selectionEtoiles = groupeEtoilesEl
    .selectAll("circle")
    .data(noeuds)
    .join("circle")
    .attr("class", "etoile")
    .attr("data-id", d => d.data.id) // cible de migrerEtoilesTemoignage() (bascule finale)
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .attr("r", d => d.data.estModele ? RAYON_ETOILE_TEMOIGNAGE : RAYON_ETOILE_DEFAUT)
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
      if (signalerInteractionFn) signalerInteractionFn();
    });

  // --- Entrée en scène progressive : la voie lactée seule d'abord, puis la
  // visualisation apparaît par couches (Lune → étiquettes → liens → étoiles),
  // jamais tout d'un coup. Respecte prefers-reduced-motion (voir style.css). ---
  const reduireAnimation = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const dureeBase = reduireAnimation ? 0.01 : 1;

  // Migration "continuité d'identité" (décision du 10 septembre 2026) : chaque
  // étoile-témoignage occupe d'abord une position anonyme dans le ciel (cercles
  // .etoile-ciel-temoignage, plus haut), puis migre vers sa position organisée dans
  // le cercle des mémoires. Ton doux et solennel — mouvement lent (~1,5-2s), ease
  // douce, jamais de saut ni de fondu croisé visible : la bascule fantôme→final se
  // fait au onComplete de CHAQUE étoile individuellement, pas à la fin de toutes,
  // et sans transition (gsap.set) pour que rien ne clignote ni ne se superpose.
  const ECART_STAGGER_MIGRATION = 0.4; // secondes entre le début de chaque migration
  function migrerEtoilesTemoignage() {
    noeuds.forEach((n, i) => {
      const id = n.data.id;
      const fantome = groupeCiel.select(`.etoile-ciel-temoignage[data-id="${id}"]`).node();
      const finale = groupeEtoilesEl.select(`.etoile[data-id="${id}"]`).node();
      const glow = groupeGlow.select(`.etoile-glow[data-id="${id}"]`).node();
      if (!fantome) return;

      gsap.to(fantome, {
        attr: {
          cx: n.x,
          cy: n.y,
          r: RAYON_ETOILE_TEMOIGNAGE,
          fill: couleurParNation[n.data.nation]
        },
        duration: reduireAnimation ? 0.01 : 1.5 + Math.random() * 0.5, // ~1,5-2s, défauts validés
        delay: reduireAnimation ? 0 : i * ECART_STAGGER_MIGRATION,
        ease: "power1.inOut", // douce, jamais bounce/elastic — ton solennel
        onComplete: () => {
          // Bascule fantôme → final → glow au MÊME instant, sans transition — un
          // seul mouvement continu, jamais une superposition visible de 2 cercles.
          if (finale) gsap.set(finale, { opacity: 1 });
          gsap.set(fantome, { opacity: 0 });
          if (glow) gsap.set(glow, { opacity: 1 });
        }
      });
    });
  }

  const timelineEntree = gsap.timeline({ delay: reduireAnimation ? 0 : 0.4 });
  timelineEntree
    // Le ciel étoilé — anonyme ET fantômes des étoiles-témoignage ensemble, même
    // apparence, indiscernables — apparaît EN PREMIER, même intention narrative que
    // le commentaire existant plus haut ("la voie lactée seule d'abord, puis la
    // visualisation apparaît par couches"). onComplete déclenche la migration :
    // synchronisé sur la vraie fin du stagger GSAP, jamais un délai fixe codé en
    // dur séparément.
    .to([...etoilesCiel.nodes(), ...etoilesCielTemoignage.nodes()], {
      opacity: 1,
      duration: dureeBase * 1.2,
      stagger: reduireAnimation ? 0 : { amount: 1.8, from: "random" },
      ease: "power1.out",
      onComplete: migrerEtoilesTemoignage
    })
    .to(groupeLune.node(), { opacity: 1, duration: dureeBase * 1.8, ease: "power2.out" }, "-=0.6")
    .to(groupeEtiquettes.node(), { opacity: 1, duration: dureeBase * 1.2, ease: "power1.out" }, "-=0.8")
    .to(groupeLiens.node(), { opacity: 1, duration: dureeBase * 1, ease: "power1.out" }, "-=0.4");

  // Pulsation continue du glow, façon "cœur qui bat" — anime r + fill-opacity, jamais
  // opacity (utilisé par migrerEtoilesTemoignage() pour révéler chaque glow
  // individuellement à la fin de SA migration, gsap.set — pas de conflit, propriétés
  // distinctes). Tourne en arrière-plan dès le chargement, même invisible tant que
  // opacity reste à 0 : redevient visible instantanément dès la révélation.
  // Ignorée si prefers-reduced-motion : le glow reste visible (révélé par la
  // migration, near-instantanée dans ce mode), juste immobile.
  if (!reduireAnimation) {
    gsap.to(".etoile-glow", {
      attr: { r: RAYON_ETOILE_TEMOIGNAGE + 16, "fill-opacity": 0.15 },
      duration: 1.1,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
      delay: 2 // laisse le fondu d'entrée se terminer avant de commencer à pulser
    });
  }

  // Références renvoyées à initUnivers() pour piloter la transition de sortie
  // (S2B3T3) sans que ce fichier ait besoin de connaître cette logique lui-même.
  return { svg, groupeLune, echelle, selectionEtoiles, groupeEtiquettes, groupeGlow };
}