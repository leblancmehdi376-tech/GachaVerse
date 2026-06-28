// ── Codes cadeaux ─────────────────────────────────────────────────────
// Codes à usage unique GLOBAL : le premier joueur qui valide un code donné
// le consomme définitivement (tracké côté Firestore, voir lib/firebase/giftCodes.ts).
// Pour ajouter/retirer des codes, modifie simplement ce tableau.

export interface GiftCodeDef {
  code: string;           // stocké en MAJUSCULES, la saisie est normalisée avant comparaison
  gems?: number;          // Neko-Gemmes à distribuer (optionnel)
  pixelCoins?: number;    // Pixel-Coins à distribuer (optionnel)
  characters?: string[];  // IDs de personnages à ajouter à la collection (optionnel)
  items?: string[];       // IDs d'items à ajouter à l'inventaire (optionnel)
}

export const GIFT_CODES: GiftCodeDef[] = [
  { code: 'NEKOZ-TEST-7K2M',  gems: 45 },
  { code: 'NEKOZ-TEST-9P4R',  gems: 45 },
  { code: 'NEKOZ-TEST-3X8Q',  gems: 45 },
  { code: 'NEKOZ-TEST-INES',  gems: 45 },
  { code: 'BEBE-MALADE-ROKU', gems: 45 },
  { code: 'CODE-TEST-1252',   gems: 450 },
  { code: 'CODE-TEST-1352',   gems: 400 },
  // ── Codes 70M Coins ───────────────────────────────────────────────
  { code: 'NEKOZ-RICH-4F7H',  pixelCoins: 10_000_000 },
  { code: 'NEKOZ-PATCH-507H', pixelCoins: 400_000_000 },
  { code: 'NEKOZ-PATCH-5100', pixelCoins: 400_000_000 },
  { code: 'NEKOZ-PATCH-12100', pixelCoins: 700_000_000 },
  { code: 'NEKOZ-TEST-EXPLOIT', pixelCoins: 2_000_000_000_000 },
  // ── Code Arthur Leywin ────────────────────────────────────────────
  {
    code:         'ARTHUR-LEYWIN-GV1',
    pixelCoins:   700_000_000,
    characters:   ['arthur_leywin'],
    items:        ['cristal_ether'],
  },
  {
    code:         'CODE-SORRY-INES',
    pixelCoins:   1_000_000,
    gems: 400,
    characters:   ['dazai', 'ichigo'],
  },
  {
    code:         'CODE-SORRY-LISA3',
    pixelCoins:   10_000_000,
    gems: 200,
    characters:   ['dazai', 'sanji', 'naruto'],
  },
  {
    code:         'BLOCK-SYLVIA',
    items:        ['sylvia'],
  },
  {
    code:         'AYGRO-EPEE',
    items:        ['epee_ether'],
  },
];

// Normalise une saisie utilisateur (espaces, casse) pour la comparaison
export function normalizeGiftCode(raw: string): string {
  return raw.trim().toUpperCase();
}

export function findGiftCode(raw: string): GiftCodeDef | undefined {
  const normalized = normalizeGiftCode(raw);
  return GIFT_CODES.find(c => c.code === normalized);
}
