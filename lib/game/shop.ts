import { Rarity } from '@/types/game';
import { rollCharacter } from './gacha';

// ── BossCrown : packs de gemmes ───────────────────────────────────────────
export interface CrownGemPack { id: string; crowns: number; gems: number; bonusLabel?: string; }
export const CROWN_GEM_PACKS: CrownGemPack[] = [
  { id:'cg1', crowns:3,  gems:15  },
  { id:'cg2', crowns:8,  gems:90,  bonusLabel:'+20%' },
  { id:'cg3', crowns:15, gems:200, bonusLabel:'+33%' },
];

// ── BossCrown : boosts temporaires ────────────────────────────────────────
export const BOOST_COST_CROWNS  = 3;             // coût d'un boost (DPS ou Or)
export const BOOST_DURATION_MS  = 15 * 60 * 1000; // 15 minutes
export const BOOST_MULTIPLIER   = 1.2;            // +20%

// ── Orbe du Néant : packs de gemmes ───────────────────────────────────────
export interface OrbGemPack { id: string; orbs: number; gems: number; bonusLabel?: string; }
export const ORB_GEM_PACKS: OrbGemPack[] = [
  { id:'og1', orbs:275,  gems:45  },
  { id:'og2', orbs:525, gems:90,  bonusLabel:'+20%' },
  { id:'og3', orbs:1000, gems:180, bonusLabel:'+50%' },
];

// ── Boutique gemmes → Or : packs de pixel coins achetés en gemmes ─────────
export interface GemGoldPack { id: string; coins: number; gems: number; bonusLabel?: string; }
export const GEM_GOLD_PACKS: GemGoldPack[] = [
  { id:'gg1', coins:500_000,  gems:50 },
  { id:'gg2', coins:2_000_000, gems:185 },
  { id:'gg3', coins:5_000_000, gems:350 },
];

// ── Orbe du Néant : recyclage des doublons au rang max (7★) ──────────────
export function getVoidOrbsForRarity(rarity: Rarity): number {
  if (rarity === 'C' || rarity === 'U' || rarity === 'R') return 1;
  if (rarity === 'E' || rarity === 'L' || rarity === 'M') return 10;
  return 50; // S, CO, P, T
}

// ── Personnages boutique (3 par jour, payés en Orbes du Néant) ───────────
export const SHOP_CHAR_PRICE_ORBS: Record<Rarity, number> = {
  C:5, U:8, R:12, E:20, L:35, M:60, S:150, CO:360, P:850, T:1500,
};

export function getTodayDayKey(): string {
  // Reset quotidien basé sur la date locale du joueur (suffisant pour ce besoin)
  return new Date().toDateString();
}

export function generateDailyShopCharacters(): string[] {
  const ids = new Set<string>();
  let guard = 0;
  while (ids.size < 3 && guard < 200) {
    ids.add(rollCharacter());
    guard++;
  }
  return Array.from(ids);
}

// ── Pack de démarrage Early Access ────────────────────────────────────────
// ⚠️ À AJUSTER : remplacer par l'horodatage réel de mise en ligne sur Vercel.
// ⚠️ Lancement : 00h01 le 19 juin 2026 heure française (UTC+2 en été = 22h01 UTC le 18 juin)
export const LAUNCH_TIMESTAMP = new Date('2026-06-18T22:01:00Z').getTime();
export const STARTER_PACK_WINDOW_MS = 24 * 60 * 60 * 1000; // 24h après le lancement
export const STARTER_PACK_REWARDS = { gems: 10, voidOrbs: 1 };

// ── Coffres d'équipement (achetés en gemmes) ──────────────────────────────
export interface EquipmentChestDef {
  id:       string;
  label:    string;
  emoji:    string;
  gems:     number;
  color:    string;
  glow:     string;
  dropRates: { label: string; pct: string; color: string }[];
}

export const EQUIPMENT_CHESTS: EquipmentChestDef[] = [
  {
    id: 'chest_common', label: 'Coffre Commun', emoji: '📦', gems: 80,
    color: '#9ca3af', glow: '#6b7280',
    dropRates: [
      { label:'Commun',      pct:'94.13%', color:'#9ca3af' },
      { label:'Rare',        pct:'3.21%',  color:'#60a5fa' },
      { label:'Épique',      pct:'1.53%',  color:'#c084fc' },
      { label:'Légendaire',  pct:'0.72%',  color:'#fbbf24' },
      { label:'Stellaire',   pct:'0.30%',  color:'#ffffff' },
      { label:'Cosmique',    pct:'0.10%',  color:'#34d399' },
      { label:'Primordial',  pct:'0.01%',  color:'#ff6b35' },
      { label:'Transcendant',pct:'0.00%',  color:'#e879f9' },
    ],
  },
  {
    id: 'chest_rare', label: 'Coffre Rare', emoji: '🎁', gems: 280,
    color: '#60a5fa', glow: '#3b82f6',
    dropRates: [
      { label:'Commun',      pct:'45.92%', color:'#9ca3af' },
      { label:'Rare',        pct:'29.18%', color:'#60a5fa' },
      { label:'Épique',      pct:'14.51%', color:'#c084fc' },
      { label:'Légendaire',  pct:'6.58%',  color:'#fbbf24' },
      { label:'Stellaire',   pct:'1.98%',  color:'#ffffff' },
      { label:'Cosmique',    pct:'1.00%',  color:'#34d399' },
      { label:'Primordial',  pct:'0.78%',  color:'#ff6b35' },
      { label:'Transcendant',pct:'0.05%',  color:'#e879f9' },
    ],
  },
  {
    id: 'chest_epic', label: 'Coffre Épique', emoji: '💎', gems: 500,
    color: '#c084fc', glow: '#9333ea',
    dropRates: [
      { label:'Commun',      pct:'6.54%',  color:'#9ca3af' },
      { label:'Rare',        pct:'14.03%', color:'#60a5fa' },
      { label:'Épique',      pct:'35.72%', color:'#c084fc' },
      { label:'Légendaire',  pct:'16.94%', color:'#fbbf24' },
      { label:'Stellaire',   pct:'10.83%',  color:'#ffffff' },
      { label:'Cosmique',    pct:'8.51%',  color:'#34d399' },
      { label:'Primordial',  pct:'6.52%',  color:'#ff6b35' },
      { label:'Transcendant',pct:'0.91%',  color:'#e879f9' },
    ],
  },
];
