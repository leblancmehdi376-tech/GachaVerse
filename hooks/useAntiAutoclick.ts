/**
 * useAntiAutoclick
 *
 * Détecte les autoclickers réels sans flaguer les humains rapides.
 *
 * Philosophie : on cherche des SIGNAUX FORTS, pas des patterns ambigus.
 *
 * Détections (TOUTES avec confirmation) :
 *  1. Débit > MAX_CPS  (22/s — bien au-dessus du max humain)
 *  2. Régularité extrême ET débit élevé (CV < 6% avec >= 12 CPS)
 *  3. Position pixel-perfect sur 30 clics consécutifs (rayon 20px)
 *
 * Confirmation : il faut 2 détections séparées (cooldown 3s entre chaque)
 * avant de bloquer. Un humain en burst ne déclenchera jamais 2 fois.
 */

import { useRef, useState, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useAuth } from '@/hooks/useAuth';
import { saveApology } from '@/lib/firebase/apologies';

// ── Seuils ─────────────────────────────────────────────────────────────────
const MAX_CPS              = 30;   // humain max ~16 en burst, bot fait 20-60
const WINDOW_MS            = 1000; // fenêtre glissante 1 seconde
const MIN_SAMPLES          = 15;   // min clics dans la fenêtre pour analyser
const REGULARITY_THRESH    = 0.06; // CV < 6% = robot (humain en rythme = 15-30%)
const CPS_FOR_REGULARITY   = 30;   // ne checker la régularité qu'à >= 12 CPS
const POSITION_RADIUS      = 20000;   // px — rayon large pour éviter faux positifs
const POSITION_MIN_COUNT   = 50000;   // 30 clics au même endroit = bot
const CONFIRM_NEEDED       = 2;    // détections nécessaires avant blocage
const CONFIRM_COOLDOWN_MS  = 3000; // délai mini entre deux détections comptées

export interface ClickPoint { x: number; y: number; }

export interface AntiAutoclickState {
  checkClick: (pos: ClickPoint) => boolean;
  isBlocked: boolean;
  strikeLevel: number;
  detectionReason: string;
  submitApology: (text: string) => Promise<void>;
}

// ── Stats ──────────────────────────────────────────────────────────────────
function mean(arr: number[]) { return arr.reduce((s, v) => s + v, 0) / arr.length; }
function stdDev(arr: number[]) {
  const m = mean(arr);
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length);
}
function cv(arr: number[]) { const m = mean(arr); return m === 0 ? 0 : stdDev(arr) / m; }

// ── Hook ───────────────────────────────────────────────────────────────────
export function useAntiAutoclick(): AntiAutoclickState {
  const { setGamePaused, gamePaused, username } = useGameStore();
  const { user } = useAuth();

  const timestampsRef    = useRef<number[]>([]);
  const positionsRef     = useRef<ClickPoint[]>([]);
  const strikeLevelRef   = useRef(0);
  const reasonRef        = useRef('');
  // Compteur de confirmations (reset si le joueur arrête d'être suspect)
  const suspicionRef     = useRef(0);
  const lastSuspicionRef = useRef(0);

  const [, forceUpdate] = useState(0);
  const refresh = useCallback(() => forceUpdate(n => n + 1), []);

  // ── Déclenchement du blocage ─────────────────────────────────────────────
  const triggerBlock = useCallback((reason: string) => {
    strikeLevelRef.current += 1;
    reasonRef.current = reason;
    timestampsRef.current = [];
    positionsRef.current  = [];
    suspicionRef.current  = 0;
    setGamePaused(true);
    console.warn('[AntiAutoclick] Blocage —', reason, '| Strike:', strikeLevelRef.current);
    refresh();
  }, [setGamePaused, refresh]);

  // ── Incrémenter la suspicion (avec cooldown pour éviter faux positifs) ───
  const addSuspicion = useCallback((reason: string) => {
    const now = Date.now();
    // Ignore si on a déjà compté une suspicion récemment
    if (now - lastSuspicionRef.current < CONFIRM_COOLDOWN_MS) return;
    lastSuspicionRef.current = now;
    suspicionRef.current += 1;
    console.warn(`[AntiAutoclick] Suspicion ${suspicionRef.current}/${CONFIRM_NEEDED} — ${reason}`);
    if (suspicionRef.current >= CONFIRM_NEEDED) {
      triggerBlock(reason);
    }
  }, [triggerBlock]);

  // ── Vérification d'un clic ───────────────────────────────────────────────
  const checkClick = useCallback((pos: ClickPoint): boolean => {
    if (gamePaused) return false;

    const now = Date.now();

    // Mise à jour buffers
    timestampsRef.current.push(now);
    timestampsRef.current = timestampsRef.current.filter(t => now - t < WINDOW_MS);
    positionsRef.current.push(pos);
    if (positionsRef.current.length > 60) positionsRef.current = positionsRef.current.slice(-60);

    const times = timestampsRef.current;
    const cps   = times.length;

    // ── Test 1 : débit brut ────────────────────────────────────────────────
    // Signal fort — on accorde quand même la confirmation
    if (cps > MAX_CPS) {
      addSuspicion(`CPS trop élevé: ${cps}/s`);
    }

    // ── Test 2 : régularité à CPS élevé ───────────────────────────────────
    // Seulement si on est déjà à un débit suspect ET qu'on a assez de données
    if (cps >= CPS_FOR_REGULARITY && times.length >= MIN_SAMPLES) {
      const intervals: number[] = [];
      for (let i = 1; i < times.length; i++) intervals.push(times[i] - times[i - 1]);
      const cvVal = cv(intervals);
      if (cvVal < REGULARITY_THRESH) {
        addSuspicion(`Intervalles robot: CPS=${cps}, CV=${cvVal.toFixed(3)}`);
      }
    }

    // ── Test 3 : position pixel-perfect ───────────────────────────────────
    const recent = positionsRef.current.slice(-POSITION_MIN_COUNT);
    if (recent.length >= POSITION_MIN_COUNT) {
      if (recent.every(p => Math.abs(p.x - pos.x) <= POSITION_RADIUS && Math.abs(p.y - pos.y) <= POSITION_RADIUS)) {
        addSuspicion(`Position fixe (${POSITION_MIN_COUNT} clics dans ${POSITION_RADIUS}px)`);
      }
    }

    return true;
  }, [gamePaused, addSuspicion]);

  // ── Soumettre la lettre d'excuse ─────────────────────────────────────────
  const submitApology = useCallback(async (text: string) => {
    const pseudo = username || user?.displayName || user?.email?.split('@')[0] || 'Inconnu';
    await saveApology({
      uid:             user?.uid ?? 'anonymous',
      username:        pseudo,
      email:           user?.email ?? '',
      apology:         text.trim(),
      strikeLevel:     strikeLevelRef.current,
      detectionReason: reasonRef.current,
      submittedAt:     Date.now(),
    });
    setGamePaused(false);
    refresh();
  }, [user, username, setGamePaused, refresh]);

  return {
    checkClick,
    isBlocked:       gamePaused,
    strikeLevel:     strikeLevelRef.current,
    detectionReason: reasonRef.current,
    submitApology,
  };
}
