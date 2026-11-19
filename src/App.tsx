import { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import {
  Check,
  Compass,
  Copy,
  ExternalLink,
  LogIn,
  LogOut,
  MessageSquareText,
  RotateCcw,
  Store,
  Ticket,
} from 'lucide-react';
import firebaseConfig from '../firebase-applet-config.json';
import { BusinessOwnerView } from './components/BusinessOwnerView';
import { CustomerDiscoveryView } from './components/CustomerDiscoveryView';
import { FeedbackModal } from './components/FeedbackModal';
import { WhatsAppShareModal } from './components/WhatsAppShareModal';
import { INITIAL_LOCALGROW_STATE } from './data/seedData';
import { auth, googleProvider } from './firebase';
import {
  claimOfferInFirestore,
  createOfferInFirestore,
  deleteOfferInFirestore,
  ensureUserProfile,
  incrementOfferCounterInFirestore,
  markClaimRedeemedInFirestore,
  saveLoyaltyProgramInFirestore,
  seedDemoDataForUser,
  seedInitialDehradunDataIfEmpty,
  submitFeedbackInFirestore,
  subscribeActiveLoyaltyPrograms,
  subscribeActiveOffers,
  subscribeOwnerLoyaltyPrograms,
  subscribeOwnerOffers,
  subscribePublicFeedback,
  subscribeUserClaims,
  subscribeUserLoyaltyCards,
  toggleOfferActiveInFirestore,
  updateUserLoyaltyStampInFirestore,
  updateUserPreferredRole,
} from './lib/firestoreService';
import {
  ClaimedOffer,
  CustomerSubTab,
  FeedbackEntry,
  LoyaltyProgram,
  Offer,
  RoleMode,
} from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  const [role, setRole] = useState<RoleMode>('customer');
  const [customerSubTab, setCustomerSubTab] = useState<CustomerSubTab>('discover');
  const [shareModalOffer, setShareModalOffer] = useState<Offer | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  // Firestore-synced state (only populated via onSnapshot when authenticated)
  const [activeOffers, setActiveOffers] = useState<Offer[]>([]);
  const [ownerOffers, setOwnerOffers] = useState<Offer[]>([]);
  const [activePrograms, setActivePrograms] = useState<Omit<LoyaltyProgram, 'currentStamps'>[]>([]);
  const [ownerPrograms, setOwnerPrograms] = useState<Omit<LoyaltyProgram, 'currentStamps'>[]>([]);
  const [stampsByProgramId, setStampsByProgramId] = useState<Record<string, number>>({});
  const [claimedOffers, setClaimedOffers] = useState<ClaimedOffer[]>([]);
  const [feedbackEntries, setFeedbackEntries] = useState<FeedbackEntry[]>([]);
  const [dbLoading, setDbLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!authReady || !user) {
      setActiveOffers([]);
      setOwnerOffers([]);
      setActivePrograms([]);
      setOwnerPrograms([]);
      setStampsByProgramId({});
      setClaimedOffers([]);
      setFeedbackEntries([]);
      setDbLoading(false);
      return;
    }

    let cancelled = false;
    setDbLoading(true);

    const unsubscribers: Array<() => void> = [];

    (async () => {
      try {
        const savedRole = await ensureUserProfile(user, 'customer');
        if (!cancelled) {
          setRole(savedRole);
        }
        await seedInitialDehradunDataIfEmpty(user.uid);
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) {
          setDbLoading(false);
        }
      }
    })();

    unsubscribers.push(subscribeActiveOffers((items) => setActiveOffers(items)));
    unsubscribers.push(subscribeOwnerOffers(user.uid, (items) => setOwnerOffers(items)));
    unsubscribers.push(subscribeActiveLoyaltyPrograms((items) => setActivePrograms(items)));
    unsubscribers.push(subscribeOwnerLoyaltyPrograms(user.uid, (items) => setOwnerPrograms(items)));
    unsubscribers.push(subscribeUserClaims(user.uid, (items) => setClaimedOffers(items)));
    unsubscribers.push(subscribeUserLoyaltyCards(user.uid, (map) => setStampsByProgramId(map)));
    unsubscribers.push(subscribePublicFeedback((items) => setFeedbackEntries(items)));

    return () => {
      cancelled = true;
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [authReady, user]);

  // Merge active & owner offers for Customer discovery vs Owner management
  const allCustomerOffers = useMemo(() => {
    if (!user) return INITIAL_LOCALGROW_STATE.offers;
    return activeOffers;
  }, [user, activeOffers]);

  const ownerManagedOffers = useMemo(() => {
    if (!user) return INITIAL_LOCALGROW_STATE.offers;
    return ownerOffers;
  }, [user, ownerOffers]);

  const mergedCustomerPrograms: LoyaltyProgram[] = useMemo(() => {
    if (!user) return INITIAL_LOCALGROW_STATE.loyaltyPrograms;
    return activePrograms.map((p) => ({
      ...p,
      currentStamps: stampsByProgramId[p.id] ?? 0,
    }));
  }, [user, activePrograms, stampsByProgramId]);

  const mergedOwnerPrograms: LoyaltyProgram[] = useMemo(() => {
    if (!user) return INITIAL_LOCALGROW_STATE.loyaltyPrograms;
    return ownerPrograms.map((p) => ({
      ...p,
      currentStamps: stampsByProgramId[p.id] ?? 0,
    }));
  }, [user, ownerPrograms, stampsByProgramId]);

  const showNotice = (msg: string) => {
    setSyncNotice(msg);
    setTimeout(() => setSyncNotice(null), 2800);
  };

  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);
  const [copiedDomain, setCopiedDomain] = useState(false);

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setUnauthorizedDomain(null);
    setSigningIn(true);
    try {
      await signInWithPopup(auth, googleProvider);
      showNotice('Signed in & synced with Cloud Firestore');
    } catch (error) {
      const code =
        typeof error === 'object' && error !== null && 'code' in error
          ? String((error as { code?: unknown }).code)
          : '';
      const msg = error instanceof Error ? error.message : 'Google sign-in failed.';
      if (code === 'auth/unauthorized-domain' || msg.includes('auth/unauthorized-domain')) {
        setUnauthorizedDomain(window.location.hostname);
        setAuthError(
          `Domain "${window.location.hostname}" is not yet in Firebase Auth Authorized domains.`
        );
      } else if (!msg.includes('popup-closed-by-user')) {
        setAuthError(msg);
      }
    } finally {
      setSigningIn(false);
    }
  };

  const handleCopyDomain = async () => {
    if (!unauthorizedDomain) return;
    try {
      await navigator.clipboard.writeText(unauthorizedDomain);
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 2000);
    } catch {
      // Ignore clipboard failures
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setRole('customer');
    setCustomerSubTab('discover');
    showNotice('Signed out');
  };

  const handleRoleChange = (nextRole: RoleMode) => {
    setRole(nextRole);
    if (user) {
      void updateUserPreferredRole(user, nextRole);
    }
  };

  const handleSeedDemoData = async () => {
    if (!user) {
      await handleGoogleSignIn();
      return;
    }
    await seedDemoDataForUser(user.uid);
    showNotice('Dehradun sample offers synced to Firestore');
  };

  const handleIncrementView = (offerId: string) => {
    if (!user) return;
    void incrementOfferCounterInFirestore(offerId, 'views');
  };

  const handleIncrementWhatsAppShare = (offerId: string) => {
    if (!user) return;
    void incrementOfferCounterInFirestore(offerId, 'whatsappShares');
  };

  const handleClaimOffer = async (offer: Offer): Promise<ClaimedOffer> => {
    if (!user) {
      await handleGoogleSignIn();
      throw new Error('Sign in with Google to claim deals');
    }
    const created = await claimOfferInFirestore(user.uid, offer);
    showNotice(`Claimed code ${created.code}`);
    return created;
  };

  const handleToggleRedeemed = async (claimId: string) => {
    if (!user) return;
    await markClaimRedeemedInFirestore(user.uid, claimId);
    showNotice('Offer marked as redeemed at shop');
  };

  const handleStampLoyalty = async (programId: string) => {
    if (!user) {
      await handleGoogleSignIn();
      return;
    }
    const prog = mergedCustomerPrograms.find((p) => p.id === programId);
    if (!prog) return;
    const next = Math.min(prog.visitsRequired, prog.currentStamps + 1);
    await updateUserLoyaltyStampInFirestore(user.uid, prog, next);
  };

  const handleResetLoyaltyCard = async (programId: string) => {
    if (!user) return;
    const prog = mergedCustomerPrograms.find((p) => p.id === programId);
    if (!prog) return;
    await updateUserLoyaltyStampInFirestore(user.uid, prog, 0);
    showNotice(`Redeemed ${prog.rewardTitle}`);
  };

  const handleCreateOffer = async (
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
  ): Promise<Offer> => {
    if (!user) {
      await handleGoogleSignIn();
      throw new Error('Sign in with Google to publish offers');
    }
    const created = await createOfferInFirestore(user.uid, draft);
    showNotice('Offer published to Cloud Firestore');
    return created;
  };

  const handleToggleOfferActive = async (offerId: string) => {
    if (!user) return;
    const target = ownerManagedOffers.find((o) => o.id === offerId);
    if (!target) return;
    await toggleOfferActiveInFirestore(offerId, !target.active);
  };

  const handleDeleteOffer = async (offerId: string) => {
    if (!user) return;
    await deleteOfferInFirestore(offerId);
    showNotice('Offer deleted from Firestore');
  };

  const handleSaveLoyaltyPerk = async (
    draft: Omit<LoyaltyProgram, 'id' | 'currentStamps'> & { id?: string }
  ) => {
    if (!user) {
      await handleGoogleSignIn();
      return;
    }
    await saveLoyaltyProgramInFirestore(user.uid, draft);
    showNotice('Loyalty perk saved to Firestore');
  };

  const handleSubmitFeedback = async (
    entry: Omit<FeedbackEntry, 'id' | 'createdAt'>
  ) => {
    if (!user) {
      await handleGoogleSignIn();
      return;
    }
    await submitFeedbackInFirestore(user.uid, entry);
    showNotice('Validation feedback saved to Firestore');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 pb-16 md:pb-0">
      {/* 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 h-14 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Wordmark */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              handleRoleChange('customer');
              setCustomerSubTab('discover');
            }}
            className="text-lg font-extrabold tracking-tight text-slate-900 font-display whitespace-nowrap shrink-0"
          >
            LocalGrow
          </a>

          {/* Zone 2: Concise single-line navigation links */}
          <nav
            className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
            aria-label="Primary navigation"
          >
            <button
              type="button"
              onClick={() => {
                handleRoleChange('customer');
                setCustomerSubTab('discover');
              }}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
                role === 'customer' && customerSubTab === 'discover'
                  ? 'text-slate-900 font-semibold underline underline-offset-4 decoration-emerald-700 decoration-2'
                  : ''
              }`}
            >
              Discover Deals
            </button>
            <button
              type="button"
              onClick={() => {
                handleRoleChange('customer');
                setCustomerSubTab('wallet');
              }}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
                role === 'customer' && customerSubTab === 'wallet'
                  ? 'text-slate-900 font-semibold underline underline-offset-4 decoration-emerald-700 decoration-2'
                  : ''
              }`}
            >
              Claims & Loyalty
            </button>
            <button
              type="button"
              onClick={() => handleRoleChange('owner')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
                role === 'owner'
                  ? 'text-slate-900 font-semibold underline underline-offset-4 decoration-emerald-700 decoration-2'
                  : ''
              }`}
            >
              Owner Studio
            </button>
            <button
              type="button"
              onClick={() => setFeedbackOpen(true)}
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Feedback
            </button>
          </nav>

          {/* Zone 3: Single Primary Action (Google Auth or Quick Feedback) */}
          <div className="flex items-center shrink-0">
            {user ? (
              <button
                type="button"
                onClick={handleSignOut}
                className="min-h-[40px] px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs sm:text-sm font-semibold hover:bg-slate-50 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
              >
                {user.photoURL && (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Account'}
                    referrerPolicy="no-referrer"
                    className="w-5 h-5 rounded-full object-cover"
                  />
                )}
                <span className="max-w-[110px] truncate">
                  {user.displayName?.split(' ')[0] || 'Account'}
                </span>
                <LogOut className="w-3.5 h-3.5 text-slate-500" />
              </button>
            ) : (
              <button
                type="button"
                disabled={signingIn}
                onClick={handleGoogleSignIn}
                className="min-h-[40px] px-4 py-1.5 rounded-xl bg-emerald-700 text-white text-xs sm:text-sm font-semibold hover:bg-emerald-800 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 disabled:opacity-60"
              >
                <LogIn className="w-4 h-4" />
                <span>{signingIn ? 'Signing in...' : 'Sign in with Google'}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main id="top" className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-5 sm:py-7 space-y-6">
        {/* Google Auth Prompt Banner when signed out */}
        {authReady && !user && (
          <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <p className="text-xs font-semibold text-emerald-800">
                Cloud Firestore & Google Account Sync
              </p>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                Sign in with Google to save claimed deals, loyalty stamps, and shop offers
              </h2>
              <p className="text-sm text-slate-600">
                Browse the Dehradun sample feed below right now, or connect your Google account to persist offers and redemptions in Cloud Firestore.
              </p>
              {authError && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-3.5 text-xs text-red-900 space-y-2 mt-2">
                  <p className="font-semibold">{authError}</p>
                  {unauthorizedDomain && (
                    <div className="space-y-2">
                      <p className="text-red-800">
                        Add this hostname under Firebase Console → Authentication → Settings → Authorized domains:
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <code className="px-2.5 py-1 rounded-lg bg-white border border-red-200 font-mono text-[11px] text-slate-900">
                          {unauthorizedDomain}
                        </code>
                        <button
                          type="button"
                          onClick={handleCopyDomain}
                          className="min-h-[34px] px-2.5 py-1 rounded-lg bg-white border border-red-200 text-slate-800 font-medium flex items-center gap-1 hover:bg-red-100/50 transition-colors"
                        >
                          {copiedDomain ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-700" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Domain</span>
                            </>
                          )}
                        </button>
                        <a
                          href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/settings`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="min-h-[34px] px-2.5 py-1 rounded-lg bg-slate-900 text-white font-medium flex items-center gap-1 hover:bg-slate-800 transition-colors"
                        >
                          <span>Open Authorized Domains</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <button
              type="button"
              disabled={signingIn}
              onClick={handleGoogleSignIn}
              className="min-h-[48px] px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2.5 whitespace-nowrap shrink-0 disabled:opacity-60"
            >
              <LogIn className="w-4 h-4" />
              <span>{signingIn ? 'Connecting Google...' : 'Continue with Google'}</span>
            </button>
          </section>
        )}

        {/* Top Demo Role Switcher & Firestore Status Toolbar */}
        <section
          aria-label="Demo role switcher"
          className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div
              className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/80 w-full sm:w-auto"
              role="group"
              aria-label="Switch user role"
            >
              <button
                type="button"
                onClick={() => handleRoleChange('customer')}
                className={`flex-1 sm:flex-initial min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
                  role === 'customer'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Customer View (18–30)
              </button>
              <button
                type="button"
                onClick={() => handleRoleChange('owner')}
                className={`flex-1 sm:flex-initial min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
                  role === 'owner'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Business Owner View
              </button>
            </div>

            <span className="text-xs text-slate-500 whitespace-nowrap">
              Dehradun, Uttarakhand ·{' '}
              {user
                ? dbLoading
                  ? 'Syncing Firestore...'
                  : `Synced (${user.email})`
                : 'Preview Mode'}
            </span>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3">
            {syncNotice && (
              <span className="text-xs font-medium text-emerald-800">{syncNotice}</span>
            )}
            <button
              type="button"
              onClick={handleSeedDemoData}
              className="min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>{user ? 'Seed Sample Dehradun Data' : 'Sign in to Seed Data'}</span>
            </button>
          </div>
        </section>

        {/* Active Role View */}
        {role === 'customer' ? (
          <CustomerDiscoveryView
            offers={allCustomerOffers}
            loyaltyPrograms={mergedCustomerPrograms}
            claimedOffers={user ? claimedOffers : []}
            activeSubTab={customerSubTab}
            onChangeSubTab={setCustomerSubTab}
            onClaimOffer={handleClaimOffer}
            onToggleRedeemed={handleToggleRedeemed}
            onStampLoyalty={handleStampLoyalty}
            onResetLoyaltyCard={handleResetLoyaltyCard}
            onOpenWhatsAppShare={(offer) => setShareModalOffer(offer)}
            onIncrementView={handleIncrementView}
            onOpenFeedback={() => {
              if (!user) {
                void handleGoogleSignIn();
                return;
              }
              setFeedbackOpen(true);
            }}
          />
        ) : (
          <BusinessOwnerView
            offers={ownerManagedOffers}
            loyaltyPrograms={mergedOwnerPrograms}
            feedbackEntries={user ? feedbackEntries : INITIAL_LOCALGROW_STATE.feedbackEntries}
            onCreateOffer={handleCreateOffer}
            onToggleOfferActive={handleToggleOfferActive}
            onDeleteOffer={handleDeleteOffer}
            onSaveLoyaltyPerk={handleSaveLoyaltyPerk}
            onIncrementWhatsAppShare={handleIncrementWhatsAppShare}
            onSwitchToCustomerPreview={() => {
              handleRoleChange('customer');
              setCustomerSubTab('discover');
            }}
          />
        )}
      </main>

      {/* Clean Footer */}
      <footer className="border-t border-slate-200 bg-white mt-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-500">
          <p>
            LocalGrow · Built for Dehradun neighborhood shops, cafés, salons, and boutiques.
          </p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => {
                if (!user) {
                  void handleGoogleSignIn();
                  return;
                }
                setFeedbackOpen(true);
              }}
              className="text-slate-700 hover:text-slate-900 font-medium underline underline-offset-2"
            >
              Would You Pay? Feedback ({user ? feedbackEntries.length : INITIAL_LOCALGROW_STATE.feedbackEntries.length})
            </button>
            {user ? (
              <button
                type="button"
                onClick={handleSignOut}
                className="text-slate-700 hover:text-slate-900 font-medium"
              >
                Sign Out
              </button>
            ) : (
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="text-emerald-800 hover:text-emerald-900 font-semibold"
              >
                Google Sign-In
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Thumb-Zone Navigation (compact 56px, under 15% cap with header) */}
      <nav
        aria-label="Mobile navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-14 bg-white/95 backdrop-blur-md border-t border-slate-200 grid grid-cols-4 items-center"
      >
        <button
          type="button"
          onClick={() => {
            handleRoleChange('customer');
            setCustomerSubTab('discover');
          }}
          className={`h-full flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
            role === 'customer' && customerSubTab === 'discover'
              ? 'text-emerald-800 font-semibold'
              : 'text-slate-500'
          }`}
        >
          <Compass className="w-5 h-5" />
          <span>Discover</span>
        </button>

        <button
          type="button"
          onClick={() => {
            handleRoleChange('customer');
            setCustomerSubTab('wallet');
          }}
          className={`h-full flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
            role === 'customer' && customerSubTab === 'wallet'
              ? 'text-emerald-800 font-semibold'
              : 'text-slate-500'
          }`}
        >
          <Ticket className="w-5 h-5" />
          <span>Wallet</span>
        </button>

        <button
          type="button"
          onClick={() => handleRoleChange('owner')}
          className={`h-full flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
            role === 'owner' ? 'text-emerald-800 font-semibold' : 'text-slate-500'
          }`}
        >
          <Store className="w-5 h-5" />
          <span>Owner</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (!user) {
              void handleGoogleSignIn();
              return;
            }
            setFeedbackOpen(true);
          }}
          className="h-full flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-slate-600"
        >
          <MessageSquareText className="w-5 h-5" />
          <span>Feedback</span>
        </button>
      </nav>

      {/* Modals */}
      <WhatsAppShareModal
        offer={shareModalOffer}
        onClose={() => setShareModalOffer(null)}
        onConfirmShare={handleIncrementWhatsAppShare}
      />

      <FeedbackModal
        isOpen={feedbackOpen}
        currentRole={role}
        onClose={() => setFeedbackOpen(false)}
        onSubmitFeedback={handleSubmitFeedback}
      />
    </div>
  );
}
