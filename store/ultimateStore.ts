'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getUltimateDef, UltimateEffect } from '@/lib/game/ultimates';

export interface ActiveUlt {
  templateId: string;
  formIndex:  number;
  endsAt:     number;   // timestamp ms
  effect:     UltimateEffect;
}

interface UltState {
  cooldowns:  Record<string, number>;   // templateId -> secondes restantes
  activeUlts: ActiveUlt[];               // effets en cours
  animating:  string | null;             // templateId en cours d'animation

  // Etat des effets "par clic"
  clickStacks:                Record<string, number>; // stackPerClickPct : nb de stacks accumulés
  comboMultipliers:            Record<string, number>; // comboGrowthPct : multiplicateur courant
  pendingNextClickMultiplier:  number;                  // nextClickMultiplier en attente (1 = aucun)

  startCooldown: (templateId: string, duration: number) => void;
  activateUlt:   (templateId: string, formIndex: number, equippedTeam?: (string | null)[]) => void;
  tick:          () => void;

  // Hooks "par clic" — appelés depuis gameStore.clickEnemy()
  registerClick:              () => void;
  consumeNextClickMultiplier: () => number;
  rollClickCoinBursts:        () => number;

  // Sélecteurs de combat — utilisés par gameStore pour calculer les dégâts réels
  getClickDpcMultiplier:               () => number;
  getDpsMultiplierFor:                 (templateId: string) => number;
  getActiveCritChance:                 () => number | null;
  getActiveEnemyDamageTakenMultiplier: () => number;
  getActiveBonusDpsFlat:               (heroDpc: number, teamDps: number) => number;
  getActiveDamageToCoinPct:            () => number;
}

const STACK_CAP = 30;   // plafond de stacks (stackPerClickPct)
const COMBO_CAP = 50;   // plafond multiplicateur (comboGrowthPct) — sécurité anti-explosion numérique

export const useUltimateStore = create<UltState>()(
  persist(
    (set, get) => ({
  cooldowns:  {},
  activeUlts: [],
  animating:  null,
  clickStacks: {},
  comboMultipliers: {},
  pendingNextClickMultiplier: 1,

  startCooldown: (id, dur) =>
    set(s => ({ cooldowns: { ...s.cooldowns, [id]: dur } })),

  activateUlt: (templateId, formIndex, equippedTeam = []) => {
    const def = getUltimateDef(templateId);
    if (!def) return;
    const now = Date.now();
    const eff = def.effect;

    // ── 1 SEULE ULT ACTIVE À LA FOIS : on annule l'ult en cours ──────────
    const currentActive = get().activeUlts[0];
    if (currentActive) {
      const prevId = currentActive.templateId;
      set(s => {
        const cs = { ...s.clickStacks }; delete cs[prevId];
        const cm = { ...s.comboMultipliers }; delete cm[prevId];
        return { activeUlts: [], clickStacks: cs, comboMultipliers: cm };
      });
    }

    set(() => ({ animating: templateId }));
    setTimeout(() => set(() => ({ animating: null })), def.animDuration);

    set(s => {
      const newCooldowns = { ...s.cooldowns, [templateId]: def.cooldown };
      const others = (equippedTeam ?? []).filter((id): id is string => !!id && id !== templateId);

      if (eff.reduceOtherCooldownsSeconds) {
        for (const id of others) newCooldowns[id] = Math.max(0, (newCooldowns[id] ?? 0) - eff.reduceOtherCooldownsSeconds!);
      }
      if (eff.haltTeamCooldownHalved) {
        for (const id of others) newCooldowns[id] = Math.floor((newCooldowns[id] ?? 0) / 2);
      }
      if (eff.resetBestOtherCooldown) {
        let bestId: string | null = null; let bestVal = 0;
        for (const id of others) { const v = newCooldowns[id] ?? 0; if (v > bestVal) { bestVal = v; bestId = id; } }
        if (bestId) newCooldowns[bestId] = 0;
      }

      const clickStacks = { ...s.clickStacks };
      const comboMultipliers = { ...s.comboMultipliers };
      if (eff.stackPerClickPct) clickStacks[templateId] = 0;
      if (eff.comboGrowthPct)   comboMultipliers[templateId] = 1;

      return {
        cooldowns: newCooldowns,
        clickStacks, comboMultipliers,
        pendingNextClickMultiplier: eff.nextClickMultiplier ?? s.pendingNextClickMultiplier,
        activeUlts: [{ templateId, formIndex, endsAt: now + def.duration * 1000, effect: eff }],
      };
    });

    setTimeout(() => {
      set(s => {
        const cs = { ...s.clickStacks }; delete cs[templateId];
        const cm = { ...s.comboMultipliers }; delete cm[templateId];
        return {
          activeUlts: s.activeUlts.filter(a => a.templateId !== templateId),
          clickStacks: cs, comboMultipliers: cm,
        };
      });
    }, def.duration * 1000);
  },

  tick: () => set(s => {
    const newCds: Record<string, number> = {};
    for (const [id, cd] of Object.entries(s.cooldowns)) newCds[id] = Math.max(0, cd - 1);
    const now = Date.now();
    const activeUlts = s.activeUlts.filter(a => a.endsAt > now);
    return { cooldowns: newCds, activeUlts };
  }),

  registerClick: () => set(s => {
    const clickStacks = { ...s.clickStacks };
    const comboMultipliers = { ...s.comboMultipliers };
    for (const a of s.activeUlts) {
      if (a.effect.stackPerClickPct) clickStacks[a.templateId] = Math.min((clickStacks[a.templateId] ?? 0) + 1, STACK_CAP);
      if (a.effect.comboGrowthPct) {
        const cur = comboMultipliers[a.templateId] ?? 1;
        comboMultipliers[a.templateId] = Math.min(cur * (1 + a.effect.comboGrowthPct / 100), COMBO_CAP);
      }
    }
    return { clickStacks, comboMultipliers };
  }),

  consumeNextClickMultiplier: () => {
    const val = get().pendingNextClickMultiplier;
    if (val !== 1) set({ pendingNextClickMultiplier: 1 });
    return val;
  },

  rollClickCoinBursts: () => {
    let total = 0;
    for (const a of get().activeUlts) {
      const b = a.effect.chancePerClickCoinBurst;
      if (b && Math.random() * 100 < b.chancePct) total += b.coinFlat;
    }
    return total;
  },

  getClickDpcMultiplier: () => {
    const { activeUlts, clickStacks, comboMultipliers } = get();
    let mult = 1;
    for (const a of activeUlts) {
      if (a.effect.dpcMultiplier) mult *= a.effect.dpcMultiplier;
      if (a.effect.stackPerClickPct) mult *= 1 + ((clickStacks[a.templateId] ?? 0) * a.effect.stackPerClickPct / 100);
      if (a.effect.comboGrowthPct)   mult *= comboMultipliers[a.templateId] ?? 1;
    }
    return mult;
  },

  getDpsMultiplierFor: (templateId) => {
    let mult = 1;
    for (const a of get().activeUlts) {
      if (a.effect.dpsMultiplier) mult *= a.effect.dpsMultiplier;
      if (a.effect.selfDpsMultiplier && a.templateId === templateId) mult *= a.effect.selfDpsMultiplier;
    }
    return mult;
  },

  getActiveCritChance: () => {
    let best: number | null = null;
    for (const a of get().activeUlts) {
      if (a.effect.critChance != null) best = best === null ? a.effect.critChance : Math.max(best, a.effect.critChance);
    }
    return best;
  },

  getActiveEnemyDamageTakenMultiplier: () =>
    get().activeUlts.reduce((m, a) => a.effect.enemyDamageTakenBonusPct ? m * (1 + a.effect.enemyDamageTakenBonusPct / 100) : m, 1),

  getActiveBonusDpsFlat: (heroDpc, teamDps) => {
    let bonus = 0;
    for (const a of get().activeUlts) {
      if (a.effect.poisonDpsPctOfDpc) bonus += heroDpc * (a.effect.poisonDpsPctOfDpc / 100);
      if (a.effect.autoStrikes) {
        const { perSecond, source, value } = a.effect.autoStrikes;
        const perStrike = source === 'dpc' ? heroDpc * value : teamDps * (value / 100);
        bonus += perSecond * perStrike;
      }
    }
    return bonus;
  },

  getActiveDamageToCoinPct: () =>
    get().activeUlts.reduce((sum, a) => sum + (a.effect.damageToCoinPct ?? 0), 0),
    }),
    {
      name: 'nekoz-ult-v1',
      // Ne persiste QUE les cooldowns (pas les actives — elles expirent au reload)
      partialize: (s) => ({ cooldowns: s.cooldowns }),
    }
  )
);

// ── Sélecteur coin (utilisé dans resolveEnemyDeath de gameStore) ──────────
export function getActiveCoinMultiplier(store: ReturnType<typeof useUltimateStore.getState>): number {
  return store.activeUlts.reduce((m, a) => m * (a.effect.coinMultiplier ?? 1), 1);
}
