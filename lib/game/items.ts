// ── Objets d'évolution ─────────────────────────────────────────────────
// Items obtenus via les boss d'événement, stockés dans l'inventaire du
// joueur (gameStore.inventory), et consommés pour débloquer certaines
// évolutions spéciales (voir EvoForm.requiredItemId dans characters.ts).

export interface ItemDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  sellValue: number; // Pixel-Coins obtenus à la revente
}

export const ITEM_DEFS: Record<string, ItemDef> = {
  elixir_vie: {
    id: 'elixir_vie', name: 'Élixir de Vie', icon: '🧪', color: '#4ade80',
    description: "Débloque la 1ère évolution de Sung Jin Woo.",
    sellValue: 500_000,
  },
  manteau_ombre: {
    id: 'manteau_ombre', name: "Manteau de l'Ombre", icon: '🧥', color: '#818cf8',
    description: "Débloque la 2ème évolution de Sung Jin Woo.",
    sellValue: 750_000,
  },
  beru: {
    id: 'beru', name: 'Beru', icon: '🐜', color: '#a855f7',
    description: "Débloque l'évolution finale de Sung Jin Woo.",
    sellValue: 1_000_000,
  },
  cristal_ether: {
    id: 'cristal_ether', name: 'Cristal d’Éther', icon: '💎', color: '#38bdf8',
    description: 'Matériau d’évolution requis pour Arthur Leywin.',
    sellValue: 500_000,
  },
  epee_ether: {
    id: 'epee_ether', name: 'Épée d’Éther', icon: '⚔️', color: '#f59e0b',
    description: 'Arme d’évolution requise pour Arthur Leywin.',
    sellValue: 750_000,
  },
  sylvia: {
    id: 'sylvia', name: 'Sylvia', icon: '👑', color: '#f97316',
    description: 'Trophée de Sylvia, utilisé pour la dernière évolution d’Arthur Leywin.',
    sellValue: 1_500_000,
  },
};

export interface EquipmentDef {
  id: string;
  name: string;
  slot: 'helmet' | 'chest' | 'pants' | 'boots' | 'weapon';
  rarity: string;
  description: string;
  icon: string;
  color: string;
  dpsMultiplier: number;
  recycleValue: number;
  bonusFor?: {
    templateId: string;
    multiplier: number;
    description: string;
  };
}

export const EQUIPMENT_DEFS: Record<string, EquipmentDef> = {
  // Casques
  helmet_common: {
    id: 'helmet_common', name: 'Casque Commun', slot:'helmet', rarity:'C', icon:'⛑', color:'#9ca3af',
    description:'Casque robuste pour les débutants.', dpsMultiplier:1.05, recycleValue:1000,
  },
  helmet_rare: {
    id: 'helmet_rare', name: 'Casque Rare', slot:'helmet', rarity:'R', icon:'🪖', color:'#60a5fa',
    description:'Casque plus résistant et élégant.', dpsMultiplier:1.12, recycleValue:4000,
  },
  helmet_epic: {
    id: 'helmet_epic', name: 'Casque Épique', slot:'helmet', rarity:'E', icon:'🥽', color:'#c084fc',
    description:'Casque enchanté aux propriétés offensives.', dpsMultiplier:1.18, recycleValue:12000,
  },
  helmet_legendary: {
    id: 'helmet_legendary', name: 'Casque Légendaire', slot:'helmet', rarity:'L', icon:'🥷', color:'#fbbf24',
    description:'Casque mythique issu des batailles anciennes.', dpsMultiplier:1.25, recycleValue:95000,
  },
  helmet_primordial: {
    id: 'helmet_primordial', name: 'Casque Primordial', slot:'helmet', rarity:'P', icon:'👑', color:'#ff6b35',
    description:'Casque porté par les premiers héros.', dpsMultiplier:1.40, recycleValue:750000,
  },

  // Plastrons
  chest_common: {
    id: 'chest_common', name: 'Plastron Commun', slot:'chest', rarity:'C', icon:'🛡', color:'#9ca3af',
    description:'Plastron léger et fiable.', dpsMultiplier:1.04, recycleValue:1200,
  },
  chest_rare: {
    id: 'chest_rare', name: 'Plastron Rare', slot:'chest', rarity:'R', icon:'🦺', color:'#60a5fa',
    description:'Plastron renforcé contre les dégâts.', dpsMultiplier:1.10, recycleValue:4200,
  },
  chest_epic: {
    id: 'chest_epic', name: 'Plastron Épique', slot:'chest', rarity:'E', icon:'🥼', color:'#c084fc',
    description:'Plastron chargé de magie offensive.', dpsMultiplier:1.16, recycleValue:13000,
  },
  chest_legendary: {
    id: 'chest_legendary', name: 'Plastron Légendaire', slot:'chest', rarity:'L', icon:'🛡️', color:'#fbbf24',
    description:'Plastron des champions légendaires.', dpsMultiplier:1.22, recycleValue:70000,
  },
  chest_primordial: {
    id: 'chest_primordial', name: 'Plastron Primordial', slot:'chest', rarity:'P', icon:'🛡️', color:'#ff6b35',
    description:'Plastron imprégné de l’énergie primordiale.', dpsMultiplier:1.35, recycleValue:560000,
  },

  // Pantalons
  pants_common: {
    id: 'pants_common', name: 'Pantalon Commun', slot:'pants', rarity:'C', icon:'🩳', color:'#9ca3af',
    description:'Pantalon de voyage ordinaire.', dpsMultiplier:1.03, recycleValue:1100,
  },
  pants_rare: {
    id: 'pants_rare', name: 'Pantalon Rare', slot:'pants', rarity:'R', icon:'🩳', color:'#60a5fa',
    description:'Pantalon renforcé pour l’agilité.', dpsMultiplier:1.08, recycleValue:3900,
  },
  pants_epic: {
    id: 'pants_epic', name: 'Pantalon Épique', slot:'pants', rarity:'E', icon:'👖', color:'#c084fc',
    description:'Pantalon mystique qui améliore les mouvements.', dpsMultiplier:1.14, recycleValue:12500,
  },
  pants_legendary: {
    id: 'pants_legendary', name: 'Pantalon Légendaire', slot:'pants', rarity:'L', icon:'👖', color:'#fbbf24',
    description:'Pantalon des sages de bataille.', dpsMultiplier:1.20, recycleValue:68000,
  },
  pants_primordial: {
    id: 'pants_primordial', name: 'Pantalon Primordial', slot:'pants', rarity:'P', icon:'👖', color:'#ff6b35',
    description:'Pantalon chargé d’une force ancienne.', dpsMultiplier:1.32, recycleValue:840000,
  },

  // Bottes
  boots_common: {
    id: 'boots_common', name: 'Bottes Communes', slot:'boots', rarity:'C', icon:'🥾', color:'#9ca3af',
    description:'Bottes simples pour marcher plus vite.', dpsMultiplier:1.03, recycleValue:1100,
  },
  boots_rare: {
    id: 'boots_rare', name: 'Bottes Rares', slot:'boots', rarity:'R', icon:'🥾', color:'#60a5fa',
    description:'Bottes équilibrées pour le combat.', dpsMultiplier:1.09, recycleValue:3800,
  },
  boots_epic: {
    id: 'boots_epic', name: 'Bottes Épiques', slot:'boots', rarity:'E', icon:'🥾', color:'#c084fc',
    description:'Bottes enchantées pour l’élan.', dpsMultiplier:1.15, recycleValue:13000,
  },
  boots_legendary: {
    id: 'boots_legendary', name: 'Bottes Légendaires', slot:'boots', rarity:'L', icon:'🥾', color:'#fbbf24',
    description:'Bottes des héros des âges anciens.', dpsMultiplier:1.21, recycleValue:69000,
  },
  boots_primordial: {
    id: 'boots_primordial', name: 'Bottes Primordiales', slot:'boots', rarity:'P', icon:'🥾', color:'#ff6b35',
    description:'Bottes imprégnées d’une force primale.', dpsMultiplier:1.34, recycleValue:1045000,
  },

  // Armes génériques
  weapon_common: {
    id: 'weapon_common', name: 'Arme Commune', slot:'weapon', rarity:'C', icon:'🗡', color:'#9ca3af',
    description:'Une arme simple, mais efficace.', dpsMultiplier:1.08, recycleValue:1500,
  },
  weapon_rare: {
    id: 'weapon_rare', name: 'Arme Rare', slot:'weapon', rarity:'R', icon:'⚔', color:'#60a5fa',
    description:'Arme qui tranche avec précision.', dpsMultiplier:1.16, recycleValue:4500,
  },
  weapon_epic: {
    id: 'weapon_epic', name: 'Arme Épique', slot:'weapon', rarity:'E', icon:'🗡️', color:'#c084fc',
    description:'Arme imprégnée d’énergie mystique.', dpsMultiplier:1.24, recycleValue:14000,
  },
  weapon_legendary: {
    id: 'weapon_legendary', name: 'Arme Légendaire', slot:'weapon', rarity:'L', icon:'🗡️', color:'#fbbf24',
    description:'Arme qui a traversé les légendes.', dpsMultiplier:1.34, recycleValue:75000,
  },
  weapon_primordial: {
    id: 'weapon_primordial', name: 'Arme Primordiale', slot:'weapon', rarity:'P', icon:'⚔️', color:'#ff6b35',
    description:'Arme ancestrale dotée d’un pouvoir brut.', dpsMultiplier:1.52, recycleValue:1280000,
  },
  weapon_stellar: {
    id: 'weapon_stellar', name: 'Gomu Gomu No Mi', slot:'weapon', rarity:'S', icon:'🍉', color:'#ffffff',
    description:'Bonus si équipé par Luffy.', dpsMultiplier:1.65, recycleValue:3500000,
    bonusFor:{ templateId:'luffy', multiplier:1.30, description:'Bonus si équipé par Luffy' },
  },
  weapon_cosmic_gilgamesh: {
    id: 'weapon_cosmic_gilgamesh', name: 'Nature divine', slot:'weapon', rarity:'CO', icon:'🌿', color:'#34d399',
    description:'Bonus si équipé par Gilgamesh.', dpsMultiplier:1.75, recycleValue:5000000,
    bonusFor:{ templateId:'gilgamesh', multiplier:1.35, description:'Bonus si équipé par Gilgamesh' },
  },
  weapon_cosmic_jinwoo: {
    id: 'weapon_cosmic_jinwoo', name: 'La Colère de Kamish', slot:'weapon', rarity:'CO', icon:'🔥', color:'#34d399',
    description:'Bonus si équipé par Jinwoo.', dpsMultiplier:1.75, recycleValue:5300000,
    bonusFor:{ templateId:'jinwoo', multiplier:1.35, description:'Bonus si équipé par Jinwoo' },
  },
  weapon_cosmic_minato: {
    id: 'weapon_cosmic_minato', name: 'Le Kunaï de l’Espace-Temps', slot:'weapon', rarity:'CO', icon:'🌀', color:'#34d399',
    description:'Bonus si équipé par Minato.', dpsMultiplier:1.75, recycleValue:5600000,
    bonusFor:{ templateId:'minato', multiplier:1.35, description:'Bonus si équipé par Minato' },
  },
  weapon_cosmic_vegeta: {
    id: 'weapon_cosmic_vegeta', name: 'Détecteur', slot:'weapon', rarity:'CO', icon:'🔭', color:'#34d399',
    description:'Bonus si équipé par Végéta.', dpsMultiplier:1.75, recycleValue:5900000,
    bonusFor:{ templateId:'vegeta', multiplier:1.35, description:'Bonus si équipé par Végéta' },
  },
  weapon_transcendant: {
    id: 'weapon_transcendant', name: 'Cigarette Electronique', slot:'weapon', rarity:'T', icon:'⌨️', color:'#e879f9',
    description:'Bonus si équipé par NekoZ.', dpsMultiplier:1.95, recycleValue:9000000,
    bonusFor:{ templateId:'nekoz', multiplier:1.90, description:'Bonus si équipé par NekoZ' },
  },
  weapon_primordial_draconic: {
    id: 'weapon_primordial_draconic', name: 'Draconic Sword', slot:'weapon', rarity:'P', icon:'🐉', color:'#ff6b35',
    description:'Bonus si équipé par Limule.', dpsMultiplier:1.55, recycleValue:7000000,
    bonusFor:{ templateId:'limule', multiplier:1.30, description:'Bonus si équipé par Limule' },
  },
  weapon_primordial_magic: {
    id: 'weapon_primordial_magic', name: 'Bâton Magique', slot:'weapon', rarity:'P', icon:'✨', color:'#ff6b35',
    description:'Bonus si équipé par Goku.', dpsMultiplier:1.55, recycleValue:7200000,
    bonusFor:{ templateId:'goku', multiplier:1.30, description:'Bonus si équipé par Goku' },
  },
  weapon_primordial_dawn: {
    id: 'weapon_primordial_dawn', name: "Épée de l'Aube", slot:'weapon', rarity:'P', icon:'🌅', color:'#fde68a',
    description:"L'arme sacrée forgée à l'aurore des temps. Bonus si équipée par Arthur Leywin.", dpsMultiplier:1.58, recycleValue:8500000,
    bonusFor:{ templateId:'arthur_leywin', multiplier:1.40, description:"Bonus si équipée par Arthur Leywin" },
  },
  weapon_cosmique_babylone: { 
    id: 'clef_babylone', name: 'Clé de Babylone', slot:'weapon', rarity:'CO', icon:'✨', color:'#fde68a',
    description:"Armes bennir par les plus puissant", dpsMultiplier:1.58, recycleValue:8500000,
    bonusFor:{ templateId:'gilgamesh', multiplier:1.40, description:"Bonus si équipée par Gilgamesh" },
  },
};

export const getItemDef = (id: string): ItemDef | undefined => ITEM_DEFS[id];
export const getEquipmentDef = (id: string): EquipmentDef | undefined => EQUIPMENT_DEFS[id];

export function getEquipmentForSlot(slot: EquipmentDef['slot']): EquipmentDef[] {
  return Object.values(EQUIPMENT_DEFS).filter(item => item.slot === slot);
}

export function getEquipmentDrop(): string | null {
  const roll = Math.random() * 100;
  if (roll < 0.00025) {
    const transcend = Object.values(EQUIPMENT_DEFS).filter(item => item.rarity === 'T');
    return transcend.length ? transcend[Math.floor(Math.random() * transcend.length)].id : null;
  }
  if (roll < 0.0035) {
    const cosmic = Object.values(EQUIPMENT_DEFS).filter(item => item.rarity === 'CO');
    return cosmic.length ? cosmic[Math.floor(Math.random() * cosmic.length)].id : null;
  }
  if (roll < 0.0015) {
    const primordial = Object.values(EQUIPMENT_DEFS).filter(item => item.rarity === 'P');
    return primordial.length ? primordial[Math.floor(Math.random() * primordial.length)].id : null;
  }
  if (roll < 0.147) {
    const legendary = Object.values(EQUIPMENT_DEFS).filter(item => item.rarity === 'L');
    return legendary.length ? legendary[Math.floor(Math.random() * legendary.length)].id : null;
  }
  if (roll < 0.277) {
    const epic = Object.values(EQUIPMENT_DEFS).filter(item => item.rarity === 'E');
    return epic.length ? epic[Math.floor(Math.random() * epic.length)].id : null;
  }
  if (roll < 1.07) {
    const rare = Object.values(EQUIPMENT_DEFS).filter(item => item.rarity === 'R');
    return rare.length ? rare[Math.floor(Math.random() * rare.length)].id : null;
  }
  if (roll < 6.97) {
    const common = Object.values(EQUIPMENT_DEFS).filter(item => item.rarity === 'C');
    return common.length ? common[Math.floor(Math.random() * common.length)].id : null;
  }
  return null;
}

export function getEquipmentDpsMultiplier(owned: { equippedItems: Record<string, string | null> }, templateId?: string): number {
  let mult = 1;
  for (const equippedId of Object.values(owned.equippedItems)) {
    if (!equippedId) continue;
    const item = getEquipmentDef(equippedId);
    if (!item) continue;
    mult *= item.dpsMultiplier;
    if (item.bonusFor?.templateId && templateId === item.bonusFor.templateId) {
      mult *= item.bonusFor.multiplier;
    }
  }
  return mult;
}

export function getEquipmentEquippedCount(collection: { [templateId: string]: { equippedItems: Record<string, string | null> } }, equipmentId: string): number {
  return Object.values(collection).reduce((count, owned) => {
    return count + Object.values(owned.equippedItems).filter(eid => eid === equipmentId).length;
  }, 0);
}

/**
 * Drop d'items d'évolution sur les mobs normaux.
 * Chaque item droppable est listé avec sa chance (en %).
 * Retourne l'id de l'item dropé, ou null.
 */
const ITEM_DROP_TABLE: { id: string; chance: number }[] = [
  { id: 'clef_babylone', chance: 0.4 }, // ~1 drop toutes les 250 vagues
];

export function getItemDrop(): string | null {
  for (const entry of ITEM_DROP_TABLE) {
    if (Math.random() * 100 < entry.chance) return entry.id;
  }
  return null;
}
