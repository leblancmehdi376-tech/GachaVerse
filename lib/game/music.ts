// ── Musique par palier ─────────────────────────────────────────────────
// 3 morceaux par palier, nommés "palierX_songY" dans /public/music/.
// Le format (.mp3 ou .m4a) varie selon les fichiers, donc on essaie les
// deux extensions automatiquement (voir MusicPlayer.tsx) plutôt que de
// les coder en dur ici.

export const SONGS_PER_PALIER = 3;
export const SONG_EXTENSIONS  = ['mp3', 'm4a'] as const;

export function getSongCandidates(palier: number, songIndex: number): string[] {
  const base = `/music/palier${palier}_song${songIndex}`;
  return SONG_EXTENSIONS.map(ext => `${base}.${ext}`);
}

// Choisit un morceau au hasard parmi les 3 du palier, en évitant si possible
// de rejouer immédiatement le même qu'avant.
export function pickNextSongIndex(prevIndex: number | null): number {
  const all = Array.from({ length: SONGS_PER_PALIER }, (_, i) => i + 1);
  const pool = prevIndex === null ? all : all.filter(i => i !== prevIndex);
  return pool[Math.floor(Math.random() * pool.length)];
}

// ── Musique d'événement (Monarque des Ombres) ──────────────────────────
// Séparée de la musique de palier : 2 morceaux dédiés, nommés
// "event_shadow_monarch_songX" dans /public/music/.
export const EVENT_SONGS_COUNT = 2;

export function getEventSongCandidates(songIndex: number): string[] {
  const base = `/music/event_shadow_monarch_song${songIndex}`;
  return SONG_EXTENSIONS.map(ext => `${base}.${ext}`);
}

export function pickNextEventSongIndex(prevIndex: number | null): number {
  const all = Array.from({ length: EVENT_SONGS_COUNT }, (_, i) => i + 1);
  const pool = prevIndex === null ? all : all.filter(i => i !== prevIndex);
  return pool[Math.floor(Math.random() * pool.length)];
}
