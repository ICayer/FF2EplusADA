# Gabarit — Prompt Claude Code (scrollyFFADA2S v2)

*À coller au début d'une nouvelle conversation Claude Code, ou à réutiliser comme structure pour chaque tâche. Basé sur le format validé dans GameCayer (Bob le blob), adapté au contexte JS vanilla / SVG / GSAP.*

---

```
Fichiers à modifier : [liste des fichiers concernés, chemins complets]
NE PAS committer. Synthèse seulement — attendre la validation d'Isabel.

Lis docs/PLAYBOOK.md et docs/REGISTRE.md avant de commencer.

RÉFÉRENCE (si applicable — décision du Registre datée, croquis de Déline, comportement attendu)
- [élément 1] : [état attendu] ✓ déjà correct / à corriger
- [élément 2] : [état attendu]

════════════════════════════════════════
CORRECTION 1 — [fichier] : [titre court de la correction]

[État actuel — extrait de code ou description précise]

Remplacer par :
[code corrigé]

Raison : [le "pourquoi" — justification technique ou pédagogique. Pas juste
"ça corrige le bug" mais pourquoi cette approche plutôt qu'une autre.]

════════════════════════════════════════
CORRECTION 2 — [fichier] : [titre court]

[...]

Raison : [...]

════════════════════════════════════════
RÈGLE D'AUDIT (obligatoire avant renommage/suppression/restructuration)
grep -rn "[nom de l'export ou de la fonction concernée]" [dossier] avant toute
modification qui touche un export existant utilisé ailleurs.

════════════════════════════════════════
RÉSUMÉ OBLIGATOIRE avant tout commit :
- Fichier + numéro de ligne exact pour chaque modification
- [vérification spécifique à cette tâche — ex: confirmer qu'un ID dupliqué a bien été retiré]
- [vérification spécifique à cette tâche — ex: tester le step en question au scroll avant/arrière]
Attendre la validation d'Isabel.
```

---

## Exemple rempli (mini-cas type scrollyFFADA2S)

```
Fichiers à modifier : steps/step3.js, data/etoiles.json
NE PAS committer. Synthèse seulement — attendre la validation d'Isabel.

Lis docs/PLAYBOOK.md et docs/REGISTRE.md avant de commencer.

RÉFÉRENCE (Registre, décision du 18 août 2026)
- Une seule étoile "modèle" affiche un récit complet au chargement
- Les autres étoiles du step3 restent vides (tooltip seulement, pas de clic actif)

════════════════════════════════════════
CORRECTION 1 — steps/step3.js : le clic sur une étoile vide déclenche une erreur console

État actuel :
  etoile.on('click', () => showRecit(etoile.dataId));

Remplacer par :
  etoile.on('click', () => {
    const data = etoilesData[etoile.dataId];
    if (!data?.recit) return; // étoile vide par conception — pas d'action
    showRecit(data);
  });

Raison : les étoiles vides sont un choix éditorial (Registre, 18 août), pas un
bug à corriger en ajoutant du contenu — le code doit juste ignorer le clic
proprement plutôt que planter sur un récit inexistant.

════════════════════════════════════════
RÈGLE D'AUDIT
grep -rn "showRecit" steps/ avant modification — vérifier qu'aucun autre step
n'appelle cette fonction avec une signature différente.

════════════════════════════════════════
RÉSUMÉ OBLIGATOIRE avant tout commit :
- Fichier + numéro de ligne exact pour chaque modification
- Confirmer qu'un clic sur une étoile sans récit ne produit plus d'erreur console
- Confirmer que l'étoile modèle (avec récit) fonctionne toujours normalement
Attendre la validation d'Isabel.
```
