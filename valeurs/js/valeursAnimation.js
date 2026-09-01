// ==================================================
// valeurs/js/valeursAnimation.js
// Partie 4 — Valeurs : mise en scène spirale / couple / collier de perles
//
// Rôle : Charger valeurs/svg/valeurs.svg, dimensionner l'ensemble pour que
// la spirale fasse 80% de la hauteur d'écran (même cible que la Lune
// agrandie en fin d'univers/), puis révéler en fondu la spirale, le couple
// et les 5 groupes de perles en vague. Le fondu d'entrée de la spirale est
// symétrique du fondu de sortie fait par univers/ avant la navigation —
// la coupure de page se produit entre deux écrans blancs. Les couleurs
// des 5 groupes sont tirées au hasard parmi les nations à chaque
// chargement (le collier change à chaque visite). Enfin les 9 swirls
// apparaissent un à un (révélation circulaire, sens alterné), chacun
// suivi de son bouton de valeur avec étiquette bilingue au survol/focus
// et lecture audio (innu-aimun) au clic / Entrée / Espace.
// Dépend de : shared/js/utils.js (loadSVG), shared/js/i18n.js
// (initI18n/resolve/getLanguage), univers/data/nations.json,
// shared/data/valeurs.json, valeurs/audio/${langue}/*.mp3,
// gsap (global, CDN)
// Utilisé par : valeurs/index.html
//
// FF2EplusADA (scrollyFFADA2S v2)
// Isabel Cayer · Atelier Love & Code · 2026
// ==================================================

import { loadSVG } from "../../shared/js/utils.js";
import { initI18n, resolve, getLanguage } from "../../shared/js/i18n.js";

let container = null;
let audioActif = null; // un seul audio à la fois — une nouvelle lecture arrête la précédente

function reduitMouvement() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

async function assurerContainer() {
  if (!container) {
    container = await loadSVG("./svg/valeurs.svg", "valeursSVG", "graphic");
    if (!container) {
      console.error("❌ Impossible de charger valeurs.svg");
      return null;
    }

    // Regrouper TOUS les groupes de premier niveau dans un seul <g> — le
    // fichier source n'a pas de groupe englobant, chaque élément (couple,
    // perles, spirale, swirls, boutons) est positionné indépendamment dans
    // un large canevas (Playbook §3.3 : mesurer, jamais présumer).
    const svgRoot = container.querySelector("svg");
    const NS_SVG = "http://www.w3.org/2000/svg";
    const groupePrincipal = document.createElementNS(NS_SVG, "g");
    groupePrincipal.setAttribute("id", "scene-valeurs");
    Array.from(svgRoot.children)
      .filter((el) => el.tagName === "g")
      .forEach((el) => groupePrincipal.appendChild(el));
    svgRoot.appendChild(groupePrincipal);

    // Mesurer la hauteur RÉELLEMENT rendue de la spirale (avant tout
    // ajustement d'échelle) pour viser 80% de la hauteur d'écran — même
    // cible que la Lune agrandie dans univers/js/transitionValeurs.js, pour
    // que la taille corresponde visuellement d'une page à l'autre. Remplace
    // l'échelle fixe .6491 héritée du fichier Illustrator, qui ne visait
    // rien de précis.
    const spiraleEl = groupePrincipal.querySelector("#spirale");
    const rectSpiraleInitial = spiraleEl.getBoundingClientRect();
    const hauteurCiblePx = window.innerHeight * 0.8;
    const facteurEchelle = hauteurCiblePx / rectSpiraleInitial.height;

    const bbox = groupePrincipal.getBBox();
    const centreGroupeX = bbox.x + bbox.width / 2;
    const centreGroupeY = bbox.y + bbox.height / 2;
    const [vbX, vbY, vbW, vbH] = svgRoot.getAttribute("viewBox").split(" ").map(Number);
    const centreViewBoxX = vbX + vbW / 2;
    const centreViewBoxY = vbY + vbH / 2;
    groupePrincipal.setAttribute(
      "transform",
      `translate(${centreViewBoxX - facteurEchelle * centreGroupeX}, ${centreViewBoxY - facteurEchelle * centreGroupeY}) scale(${facteurEchelle})`
    );

    // loadSVG pose le conteneur à opacity:0 ET pointer-events:none (défaut
    // pensé pour l'empilement de steps du scrolly). Le rendre visible ET
    // cliquable — comme assurerContainer() du scrolly (avantColonisation.js
    // L106). Sans "pointerEvents: auto" ici, pointer-events:none hérité du
    // conteneur bloque TOUT le hit-testing du SVG : les boutons de valeur
    // ne reçoivent jamais le clic réel de la souris (bug S4B3T2).
    gsap.set(container, { opacity: 1, display: "block", pointerEvents: "auto" });

    // Spirale : invisible au départ, révélée en fondu par initValeurs()
    // (ajusté après test — un fondu d'entrée adoucit la coupure de page
    // depuis univers/, qui fait maintenant son propre fondu de sortie
    // symétrique. Voir univers/js/transitionValeurs.js.)
    const spirale = container.querySelector("#spirale");
    if (spirale) gsap.set(spirale, { opacity: 0, display: "block" });

    // Couple : présent mais invisible, révélé plus tard en fondu.
    const couple = container.querySelector("#couple");
    if (couple) gsap.set(couple, { opacity: 0, display: "block" });

    // Perles : le GROUPE reste opacity:1 (sinon l'opacité du parent
    // multiplierait celle des enfants — même piège que dans le scrolly) ;
    // chaque <path> enfant démarre invisible, individuellement.
    for (let i = 1; i <= 5; i++) {
      const groupe = container.querySelector(`#perles${i}`);
      if (groupe) {
        gsap.set(groupe, { opacity: 1, display: "block", visibility: "visible" });
        gsap.set(groupe.querySelectorAll("path"), { opacity: 0 });
      }
    }

    // Swirls et boutons : les groupes #swirls/#boutons eux-mêmes restent
    // opacity:1/display:block (déjà mesurés dans le recentrage ci-dessus,
    // doivent le rester) — chaque swirlN/boutonN individuel démarre
    // invisible, révélé un à un par initValeurs().
    ["#swirls", "#boutons"].forEach((sel) => {
      const groupe = container.querySelector(sel);
      if (groupe) {
        gsap.set(groupe, { opacity: 1, display: "block" });
        Array.from(groupe.children).forEach((enfant) => gsap.set(enfant, { opacity: 0 }));
      }
    });
  }

  return container;
}

// 5 couleurs de nations différentes, tirées au hasard à chaque chargement
// — pas de nation favorisée (script technique : le collier change à chaque
// exploration). Mélange approximatif (tri par Math.random) suffisant ici.
async function chargerCouleursNations() {
  const nations = await fetch("/univers/data/nations.json").then((r) => r.json());
  return [...nations]
    .sort(() => Math.random() - 0.5)
    .slice(0, 5)
    .map((n) => n.couleur);
}

function appliquerCouleursPerles(c, couleurs) {
  for (let i = 1; i <= 5; i++) {
    const groupe = c.querySelector(`#perles${i}`);
    if (!groupe) continue;
    groupe.querySelectorAll("path").forEach((p) => p.setAttribute("fill", couleurs[i - 1]));
  }
}

let valeurs = [];
async function chargerValeurs() {
  if (valeurs.length === 0) {
    valeurs = await fetch("/shared/data/valeurs.json").then((r) => r.json());
  }
  return valeurs;
}

// Chemin du fichier audio pour une valeur dans `langue` si enregistré,
// sinon repli sur innu-aimun (même patron que le mot affiché au survol).
// Convention : /valeurs/audio/${langue}/${nomFichier}.
function cheminAudioValeur(valeur, langue) {
  const langueDisponible = valeur.audio && valeur.audio[langue] ? langue : "innu-aimun";
  const nomFichier = valeur.audio && valeur.audio[langueDisponible];
  if (!nomFichier) return null;
  return `/valeurs/audio/${langueDisponible}/${nomFichier}`;
}

// Joue l'audio d'une valeur — un seul à la fois (une nouvelle lecture
// coupe la précédente). Pose/retire la classe "lecture-active" sur le
// bouton. Aucun plantage si le fichier manque : avertissement console.
function jouerAudioValeur(valeur, boutonEl) {
  const chemin = cheminAudioValeur(valeur, getLanguage());
  if (!chemin) {
    console.warn(`⚠️ Aucun fichier audio disponible pour "${valeur.id}"`);
    return;
  }

  if (audioActif) {
    audioActif.pause();
    audioActif.currentTime = 0;
  }

  const audio = new Audio(chemin);
  audio.addEventListener("error", () => {
    console.error(`❌ Impossible de lire l'audio : ${chemin}`);
    boutonEl.classList.remove("lecture-active");
  });
  audio.addEventListener("ended", () => {
    boutonEl.classList.remove("lecture-active");
  });

  audio.play().catch((err) => {
    console.error("❌ Lecture audio bloquée par le navigateur :", err);
    boutonEl.classList.remove("lecture-active");
  });

  boutonEl.classList.add("lecture-active");
  audioActif = audio;
}

// Révélation circulaire d'un swirl via masque CSS conic-gradient animé —
// `sens` vaut 1 (horaire) ou -1 (antihoraire). Ajoute une étape à
// `timeline` sans position explicite (séquentiel — s'enchaîne après la
// précédente).
// ⚠️ Technique jamais utilisée ailleurs dans ce projet et NON vérifiée en
// navigateur au moment d'écrire (pas d'environnement navigateur ici).
// Dégradation gracieuse voulue : le <g> parent est remis à opacity:1 dès
// le début, donc si le navigateur ignore mask-image sur un <image> SVG,
// le swirl apparaît simplement d'un coup (= le filet de secours "fondu
// simple") au lieu de balayer. Voir la synthèse.
function revelerCercleSwirl(imageEl, sens, timeline) {
  const props = { angle: 0 };

  const gradient = (a) =>
    sens > 0
      ? `conic-gradient(black 0deg, black ${a}deg, transparent ${a}deg, transparent 360deg)`
      : `conic-gradient(transparent 0deg, transparent ${360 - a}deg, black ${360 - a}deg, black 360deg)`;

  timeline.call(() => {
    // Le <g id="swirlN"> parent est à opacity:0 (assurerContainer) — le
    // rendre visible ; c'est le masque, démarré à 0°, qui tient l'image
    // invisible jusqu'à la fin du balayage.
    const groupe = imageEl.parentNode;
    if (groupe) gsap.set(groupe, { opacity: 1 });
    imageEl.style.webkitMaskRepeat = imageEl.style.maskRepeat = "no-repeat";
    imageEl.style.webkitMaskPosition = imageEl.style.maskPosition = "center";
    imageEl.style.webkitMaskImage = imageEl.style.maskImage = gradient(0);
  });

  timeline.to(props, {
    angle: 360,
    duration: 1.3,
    ease: "power1.inOut",
    onUpdate: () => {
      imageEl.style.webkitMaskImage = imageEl.style.maskImage = gradient(props.angle);
    },
  });
}

// Crée et attache l'étiquette bilingue d'un bouton (mot autochtone selon
// getLanguage() + repli innu-aimun, traduction fr/en via resolve()),
// visible au survol/focus. Rend le bouton focusable au clavier. Séparée
// de revelerBouton() pour que la branche prefers-reduced-motion puisse
// l'appeler directement, sans passer par une timeline.
function attacherEtiquetteBouton(boutonEl, valeur) {
  const rect = boutonEl.querySelector("rect");
  const x = parseFloat(rect.getAttribute("x")) + parseFloat(rect.getAttribute("width")) / 2;
  const y = parseFloat(rect.getAttribute("y"));

  const langueActive = getLanguage();
  const langueAutochtone = (langueActive === "fr" || langueActive === "en") ? null : langueActive;
  const motAutochtone = (langueAutochtone && valeur.nom[langueAutochtone]) || valeur.nom["innu-aimun"];
  const motSecondaire = resolve({ fr: valeur.nom.fr, en: valeur.nom.en });

  const NS_SVG = "http://www.w3.org/2000/svg";
  const texte = document.createElementNS(NS_SVG, "text");
  texte.setAttribute("text-anchor", "middle");
  texte.setAttribute("font-family", "Agoradp_15, sans-serif");
  texte.style.opacity = "0";
  texte.style.pointerEvents = "none";
  texte.style.transition = "opacity 0.2s ease";

  // Halo blanc pour rester lisible là où l'étiquette croise le trait de
  // la spirale ou un swirl coloré. paint-order="stroke fill" : le contour
  // est peint AVANT le texte (sinon il l'épaissit par-dessus au lieu de
  // l'entourer). stroke-width un peu plus fin sur la 2e ligne, plus petite.
  const ligneAutochtone = document.createElementNS(NS_SVG, "tspan");
  ligneAutochtone.setAttribute("x", x);
  ligneAutochtone.setAttribute("y", y - 45);
  ligneAutochtone.setAttribute("font-size", "36");
  ligneAutochtone.setAttribute("stroke", "#fff");
  ligneAutochtone.setAttribute("stroke-width", "5");
  ligneAutochtone.setAttribute("stroke-linejoin", "round");
  ligneAutochtone.setAttribute("paint-order", "stroke fill");
  ligneAutochtone.textContent = motAutochtone;

  const ligneSecondaire = document.createElementNS(NS_SVG, "tspan");
  ligneSecondaire.setAttribute("x", x);
  ligneSecondaire.setAttribute("y", y - 15);
  ligneSecondaire.setAttribute("font-size", "26");
  ligneSecondaire.setAttribute("fill", "#666");
  ligneSecondaire.setAttribute("stroke", "#fff");
  ligneSecondaire.setAttribute("stroke-width", "4");
  ligneSecondaire.setAttribute("stroke-linejoin", "round");
  ligneSecondaire.setAttribute("paint-order", "stroke fill");
  ligneSecondaire.textContent = motSecondaire;

  texte.appendChild(ligneAutochtone);
  texte.appendChild(ligneSecondaire);
  boutonEl.appendChild(texte);

  boutonEl.style.cursor = "pointer";
  boutonEl.setAttribute("tabindex", "0");
  boutonEl.setAttribute("role", "button");
  boutonEl.setAttribute("aria-label", `${motAutochtone} — ${motSecondaire}`);
  // Pas de contour de focus par défaut : la boîte englobante inclut
  // l'étiquette ajoutée au-dessus du cercle → grand rectangle disgracieux.
  // L'étiquette qui apparaît au focus (écouteurs ci-dessous) sert
  // elle-même d'indicateur visuel de focus — pas de style de remplacement.
  boutonEl.style.outline = "none";

  const montrer = () => { texte.style.opacity = "1"; };
  const cacher = () => { texte.style.opacity = "0"; };
  boutonEl.addEventListener("mouseenter", montrer);
  boutonEl.addEventListener("focus", montrer);
  boutonEl.addEventListener("mouseleave", cacher);
  boutonEl.addEventListener("blur", cacher);

  // Icône permanente (pas seulement au survol) — indique clairement qu'un
  // audio est disponible, avant même d'interagir (Design doc, Partie 4).
  // Vraie icône SVG (pas un emoji) : un emoji système a ses propres
  // couleurs fixes (gris/bleu selon la police du système), impossible à
  // forcer en blanc via CSS — problème de contraste signalé par Isabel
  // sur les couleurs pastel des boutons.
  const rect2 = boutonEl.querySelector("rect");
  const rectX = parseFloat(rect2.getAttribute("x"));
  const rectY = parseFloat(rect2.getAttribute("y"));
  const rectW = parseFloat(rect2.getAttribute("width"));
  const rectH = parseFloat(rect2.getAttribute("height"));
  const centreX = rectX + rectW / 2;
  const centreY = rectY + rectH / 2;

  // Icône "haut-parleur" (path générique 24×24, style Material Icons
  // "volume_up") — dessinée, pas un glyphe système, donc son fill est
  // contrôlable directement.
  const CHEMIN_ICONE = "M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z";
  const TAILLE_CIBLE = rectW * 0.6; // 60% du diamètre du bouton
  const ECHELLE_ICONE = TAILLE_CIBLE / 24; // le path est dessiné dans un viewBox 24×24

  const icone = document.createElementNS(NS_SVG, "path");
  icone.setAttribute("d", CHEMIN_ICONE);
  icone.setAttribute("fill", "#fff");
  icone.setAttribute(
    "transform",
    `translate(${centreX - 12 * ECHELLE_ICONE}, ${centreY - 12 * ECHELLE_ICONE}) scale(${ECHELLE_ICONE})`
  );
  icone.style.pointerEvents = "none";
  boutonEl.appendChild(icone);

  // Clic ou Entrée/Espace : lecture de l'audio de la valeur.
  boutonEl.addEventListener("click", () => jouerAudioValeur(valeur, boutonEl));
  boutonEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      jouerAudioValeur(valeur, boutonEl);
    }
  });
}

// Révèle un bouton en fondu puis attache son étiquette. Enchaîné à
// `timeline` sans position explicite (après le swirl correspondant).
function revelerBouton(boutonEl, valeur, timeline) {
  timeline.to(boutonEl, { opacity: 1, duration: 0.4 });
  timeline.call(() => attacherEtiquetteBouton(boutonEl, valeur));
}

// Même technique que animerPerlesEnVague() du scrolly (avantColonisation.js) :
// trier les <path> par getBBox().x croissant et les révéler en vague.
// Dupliquée ici volontairement — la fonction du scrolly est scopée à sa
// partie, et il n'y a pas de logique métier partagée au-delà de la
// technique elle-même (Playbook §1).
function animerGroupePerlesEnVague(groupeEl, timeline, positionRelative) {
  if (!groupeEl) return;
  const paths = Array.from(groupeEl.querySelectorAll("path"))
    .sort((a, b) => a.getBBox().x - b.getBBox().x);
  timeline.to(paths, { opacity: 1, duration: 0.4, stagger: 0.05 }, positionRelative);
}

// selecteurGraphic : gardé pour rester cohérent avec initUnivers("#univers-canvas")
// — non utilisé ici (loadSVG cible déjà "graphic" par défaut).
export async function initValeurs(selecteurGraphic) {
  // Cohérent avec le reste du projet (chaque page appelle initI18n() une
  // fois). Pas strictement requis aujourd'hui (currentLang = 'fr' par
  // défaut), mais évite un piège si un sélecteur de langue est ajouté ici.
  await initI18n('fr');

  const c = await assurerContainer();
  if (!c) return;

  const couleurs = await chargerCouleursNations();
  appliquerCouleursPerles(c, couleurs);

  const couple = c.querySelector("#couple");
  const groupesPerles = [1, 2, 3, 4, 5].map((i) => c.querySelector(`#perles${i}`));

  if (reduitMouvement()) {
    // État final direct : spirale + couple + perles + swirls + boutons
    // tous visibles, aucun délai, aucun masque animé.
    const spirale = c.querySelector("#spirale");
    if (spirale) gsap.set(spirale, { opacity: 1 });
    if (couple) gsap.set(couple, { opacity: 1 });
    groupesPerles.forEach((groupe) => {
      if (groupe) gsap.set(groupe.querySelectorAll("path"), { opacity: 1 });
    });

    const listeValeurs = await chargerValeurs();
    for (let i = 1; i <= 9; i++) {
      const swirlGroupe = c.querySelector(`#swirl${i}`);
      const boutonEl = c.querySelector(`#bouton${i}`);
      if (swirlGroupe) gsap.set(swirlGroupe, { opacity: 1 });
      if (boutonEl) {
        gsap.set(boutonEl, { opacity: 1 });
        if (listeValeurs[i - 1]) attacherEtiquetteBouton(boutonEl, listeValeurs[i - 1]);
      }
    }
    return;
  }

  const tl = gsap.timeline();
  const spirale = c.querySelector("#spirale");

  // La spirale entre en fondu dès le chargement — pas de délai
  // supplémentaire ici, univers/ a déjà fait sa propre pause avant de
  // naviguer (voir CORRECTION 1, transitionValeurs.js).
  if (spirale) {
    tl.to(spirale, { opacity: 1, duration: 1.5, ease: "power1.out" });
  }

  // +=2 : délai avant le fondu du couple (script technique), maintenant
  // relatif à la fin du fondu de la spirale plutôt qu'au chargement de la
  // page.
  if (couple) {
    tl.to(couple, { opacity: 1, duration: 1.5, ease: "power1.out" }, "+=2");
  }

  // Toutes les vagues de perles démarrent à la MÊME position — un label
  // posé +=2 après la fin du fondu du couple. Sans le label, chaque .to()
  // suivant se placerait +=2 après la fin du précédent (effet d'escalier).
  tl.addLabel("perles", "+=2");
  groupesPerles.forEach((groupe) => animerGroupePerlesEnVague(groupe, tl, "perles"));

  const listeValeurs = await chargerValeurs();

  // Pause 1s après la fin de la vague de perles (script technique), avant
  // le premier swirl.
  tl.to({}, { duration: 1 });

  for (let i = 1; i <= 9; i++) {
    const swirlImg = c.querySelector(`#swirl${i} image`);
    const boutonEl = c.querySelector(`#bouton${i}`);
    const valeur = listeValeurs[i - 1];
    const sens = i % 2 === 1 ? 1 : -1; // alterne horaire / antihoraire

    if (swirlImg) revelerCercleSwirl(swirlImg, sens, tl);
    if (boutonEl && valeur) revelerBouton(boutonEl, valeur, tl);
  }
}
