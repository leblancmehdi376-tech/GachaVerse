import {
  collection, doc, addDoc, getDocs, query, where,
  runTransaction, serverTimestamp, orderBy, limit,
} from 'firebase/firestore';
import { db } from './config';

export type ListingCurrency = 'gems' | 'coins' | 'crowns';
export type ListingType     = 'item' | 'equipment' | 'character';

export interface MarketplaceListing {
  id:           string;
  sellerId:     string;
  sellerName:   string;
  type:         ListingType;
  itemId:       string;
  quantity:     number;
  price:        number;
  currency:     ListingCurrency;
  createdAt:    number;
  status:       'active' | 'sold' | 'cancelled';
  soldTo?:      string;
  soldToName?:  string;
  soldAt?:      number;
}

// ── Créer une annonce ──────────────────────────────────────────────────────
export async function createListing(
  data: Omit<MarketplaceListing, 'id' | 'createdAt' | 'status'>
): Promise<string | null> {
  if (!db) return null;
  try {
    const ref = await addDoc(collection(db, 'marketplace'), {
      ...data,
      status:    'active',
      createdAt: Date.now(),
    });
    return ref.id;
  } catch (e) {
    console.error('[Marketplace] createListing error:', e);
    return null;
  }
}

// ── Récupérer toutes les annonces actives ──────────────────────────────────
export async function getActiveListings(max = 100): Promise<MarketplaceListing[]> {
  if (!db) return [];
  try {
    const snap = await getDocs(
      query(collection(db, 'marketplace'),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc'),
        limit(max)
      )
    );
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as MarketplaceListing));
  } catch (e) {
    console.error('[Marketplace] getActiveListings error:', e);
    return [];
  }
}

// ── Récupérer mes annonces (actives + vendues non encaissées) ──────────────
export async function getMyListings(sellerId: string): Promise<MarketplaceListing[]> {
  if (!db) return [];
  try {
    const snap = await getDocs(
      query(collection(db, 'marketplace'),
        where('sellerId', '==', sellerId),
        orderBy('createdAt', 'desc'),
        limit(50)
      )
    );
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as MarketplaceListing));
  } catch (e) {
    console.error('[Marketplace] getMyListings error:', e);
    return [];
  }
}

// ── Acheter une annonce (transaction atomique) ─────────────────────────────
export async function buyListing(
  listingId: string,
  buyerId: string,
  buyerName: string
): Promise<MarketplaceListing | null> {
  if (!db) return null;
  try {
    const listingRef = doc(db, 'marketplace', listingId);
    let listing: MarketplaceListing | null = null;

    await runTransaction(db, async (tx) => {
      const snap = await tx.get(listingRef);
      if (!snap.exists()) throw new Error('Annonce introuvable');
      const data = snap.data() as Omit<MarketplaceListing, 'id'>;
      if (data.status !== 'active') throw new Error('Annonce déjà vendue ou annulée');
      if (data.sellerId === buyerId)  throw new Error('Tu ne peux pas acheter ta propre annonce');

      listing = { id: listingId, ...data };
      tx.update(listingRef, {
        status:    'sold',
        soldTo:    buyerId,
        soldToName: buyerName,
        soldAt:    Date.now(),
      });
    });
    return listing;
  } catch (e) {
    console.error('[Marketplace] buyListing error:', e);
    return null;
  }
}

// ── Annuler une annonce ────────────────────────────────────────────────────
export async function cancelListing(
  listingId: string,
  sellerId: string
): Promise<boolean> {
  if (!db) return false;
  try {
    const listingRef = doc(db, 'marketplace', listingId);
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(listingRef);
      if (!snap.exists()) throw new Error('Annonce introuvable');
      const data = snap.data();
      if (data.sellerId !== sellerId) throw new Error('Non autorisé');
      if (data.status !== 'active')   throw new Error('Annonce déjà fermée');
      tx.update(listingRef, { status: 'cancelled' });
    });
    return true;
  } catch (e) {
    console.error('[Marketplace] cancelListing error:', e);
    return false;
  }
}

// ── Encaisser une vente (marque comme encaissé) ───────────────────────────
export async function claimSaleReward(listingId: string, sellerId: string): Promise<boolean> {
  if (!db) return false;
  try {
    const ref = doc(db, 'marketplace', listingId);
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) throw new Error('Annonce introuvable');
      const data = snap.data();
      if (data.sellerId !== sellerId) throw new Error('Non autorisé');
      if (data.status !== 'sold')     throw new Error('Pas encore vendu');
      if (data.claimed)               throw new Error('Déjà encaissé');
      tx.update(ref, { claimed: true, claimedAt: Date.now() });
    });
    return true;
  } catch (e) {
    console.error('[Marketplace] claimSaleReward error:', e);
    return false;
  }
}
