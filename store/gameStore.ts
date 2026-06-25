'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  GameState, OwnedCharacter, HeroState, EquipmentSlot, EquippedItems, defaultEquippedItems, getPalierConfig,
  calcCharDps, calcHeroDpc, xpToNextLevel, levelUpCost, heroLevelUpCost,
  calcBaseDpc, calcClickUpgradeCost,
  evoCost, canEvolve, canEvolveHero, getLevelCap, RARITY_CONFIG,
} from '@/types/game';
import { generateEnemy } from '@/lib/game/enemies';
import { rollCharacter, rollMulti, GACHA_COSTS } from '@/lib/game/gacha';
import { getCharacterById, HERO_TEMPLATE, EVENT_EXCLUSIVE_IDS } from '@/lib/game/characters';
import { ITEM_DEFS } from '@/lib/game/items';
import { computeActiveSynergies, calcDpsWithSynergies } from '@/lib/game/synergies';
import { getUltimateDef } from '@/lib/game/ultimates';
import { auth } from '@/lib/firebase/config';
import { updatePlayerScore } from '@/lib/firebase/leaderboard';
import { useUltimateStore, getActiveCoinMultiplier } from '@/store/ultimateStore';
import { getEquipmentDrop, getEquipmentDef } from '@/lib/game/items';
import {
  CROWN_GEM_PACKS, ORB_GEM_PACKS, GEM_GOLD_PACKS, BOOST_COST_CROWNS, BOOST_DURATION_MS, BOOST_MULTIPLIER,
  getVoidOrbsForRarity, SHOP_CHAR_PRICE_ORBS, getTodayDayKey, generateDailyShopCharacters,
  LAUNCH_TIMESTAMP, STARTER_PACK_WINDOW_MS, STARTER_PACK_REWARDS,
} from '@/lib/game/shop';

export interface Quest {
  id: string; label: string; icon: string;
  target: number; current: number; reward: number; rewardType: 'gems'|'coins'; done: boolean;
}

const DAILY_QUESTS: Omit<Quest,'current'|'done'>[] = [
  { id:'kills60',   label:'Vaincre 250 monstres', icon:'⚔', target:250, reward:10, rewardType:'gems'  },
  { id:'upgrade1',  label:'Améliorer 5 fois',      icon:'⬆', target:5,   reward:8,  rewardType:'gems'  },
  { id:'clicks100', label:'Effectuer 500 clics',   icon:'🖱', target:500, reward:8,  rewardType:'gems'  },
];

// Coût et multiplicateur du Coffre d'Or — partagés entre upgradeGold() et resolveEnemyDeath()
// Ajout de deux niveaux supplémentaires : coûts et multiplicateurs
export const GOLD_UPGRADE_COSTS = [5_000, 25_000, 100_000, 400_000, 1_000_000, 5_000_000];
export const GOLD_MULTIPLIERS   = [1, 1.15, 1.30, 1.50, 1.75, 2.00];

// Récompenses de progression
export const PALIER_PASS_GEMS    = 20;     // gemmes données à chaque palier franchi (mort du boss)
export const MOB_GEM_DROP_CHANCE = 0.005;  // 0.5% de chance de looter 1 gemme bonus sur N'IMPORTE QUEL ennemi tué

// Critique de base (hors ultimates) — Canarticho/The Dress peuvent le surcharger temporairement
const BASE_CRIT_CHANCE  = 0.08;
const CRIT_DAMAGE_BONUS = 0.5; // +50% de dégâts sur un coup critique

export interface ClickResult { dmg: number; crit: boolean; }

interface GameStore extends GameState {
  quests: Quest[];
  questsDayKey: string;
  // Musique
  musicVolume: number;
  musicMuted:  boolean;
  setMusicVolume: (v: number) => void;
  toggleMusicMuted: () => void;
  eventMusicActive: boolean;          // true tant qu'une page d'event avec sa propre musique est ouverte
  setEventMusicActive: (v: boolean) => void;
  // Monnaies additionnelles
  bossCrowns: number;
  voidOrbs: number;
  // Boosts temporaires (BossCrown)
  dpsBoostEndsAt: number;
  goldBoostEndsAt: number;
  isDpsBoostActive: () => boolean;
  isGoldBoostActive: () => boolean;
  buyDpsBoost: () => void;
  buyGoldBoost: () => void;
  buyGemsWithCrowns: (packId: string) => void;
  buyGoldWithGems: (packId: string) => void;
  // Inventaire objets d'évolution
  inventory: Record<string, number>;
  equipmentInventory: Record<string, number>;
  lastEquipmentDrop: string | null;
  addItem: (itemId: string, qty?: number) => void;
  sellItem: (itemId: string, qty: number) => void;
  addEquipment: (equipmentId: string, qty?: number) => void;
  recycleEquipment: (equipmentId: string, qty?: number) => void;
  equipItem: (templateId: string, slot: EquipmentSlot, equipmentId: string) => void;
  unequipItem: (templateId: string, slot: EquipmentSlot) => void;
  setLastEquipmentDrop: (id: string | null) => void;
  // Boutique quotidienne (Orbe du Néant)
  dailyShop: { dayKey: string; characterIds: string[]; purchased: string[] };
  ensureDailyShop: () => void;
  buyShopCharacter: (slotIndex: number) => void;
  buyGemsWithOrbs: (packId: string) => void;
  // Pack de démarrage Early Access
  starterPackClaimed: boolean;
  isStarterPackAvailable: () => boolean;
  claimStarterPack: () => void;
  // Pause (anti-autoclick)
  gamePaused: boolean;
  setGamePaused: (v: boolean) => void;
  // Timestamp de la dernière sauvegarde locale (anti-rollback)
  savedAt: number;
  // Combat
  clickEnemy: () => ClickResult;
  tickDps: () => void;
  tickBossTimer: () => void;
  activateCharacterUltimate: (templateId: string, formIndex: number) => void;
  // Ressources
  spendPixelCoins: (n: number) => boolean;
  // Héros
  levelUpHero: () => void;
  evolveHero: () => void;
  getHeroDpc: () => number;
  upgradeClick: () => void;
  upgradeGold: () => void;
  getGoldMultiplier: () => number;
  getGoldUpgradeCost: () => number;
  // Personnages
  levelUpCharacter: (templateId: string) => void;
  evolveCharacter: (templateId: string) => void;
  getTotalDps: () => number;
  equipCharacter: (id: string, slot: number) => void;
  unequipCharacter: (slot: number) => void;
  // Joueur
  username: string;
  setUsername: (name: string) => void;
  // Gacha
  pullSingle: () => string | null;
  pullMulti: () => string[] | null;
  addToCollection: (id: string) => void;
  // Quêtes
  claimQuest: (id: string) => void;
  ensureDailyQuests: () => void;
  resetGame: () => void;
}

const makeInitial = () => ({
  pixelCoins: 0, nekoGems: 10, totalClicks: 0,
  wave: 1, palier: 1, maxPalierReached: 1,
  currentEnemy: generateEnemy(1, 1),
  baseDpc: 1, clickUpgradeLevel: 0, goldUpgradeLevel: 0,
  equippedTeam: [null, null, null, null] as (string|null)[],
  collection: {} as Record<string, OwnedCharacter>,
  hero: { level: 1, currentForm: 0, xp: 0 } as HeroState,
  bossActive: false, bossTimeLeft: 0,
  lastSaved: Date.now(),
  username: 'NEKOZ',
  quests: DAILY_QUESTS.map(q => ({ ...q, current: 0, done: false })),
  questsDayKey: getTodayDayKey(),
  musicVolume: 0.5, musicMuted: false, eventMusicActive: false,
  bossCrowns: 0, voidOrbs: 0,
  inventory: {} as Record<string, number>,
  equipmentInventory: {} as Record<string, number>,
  lastEquipmentDrop: null,
  dpsBoostEndsAt: 0, goldBoostEndsAt: 0,
  dailyShop: { dayKey: '', characterIds: [] as string[], purchased: [] as string[] },
  starterPackClaimed: false,
  gamePaused: false,
  savedAt: 0,
});

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...makeInitial(),

      // ─── Combat ───────────────────────────────────────────────────────
      clickEnemy: () => {
        const ult = useUltimateStore.getState();
        ult.registerClick();

        const baseDpc       = get().getHeroDpc();
        const dpcMult        = ult.getClickDpcMultiplier();
        const nextClickMult  = ult.consumeNextClickMultiplier();
        const enemyMult       = ult.getActiveEnemyDamageTakenMultiplier();
        const critChance       = ult.getActiveCritChance() ?? BASE_CRIT_CHANCE;
        const crit              = Math.random() < critChance;
        const critMult           = crit ? (1 + CRIT_DAMAGE_BONUS) : 1;

        const finalDmg = Math.max(1, Math.floor(baseDpc * dpcMult * nextClickMult * enemyMult * critMult));

        const coinBurst        = ult.rollClickCoinBursts();
        const damageToCoinPct  = ult.getActiveDamageToCoinPct();
        const bonusCoins       = Math.floor(finalDmg * damageToCoinPct / 100) + coinBurst;

        set(state => {
          const newHp  = Math.max(0, state.currentEnemy.currentHp - finalDmg);
          const clicks = state.totalClicks + 1;
          const quests = state.quests.map(q =>
            q.id === 'clicks100' && !q.done ? { ...q, current: Math.min(q.current+1, q.target) } : q
          );
          const withCoins = bonusCoins > 0 ? { pixelCoins: state.pixelCoins + bonusCoins } : {};
          if (newHp <= 0) {
            return { totalClicks: clicks, quests, ...withCoins, ...resolveEnemyDeath({ ...state, currentEnemy:{ ...state.currentEnemy, currentHp:newHp }, ...withCoins }) };
          }
          return { totalClicks: clicks, quests, ...withCoins, currentEnemy: { ...state.currentEnemy, currentHp: newHp } };
        });

        return { dmg: finalDmg, crit };
      },

      tickDps: () => {
        const ult         = useUltimateStore.getState();
        const heroDpc      = get().getHeroDpc();
        const baseTeamDps   = get().getTotalDps(); // inclut déjà dpsMultiplier/selfDpsMultiplier par perso
        const bonusFlat      = ult.getActiveBonusDpsFlat(heroDpc, baseTeamDps);
        const enemyMult       = ult.getActiveEnemyDamageTakenMultiplier();
        const damageToCoinPct  = ult.getActiveDamageToCoinPct();

        const finalDps = Math.floor((baseTeamDps + bonusFlat) * enemyMult);
        if (finalDps <= 0) return;

        const bonusCoins = Math.floor(finalDps * damageToCoinPct / 100);

        set(state => {
          const newHp = Math.max(0, state.currentEnemy.currentHp - finalDps);
          const withCoins = bonusCoins > 0 ? { pixelCoins: state.pixelCoins + bonusCoins } : {};
          if (newHp <= 0) return { ...withCoins, ...resolveEnemyDeath({ ...state, currentEnemy:{ ...state.currentEnemy, currentHp:newHp }, ...withCoins }) };
          return { ...withCoins, currentEnemy: { ...state.currentEnemy, currentHp: newHp } };
        });
      },

      tickBossTimer: () => set(state => {
        if (!state.bossActive || state.bossTimeLeft <= 0) return {};
        const t = state.bossTimeLeft - 1;
        if (t <= 0) return { bossActive:false, bossTimeLeft:0, wave:1, currentEnemy: generateEnemy(1, state.palier) };
        return { bossTimeLeft: t };
      }),

      activateCharacterUltimate: (templateId, formIndex) => {
        const def = getUltimateDef(templateId);
        if (!def) return;
        const ultState = useUltimateStore.getState();
        if ((ultState.cooldowns[templateId] ?? 0) > 0) return; // pas prêt, sécurité

        const eff   = def.effect;
        const state = get();
        const heroDpc   = state.getHeroDpc();
        const teamDps   = state.getTotalDps();
        const ownedSelf = state.collection[templateId];
        const tplSelf   = getCharacterById(templateId);
        const selfDps   = (ownedSelf && tplSelf) ? calcCharDps(tplSelf, ownedSelf) : 0;

        // ── Dégâts instantanés (one-shot, calculés à l'activation) ────────
        let instantDmg = 0;
        if (eff.instantClicks)           instantDmg += eff.instantClicks * heroDpc;
        if (eff.instantDamagePctSelfDps) instantDmg += selfDps * (eff.instantDamagePctSelfDps / 100);
        if (eff.instantDamagePctTeamDps) instantDmg += teamDps * (eff.instantDamagePctTeamDps / 100);
        if (eff.instantDamagePctMaxHp)   instantDmg += state.currentEnemy.maxHp * (eff.instantDamagePctMaxHp / 100);
        instantDmg = Math.floor(instantDmg);

        // ── Monnaie instantanée (one-shot) ────────────────────────────────
        let instantCoins = 0;
        if (eff.instantCoinMultiplierBurst) {
          instantCoins += Math.floor(state.currentEnemy.pixelCoinsReward * (eff.instantCoinMultiplierBurst - 1));
        }

        if (instantDmg > 0 || instantCoins > 0) {
          set(s => {
            const withCoins = instantCoins > 0 ? { pixelCoins: s.pixelCoins + instantCoins } : {};
            const newHp = Math.max(0, s.currentEnemy.currentHp - instantDmg);
            if (newHp <= 0) return { ...withCoins, ...resolveEnemyDeath({ ...s, currentEnemy:{ ...s.currentEnemy, currentHp:newHp }, ...withCoins }) };
            return { ...withCoins, currentEnemy: { ...s.currentEnemy, currentHp: newHp } };
          });
        }

        // ── Activer le buff (cooldown, durée, gestion cooldowns alliés) ────
        useUltimateStore.getState().activateUlt(templateId, formIndex, get().equippedTeam);
      },

      spendPixelCoins: (n) => {
        if (get().pixelCoins < n) return false;
        set(s => ({ pixelCoins: s.pixelCoins - n }));
        return true;
      },

      // ─── Musique ──────────────────────────────────────────────────────
      setMusicVolume:   (v) => set({ musicVolume: Math.max(0, Math.min(1, v)) }),
      toggleMusicMuted: () => set(s => ({ musicMuted: !s.musicMuted })),
      setEventMusicActive: (v) => set({ eventMusicActive: v }),      setUsername: (name) => set({ username: name.trim().slice(0, 20) }),
      // ─── Boutique : BossCrown (boosts + gemmes) ─────────────────────────
      isDpsBoostActive:  () => Date.now() < get().dpsBoostEndsAt,
      isGoldBoostActive: () => Date.now() < get().goldBoostEndsAt,

      buyDpsBoost: () => {
        if (get().bossCrowns < BOOST_COST_CROWNS) return;
        set(state => ({
          bossCrowns: state.bossCrowns - BOOST_COST_CROWNS,
          dpsBoostEndsAt: Math.max(Date.now(), state.dpsBoostEndsAt) + BOOST_DURATION_MS,
        }));
      },
      buyGoldBoost: () => {
        if (get().bossCrowns < BOOST_COST_CROWNS) return;
        set(state => ({
          bossCrowns: state.bossCrowns - BOOST_COST_CROWNS,
          goldBoostEndsAt: Math.max(Date.now(), state.goldBoostEndsAt) + BOOST_DURATION_MS,
        }));
      },
      buyGemsWithCrowns: (packId) => {
        const pack = CROWN_GEM_PACKS.find(p => p.id === packId);
        if (!pack || get().bossCrowns < pack.crowns) return;
        set(state => ({ bossCrowns: state.bossCrowns - pack.crowns, nekoGems: state.nekoGems + pack.gems }));
      },
      buyGoldWithGems: (packId) => {
        const pack = GEM_GOLD_PACKS.find(p => p.id === packId);
        if (!pack || get().nekoGems < pack.gems) return;
        set(state => ({ nekoGems: state.nekoGems - pack.gems, pixelCoins: state.pixelCoins + pack.coins }));
      },

      // ─── Boutique : Orbe du Néant (persos + gemmes) ─────────────────────
      ensureDailyShop: () => {
        const today = getTodayDayKey();
        if (get().dailyShop.dayKey === today) return; // déjà à jour
        set({ dailyShop: { dayKey: today, characterIds: generateDailyShopCharacters(), purchased: [] } });
      },
      buyShopCharacter: (slotIndex) => {
        const { dailyShop, voidOrbs } = get();
        const templateId = dailyShop.characterIds[slotIndex];
        if (!templateId || dailyShop.purchased.includes(templateId)) return;
        const tpl = getCharacterById(templateId);
        if (!tpl) return;
        const price = SHOP_CHAR_PRICE_ORBS[tpl.rarity];
        if (voidOrbs < price) return;
        set(state => ({
          voidOrbs: state.voidOrbs - price,
          dailyShop: { ...state.dailyShop, purchased: [...state.dailyShop.purchased, templateId] },
        }));
        get().addToCollection(templateId);
      },
      buyGemsWithOrbs: (packId) => {
        const pack = ORB_GEM_PACKS.find(p => p.id === packId);
        if (!pack || get().voidOrbs < pack.orbs) return;
        set(state => ({ voidOrbs: state.voidOrbs - pack.orbs, nekoGems: state.nekoGems + pack.gems }));
      },

      // ─── Pack de démarrage Early Access (24h après le lancement) ───────
      isStarterPackAvailable: () => {
        if (get().starterPackClaimed) return false;
        const now = Date.now();
        return now >= LAUNCH_TIMESTAMP && now < LAUNCH_TIMESTAMP + STARTER_PACK_WINDOW_MS;
      },
      claimStarterPack: () => {
        if (!get().isStarterPackAvailable()) return;
        set(state => ({
          starterPackClaimed: true,
          nekoGems:   state.nekoGems   + STARTER_PACK_REWARDS.gems,
          voidOrbs:   state.voidOrbs   + STARTER_PACK_REWARDS.voidOrbs,
        }));
      },

      // ─── Pause (anti-autoclick) ────────────────────────────────────────
      setGamePaused: (v: boolean) => set({ gamePaused: v }),

      // ─── Héros ────────────────────────────────────────────────────────
      getHeroDpc: () => {
        const { hero, clickUpgradeLevel } = get();
        // On dérive toujours le baseDpc depuis le niveau pour garantir la cohérence
        // même pour les sauvegardes existantes.
        const baseDpc = calcBaseDpc(clickUpgradeLevel);
        return calcHeroDpc(hero, HERO_TEMPLATE.forms ?? [], baseDpc);
      },

      upgradeClick: () => {
        const level = get().clickUpgradeLevel;
        const cost  = calcClickUpgradeCost(level); // formule centralisée = même valeur que l'UI
        if (!get().spendPixelCoins(cost)) return;
        const newLevel = level + 1;
        set(state => ({
          clickUpgradeLevel: newLevel,
          baseDpc: calcBaseDpc(newLevel), // courbe puissance, stocké pour les sauvegardes
          quests: state.quests.map(q =>
            q.id === 'upgrade1' && !q.done ? { ...q, current: Math.min(q.current+1, q.target) } : q
          ),
        }));
      },

      upgradeGold: () => {
        const level = get().goldUpgradeLevel ?? 0;
        if (level >= GOLD_UPGRADE_COSTS.length) return;
        const cost = GOLD_UPGRADE_COSTS[level];
        if (!get().spendPixelCoins(cost)) return;
        set(state => ({
          goldUpgradeLevel: (state.goldUpgradeLevel ?? 0) + 1,
          quests: state.quests.map(q =>
            q.id === 'upgrade1' && !q.done ? { ...q, current: Math.min(q.current+1, q.target) } : q
          ),
        }));
      },

      getGoldMultiplier: () => {
        const level = get().goldUpgradeLevel ?? 0;
        return GOLD_MULTIPLIERS[Math.min(level, GOLD_MULTIPLIERS.length - 1)];
      },

      getGoldUpgradeCost: () => {
        const level = get().goldUpgradeLevel ?? 0;
        return level >= GOLD_UPGRADE_COSTS.length ? 0 : GOLD_UPGRADE_COSTS[level];
      },

      levelUpHero: () => {
        const { hero } = get();
        const cap  = HERO_TEMPLATE.forms?.[hero.currentForm]?.levelCap ?? 100;
        if (hero.level >= cap) return;                 // doit évoluer d'abord
        const cost = heroLevelUpCost(hero.level);
        if (!get().spendPixelCoins(cost)) return;
        set(state => ({
          hero: { ...state.hero, level: state.hero.level + 1, xp: 0 },
          quests: state.quests.map(q =>
            q.id === 'upgrade1' && !q.done ? { ...q, current: Math.min(q.current+1, q.target) } : q
          ),
        }));
      },

      evolveHero: () => {
        const { hero } = get();
        const forms = HERO_TEMPLATE.forms ?? [];
        if (!canEvolveHero(forms, hero)) return;
        const cost = evoCost('L', hero.currentForm);
        if (!get().spendPixelCoins(cost)) return;
        set(state => ({
          hero: { ...state.hero, currentForm: state.hero.currentForm + 1, level: state.hero.level + 1 },
        }));
      },

      // ─── Inventaire ───────────────────────────────────────────────────
      addItem: (itemId, qty = 1) => set(s => ({
        inventory: { ...s.inventory, [itemId]: (s.inventory[itemId] ?? 0) + qty },
      })),

      sellItem: (itemId, qty) => {
        const item = ITEM_DEFS[itemId];
        if (!item) return;
        const current = get().inventory[itemId] ?? 0;
        const toSell = Math.min(qty, current);
        if (toSell <= 0) return;
        const gained = item.sellValue * toSell;
        set(s => ({
          inventory:   { ...s.inventory,  [itemId]: s.inventory[itemId] - toSell },
          pixelCoins:  s.pixelCoins + gained,
        }));
      },
      addEquipment: (equipmentId, qty = 1) => set(s => ({
        equipmentInventory: { ...s.equipmentInventory, [equipmentId]: (s.equipmentInventory[equipmentId] ?? 0) + qty },
      })),
      recycleEquipment: (equipmentId, qty = 1) => {
        const def = getEquipmentDef(equipmentId);
        if (!def) return;
        set(s => {
          const current = s.equipmentInventory[equipmentId] ?? 0;
          if (current <= 0) return {};
          const removed = Math.min(current, qty);
          return {
            equipmentInventory: { ...s.equipmentInventory, [equipmentId]: current - removed },
            pixelCoins: s.pixelCoins + def.recycleValue * removed,
          };
        });
      },
      equipItem: (templateId, slot, equipmentId) => {
        const owned = get().collection[templateId];
        const def = getEquipmentDef(equipmentId);
        if (!owned || !def || def.slot !== slot) return;
        const currentQty = get().equipmentInventory[equipmentId] ?? 0;
        if (currentQty <= 0) return;
        set(state => {
          const existing = state.collection[templateId];
          if (!existing) return {};
          const equipped = existing.equippedItems ?? defaultEquippedItems();
          if (equipped[slot] === equipmentId) return {};
          const previousId = equipped[slot];
          const newInventory = {
            ...state.equipmentInventory,
            [equipmentId]: currentQty - 1,
          };
          if (previousId) {
            newInventory[previousId] = (newInventory[previousId] ?? 0) + 1;
          }
          return {
            collection: {
              ...state.collection,
              [templateId]: {
                ...existing,
                equippedItems: { ...equipped, [slot]: equipmentId },
              },
            },
            equipmentInventory: newInventory,
          };
        });
      },
      unequipItem: (templateId, slot) => {
        const owned = get().collection[templateId];
        if (!owned || !owned.equippedItems) return;
        const equipped = owned.equippedItems as EquippedItems;
        const equipmentId = equipped[slot];
        if (!equipmentId) return;
        const nextOwned: OwnedCharacter = {
          ...owned,
          equippedItems: { ...equipped, [slot]: null },
        };
        set(state => ({
          collection: {
            ...state.collection,
            [templateId]: nextOwned,
          },
          equipmentInventory: { ...state.equipmentInventory, [equipmentId]: (state.equipmentInventory[equipmentId] ?? 0) + 1 },
        }));
      },

      // ─── Personnages ──────────────────────────────────────────────────
      levelUpCharacter: (templateId) => {
        const owned = get().collection[templateId];
        if (!owned) return;
        const tpl = getCharacterById(templateId);
        if (!tpl) return;
        const cap = getLevelCap(tpl, owned.currentForm);
        if (owned.level >= cap) return;
        const cost = levelUpCost(owned.level, tpl.rarity);
        if (!get().spendPixelCoins(cost)) return;
        set(state => ({
          collection: {
            ...state.collection,
            [templateId]: { ...owned, level: owned.level + 1, xp: 0 },
          },
          quests: state.quests.map(q =>
            q.id === 'upgrade1' && !q.done ? { ...q, current: Math.min(q.current+1, q.target) } : q
          ),
        }));
      },

      evolveCharacter: (templateId) => {
        const owned = get().collection[templateId];
        if (!owned) return;
        const tpl = getCharacterById(templateId);
        if (!tpl || !canEvolve(tpl, owned, get().inventory)) return;
        // Persos event (arthur_leywin, jinwoo) : évolution gratuite en coins,
        // seul l'item est requis
        const isEvent = EVENT_EXCLUSIVE_IDS.includes(templateId);
        if (!isEvent) {
          const cost = evoCost(tpl.rarity, owned.currentForm);
          if (!get().spendPixelCoins(cost)) return;
        }
        // Consomme l'item requis pour cette évolution si applicable
        const nextForm = tpl.forms?.[owned.currentForm + 1];
        const requiredItem = nextForm?.requiredItemId;
        set(state => {
          const newInventory = requiredItem
            ? { ...state.inventory, [requiredItem]: Math.max(0, (state.inventory[requiredItem] ?? 0) - 1) }
            : state.inventory;
          return {
            inventory: newInventory,
            collection: {
              ...state.collection,
              [templateId]: { ...owned, currentForm: owned.currentForm + 1, level: owned.level + 1 },
            },
          };
        });
      },

      getTotalDps: () => {
        const { equippedTeam, collection } = get();
        const activeSynergies = computeActiveSynergies(equippedTeam);
        const ult = useUltimateStore.getState();
        const boostMult = get().isDpsBoostActive() ? BOOST_MULTIPLIER : 1;
        return equippedTeam.reduce((total, id) => {
          if (!id) return total;
          const owned = collection[id];
          const tpl   = getCharacterById(id);
          if (!owned || !tpl) return total;
          const baseDps  = calcCharDps(tpl, owned);
          const helmetMult = getEquipmentDef(owned.equippedItems?.helmet ?? '')?.dpsMultiplier ?? 1;
          const chestMult  = getEquipmentDef(owned.equippedItems?.chest ?? '')?.dpsMultiplier ?? 1;
          const pantsMult  = getEquipmentDef(owned.equippedItems?.pants ?? '')?.dpsMultiplier ?? 1;
          const bootsMult  = getEquipmentDef(owned.equippedItems?.boots ?? '')?.dpsMultiplier ?? 1;
          const weaponMult = getEquipmentDef(owned.equippedItems?.weapon ?? '')?.dpsMultiplier ?? 1;
          const weaponDef  = getEquipmentDef(owned.equippedItems?.weapon ?? '');
          const weaponBonusMult = weaponDef?.bonusFor?.templateId === tpl.id ? weaponDef.bonusFor.multiplier : 1;
          const equippedMult = helmetMult * chestMult * pantsMult * bootsMult * weaponMult * weaponBonusMult;
          const dpsWithEquip = Math.floor(baseDps * equippedMult);
          const withSyn  = calcDpsWithSynergies(id, dpsWithEquip, activeSynergies);
          const ultMult  = ult.getDpsMultiplierFor(id);
          return total + withSyn * ultMult * boostMult;
        }, 0);
      },
      equipCharacter: (id, slot) => {
        const character = get().collection[id];
        if (!character) return;
        set(state => {
          const team = [...state.equippedTeam] as (string | null)[];
          const currentSlot = team.findIndex(entry => entry === id);
          if (currentSlot === slot) return { equippedTeam: team };
          if (currentSlot !== -1) team[currentSlot] = null;
          team[slot] = id;
          return { equippedTeam: team };
        });
      },
      unequipCharacter: (slot) => set(s => {
        const t = [...s.equippedTeam] as (string|null)[];
        t[slot] = null;
        return { equippedTeam: t };
      }),

      // ─── Gacha ────────────────────────────────────────────────────────
      pullSingle: () => {
        if (get().nekoGems < GACHA_COSTS.single) return null;
        set(s => ({ nekoGems: s.nekoGems - GACHA_COSTS.single }));
        const id = rollCharacter(); get().addToCollection(id); return id;
      },
      pullMulti: () => {
        if (get().nekoGems < GACHA_COSTS.multi10) return null;
        set(s => ({ nekoGems: s.nekoGems - GACHA_COSTS.multi10 }));
        const ids = rollMulti(); ids.forEach(id => get().addToCollection(id)); return ids;
      },
      addToCollection: (templateId) => {
        const ex = get().collection[templateId];
        if (ex && ex.rank >= 7) {
          // Déjà au rang maximum (7★) -> ce doublon est recyclé en Orbes du Néant
          const tpl  = getCharacterById(templateId);
          const orbs = tpl ? getVoidOrbsForRarity(tpl.rarity) : 1;
          set(state => ({ voidOrbs: state.voidOrbs + orbs }));
          return;
        }
        set(state => {
          const ex2 = state.collection[templateId];
          const equippedItems = ex2?.equippedItems ?? defaultEquippedItems();
          return {
            collection: {
              ...state.collection,
              [templateId]: ex2
                ? { ...ex2, copies: ex2.copies+1, rank: Math.min(ex2.rank+1, 7), equippedItems }
                : { templateId, rank:1, copies:1, level:1, currentForm:0, xp:0, equippedItems },
            },
          };
        });
      },

      // ─── Quêtes ───────────────────────────────────────────────────────
      claimQuest: (id) => set(s => {
        const q = s.quests.find(q => q.id === id);
        if (!q || q.current < q.target || q.done) return {};
        return {
          quests: s.quests.map(q2 => q2.id===id ? { ...q2, done:true } : q2),
          nekoGems:   q.rewardType==='gems'  ? s.nekoGems  + q.reward : s.nekoGems,
          pixelCoins: q.rewardType==='coins' ? s.pixelCoins + q.reward : s.pixelCoins,
        };
      }),

      // Réinitialise les quêtes à un jour nouveau (progression + statut "réclamé" remis à zéro)
      ensureDailyQuests: () => {
        const today = getTodayDayKey();
        set(state => {
          const dayChanged = state.questsDayKey !== today;
          // Les valeurs (libellé/cible/récompense) viennent TOUJOURS du code à jour,
          // seule la progression (current/done) est conservée d'une session à l'autre,
          // et uniquement réinitialisée si le jour a réellement changé. Ainsi un patch
          // d'équilibrage des quêtes s'applique immédiatement, sans attendre minuit.
          const quests = DAILY_QUESTS.map(def => {
            const prev = state.quests.find(q => q.id === def.id);
            return {
              ...def,
              current: dayChanged ? 0 : (prev?.current ?? 0),
              done:    dayChanged ? false : (prev?.done ?? false),
            };
          });
          return { questsDayKey: today, quests };
        });
      },

      setLastEquipmentDrop: (id) => set(() => ({ lastEquipmentDrop: id })),
      resetGame: () => {
        try { localStorage.clear(); } catch {}
        set(makeInitial());
      },
    }),
    {
      name: 'nekoz-world-v7',
      partialize: (s) => ({
        pixelCoins:s.pixelCoins, nekoGems:s.nekoGems, totalClicks:s.totalClicks,
        wave:s.wave, palier:s.palier, maxPalierReached:s.maxPalierReached,
        currentEnemy:s.currentEnemy, baseDpc:s.baseDpc, clickUpgradeLevel:s.clickUpgradeLevel,
        equippedTeam:s.equippedTeam, collection:s.collection, hero:s.hero, goldUpgradeLevel:s.goldUpgradeLevel ?? 0,
        bossActive:s.bossActive, bossTimeLeft:s.bossTimeLeft, quests:s.quests, questsDayKey:s.questsDayKey,
        musicVolume:s.musicVolume, musicMuted:s.musicMuted,
        bossCrowns:s.bossCrowns, voidOrbs:s.voidOrbs,
        inventory:s.inventory,
        equipmentInventory:s.equipmentInventory,
        dpsBoostEndsAt:s.dpsBoostEndsAt, goldBoostEndsAt:s.goldBoostEndsAt,
        dailyShop:s.dailyShop, starterPackClaimed:s.starterPackClaimed,
        username:s.username,
      }),
    }
  )
);

function resolveEnemyDeath(state: GameState & { quests: Quest[] }): Partial<GameState & { quests: Quest[] }> {
  // Garde-fou : ne résout la mort que si currentEnemy.currentHp <= 0 a bien été
  // appliqué par l'appelant (voir clickEnemy/tickDps/activateCharacterUltimate,
  // qui fusionnent { currentHp: newHp } avant d'appeler cette fonction).
  if (state.currentEnemy.currentHp > 0) return {};

  // Multiplicateurs de coins (or + ult + boost BossCrown)
  const goldMult     = GOLD_MULTIPLIERS[Math.min((state as {goldUpgradeLevel?:number}).goldUpgradeLevel ?? 0, GOLD_MULTIPLIERS.length - 1)];
  const ultCoinMult  = getActiveCoinMultiplier(useUltimateStore.getState());
  const goldBoostEndsAt = (state as {goldBoostEndsAt?:number}).goldBoostEndsAt ?? 0;
  const boostGoldMult   = Date.now() < goldBoostEndsAt ? BOOST_MULTIPLIER : 1;
  const baseCoins   = Math.floor(state.currentEnemy.pixelCoinsReward * goldMult * ultCoinMult * boostGoldMult);
  const coins = state.pixelCoins + baseCoins;

  // 0.5% de chance de looter 1 gemme bonus sur n'importe quel ennemi (boss inclus)
  const mobGemDrop = Math.random() < MOB_GEM_DROP_CHANCE ? 1 : 0;
  const gems  = state.nekoGems + state.currentEnemy.gemsReward + mobGemDrop;

  const quests = state.quests.map(q =>
    q.id === 'kills60' && !q.done ? { ...q, current: Math.min(q.current+1, q.target) } : q
  );
  const bossCrownsBefore = (state as {bossCrowns?:number}).bossCrowns ?? 0;
  if (state.currentEnemy.isBoss) {
    const next = state.palier + 1;
    if (auth?.currentUser?.uid) {
      updatePlayerScore(auth.currentUser.uid, {
        username: state.username,
        palier: next,
        wave: 1,
        totalClicks: state.totalClicks,
        pixelCoins: coins,
      }).catch(() => {});
    }
    // +20 gemmes à chaque palier franchi, en plus du loot normal du boss
    return { pixelCoins:coins, nekoGems:gems + PALIER_PASS_GEMS, quests, wave:1, palier:next, maxPalierReached:Math.max(state.maxPalierReached,next), bossActive:false, bossTimeLeft:0, currentEnemy:generateEnemy(1,next), bossCrowns: bossCrownsBefore + 1 } as Partial<GameState & { quests: Quest[] }>;
  }
  const nw = state.wave + 1;
  if (nw === 10) return { pixelCoins:coins, nekoGems:gems, quests, wave:10, bossActive:true, bossTimeLeft:getPalierConfig(state.palier).bossTimerSeconds, currentEnemy:generateEnemy(10,state.palier) };
  const equipDrop = getEquipmentDrop();
  const newEquipmentInventory = equipDrop
    ? { ...state.equipmentInventory, [equipDrop]: (state.equipmentInventory[equipDrop] ?? 0) + 1 }
    : state.equipmentInventory;
  return {
    pixelCoins:coins,
    nekoGems:gems,
    quests,
    wave:nw,
    currentEnemy:generateEnemy(nw,state.palier),
    equipmentInventory:newEquipmentInventory,
    lastEquipmentDrop: equipDrop ?? null,
  };
}
