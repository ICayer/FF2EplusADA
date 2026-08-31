// ==================================================
// shared/js/navigationEtat.js
// Logique générique de thème et de bloc-titre de scène
//
// Rôle : Fournir la logique GÉNÉRIQUE de bascule de thème visuel et de
// mise à jour du bloc-titre, réutilisable par n'importe quelle partie du
// site. Ce module n'importe RIEN de scrolly/, univers/ ni valeurs/ —
// chaque partie l'appelle avec ses propres éléments DOM et ses propres
// données. La logique spécifique à une partie (nettoyage de scène, etc.)
// reste chez elle.
// Dépend de : aucun
// Utilisé par : scrolly/js/timelineRail.js (univers/, valeurs/ à venir)
//
// FF2EplusADA (scrollyFFADA2S v2)
// Isabel Cayer · Atelier Love & Code · 2026
// ==================================================

// Bascule le thème visuel de la page selon l'époque narrative courante.
// Copié tel quel depuis timelineRail.js — comportement identique.
export function appliquerTheme(epoque) {
  document.body.dataset.theme = (epoque === "apres") ? "" : "clair";
}

// Vrai si l'utilisatrice a demandé de réduire les animations.
// Copié tel quel depuis timelineRail.js.
export function reduitMouvement() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Met à jour le bloc-titre de scène : compteur « index+1 / total » et
// texte du titre. Fondu sortie/entrée sauf si reduitMouvement().
// Même logique que l'ancien mettreAJourTitre() de timelineRail.js, mais
// paramétrée (éléments DOM, index, total, texte, durée passés en
// arguments) plutôt que dépendante de variables de module — n'importe
// quelle partie peut l'appeler avec ses propres éléments.
export function mettreAJourTitreScene(titreCompteurEl, titreTexteEl, index, total, texte, dureeFonduMs = 200) {
  const majTexte = () => {
    titreCompteurEl.textContent = `${index + 1} / ${total}`;
    titreTexteEl.textContent = texte || "";
  };

  if (reduitMouvement()) {
    majTexte();
    return;
  }

  titreTexteEl.classList.add("transition-sortie");
  setTimeout(() => {
    majTexte();
    titreTexteEl.classList.remove("transition-sortie");
  }, dureeFonduMs);
}
