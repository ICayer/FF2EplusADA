import { showStep7, hideStep7 } from "./steps/step7.js";
import { showStep9, hideStep9 } from "./steps/step9.js";
import { showStep10, hideStep10 } from "./steps/step10.js";

export const stepsRegistry = {
  "hommage-victimes": { show: showStep7, hide: hideStep7 },
  "transformation-coeur": { show: showStep9,  hide: hideStep9 },
  "communaute-etoiles":   { show: showStep10, hide: hideStep10 },
};