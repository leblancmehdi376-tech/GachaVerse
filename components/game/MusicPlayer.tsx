'use client';
import { useEffect, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import { getSongCandidates, pickNextSongIndex } from '@/lib/game/music';

const FADE_MS = 400;

function fadeTo(audio: HTMLAudioElement, target: number, duration: number, onDone?: () => void) {
  const start = audio.volume;
  const steps = 10;
  const stepMs = Math.max(16, duration / steps);
  let i = 0;
  const id = setInterval(() => {
    i++;
    audio.volume = Math.max(0, Math.min(1, start + (target - start) * (i / steps)));
    if (i >= steps) { clearInterval(id); audio.volume = target; onDone?.(); }
  }, stepMs);
}

// Lecteur de musique global — un morceau aléatoire parmi les 3 du palier
// actuel, en boucle, avec changement de playlist quand le palier change.
// Aucune UI : ce composant ne fait que jouer le son en arrière-plan.
export function MusicPlayer() {
  const palier           = useGameStore(s => s.palier);
  const musicVolume      = useGameStore(s => s.musicVolume);
  const musicMuted       = useGameStore(s => s.musicMuted);
  const eventMusicActive = useGameStore(s => s.eventMusicActive);

  const audioRef        = useRef<HTMLAudioElement | null>(null);
  const currentPalierRef = useRef<number | null>(null);
  const currentSongRef   = useRef<number | null>(null);
  const extAttemptRef    = useRef(0);          // index dans getSongCandidates (essai d'extension)
  const failedSongsRef   = useRef<Set<number>>(new Set());
  const unlockedRef       = useRef(false);

  const targetVolume = () => (musicMuted ? 0 : musicVolume);

  // Tente de jouer le morceau `songIndex` du palier `pal`, avec repli d'extension
  const tryPlaySong = (pal: number, songIndex: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    extAttemptRef.current = 0;
    currentSongRef.current = songIndex;
    const candidates = getSongCandidates(pal, songIndex);
    audio.src = candidates[0];
    audio.load();
    audio.volume = targetVolume();
    audio.play().catch(() => { /* autoplay bloqué — démarrera au premier clic */ });
  };

  // Choisit et lance un nouveau morceau pour le palier courant (en évitant
  // si possible les morceaux déjà marqués en échec)
  const playRandomForPalier = (pal: number) => {
    if (failedSongsRef.current.size >= 3) return; // aucun morceau dispo pour ce palier
    let next = pickNextSongIndex(currentSongRef.current);
    let guard = 0;
    while (failedSongsRef.current.has(next) && guard < 10) {
      next = pickNextSongIndex(currentSongRef.current);
      guard++;
    }
    tryPlaySong(pal, next);
  };

  // Changement de palier -> fondu puis nouvelle playlist
  useEffect(() => {
    if (currentPalierRef.current === palier) return;
    currentPalierRef.current = palier;
    currentSongRef.current = null;
    failedSongsRef.current = new Set();

    const audio = audioRef.current;
    if (!audio) return;
    if (audio.src) {
      fadeTo(audio, 0, FADE_MS, () => playRandomForPalier(palier));
    } else {
      playRandomForPalier(palier);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [palier]);

  // Volume / mute réactifs
  useEffect(() => {
    const audio = audioRef.current;
    if (audio && !audio.paused) audio.volume = targetVolume();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [musicVolume, musicMuted]);

  // Cède la place à la musique d'événement (EventMusicPlayer) quand elle est
  // active, puis reprend là où elle s'était arrêtée à la fermeture de l'event.
  const wasPlayingBeforeEventRef = useRef(false);
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (eventMusicActive) {
      wasPlayingBeforeEventRef.current = !audio.paused;
      fadeTo(audio, 0, FADE_MS, () => audio.pause());
    } else if (wasPlayingBeforeEventRef.current) {
      audio.volume = 0;
      audio.play().then(() => fadeTo(audio, targetVolume(), FADE_MS)).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventMusicActive]);

  // Déverrouillage autoplay : la plupart des navigateurs bloquent le son
  // tant qu'il n'y a pas eu d'interaction utilisateur sur la page.
  useEffect(() => {
    const unlock = () => {
      if (unlockedRef.current) return;
      unlockedRef.current = true;
      const audio = audioRef.current;
      if (audio && audio.paused) audio.play().catch(() => {});
    };
    window.addEventListener('pointerdown', unlock, { once:true });
    window.addEventListener('keydown', unlock, { once:true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  return (
    <audio
      ref={audioRef}
      loop={false}
      onEnded={() => playRandomForPalier(currentPalierRef.current ?? palier)}
      onError={() => {
        const songIndex = currentSongRef.current;
        if (songIndex == null) return;
        const candidates = getSongCandidates(currentPalierRef.current ?? palier, songIndex);
        extAttemptRef.current += 1;
        if (extAttemptRef.current < candidates.length) {
          // Essaie l'extension suivante pour ce même morceau
          const audio = audioRef.current;
          if (audio) {
            audio.src = candidates[extAttemptRef.current];
            audio.load();
            audio.play().catch(() => {});
          }
        } else {
          // Aucune extension n'a fonctionné -> ce morceau est indisponible
          failedSongsRef.current.add(songIndex);
          playRandomForPalier(currentPalierRef.current ?? palier);
        }
      }}
      style={{ display:'none' }}
    />
  );
}
