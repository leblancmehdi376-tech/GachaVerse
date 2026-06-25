'use client';
import { useEffect, useRef, useState } from 'react';

// Extensions essayées dans l'ordre quand un visuel ne charge pas — utile
// quand un fichier a été renommé en .png mais reste en réalité un .webp/.jpg
// (changer juste l'extension dans l'explorateur ne convertit pas le fichier).
export const IMAGE_FALLBACK_EXTENSIONS = ['png', 'webp', 'jpg', 'jpeg'] as const;

// À partir d'un chemin de base SANS extension (ex: "/sprites/enemies/palier2/gaara"),
// génère la liste ordonnée de candidats à essayer.
export function buildImageCandidates(basePathNoExt: string): string[] {
  return IMAGE_FALLBACK_EXTENSIONS.map(ext => `${basePathNoExt}.${ext}`);
}

// Retire une extension connue d'un chemin existant pour en faire une base réutilisable.
export function stripKnownExtension(path: string): string {
  return path.replace(/\.(png|webp|jpe?g|gif|svg)$/i, '');
}

interface UseFallbackImageResult {
  src: string | null;   // candidat actuellement tenté, ou null si tous ont échoué
  failed: boolean;      // true quand plus aucun candidat ne fonctionne
  onError: () => void;  // à brancher sur <img onError={...}>
}

// Essaie chaque URL de `candidates` dans l'ordre jusqu'à ce qu'une charge.
// Se réinitialise automatiquement si la liste de candidats change (ex: changement de perso).
export function useFallbackImage(candidates: string[]): UseFallbackImageResult {
  const [index, setIndex] = useState(0);
  const key = candidates.join('|');
  const prevKeyRef = useRef(key);

  useEffect(() => {
    if (prevKeyRef.current !== key) {
      prevKeyRef.current = key;
      setIndex(0);
    }
  }, [key]);

  const failed = index >= candidates.length;
  return {
    src: failed ? null : candidates[index],
    failed,
    onError: () => setIndex(i => i + 1),
  };
}
