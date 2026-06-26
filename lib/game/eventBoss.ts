// ── Monarque des Ombres — Boss d'événement ─────────────────────────────

export interface EventBossDef {
  id: string;
  name: string;
  subtitle: string;
  spritePath: string;
  bgImagePath: string;
  description: string;
  bgGradient: string;
  accentColor: string;
  availableUntil: number;
  targetSeconds?: number;
  dropTable: DropEntry[];
}

export interface DropResult {
  type: 'character' | 'item' | 'gems' | 'bossCrowns' | 'nothing';
  id?: string;
  qty?: number;
}

export const SHADOW_MONARCH_BOSS: EventBossDef = {
  id:          'shadow_monarch',
  name:        'Monarque des Ombres',
  subtitle:    'Le Roi qui se tient au sommet de tous les Monarques',
  spritePath:  '/sprites/events/shadow_monarch.webp',
  bgImagePath: '/sprites/events/shadow_monarch_bg',
  description: 'Une présence écrasante émane de cette silhouette sombre. Ses soldats de l\'ombre attendent vos ordres... ou votre mort.',
  bgGradient:  'linear-gradient(180deg,#0a0014,#05000a)',
  accentColor: '#c084fc',
  availableUntil: new Date('2026-07-05T23:59:59Z').getTime(),
  dropTable: [
    { weight: 0.30, result: { type:'item',      id:'beru',           qty:1 } },
    { weight: 0.50, result: { type:'character', id:'jinwoo'              } },
    { weight: 1.00, result: { type:'item',      id:'manteau_ombre',  qty:1 } },
    { weight: 2.00, result: { type:'item',      id:'elixir_vie',     qty:1 } },
    { weight: 30.0, result: { type:'gems',                           qty:10 } },
    { weight: 20.0, result: { type:'bossCrowns',                     qty:3  } },
    { weight: 46.2, result: { type:'nothing'                             } },
  ],
};

export const ARTHUR_LEYWIN_BOSS: EventBossDef = {
  id:          'arthur_leywin',
  name:        'Arthur Leywin',
  subtitle:    'Héritier de l’Aube',
  spritePath:  '/sprites/events/arthur_leywin.webp',
  bgImagePath: '/sprites/events/arthur_leywin_bg',
  description: 'Le jeune héritier du soleil, prêt à frapper avec la puissance d\'une lame d\'éther.',
  bgGradient:  'linear-gradient(180deg,#071b2a,#081115)',
  accentColor: '#fbbf24',
  availableUntil: new Date('2026-07-12T23:59:59Z').getTime(),
  targetSeconds: 300,
  dropTable: [
    { weight: 0.25, result: { type:'character', id:'arthur_leywin'   } },
    { weight: 0.40, result: { type:'item',      id:'cristal_ether', qty:1 } },
    { weight: 0.40, result: { type:'item',      id:'epee_ether',    qty:1 } },
    { weight: 0.75, result: { type:'item',      id:'sylvia',        qty:1 } },
    { weight: 35.0, result: { type:'gems',                           qty:20 } },
    { weight: 15.0, result: { type:'bossCrowns',                     qty:5  } },
    { weight: 48.6, result: { type:'nothing'                             } },
  ],
};

export const EVENT_BOSSES: EventBossDef[] = [SHADOW_MONARCH_BOSS, ARTHUR_LEYWIN_BOSS];

export interface DropEntry {
  weight: number;
  result: DropResult;
}

export function rollEventDrop(bossId: string): DropResult {
  const boss = EVENT_BOSSES.find(b => b.id === bossId);
  if (!boss) return { type: 'nothing' };
  const totalWeight = boss.dropTable.reduce((s, e) => s + e.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const entry of boss.dropTable) {
    roll -= entry.weight;
    if (roll <= 0) return entry.result;
  }
  return { type: 'nothing' };
}

// ── Calibrage de la difficulté ──────────────────────────────────────────
// Le boss est dimensionné par rapport à la puissance ACTUELLE du joueur
// (DPC + DPS d'équipe), pas par un chiffre fixe — ça reste équilibré même
// si l'économie du jeu (DPC, ultimates...) est rééquilibrée plus tard.
const FIGHT_TARGET_SECONDS = 240;       // durée visée d'un combat via DPS passif seul (~4 min) pour un joueur déjà puissant
const MIN_POWER_FLOOR      = 50;        // évite un calcul à 0 pour un joueur sans équipe
const MINIMUM_BOSS_HP      = 800_000;   // plancher absolu — même un joueur tout frais doit affronter un vrai combat

export function getEventBossMaxHp(boss: EventBossDef, currentPower: number): number {
  const power = Math.max(currentPower, MIN_POWER_FLOOR);
  const targetSeconds = boss.targetSeconds ?? FIGHT_TARGET_SECONDS;
  return Math.max(Math.floor(power * targetSeconds), MINIMUM_BOSS_HP);
}
