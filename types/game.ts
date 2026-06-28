// ── Rareté — ordre de puissance : C < U < R < E < L < M < S < CO < P < T
export type Rarity = 'C' | 'U' | 'R' | 'E' | 'L' | 'M' | 'S' | 'CO' | 'P' | 'T';

export type EquipmentSlot = 'helmet' | 'chest' | 'pants' | 'boots' | 'weapon';
export const EQUIPMENT_SLOTS: EquipmentSlot[] = ['helmet', 'chest', 'pants', 'boots', 'weapon'];
export const EQUIPMENT_SLOT_LABELS: Record<EquipmentSlot, string> = {
  helmet: 'Casque', chest: 'Plastron', pants: 'Pantalon', boots: 'Bottes', weapon: 'Arme',
};

export interface EquippedItems {
  helmet: string | null;
  chest:  string | null;
  pants:  string | null;
  boots:  string | null;
  weapon: string | null;
}

export function defaultEquippedItems(): EquippedItems {
  return { helmet: null, chest: null, pants: null, boots: null, weapon: null };
}

export const RARITY_CONFIG: Record<Rarity, {
  label: string; color: string; glow: string; chance: number; dpsMultiplier: number;
  canEvolve: boolean;
}> = {
  C:  { label:'Commun',      color:'#9ca3af', glow:'#9ca3af', chance:50.0, dpsMultiplier:1,    canEvolve:false },
  U:  { label:'Uncommun',    color:'#86efac', glow:'#22c55e', chance:20.0, dpsMultiplier:1.8,  canEvolve:false },
  R:  { label:'Rare',        color:'#60a5fa', glow:'#3b82f6', chance:12.5, dpsMultiplier:3,    canEvolve:true  },  // ← canEvolve true (Pokémon)
  E:  { label:'Épique',      color:'#c084fc', glow:'#a855f7', chance:8.0,  dpsMultiplier:7,    canEvolve:false },
  L:  { label:'Légendaire',  color:'#fbbf24', glow:'#f59e0b', chance:4.5,  dpsMultiplier:15,   canEvolve:true  },
  M:  { label:'Mythique',    color:'#f87171', glow:'#ef4444', chance:2.5,  dpsMultiplier:40,   canEvolve:true  },
  S:  { label:'Stellaire',   color:'#ffffff', glow:'#fbbf24', chance:1.2,  dpsMultiplier:100,  canEvolve:true  },
  CO: { label:'Cosmique',    color:'#34d399', glow:'#10b981', chance:0.8,  dpsMultiplier:300,  canEvolve:true  },
  P:  { label:'Primordial',  color:'#ff6b35', glow:'#ff4500', chance:0.3,  dpsMultiplier:800,  canEvolve:true  },  // ← nouvelle rareté
  T:  { label:'Transcendant',color:'#e879f9', glow:'#d946ef', chance:0.2,  dpsMultiplier:2000, canEvolve:true  },
};

// ── Forme d'évolution d'un personnage ─────────────────────────────────────
export interface EvoForm {
  formId:      string;
  name:        string;
  spritePath:  string;
  levelCap:    number;
  dpsFormMult: number;
  description: string;
  requiredItemId?: string; // objet d'évolution requis (consommé) pour débloquer cette forme
}

// ── Template personnage ───────────────────────────────────────────────────
export interface CharacterTemplate {
  id:          string;
  name:        string;
  rarity:      Rarity;
  baseDps:     number;
  spritePath:  string;
  description: string;
  universe?:   string;
  forms?:      EvoForm[];
  isHero?:     boolean;
}

// ── Personnage possédé ────────────────────────────────────────────────────
export interface OwnedCharacter {
  templateId:  string;
  rank:        number;
  copies:      number;
  level:       number;
  currentForm: number;
  xp:          number;
  equippedItems?: EquippedItems;
}

// ── Héros principal ───────────────────────────────────────────────────────
export interface HeroState {
  level:       number;
  currentForm: number;
  xp:          number;
}

// ── Fonctions de calcul de niveau ─────────────────────────────────────────
export function xpToNextLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.08, level - 1));
}

export function getLevelCap(character: CharacterTemplate, formIndex: number): number {
  if (!character.forms || character.forms.length === 0) return 100;
  return character.forms[formIndex]?.levelCap ?? 100 * (formIndex + 1);
}

export function canEvolve(character: CharacterTemplate, owned: OwnedCharacter, inventory: Record<string, number> = {}): boolean {
  if (!RARITY_CONFIG[character.rarity].canEvolve) return false;
  if (!character.forms || character.forms.length === 0) return false;
  const cap = getLevelCap(character, owned.currentForm);
  if (owned.level < cap) return false;
  if (owned.currentForm >= character.forms.length - 1) return false;
  const nextForm = character.forms[owned.currentForm + 1];
  if (nextForm.requiredItemId && (inventory[nextForm.requiredItemId] ?? 0) < 1) return false;
  return true;
}

export function canEvolveHero(forms: EvoForm[], hero: HeroState): boolean {
  if (!forms || forms.length === 0) return false;
  const cap = forms[hero.currentForm]?.levelCap ?? 100;
  return hero.level >= cap && hero.currentForm < forms.length - 1;
}

export function calcCharDps(tpl: CharacterTemplate, owned: OwnedCharacter): number {
  const formMult = tpl.forms?.[owned.currentForm]?.dpsFormMult ?? 1;
  const levelMult = 1 + (owned.level - 1) * 0.05;
  const rankMult  = [1, 1.3, 1.7, 2.2, 3.0, 4.5, 7.0][Math.min(owned.rank - 1, 6)];
  return Math.floor(tpl.baseDps * formMult * levelMult * rankMult);
}

export function calcHeroDpc(hero: HeroState, forms: EvoForm[], baseClick: number): number {
  const formMult  = forms[hero.currentForm]?.dpsFormMult ?? 1;
  const levelMult = 1 + (hero.level - 1) * 0.015; // nerfé
  return Math.floor(baseClick * formMult * levelMult);
}

// ── Griffes Aiguisées : courbe DPC & coûts centralisés ───────────────────
/**
 * DPC de base selon le niveau de l'upgrade "Griffes Aiguisées".
 * Courbe puissance (exposant 1.57) :
 *   lv 0 → 1   lv 1 → 3   lv 5 → 17   lv 10 → 43   lv 20 → 119
 */
export function calcBaseDpc(level: number): number {
  return Math.max(1, Math.round(Math.pow(level + 1, 1.57)));
}

/**
 * Coût en PixelCoins pour acheter le prochain niveau de DPC.
 * Courbe exponentielle 80 × 1.5^level :
 *   lv 0 → 80   lv 5 → 607   lv 10 → 4 613   lv 20 → 266 020
 */
export function calcClickUpgradeCost(level: number): number {
  return Math.floor(80 * Math.pow(1.5, level));
}

// ── Coûts de niveau ───────────────────────────────────────────────────────
export function levelUpCost(level: number, rarity: Rarity): number {
  const rarityBase: Record<Rarity, number> = {
    C:10, U:18, R:30, E:80, L:200, M:500, S:1500, CO:5000, P:15000, T:50000,
  };
  // Réduction légère de la croissance : 1.10 au lieu de 1.12
  return Math.floor(rarityBase[rarity] * Math.pow(1.088, level - 1));
}

export function heroLevelUpCost(level: number): number {
  return Math.floor(200 * Math.pow(1.22, level - 1)); // nerfé
}

// ── Coût d'évolution ─────────────────────────────────────────────────────
export function evoCost(rarity: Rarity, currentForm: number): number {
  const base: Record<Rarity, number> = {
    C:0, U:0, R:0, E:0, L:1000000, M:3000000, S:8000000, CO:15000000, P:25000000, T:200000000
  };
  return (base[rarity] ?? 0) * Math.pow(3, currentForm);
}

// ── Paliers ───────────────────────────────────────────────────────────────
export interface PalierConfig {
  id: number; name: string; universe: string; arc: string; subtitle: string;
  bgGradient: string; accentColor: string; bossTimerSeconds: number; monstersPerPalier: number;
}

export const PALIERS: PalierConfig[] = [
  { id:1,  name:'ARC SAIYEN',        universe:'Dragon Ball Z',      arc:'Arc Saiyen',             subtitle:'Les Saiyens débarquent sur Terre',   bgGradient:'linear-gradient(180deg,#0a0f1a,#070b14)', accentColor:'#f97316', bossTimerSeconds:30,  monstersPerPalier:10 },
  { id:2,  name:'EAST BLUE',         universe:'One Piece',          arc:'Saga East Blue',          subtitle:'La mer des rêves commence ici',       bgGradient:'linear-gradient(180deg,#041424,#030d1a)', accentColor:'#3b82f6', bossTimerSeconds:35,  monstersPerPalier:10 },
  { id:3,  name:'EXAMEN CHŪNIN',     universe:'Naruto',             arc:'Première Partie',         subtitle:'Le ninja des feuilles grandit',       bgGradient:'linear-gradient(180deg,#0a1a08,#061004)', accentColor:'#f97316', bossTimerSeconds:40,  monstersPerPalier:10 },
  { id:4,  name:'KANTO',             universe:'Pokémon',            arc:'Région Kanto',            subtitle:'Attrapez-les tous !',                 bgGradient:'linear-gradient(180deg,#0f0a1a,#08061a)', accentColor:'#f59e0b', bossTimerSeconds:45,  monstersPerPalier:10 },
  { id:5,  name:'PALAIS COGNITIF',   universe:'Persona 5',          arc:'Les Voleurs Fantômes',    subtitle:'Tu vas nous le rendre',               bgGradient:'linear-gradient(180deg,#1a0000,#0d0000)', accentColor:'#ef4444', bossTimerSeconds:50,  monstersPerPalier:10 },
  { id:6,  name:'USINE PLAYTIME',    universe:'Poppy Playtime',     arc:'Chapitre 3',              subtitle:'Ils veulent juste jouer',             bgGradient:'linear-gradient(180deg,#001a1a,#000d0d)', accentColor:'#22d3ee', bossTimerSeconds:55,  monstersPerPalier:10 },
  { id:7,  name:'CLOVER KINGDOM',    universe:'Black Clover',       arc:'Saga des Rois Maléfiques',subtitle:'La magie est tout',                   bgGradient:'linear-gradient(180deg,#0a1a00,#060d00)', accentColor:'#4ade80', bossTimerSeconds:60,  monstersPerPalier:10 },
  { id:8,  name:'ZONE DANGER',       universe:'Brotato',            arc:'Vague après vague',       subtitle:'Survive ou meurs',                    bgGradient:'linear-gradient(180deg,#1a0a00,#0d0600)', accentColor:'#fb923c', bossTimerSeconds:65,  monstersPerPalier:10 },
  { id:9,  name:'TEMPEST',           universe:'Tensei Slime',       arc:'Nation de Tempest',       subtitle:'Rimuru veut la paix',                 bgGradient:'linear-gradient(180deg,#001a1a,#000d12)', accentColor:'#34d399', bossTimerSeconds:70,  monstersPerPalier:10 },
  { id:10, name:'OVERWORLD',         universe:'Minecraft',          arc:'Minecraft Overworld',     subtitle:'La nuit tombe...',                    bgGradient:'linear-gradient(180deg,#0a0a00,#050500)', accentColor:'#86efac', bossTimerSeconds:75,  monstersPerPalier:10 },
  { id:11, name:'GRANDE BARRIÈRE',   universe:'Subnautica',         arc:'Les Profondeurs',         subtitle:'4546B — Ne pas descendre',            bgGradient:'linear-gradient(180deg,#000d1a,#00060d)', accentColor:'#38bdf8', bossTimerSeconds:80,  monstersPerPalier:10 },
  { id:12, name:'SOUL SOCIETY',      universe:'Bleach',             arc:'Arc Arrancar',            subtitle:'La société des âmes en guerre',       bgGradient:'linear-gradient(180deg,#0a0000,#050000)', accentColor:'#f87171', bossTimerSeconds:85,  monstersPerPalier:10 },
  { id:13, name:'HOLY GRAIL WAR',    universe:'Fate',               arc:'Unlimited Blade Works',   subtitle:'Sept Servants, un Graal',             bgGradient:'linear-gradient(180deg,#0a0814,#05040a)', accentColor:'#a78bfa', bossTimerSeconds:90,  monstersPerPalier:10 },
  { id:14, name:'TWILIGHT REALM',    universe:'The Legend of Zelda',arc:'Twilight Princess',       subtitle:'Le royaume du crépuscule',            bgGradient:'linear-gradient(180deg,#0a0a00,#060600)', accentColor:'#fbbf24', bossTimerSeconds:95,  monstersPerPalier:10 },
  { id:15, name:'REPO HOUSE',        universe:'R.E.P.O',            arc:'The Collection',          subtitle:'Récupérez les objets... si vous pouvez', bgGradient:'linear-gradient(180deg,#080814,#04040a)', accentColor:'#818cf8', bossTimerSeconds:100, monstersPerPalier:10 },
  { id:16, name:"HOPE'S PEAK",       universe:'Danganronpa',        arc:'Killing Game',            subtitle:'Désespoir contre Espoir',             bgGradient:'linear-gradient(180deg,#1a0014,#0d000a)', accentColor:'#e879f9', bossTimerSeconds:105, monstersPerPalier:10 },
  { id:17, name:'THE BIG TOP',       universe:'Digital Circus',     arc:'Saison 1',                subtitle:'Bienvenue dans le cirque numérique',  bgGradient:'linear-gradient(180deg,#00001a,#00000d)', accentColor:'#c084fc', bossTimerSeconds:110, monstersPerPalier:10 },
  { id:18, name:'AINCRAD',           universe:'Sword Art Online',   arc:'Alicization',             subtitle:'La mort dans le jeu est réelle',      bgGradient:'linear-gradient(180deg,#001414,#000a0a)', accentColor:'#67e8f9', bossTimerSeconds:115, monstersPerPalier:10 },
  { id:19, name:'YOKOHAMA',          universe:'Bungou Stray Dogs',  arc:'Arc Port Mafia',          subtitle:'Détective vs Mafia vs Guilde',        bgGradient:'linear-gradient(180deg,#14000a,#0a0005)', accentColor:'#f472b6', bossTimerSeconds:120, monstersPerPalier:10 },
  { id:20, name:"KING'S ROW",        universe:'Overwatch',          arc:'La Guerre des Omniums',   subtitle:'Les héros ne meurent jamais',         bgGradient:'linear-gradient(180deg,#00000a,#000005)', accentColor:'#fb923c', bossTimerSeconds:130, monstersPerPalier:10 },
];

export function getPalierConfig(p: number): PalierConfig {
  return PALIERS[Math.min(p - 1, PALIERS.length - 1)];
}

export interface Enemy {
  id: string; name: string; wave: number; palier: number;
  maxHp: number; currentHp: number; spritePath: string;
  pixelCoinsReward: number; gemsReward: number; isBoss: boolean;
}

export interface GameState {
  pixelCoins: number; nekoGems: number; totalClicks: number;
  wave: number; palier: number; maxPalierReached: number;
  currentEnemy: Enemy; baseDpc: number; clickUpgradeLevel: number;
  equippedTeam: (string | null)[];
  goldUpgradeLevel: number;
  collection: Record<string, OwnedCharacter>;
  hero: HeroState;
  bossActive: boolean; bossTimeLeft: number; lastSaved: number;
  bossAvoided: boolean;
  ultUsedThisFight: string[];
  username: string;
  equipmentInventory: Record<string, number>;
  lastEquipmentDrop: string | null;
}
