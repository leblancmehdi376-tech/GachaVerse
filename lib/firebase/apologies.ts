/**
 * Sauvegarde les lettres d'excuse des tricheurs dans Firestore.
 * Collection : `apologies`
 * Document   : `{uid}_{timestamp}`
 */

import { collection, addDoc } from 'firebase/firestore';
import { db } from './config';

export interface ApologyEntry {
  uid: string;
  username: string;
  email: string;
  apology: string;
  strikeLevel: number;
  detectionReason: string;
  submittedAt: number; // timestamp ms
}

export async function saveApology(entry: ApologyEntry): Promise<void> {
  if (!db) {
    // Pas de Firebase dispo (dev local) : on logue dans la console
    console.warn('[Apology] Firebase non disponible — sauvegarde locale impossible.');
    console.table(entry);
    return;
  }
  try {
    await addDoc(collection(db, 'apologies'), entry);
    console.log('[Apology] Lettre d\'excuse sauvegardée pour', entry.username);
  } catch (e) {
    console.error('[Apology] Erreur Firestore :', e);
  }
}
