// AUTO-GENERATED. Edit the source .md files in /skill-v2/clients/ and regenerate.
// Do not hand-edit this file. Each client's bible is in ./brand-bibles/{id}.ts

import { CLUB_SCIKIDZ } from "./brand-bibles/club-scikidz.js";
import { CODE_NINJAS } from "./brand-bibles/code-ninjas.js";
import { GRAMERCY_MUSIC_ACADEMY } from "./brand-bibles/gramercy-music-academy.js";
import { JUMP_GYMNASTICS } from "./brand-bibles/jump-gymnastics.js";
import { KIDCREATE } from "./brand-bibles/kidcreate.js";
import { LAZAR_CENTER } from "./brand-bibles/lazar-center.js";
import { ROMP_N_ROLL } from "./brand-bibles/romp-n-roll.js";
import { WEIGHT_LOSS_RVA } from "./brand-bibles/weight-loss-rva.js";
import { YOUNG_CHEFS_ACADEMY } from "./brand-bibles/young-chefs-academy.js";

export type ClientId =
  | 'club-scikidz'
  | 'code-ninjas'
  | 'gramercy-music-academy'
  | 'jump-gymnastics'
  | 'kidcreate'
  | 'lazar-center'
  | 'romp-n-roll'
  | 'weight-loss-rva'
  | 'young-chefs-academy';

export interface ClientMeta {
  id: ClientId;
  label: string;
}

export const CLIENTS: ClientMeta[] = [
  { id: 'club-scikidz', label: "Club SciKidz" },
  { id: 'code-ninjas', label: "Code Ninjas" },
  { id: 'gramercy-music-academy', label: "Gramercy Music Academy" },
  { id: 'jump-gymnastics', label: "Jump! Gymnastics" },
  { id: 'kidcreate', label: "Kidcreate Studio" },
  { id: 'lazar-center', label: "Lazar Center" },
  { id: 'romp-n-roll', label: "Romp n' Roll" },
  { id: 'weight-loss-rva', label: "Weight Loss RVA" },
  { id: 'young-chefs-academy', label: "Young Chefs® Academy" },
];

export const BRAND_CONTEXT: Record<ClientId, string> = {
  'club-scikidz': CLUB_SCIKIDZ,
  'code-ninjas': CODE_NINJAS,
  'gramercy-music-academy': GRAMERCY_MUSIC_ACADEMY,
  'jump-gymnastics': JUMP_GYMNASTICS,
  'kidcreate': KIDCREATE,
  'lazar-center': LAZAR_CENTER,
  'romp-n-roll': ROMP_N_ROLL,
  'weight-loss-rva': WEIGHT_LOSS_RVA,
  'young-chefs-academy': YOUNG_CHEFS_ACADEMY,
};
