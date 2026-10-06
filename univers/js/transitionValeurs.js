// ==================================================
// univers/js/transitionValeurs.js
// Condition de sortie de la Partie 3 (univers) vers la Partie 4 (valeurs)
//
// Rôle : Suit le temps écoulé ET le nombre d'étoiles explorées depuis l'arrivée
// sur univers/. Dès que l'un des deux seuils est atteint, RÉVÈLE le bouton
// "Explorer les valeurs" — mais rien ne part tout seul (décision du 24 août,
// Playbook §1 : toujours laisser la personne décider quand poursuivre).
//
// Depuis le 6 octobre 2026, le clic sur ce bouton navigue EXACTEMENT comme le
// bouton valeurs du rail (voir etoiles.js) : fondu de page CSS, plume qui
// glisse de la perle 10 au bouton valeurs. L'ancienne animation de sortie
// (convergence des étoiles, Lune agrandie, fond blanchi, fondu vers la
// spirale — lancerTransitionValeurs()) est retirée : un seul langage de
// transition entre les parties, le fondu. Remplace la décision du Registre
// du 24 août sur ce fichier.
//
// Dépend de : shared/js/progression.js (deverrouiller "valeurs" à la condition de sortie)
// Utilisé par : univers/js/etoiles.js
//
// FF2EplusADA (scrollyFFADA2S v2)
// Isabel Cayer · Atelier Love & Code · 2026
// ==================================================

import { initProgression, deverrouiller } from "../../shared/js/progression.js";

// Seuils de la condition de sortie — valeurs de départ, faciles à ajuster,
// à valider avec Déline une fois le rythme réel de la partie 3 mieux connu.
const SEUIL_TEMPS_MS = 30000; // 30 secondes
const SEUIL_INTERACTIONS = 4;  // 4 étoiles explorées (clics, pas juste survol)

let compteurInteractions = 0;
let minuteurId = null;
let transitionDejaDeclenchee = false;

/**
 * Démarre le suivi de la condition de sortie. `callback` est appelé une seule
 * fois, dès que le premier des deux seuils (temps ou interactions) est atteint —
 * mais il ne navigue PAS lui-même. Il ne fait que RÉVÉLER un bouton ; c'est le
 * clic de la personne sur ce bouton qui mène aux valeurs (décision du 24 août :
 * jamais de transition qui part toute seule).
 */
export function initConditionSortie(callback) {
  compteurInteractions = 0;
  transitionDejaDeclenchee = false;

  minuteurId = setTimeout(() => declencher("temps", callback), SEUIL_TEMPS_MS);

  return {
    signalerInteraction: () => {
      compteurInteractions++;
      console.log(`⭐ Interaction ${compteurInteractions}/${SEUIL_INTERACTIONS}`);
      if (compteurInteractions >= SEUIL_INTERACTIONS) {
        declencher("interactions", callback);
      }
    }
  };
}

async function declencher(source, callback) {
  if (transitionDejaDeclenchee) return;
  transitionDejaDeclenchee = true;
  if (minuteurId) clearTimeout(minuteurId);
  console.log(`🌕 Condition de sortie atteinte (${source}) — bouton "Explorer les valeurs" révélé`);
  // Déverrouille AVANT callback() : callback() révèle le bouton "Explorer
  // les valeurs" (défini dans etoiles.js), donc au moment où la personne
  // peut cliquer dessus, "valeurs" est déjà débloqué dans progression.js.
  await initProgression();
  deverrouiller("valeurs");
  callback();
}
