import { Rarity, RARITY_CONFIG } from '@/types/game';
import { BANNER_POOL } from './characters';

export const GACHA_COSTS = { single: 5, multi10: 45 };

// Ordre de rareté : C < U < R < E < L < M < S < CO < P < T
const BANNER_RATES: Partial<Record<Rarity, number>> = {
  C:  50.0,
  U:  20.0,
  R:  12.5,
  E:  8.0,
  L:  4.5,
  M:  2.5,
  S:  1.2,   // Stellaire — entre Mythique et Cosmique
  CO: 0.8,   // Cosmique
  P:  0.3,   // Primordial ← nouveau
  T:  0.2,   // Transcendant
};

export function rollRarity(): Rarity {
  const rand = Math.random() * 100;
  let cum = 0;
  // Du plus rare au plus commun
  for (const r of ['T', 'P', 'CO', 'S', 'M', 'L', 'E', 'R', 'U', 'C'] as Rarity[]) {
    cum += BANNER_RATES[r] ?? 0;
    if (rand <= cum) return r;
  }
  return 'C';
}

export function rollCharacter(): string {
  const rarity = rollRarity();
  const pool   = BANNER_POOL.filter(c => c.rarity === rarity);
  if (pool.length === 0) {
    const fallback = BANNER_POOL.filter(c => c.rarity === 'R');
    return fallback[Math.floor(Math.random() * fallback.length)].id;
  }
  return pool[Math.floor(Math.random() * pool.length)].id;
}

export function rollMulti(): string[] {
  return Array.from({ length: 10 }, () => rollCharacter());
}

export const DISPLAY_RATES: Partial<Record<Rarity, number>> = BANNER_RATES;
