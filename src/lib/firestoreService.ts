import { User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  Unsubscribe,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { INITIAL_LOCALGROW_STATE } from '../data/seedData';
import { db } from '../firebase';
import {
  BusinessCategory,
  ClaimedOffer,
  FeedbackEntry,
  LoyaltyProgram,
  Offer,
  RoleMode,
} from '../types';
import { handleFirestoreError, OperationType } from './firestoreError';

function toIsoString(val: unknown): string {
  if (val instanceof Timestamp) {
    return val.toDate().toISOString();
  }
  if (typeof val === 'string') return val;
  return new Date().toISOString();
}

function sanitizeId(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 120);
  return cleaned || `doc-${Date.now()}`;
}

export async function ensureUserProfile(
  user: User,
  preferredRole: RoleMode = 'customer'
): Promise<RoleMode> {
  const userPath = `users/${user.uid}`;
  const userRef = doc(db, 'users', user.uid);
  try {
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        displayName: (user.displayName || 'Dehradun User').slice(0, 100),
        email: (user.email || 'user@localgrow.app').slice(0, 200),
        photoURL: (user.photoURL || '').slice(0, 500),
        preferredRole,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return preferredRole;
    }
    const data = snap.data();
    return data.preferredRole === 'owner' ? 'owner' : 'customer';
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userPath);
  }
}

export async function updateUserPreferredRole(
  user: User,
  preferredRole: RoleMode
): Promise<void> {
  const userPath = `users/${user.uid}`;
  try {
    await updateDoc(doc(db, 'users', user.uid), {
      displayName: (user.displayName || 'Dehradun User').slice(0, 100),
      photoURL: (user.photoURL || '').slice(0, 500),
      preferredRole,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, userPath);
  }
}

export async function seedInitialDehradunDataIfEmpty(uid: string): Promise<void> {
  try {
    const existingOffers = await getDocs(
      query(collection(db, 'offers'), where('active', '==', true), limit(1))
    );
    if (!existingOffers.empty) return;
    await seedDemoDataForUser(uid);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'offers');
  }
}

export async function seedDemoDataForUser(uid: string): Promise<void> {
  try {
    const batch = writeBatch(db);
    const uidTag = sanitizeId(uid).slice(0, 10);

    for (const offer of INITIAL_LOCALGROW_STATE.offers) {
      const offerId = sanitizeId(`${offer.id}-${uidTag}`);
      batch.set(doc(db, 'offers', offerId), {
        ownerId: uid,
        businessName: offer.businessName.slice(0, 80),
        neighborhood: offer.neighborhood.slice(0, 60),
        distanceKm: offer.distanceKm,
        category: offer.category,
        title: offer.title.slice(0, 120),
        description: offer.description.slice(0, 500),
        originalPrice: offer.originalPrice,
        offerPrice: offer.offerPrice,
        validityLabel: offer.validityLabel.slice(0, 80),
        targetAudience: offer.targetAudience.slice(0, 100),
        rating: offer.rating,
        reviewCount: Math.round(offer.reviewCount),
        imageUrl: offer.imageUrl.slice(0, 300),
        redemptionCodePrefix: offer.redemptionCodePrefix.replace(/[^A-Z0-9]/g, '').slice(0, 12) || 'DDN',
        views: Math.round(offer.views),
        claims: Math.round(offer.claims),
        whatsappShares: Math.round(offer.whatsappShares),
        active: true,
        reviews: offer.reviews.slice(0, 10),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    for (const lp of INITIAL_LOCALGROW_STATE.loyaltyPrograms) {
      const programId = sanitizeId(`${lp.id}-${uidTag}`);
      batch.set(doc(db, 'loyaltyPrograms', programId), {
        ownerId: uid,
        businessName: lp.businessName.slice(0, 80),
        neighborhood: lp.neighborhood.slice(0, 60),
        category: lp.category,
        visitsRequired: Math.round(lp.visitsRequired),
        rewardTitle: lp.rewardTitle.slice(0, 120),
        active: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    for (const fb of INITIAL_LOCALGROW_STATE.feedbackEntries) {
      const fbId = sanitizeId(`${fb.id}-${uidTag}`);
      batch.set(doc(db, 'feedback', fbId), {
        userId: uid,
        roleAtSubmission: fb.roleAtSubmission,
        savesTimeAndMoney: fb.savesTimeAndMoney,
        willingToPay: fb.willingToPay,
        comment: fb.comment.slice(0, 400),
        isPublic: true,
        createdAt: serverTimestamp(),
      });
    }

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'offers/seed');
  }
}

export function subscribeActiveOffers(
  onData: (offers: Offer[]) => void
): Unsubscribe {
  const q = query(collection(db, 'offers'), where('active', '==', true));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: Offer[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          ownerId: String(data.ownerId || ''),
          businessName: String(data.businessName || ''),
          neighborhood: String(data.neighborhood || ''),
          distanceKm: Number(data.distanceKm ?? 1),
          category: (data.category as BusinessCategory) || 'Cafés',
          title: String(data.title || ''),
          description: String(data.description || ''),
          originalPrice: Number(data.originalPrice ?? 0),
          offerPrice: Number(data.offerPrice ?? 0),
          validityLabel: String(data.validityLabel || ''),
          targetAudience: String(data.targetAudience || ''),
          rating: Number(data.rating ?? 4.8),
          reviewCount: Number(data.reviewCount ?? 0),
          imageUrl: String(data.imageUrl || ''),
          redemptionCodePrefix: String(data.redemptionCodePrefix || 'DDN'),
          views: Number(data.views ?? 0),
          claims: Number(data.claims ?? 0),
          whatsappShares: Number(data.whatsappShares ?? 0),
          active: Boolean(data.active),
          createdAt: toIsoString(data.createdAt),
          reviews: Array.isArray(data.reviews) ? data.reviews : [],
        };
      });
      items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'offers');
    }
  );
}

export function subscribeOwnerOffers(
  uid: string,
  onData: (offers: Offer[]) => void
): Unsubscribe {
  const q = query(collection(db, 'offers'), where('ownerId', '==', uid));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: Offer[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          ownerId: String(data.ownerId || ''),
          businessName: String(data.businessName || ''),
          neighborhood: String(data.neighborhood || ''),
          distanceKm: Number(data.distanceKm ?? 1),
          category: (data.category as BusinessCategory) || 'Cafés',
          title: String(data.title || ''),
          description: String(data.description || ''),
          originalPrice: Number(data.originalPrice ?? 0),
          offerPrice: Number(data.offerPrice ?? 0),
          validityLabel: String(data.validityLabel || ''),
          targetAudience: String(data.targetAudience || ''),
          rating: Number(data.rating ?? 4.8),
          reviewCount: Number(data.reviewCount ?? 0),
          imageUrl: String(data.imageUrl || ''),
          redemptionCodePrefix: String(data.redemptionCodePrefix || 'DDN'),
          views: Number(data.views ?? 0),
          claims: Number(data.claims ?? 0),
          whatsappShares: Number(data.whatsappShares ?? 0),
          active: Boolean(data.active),
          createdAt: toIsoString(data.createdAt),
          reviews: Array.isArray(data.reviews) ? data.reviews : [],
        };
      });
      items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'offers');
    }
  );
}

export function subscribeActiveLoyaltyPrograms(
  onData: (programs: Omit<LoyaltyProgram, 'currentStamps'>[]) => void
): Unsubscribe {
  const q = query(collection(db, 'loyaltyPrograms'), where('active', '==', true));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          ownerId: String(data.ownerId || ''),
          businessName: String(data.businessName || ''),
          neighborhood: String(data.neighborhood || ''),
          category: (data.category as BusinessCategory) || 'Cafés',
          visitsRequired: Number(data.visitsRequired ?? 3),
          rewardTitle: String(data.rewardTitle || ''),
          active: Boolean(data.active),
        };
      });
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'loyaltyPrograms');
    }
  );
}

export function subscribeOwnerLoyaltyPrograms(
  uid: string,
  onData: (programs: Omit<LoyaltyProgram, 'currentStamps'>[]) => void
): Unsubscribe {
  const q = query(collection(db, 'loyaltyPrograms'), where('ownerId', '==', uid));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          ownerId: String(data.ownerId || ''),
          businessName: String(data.businessName || ''),
          neighborhood: String(data.neighborhood || ''),
          category: (data.category as BusinessCategory) || 'Cafés',
          visitsRequired: Number(data.visitsRequired ?? 3),
          rewardTitle: String(data.rewardTitle || ''),
          active: Boolean(data.active),
        };
      });
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'loyaltyPrograms');
    }
  );
}

export function subscribeUserClaims(
  uid: string,
  onData: (claims: ClaimedOffer[]) => void
): Unsubscribe {
  const path = `users/${uid}/claims`;
  const q = query(collection(db, 'users', uid, 'claims'), where('userId', '==', uid));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: ClaimedOffer[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          userId: String(data.userId || uid),
          offerId: String(data.offerId || ''),
          businessName: String(data.businessName || ''),
          neighborhood: String(data.neighborhood || ''),
          title: String(data.title || ''),
          offerPrice: Number(data.offerPrice ?? 0),
          originalPrice: Number(data.originalPrice ?? 0),
          code: String(data.code || ''),
          claimedAt: toIsoString(data.claimedAt),
          redeemedInStore: Boolean(data.redeemedInStore),
        };
      });
      items.sort((a, b) => b.claimedAt.localeCompare(a.claimedAt));
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeUserLoyaltyCards(
  uid: string,
  onData: (stampsByProgramId: Record<string, number>) => void
): Unsubscribe {
  const path = `users/${uid}/loyaltyCards`;
  const q = query(collection(db, 'users', uid, 'loyaltyCards'), where('userId', '==', uid));
  return onSnapshot(
    q,
    (snapshot) => {
      const map: Record<string, number> = {};
      snapshot.docs.forEach((d) => {
        const data = d.data();
        map[d.id] = Number(data.currentStamps ?? 0);
      });
      onData(map);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribePublicFeedback(
  onData: (entries: FeedbackEntry[]) => void
): Unsubscribe {
  const q = query(collection(db, 'feedback'), where('isPublic', '==', true));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: FeedbackEntry[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          userId: String(data.userId || ''),
          roleAtSubmission: data.roleAtSubmission === 'owner' ? 'owner' : 'customer',
          savesTimeAndMoney:
            data.savesTimeAndMoney === 'somewhat' || data.savesTimeAndMoney === 'no'
              ? data.savesTimeAndMoney
              : 'yes',
          willingToPay:
            data.willingToPay === 'pay_per_deal' ||
            data.willingToPay === 'free_only' ||
            data.willingToPay === 'owner_499'
              ? data.willingToPay
              : 'pass_49',
          comment: String(data.comment || ''),
          createdAt: toIsoString(data.createdAt),
        };
      });
      items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'feedback');
    }
  );
}

export async function createOfferInFirestore(
  uid: string,
  draft: Omit<
    Offer,
    | 'id'
    | 'views'
    | 'claims'
    | 'whatsappShares'
    | 'createdAt'
    | 'reviews'
    | 'rating'
    | 'reviewCount'
    | 'distanceKm'
  >
): Promise<Offer> {
  const offerId = `offer-${Date.now()}`;
  const path = `offers/${offerId}`;
  const orig = Math.max(50, Math.min(50000, Math.round(draft.originalPrice)));
  const deal = Math.max(10, Math.min(orig, Math.round(draft.offerPrice)));
  const prefix =
    draft.redemptionCodePrefix.replace(/[^A-Z0-9]/g, '').slice(0, 12) || 'DDN';

  const payload = {
    ownerId: uid,
    businessName: draft.businessName.trim().slice(0, 80) || 'Dehradun Shop',
    neighborhood: draft.neighborhood.trim().slice(0, 60) || 'Rajpur Road',
    distanceKm: 1.2,
    category: draft.category,
    title: draft.title.trim().slice(0, 120) || 'Local Offer',
    description: draft.description.trim().slice(0, 500),
    originalPrice: orig,
    offerPrice: deal,
    validityLabel: draft.validityLabel.trim().slice(0, 80) || 'Valid All Week',
    targetAudience: draft.targetAudience.trim().slice(0, 100) || 'Ages 18-30',
    rating: 4.8,
    reviewCount: 1,
    imageUrl: draft.imageUrl.slice(0, 300),
    redemptionCodePrefix: prefix.length >= 2 ? prefix : 'DDN',
    views: 1,
    claims: 0,
    whatsappShares: 0,
    active: draft.active,
    reviews: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'offers', offerId), payload);
    return {
      ...payload,
      id: offerId,
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function toggleOfferActiveInFirestore(
  offerId: string,
  nextActive: boolean
): Promise<void> {
  const path = `offers/${offerId}`;
  try {
    await updateDoc(doc(db, 'offers', offerId), {
      active: nextActive,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteOfferInFirestore(offerId: string): Promise<void> {
  const path = `offers/${offerId}`;
  try {
    await deleteDoc(doc(db, 'offers', offerId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function incrementOfferCounterInFirestore(
  offerId: string,
  field: 'views' | 'claims' | 'whatsappShares'
): Promise<void> {
  const path = `offers/${offerId}`;
  try {
    await updateDoc(doc(db, 'offers', offerId), {
      [field]: increment(1),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function claimOfferInFirestore(
  uid: string,
  offer: Offer
): Promise<ClaimedOffer> {
  const claimId = `claim-${Date.now()}`;
  const claimPath = `users/${uid}/claims/${claimId}`;
  const randomNum = Math.floor(100 + Math.random() * 900);
  const cleanPrefix =
    offer.redemptionCodePrefix.replace(/[^A-Z0-9]/g, '').slice(0, 12) || 'DDN';
  const code = `${cleanPrefix}-${randomNum}`;

  try {
    await setDoc(doc(db, 'users', uid, 'claims', claimId), {
      userId: uid,
      offerId: offer.id,
      businessName: offer.businessName.slice(0, 80),
      neighborhood: offer.neighborhood.slice(0, 60),
      title: offer.title.slice(0, 120),
      offerPrice: offer.offerPrice,
      originalPrice: offer.originalPrice,
      code,
      redeemedInStore: false,
      claimedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await incrementOfferCounterInFirestore(offer.id, 'claims');

    return {
      id: claimId,
      userId: uid,
      offerId: offer.id,
      businessName: offer.businessName,
      neighborhood: offer.neighborhood,
      title: offer.title,
      offerPrice: offer.offerPrice,
      originalPrice: offer.originalPrice,
      code,
      claimedAt: new Date().toISOString(),
      redeemedInStore: false,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, claimPath);
  }
}

export async function markClaimRedeemedInFirestore(
  uid: string,
  claimId: string
): Promise<void> {
  const path = `users/${uid}/claims/${claimId}`;
  try {
    await updateDoc(doc(db, 'users', uid, 'claims', claimId), {
      redeemedInStore: true,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateUserLoyaltyStampInFirestore(
  uid: string,
  program: LoyaltyProgram,
  nextStamps: number
): Promise<void> {
  const path = `users/${uid}/loyaltyCards/${program.id}`;
  const clamped = Math.max(0, Math.min(program.visitsRequired, Math.round(nextStamps)));
  const cardRef = doc(db, 'users', uid, 'loyaltyCards', program.id);
  try {
    const snap = await getDoc(cardRef);
    if (!snap.exists()) {
      await setDoc(cardRef, {
        userId: uid,
        programId: program.id,
        businessName: program.businessName.slice(0, 80),
        neighborhood: program.neighborhood.slice(0, 60),
        category: program.category,
        visitsRequired: Math.round(program.visitsRequired),
        currentStamps: clamped,
        rewardTitle: program.rewardTitle.slice(0, 120),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(cardRef, {
        currentStamps: clamped,
        visitsRequired: Math.round(program.visitsRequired),
        rewardTitle: program.rewardTitle.slice(0, 120),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveLoyaltyProgramInFirestore(
  uid: string,
  draft: Omit<LoyaltyProgram, 'id' | 'currentStamps'> & { id?: string }
): Promise<void> {
  const programId = draft.id ? sanitizeId(draft.id) : `loy-${Date.now()}`;
  const path = `loyaltyPrograms/${programId}`;
  const visits = Math.max(2, Math.min(10, Math.round(draft.visitsRequired)));

  try {
    if (draft.id) {
      await updateDoc(doc(db, 'loyaltyPrograms', programId), {
        businessName: draft.businessName.trim().slice(0, 80) || 'Dehradun Shop',
        neighborhood: draft.neighborhood.trim().slice(0, 60) || 'Rajpur Road',
        category: draft.category,
        visitsRequired: visits,
        rewardTitle: draft.rewardTitle.trim().slice(0, 120) || 'Free Reward',
        active: draft.active,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(doc(db, 'loyaltyPrograms', programId), {
        ownerId: uid,
        businessName: draft.businessName.trim().slice(0, 80) || 'Dehradun Shop',
        neighborhood: draft.neighborhood.trim().slice(0, 60) || 'Rajpur Road',
        category: draft.category,
        visitsRequired: visits,
        rewardTitle: draft.rewardTitle.trim().slice(0, 120) || 'Free Reward',
        active: draft.active,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function submitFeedbackInFirestore(
  uid: string,
  entry: Omit<FeedbackEntry, 'id' | 'createdAt'>
): Promise<void> {
  const fbId = `fb-${Date.now()}`;
  const path = `feedback/${fbId}`;
  try {
    await setDoc(doc(db, 'feedback', fbId), {
      userId: uid,
      roleAtSubmission: entry.roleAtSubmission,
      savesTimeAndMoney: entry.savesTimeAndMoney,
      willingToPay: entry.willingToPay,
      comment: entry.comment.trim().slice(0, 400),
      isPublic: true,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}
