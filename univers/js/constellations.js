// ==================================================
// univers/js/constellations.js
// Calcul de la disposition des étoiles en constellations par nation et par décennie
//
// Rôle : Convertir les données brutes (nations + étoiles) en positions à l'écran.
// Module de calcul PUR : ne touche jamais au DOM, ne dessine rien — il retourne
// des coordonnées que univers/js/etoiles.js se charge d'afficher.
// Dépend de : d3 (global, chargé par CDN dans univers/index.html)
// Utilisé par : univers/js/etoiles.js
//
// FF2EplusADA (scrollyFFADA2S v2)
// Isabel Cayer · Atelier Love & Code · 2026
// ==================================================

// Convention d'angle UNIQUE pour tout le module :
// 0 = midi (haut de l'écran), sens HORAIRE positif.
// Toute position sur le cercle DOIT passer par cette fonction — c'est ce qui
// garantit que les étoiles et les arcs-étiquettes ne se désynchronisent jamais.
export function positionSurCercle(angle, rayon, centre) {
  return {
    x: centre.x + rayon * Math.sin(angle),
    y: centre.y - rayon * Math.cos(angle)
  };
}

// Génère un arc SIMPLE (non fermé) en coordonnées absolues.
// On n'utilise PAS d3.arc() ici : avec innerRadius === outerRadius, il génère un
// chemin aller-retour fermé de longueur double, ce qui place startOffset:"50%"
// à la frontière du secteur au lieu de son milieu.
export function cheminArc(angleDebut, angleFin, rayon, centre, inverse = false) {
  const a0 = inverse ? angleFin : angleDebut;
  const a1 = inverse ? angleDebut : angleFin;
  const p0 = positionSurCercle(a0, rayon, centre);
  const p1 = positionSurCercle(a1, rayon, centre);
  const grandArc = Math.abs(angleFin - angleDebut) > Math.PI ? 1 : 0;
  const sens = inverse ? 0 : 1; // 1 = horaire à l'écran (axe y vers le bas)
  return `M ${p0.x} ${p0.y} A ${rayon} ${rayon} 0 ${grandArc} ${sens} ${p1.x} ${p1.y}`;
}

// Générateur pseudo-aléatoire déterministe : une même clé produit toujours la
// même suite. Permet de garder exactement la même constellation d'un rechargement
// à l'autre (essentiel pour itérer visuellement sans que tout bouge à chaque fois).
function rngDeterministe(cle) {
  let h = 0;
  for (let i = 0; i < cle.length; i++) h = (h * 31 + cle.charCodeAt(i)) >>> 0;
  return () => {
    h = (h * 1664525 + 1013904223) >>> 0;
    return h / 4294967295;
  };
}

// Scinde une liste en sous-groupes de 3 à 5 éléments.
// Une décennie représentée par une seule étoile donne une étoile solitaire :
// c'est voulu, pas un cas d'erreur.
function scinderEnSousGroupes(liste, max = 5) {
  const groupes = [];
  let reste = [...liste];
  while (reste.length > 0) {
    if (reste.length <= max) { groupes.push(reste); break; }
    groupes.push(reste.slice(0, max));
    reste = reste.slice(max);
  }
  return groupes;
}

/**
 * Calcule la disposition complète des constellations.
 *
 * @returns {{secteurs: Object, noeuds: Array, liens: Array}}
 *   secteurs : { [nationId]: { debut, fin, milieu, nation } } — cadrans angulaires
 *   noeuds   : positions finales de chaque étoile ({ data, x, y, sousGroupeId })
 *   liens    : paires d'étoiles à relier par un trait de constellation
 */
export function calculerDisposition(nations, etoiles, options) {
  const {
    centre,
    rayonMin,
    rayonMax,
    rayonCollision = 6,
    anglePadding = 0.03,
    ordreDecennies,
    iterations = 200
  } = options;

  // --- 1. Un cadran angulaire par nation ---
  const angleParNation = (2 * Math.PI) / nations.length;
  const secteurs = {};
  nations.forEach((n, i) => {
    const debut = i * angleParNation + anglePadding / 2;
    const fin = (i + 1) * angleParNation - anglePadding / 2;
    secteurs[n.id] = { debut, fin, milieu: (debut + fin) / 2, nation: n };
  });

  // --- 2. Regroupement : nation → décennie → sous-groupes de 3-5 ---
  const sousGroupes = [];
  nations.forEach(n => {
    const etoilesNation = etoiles.filter(e => e.nation === n.id);
    const parDecennie = d3.group(etoilesNation, e => e.decennieNaissanceApprox);
    parDecennie.forEach((liste, decennie) => {
      scinderEnSousGroupes(liste).forEach((groupe, idx) => {
        sousGroupes.push({
          id: `${n.id}-${decennie}-${idx}`,
          nationId: n.id,
          decennie,
          etoiles: groupe
        });
      });
    });
  });

  // --- 3. Point d'ancrage de chaque sous-groupe ---
  // Le rayon dépend de la décennie : les plus anciennes près de la Lune, les plus
  // récentes vers l'extérieur — choix narratif (l'étoile naissante s'éloigne).
  const largeurBande = (rayonMax - rayonMin) / ordreDecennies.length;

  sousGroupes.forEach(sg => {
    const sect = secteurs[sg.nationId];
    const rand = rngDeterministe(sg.id);
    const angle = sect.debut + rand() * (sect.fin - sect.debut);

    const indexDecennie = ordreDecennies.indexOf(sg.decennie);
    const debutBande = rayonMin + Math.max(indexDecennie, 0) * largeurBande;
    const rayon = debutBande + rand() * largeurBande;

    const pos = positionSurCercle(angle, rayon, centre);
    sg.focalX = pos.x;
    sg.focalY = pos.y;
  });

  // --- 4. Un nœud par étoile, rattaché au point d'ancrage de son sous-groupe ---
  const noeuds = [];
  sousGroupes.forEach(sg => {
    sg.etoiles.forEach(e => {
      const rand = rngDeterministe(e.id);
      noeuds.push({
        data: e,
        sousGroupeId: sg.id,
        focalX: sg.focalX,
        focalY: sg.focalY,
        x: sg.focalX + (rand() - 0.5) * 10,
        y: sg.focalY + (rand() - 0.5) * 10
      });
    });
  });

  // --- 5. Simulation multi-foci : chaque étoile est attirée par SON point d'ancrage ---
  const simulation = d3.forceSimulation(noeuds)
    .force("x", d3.forceX(d => d.focalX).strength(0.15))
    .force("y", d3.forceY(d => d.focalY).strength(0.15))
    .force("collide", d3.forceCollide(rayonCollision))
    .force("charge", d3.forceManyBody().strength(-3))
    .stop();

  // On fait tourner la simulation d'un coup plutôt qu'en animation :
  // la disposition est calculée une fois, puis affichée telle quelle.
  for (let i = 0; i < iterations; i++) simulation.tick();

  // --- 6. Traits de constellation à l'intérieur de chaque sous-groupe ---
  const liens = [];
  d3.group(noeuds, d => d.sousGroupeId).forEach(membres => {
    for (let i = 0; i < membres.length - 1; i++) {
      liens.push({ source: membres[i], target: membres[i + 1] });
    }
  });

  return { secteurs, noeuds, liens };
}