'use client';
import { useEffect, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import { saveGameToFirestore, loadGameFromFirestore } from '@/lib/firebase/saveGame';
import { updatePlayerScore } from '@/lib/firebase/leaderboard';

const FIREBASE_INTERVAL_MS = 600_000; // Firebase toutes les 10min (quota)
const LOCAL_INTERVAL_MS    =  30_000; // localStorage toutes les 30s (gratuit, illimité)
const LOCAL_STORAGE_KEY    = 'gachaverse_save';

// ── Sérialisation ──────────────────────────────────────────────────────────
function getSerializableState() {
  const s = useGameStore.getState();
  return {
    pixelCoins:         s.pixelCoins,
    nekoGems:           s.nekoGems,
    totalClicks:        s.totalClicks,
    wave:               s.wave,
    palier:             s.palier,
    maxPalierReached:   s.maxPalierReached,
    currentEnemy:       s.currentEnemy,
    baseDpc:            s.baseDpc,
    clickUpgradeLevel:  s.clickUpgradeLevel,
    goldUpgradeLevel:   s.goldUpgradeLevel ?? 0,
    equippedTeam:       s.equippedTeam,
    collection:         s.collection,
    hero:               s.hero,
    bossActive:         s.bossActive,
    bossTimeLeft:       s.bossTimeLeft,
    quests:             s.quests,
    questsDayKey:       s.questsDayKey,
    musicVolume:        s.musicVolume,
    musicMuted:         s.musicMuted,
    bossCrowns:         s.bossCrowns,
    voidOrbs:           s.voidOrbs,
    inventory:          s.inventory,
    equipmentInventory: s.equipmentInventory,
    championInventory:  s.championInventory ?? {},
    dpsBoostEndsAt:     s.dpsBoostEndsAt,
    goldBoostEndsAt:    s.goldBoostEndsAt,
    dailyShop:          s.dailyShop,
    starterPackClaimed: s.starterPackClaimed,
    username:           s.username,
    savedAt:            Date.now(),
  };
}

// ── localStorage (backup local, aucun quota) ───────────────────────────────
function saveToLocal() {
  try {
    const data = getSerializableState();
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    useGameStore.setState({ savedAt: data.savedAt });
  } catch (e) {
    console.warn('[CloudSave] localStorage write failed:', e);
  }
}

function loadFromLocal(): Record<string, unknown> | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// ── Chargement au login — compare Firebase, localStorage et état local ─────
async function loadAndApply(userId: string) {
  try {
    const [remote, local] = await Promise.all([
      loadGameFromFirestore(userId),
      Promise.resolve(loadFromLocal()),
    ]);

    const current = useGameStore.getState();

    // Cherche la sauvegarde la plus récente parmi les 3 sources
    const sources = [
      { label: 'firebase',      data: remote,  ts: (remote  as Record<string,unknown>)?.lastSaved as number ?? 0 },
      { label: 'localStorage',  data: local,   ts: (local   as Record<string,unknown>)?.savedAt   as number ?? 0 },
      { label: 'local (store)', data: null,    ts: current.savedAt ?? 0 },
    ];

    const best = sources.reduce((a, b) => (b.ts > a.ts ? b : a));
    console.log('[CloudSave] Sources:', sources.map(s => `${s.label}=${new Date(s.ts).toLocaleTimeString()}`).join(' | '));
    console.log('[CloudSave] Meilleure source:', best.label, '—', new Date(best.ts).toLocaleTimeString());

    if (best.data && best.ts > (current.savedAt ?? 0)) {
      useGameStore.setState(best.data as Parameters<typeof useGameStore.setState>[0]);
    }
  } catch (e) {
    console.error('[CloudSave] Erreur loadAndApply:', e);
  }
}

// ── Firebase (avec gestion quota + timeout 5s) ────────────────────────────
async function saveToFirebase(userId: string) {
  try {
    const s    = useGameStore.getState();
    const data = getSerializableState();

    // Timeout 5s — si Firebase est bloqué (quota), on n'attend pas indéfiniment
    await Promise.race([
      saveGameToFirestore(userId, data),
      new Promise<void>((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
    ]);

    useGameStore.setState({ savedAt: data.savedAt });

    let totalDps = 0;
    try { totalDps = s.getTotalDps?.() ?? 0; } catch { /* ignore */ }

    await Promise.race([
      updatePlayerScore(userId, {
        username:    s.username    || 'Joueur',
        palier:      s.palier,
        wave:        s.wave,
        pixelCoins:  s.pixelCoins,
        totalClicks: s.totalClicks,
        totalDps,
      }),
      new Promise<void>((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
    ]);

    console.log('[CloudSave] Firebase OK —', new Date().toLocaleTimeString());
  } catch (e) {
    console.warn('[CloudSave] Firebase indisponible (quota ou timeout), données conservées en localStorage:', e);
  }
}

// ── Hook principal ─────────────────────────────────────────────────────────
export function useCloudSave(userId: string | null) {
  const loadedRef = useRef(false);
  const userIdRef = useRef<string | null>(null);

  // Chargement au login
  useEffect(() => {
    if (!userId) { loadedRef.current = false; userIdRef.current = null; return; }
    if (userId === userIdRef.current) return;
    userIdRef.current = userId;
    loadedRef.current = false;
    loadAndApply(userId).finally(() => { loadedRef.current = true; });
  }, [userId]);

  // localStorage toutes les 30s — indépendant du quota Firebase
  useEffect(() => {
    if (!userId) return;
    const id = setInterval(() => {
      if (!loadedRef.current) return;
      saveToLocal();
    }, LOCAL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [userId]);

  // Firebase toutes les 10min
  useEffect(() => {
    if (!userId) return;
    const id = setInterval(() => {
      if (!loadedRef.current) return;
      saveToFirebase(userId);
    }, FIREBASE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [userId]);

  // Save à la fermeture / mise en arrière-plan
  useEffect(() => {
    if (!userId) return;
    const onHide = () => {
      if (document.visibilityState === 'hidden' && loadedRef.current) {
        saveToLocal();           // immédiat, pas de quota
        saveToFirebase(userId);  // tentative Firebase (peut échouer si quota)
      }
    };
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, [userId]);

  // Sauvegarde manuelle (bouton)
  const forceSave = async (): Promise<void> => {
    if (!userId || !loadedRef.current) return;
    saveToLocal();
    await saveToFirebase(userId);
  };

  return { forceSave };
}
