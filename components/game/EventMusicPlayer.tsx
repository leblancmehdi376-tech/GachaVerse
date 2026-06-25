'use client';
import { useEffect, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import { getEventSongCandidates, pickNextEventSongIndex, EVENT_SONGS_COUNT } from '@/lib/game/music';

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

// Lecteur de musique dédié à l'événement Monarque des Ombres — 2 morceaux en
// rotation aléatoire, séparés de la musique de palier. Se monte/démonte avec
// la page d'événement (via React lifecycle) : signale au lecteur principal
// (MusicPlayer.tsx) de se mettre en pause pendant ce temps via le flag
// `eventMusicActive` du store, et le relâche proprement en se démontant.
export function EventMusicPlayer() {
  const musicVolume = useGameStore(s => s.musicVolume);
  const musicMuted  = useGameStore(s => s.musicMuted);
  const setEventMusicActive = useGameStore(s => s.setEventMusicActive);

  const audioRef      = useRef<HTMLAudioElement | null>(null);
  const currentSongRef = useRef<number | null>(null);
  const extAttemptRef  = useRef(0);
  const failedSongsRef = useRef<Set<number>>(new Set());

  const targetVolume = () => (musicMuted ? 0 : musicVolume);

  const tryPlaySong = (songIndex: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    extAttemptRef.current = 0;
    currentSongRef.current = songIndex;
    const candidates = getEventSongCandidates(songIndex);
    audio.src = candidates[0];
    audio.load();
    audio.volume = targetVolume();
    audio.play().catch(() => { /* autoplay bloqué — démarrera au premier clic */ });
  };

  const playRandom = () => {
    if (failedSongsRef.current.size >= EVENT_SONGS_COUNT) return; // aucun morceau dispo
    let next = pickNextEventSongIndex(currentSongRef.current);
    let guard = 0;
    while (failedSongsRef.current.has(next) && guard < 10) {
      next = pickNextEventSongIndex(currentSongRef.current);
      guard++;
    }
    tryPlaySong(next);
  };

  // Active la musique d'event au montage, la relâche au démontage
  useEffect(() => {
    setEventMusicActive(true);
    playRandom();
    return () => setEventMusicActive(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Volume / mute réactifs
  useEffect(() => {
    const audio = audioRef.current;
    if (audio && !audio.paused) audio.volume = targetVolume();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [musicVolume, musicMuted]);

  return (
    <audio
      ref={audioRef}
      onEnded={playRandom}
      onError={() => {
        const songIndex = currentSongRef.current;
        if (songIndex == null) return;
        const candidates = getEventSongCandidates(songIndex);
        extAttemptRef.current += 1;
        if (extAttemptRef.current < candidates.length) {
          const audio = audioRef.current;
          if (audio) {
            audio.src = candidates[extAttemptRef.current];
            audio.load();
            audio.play().catch(() => {});
          }
        } else {
          failedSongsRef.current.add(songIndex);
          playRandom();
        }
      }}
      style={{ display:'none' }}
    />
  );
}
