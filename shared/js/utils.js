// ==================================================
// shared/js/utils.js
// Fonctions utilitaires communes aux 3 parties du projet
//
// Rôle : Regrouper les petites fonctions réutilisables (ex: chargement
// JSON, aides DOM) au fur et à mesure qu'un vrai besoin partagé apparaît —
// pas de fonctions ajoutées de façon spéculative.
// Dépend de : aucun
// Utilisé par : à déterminer
//
// FF2EplusADA (scrollyFFADA2S v2)
// Isabel Cayer · Atelier Love & Code · 2026
// ==================================================

// ... en-tête déjà en place ...

export async function loadSVG(path, containerId, parentId = "graphic") {
  try {
    const cacheBuster = `?v=${Date.now()}`;
    const response = await fetch(path + cacheBuster);
    if (!response.ok) {
      console.error(`❌ Impossible de charger le SVG: ${path}`);
      return null;
    }
    const text = await response.text();
    let container = document.getElementById(containerId);
    if (!container) {
      container = document.createElement("div");
      container.id = containerId;
      Object.assign(container.style, {
        position: "absolute", top: 0, left: 0,
        width: "100%", height: "100%",
        opacity: 0, zIndex: 1500, pointerEvents: "none"
      });
      const parent = document.getElementById(parentId);
      if (parent) parent.appendChild(container);
      else console.warn(`⚠️ Parent #${parentId} introuvable`);
    }
    container.innerHTML = text;
    return container;
  } catch (err) {
    console.error(`❌ Erreur lors du chargement du SVG: ${path}`, err);
    return null;
  }
}