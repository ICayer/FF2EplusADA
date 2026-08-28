import { showStep7, hideStep7 } from "./steps/step7.js";
import { showStep9, hideStep9 } from "./steps/step9.js";
import { showStep10, hideStep10 } from "./steps/step10.js";
import { showStep11, hideStep11 } from "./steps/step11.js";
import {
  showNuitDesTemps, hideNuitDesTemps,
  showLienCommunaute, hideLienCommunaute,
  showLienTerritoire, hideLienTerritoire,
  showLienValeurs, hideLienValeurs,
  showRuptureColoniale, hideRuptureColoniale,
} from "./steps/avantColonisation.js";

export const stepsRegistry = {
  "nuit-des-temps":       { show: showNuitDesTemps,     hide: hideNuitDesTemps },
  "lien-communaute":      { show: showLienCommunaute,   hide: hideLienCommunaute },
  "lien-territoire":      { show: showLienTerritoire,   hide: hideLienTerritoire },
  "lien-valeurs":         { show: showLienValeurs,      hide: hideLienValeurs },
  "rupture-coloniale":    { show: showRuptureColoniale, hide: hideRuptureColoniale },
  "hommage-victimes":     { show: showStep7,  hide: hideStep7 },
  "transformation-coeur": { show: showStep9,  hide: hideStep9 },
  "communaute-etoiles":   { show: showStep10, hide: hideStep10 },
  "seuil-univers":        { show: showStep11, hide: hideStep11 },
};
