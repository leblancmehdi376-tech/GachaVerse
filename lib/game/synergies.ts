import { getCharacterById } from './characters';

export interface SynergyThreshold {
  count: number; label: string; dpsBonus: number; globalBonus: number;
}

export interface SynergyDef {
  id: string; universe: string; label: string;
  color: string; glow: string; icon: string;
  thresholds: SynergyThreshold[];
}

export interface ActiveSynergy {
  def: SynergyDef; threshold: SynergyThreshold; count: number; members: string[];
}

export const SYNERGIES: SynergyDef[] = [
  { id:'dbz',         universe:'Dragon Ball Z',       label:'Dragon Ball Z',    color:'#f97316', glow:'#ea580c', icon:'🐉',
    thresholds:[{ count:2, label:'+32% DPS DBZ',dpsBonus:32,globalBonus:0 },{ count:4, label:'+55% DPS +15% global',dpsBonus:55,globalBonus:15 }] },
  { id:'onepiece',    universe:'One Piece',            label:'One Piece',        color:'#f59e0b', glow:'#d97706', icon:'☠',
    thresholds:[{ count:2, label:'+25% DPS One Piece',dpsBonus:25,globalBonus:0 },{ count:3, label:'+35% DPS +5% global',dpsBonus:35,globalBonus:5 }] },
  { id:'naruto',      universe:'Naruto',               label:'Naruto',           color:'#f97316', glow:'#ea580c', icon:'🍃',
    thresholds:[{ count:2, label:'+22% DPS Naruto',dpsBonus:22,globalBonus:0 },{ count:3, label:'+35% DPS',dpsBonus:35,globalBonus:0 }] },
  { id:'pokemon',     universe:'Pokémon',              label:'Pokémon',          color:'#fbbf24', glow:'#f59e0b', icon:'⚡',
    thresholds:[{ count:2, label:'+21% DPS Pokémon',dpsBonus:21,globalBonus:0 },{ count:4, label:'+30% DPS +5% global',dpsBonus:30,globalBonus:5 }] },
  { id:'persona5',    universe:'Persona 5',            label:'Persona 5',        color:'#ef4444', glow:'#dc2626', icon:'🃏',
    thresholds:[{ count:2, label:'+18% DPS Persona',dpsBonus:18,globalBonus:0 },{ count:3, label:'+40% DPS',dpsBonus:40,globalBonus:0 }] },
  { id:'poppy',       universe:'Poppy Playtime',       label:'Poppy Playtime',   color:'#4ade80', glow:'#16a34a', icon:'🧸',
    thresholds:[{ count:2, label:'+28% DPS Poppy',dpsBonus:28,globalBonus:0 }] },
  { id:'blackclover', universe:'Black Clover',         label:'Black Clover',     color:'#fbbf24', glow:'#d97706', icon:'🍀',
    thresholds:[{ count:2, label:'+25% DPS Black Clover',dpsBonus:25,globalBonus:0 },{ count:3, label:'+35% DPS',dpsBonus:35,globalBonus:0 }] },
  { id:'brotato',     universe:'Brotato',              label:'Brotato',          color:'#fb923c', glow:'#ea580c', icon:'🥔',
    thresholds:[{ count:2, label:'+22% DPS Brotato',dpsBonus:22,globalBonus:0 }] },
  { id:'tensei',      universe:'Tensei Slime',         label:'Tensei Slime',     color:'#34d399', glow:'#10b981', icon:'🌀',
    thresholds:[{ count:2, label:'+29% DPS Tensei',dpsBonus:29,globalBonus:0 }] },
  { id:'minecraft',   universe:'Minecraft',            label:'Minecraft',        color:'#86efac', glow:'#22c55e', icon:'🟩',
    thresholds:[{ count:2, label:'+22% DPS Minecraft',dpsBonus:22,globalBonus:0 }] },
  { id:'subnautica',  universe:'Subnautica',           label:'Subnautica',       color:'#38bdf8', glow:'#0891b2', icon:'🌊',
    thresholds:[{ count:2, label:'+15% DPS Subnautica',dpsBonus:15,globalBonus:0 }] },
  { id:'bleach',      universe:'Bleach',               label:'Bleach',           color:'#60a5fa', glow:'#3b82f6', icon:'⚔',
    thresholds:[{ count:2, label:'+28% DPS Bleach',dpsBonus:28,globalBonus:0 },{ count:4, label:'+45% DPS +6% global',dpsBonus:45,globalBonus:6 }] },
  { id:'fate',        universe:'Fate',                 label:'Fate',             color:'#c084fc', glow:'#9333ea', icon:'👑',
    thresholds:[{ count:2, label:'+25% DPS Fate',dpsBonus:25,globalBonus:0 },{ count:4, label:'+40% DPS +5% global',dpsBonus:40,globalBonus:5 }] },
  { id:'zelda',       universe:'The Legend of Zelda',  label:'Zelda',            color:'#a3e635', glow:'#65a30d', icon:'🗡',
    thresholds:[{ count:2, label:'+15% DPS Zelda',dpsBonus:15,globalBonus:0 }] },
  { id:'repo',        universe:'R.E.P.O',              label:'R.E.P.O',          color:'#a78bfa', glow:'#7c3aed', icon:'🔔',
    thresholds:[{ count:2, label:'+12% DPS R.E.P.O',dpsBonus:12,globalBonus:0 }] },
  { id:'danganronpa', universe:'Danganronpa',           label:'Danganronpa',      color:'#ec4899', glow:'#db2777', icon:'💀',
    thresholds:[{ count:2, label:'+20% DPS Danganronpa',dpsBonus:20,globalBonus:0 },{ count:3, label:'+45% DPS',dpsBonus:45,globalBonus:0 }] },
  { id:'digital',     universe:'Digital Circus',       label:'Digital Circus',   color:'#818cf8', glow:'#6366f1', icon:'🎪',
    thresholds:[{ count:2, label:'+15% DPS Digital Circus',dpsBonus:15,globalBonus:0 }] },
  { id:'sao',         universe:'Sword Art Online',     label:'SAO',              color:'#67e8f9', glow:'#0284c7', icon:'🗾',
    thresholds:[{ count:2, label:'+15% DPS SAO',dpsBonus:15,globalBonus:0 }] },
  { id:'bungou',      universe:'Bungou Stray Dogs',    label:'Bungou Stray Dogs',color:'#f472b6', glow:'#ec4899', icon:'📖',
    thresholds:[{ count:2, label:'+18% DPS Bungou',dpsBonus:18,globalBonus:0 }] },
  { id:'overwatch',   universe:'Overwatch',            label:'Overwatch',        color:'#f59e0b', glow:'#d97706', icon:'🛡',
    thresholds:[{ count:2, label:'+15% DPS Overwatch',dpsBonus:15,globalBonus:0 }] },
  { id:'chillcool',   universe:'Chill&Cool',           label:'Chill&Cool',       color:'#818cf8', glow:'#6366f1', icon:'😎',
    thresholds:[{ count:2, label:'+35% global (mascotte)',dpsBonus:35,globalBonus:20 }] },
  { id:'sao_kirito',  universe:'Sword Art Online',     label:'SAO',              color:'#67e8f9', glow:'#0284c7', icon:'🗾',
    thresholds:[{ count:2, label:'+15% DPS SAO',dpsBonus:15,globalBonus:0 }] },
];

// Déduplique par universe
const UNIQUE_SYNERGIES = SYNERGIES.filter((s, i, arr) => arr.findIndex(x => x.universe === s.universe) === i);

export function computeActiveSynergies(equippedTeam: (string | null)[]): ActiveSynergy[] {
  const universeCount: Record<string, string[]> = {};
  for (const id of equippedTeam) {
    if (!id) continue;
    const tpl = getCharacterById(id);
    if (!tpl?.universe) continue;
    if (!universeCount[tpl.universe]) universeCount[tpl.universe] = [];
    universeCount[tpl.universe].push(id);
  }
  const active: ActiveSynergy[] = [];
  for (const [universe, members] of Object.entries(universeCount)) {
    if (members.length < 2) continue; // minimum 2 requis
    const def = UNIQUE_SYNERGIES.find(s => s.universe === universe);
    if (!def) continue;
    const reached = [...def.thresholds].reverse().find(t => members.length >= t.count);
    if (reached) active.push({ def, threshold: reached, count: members.length, members });
  }
  return active;
}

export function calcDpsWithSynergies(
  templateId: string, baseDps: number, activeSynergies: ActiveSynergy[]
): number {
  const tpl = getCharacterById(templateId);
  if (!tpl) return baseDps;
  let mult = 1;
  for (const syn of activeSynergies) {
    if (syn.def.universe === tpl.universe && syn.threshold.dpsBonus > 0)
      mult += syn.threshold.dpsBonus / 100;
    if (syn.threshold.globalBonus > 0)
      mult += syn.threshold.globalBonus / 100;
  }
  return Math.floor(baseDps * mult);
}

export const getSynergyByUniverse = (universe: string) =>
  UNIQUE_SYNERGIES.find(s => s.universe === universe);

export { UNIQUE_SYNERGIES as SYNERGIES_LIST };
export default UNIQUE_SYNERGIES;
