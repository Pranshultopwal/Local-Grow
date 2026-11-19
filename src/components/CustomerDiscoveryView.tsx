import { FormEvent, useMemo, useState } from 'react';
import {
  Check,
  CheckCircle2,
  MapPin,
  MessageCircle,
  Search,
  Sparkles,
  Star,
  Store,
  Tag,
  Ticket,
  X,
} from 'lucide-react';
import { DEHRADUN_NEIGHBORHOODS } from '../data/seedData';
import {
  BusinessCategory,
  ClaimedOffer,
  CustomerSubTab,
  LoyaltyProgram,
  Offer,
} from '../types';
import { OfferImage } from './OfferImage';

interface CustomerDiscoveryViewProps {
  offers: Offer[];
  loyaltyPrograms: LoyaltyProgram[];
  claimedOffers: ClaimedOffer[];
  activeSubTab: CustomerSubTab;
  onChangeSubTab: (tab: CustomerSubTab) => void;
  onClaimOffer: (offer: Offer) => Promise<ClaimedOffer> | ClaimedOffer;
  onToggleRedeemed: (claimId: string) => void;
  onStampLoyalty: (programId: string) => void;
  onResetLoyaltyCard: (programId: string) => void;
  onOpenWhatsAppShare: (offer: Offer) => void;
  onIncrementView: (offerId: string) => void;
  onOpenFeedback: () => void;
}

const CATEGORIES: Array<'All' | BusinessCategory> = [
  'All',
  'Cafés',
  'Salons',
  'Retail',
  'Boutiques',
];

export function CustomerDiscoveryView({
  offers,
  loyaltyPrograms,
  claimedOffers,
  activeSubTab,
  onChangeSubTab,
  onClaimOffer,
  onToggleRedeemed,
  onStampLoyalty,
  onResetLoyaltyCard,
  onOpenWhatsAppShare,
  onIncrementView,
  onOpenFeedback,
}: CustomerDiscoveryViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | BusinessCategory>('All');
  const [selectedArea, setSelectedArea] = useState<string>('All Areas');
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [justClaimedCode, setJustClaimedCode] = useState<string | null>(null);

  const activeOffers = useMemo(() => offers.filter((o) => o.active), [offers]);

  const filteredOffers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return activeOffers.filter((offer) => {
      const matchesCategory =
        selectedCategory === 'All' || offer.category === selectedCategory;
      const matchesArea =
        selectedArea === 'All Areas' || offer.neighborhood === selectedArea;
      const matchesSearch =
        !q ||
        offer.businessName.toLowerCase().includes(q) ||
        offer.title.toLowerCase().includes(q) ||
        offer.neighborhood.toLowerCase().includes(q) ||
        offer.category.toLowerCase().includes(q);
      return matchesCategory && matchesArea && matchesSearch;
    });
  }, [activeOffers, searchQuery, selectedCategory, selectedArea]);

  const selectedOffer = useMemo(
    () => offers.find((o) => o.id === selectedOfferId) ?? null,
    [offers, selectedOfferId]
  );

  const claimedByOfferId = useMemo(() => {
    const map = new Map<string, ClaimedOffer>();
    for (const c of claimedOffers) {
      if (!map.has(c.offerId)) {
        map.set(c.offerId, c);
      }
    }
    return map;
  }, [claimedOffers]);

  const handleOpenOffer = (offer: Offer) => {
    setJustClaimedCode(null);
    setSelectedOfferId(offer.id);
    onIncrementView(offer.id);
  };

  const handleClaim = async (offer: Offer) => {
    const existing = claimedByOfferId.get(offer.id);
    if (existing) {
      setJustClaimedCode(existing.code);
      setSelectedOfferId(offer.id);
      return;
    }
    const created = await onClaimOffer(offer);
    if (created?.code) {
      setJustClaimedCode(created.code);
    }
  };

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
  };

  const selectedOfferLoyalty = useMemo(() => {
    if (!selectedOffer) return null;
    return (
      loyaltyPrograms.find(
        (lp) =>
          lp.active &&
          lp.businessName.toLowerCase() === selectedOffer.businessName.toLowerCase()
      ) ?? null
    );
  }, [loyaltyPrograms, selectedOffer]);

  return (
    <div className="space-y-6">
      {/* Sub-View Header & Discovery Intro */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-1.5 max-w-2xl">
          <p className="text-xs font-medium text-emerald-800">
            Dehradun Campus & Neighborhood Picks · Ages 18–30
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 text-balance">
            Transparent local offers from shops you actually visit
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Upfront ₹ pricing, one-tap claim codes, and simple visit-stamp rewards across Rajpur Road, Jakhan, Clement Town, and Karanpur.
          </p>
        </div>

        {/* Sub-view segmented control */}
        <div
          className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/80 self-start lg:self-auto shrink-0"
          role="tablist"
          aria-label="Customer view sections"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeSubTab === 'discover'}
            onClick={() => onChangeSubTab('discover')}
            className={`min-h-[40px] px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 ${
              activeSubTab === 'discover'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Nearby Deals ({activeOffers.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeSubTab === 'wallet'}
            onClick={() => onChangeSubTab('wallet')}
            className={`min-h-[40px] px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 ${
              activeSubTab === 'wallet'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Claims & Loyalty ({claimedOffers.length})
          </button>
        </div>
      </div>

      {activeSubTab === 'discover' ? (
        <div className="space-y-6">
          {/* Search + Neighborhood + Category Filters */}
          <div className="space-y-3">
            <form
              onSubmit={handleSearchSubmit}
              className="grid grid-cols-1 md:grid-cols-12 gap-3"
            >
              <div className="relative md:col-span-8">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search cafés, haircuts, stationery, Rajpur Road..."
                  aria-label="Search Dehradun local offers"
                  className="w-full min-h-[46px] pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
                />
              </div>

              <div className="relative md:col-span-4">
                <MapPin className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  aria-label="Filter by Dehradun neighborhood"
                  className="w-full min-h-[46px] pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
                >
                  {DEHRADUN_NEIGHBORHOODS.map((area) => (
                    <option key={area} value={area}>
                      {area === 'All Areas' ? 'All Dehradun Areas' : area}
                    </option>
                  ))}
                </select>
              </div>
            </form>

            {/* Interactive Category Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              {CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`min-h-[40px] px-4 py-2 rounded-xl text-xs sm:text-sm font-medium border transition-colors whitespace-nowrap shrink-0 ${
                      isActive
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Offers Grid */}
          {filteredOffers.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3">
              <Store className="w-8 h-8 text-slate-400 mx-auto" />
              <h2 className="text-base font-semibold text-slate-900">
                No matching Dehradun deals found
              </h2>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                Try clearing your search or switching back to All Areas to explore nearby cafés, salons, and boutiques.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                  setSelectedArea('All Areas');
                }}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredOffers.map((offer) => {
                const savings = Math.max(0, offer.originalPrice - offer.offerPrice);
                const claimed = claimedByOfferId.get(offer.id);
                const linkedLoyalty = loyaltyPrograms.find(
                  (lp) =>
                    lp.active &&
                    lp.businessName.toLowerCase() === offer.businessName.toLowerCase()
                );

                return (
                  <article
                    key={offer.id}
                    className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col transition-shadow hover:shadow-md"
                  >
                    <button
                      type="button"
                      onClick={() => handleOpenOffer(offer)}
                      className="block relative aspect-[4/3] w-full bg-slate-100 overflow-hidden text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
                    >
                      <OfferImage
                        src={offer.imageUrl}
                        alt={`${offer.businessName} in ${offer.neighborhood}`}
                        businessName={offer.businessName}
                        className="group-hover:scale-[1.02] transition-transform duration-200"
                      />
                    </button>

                    <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-4">
                      <div className="space-y-2">
                        {/* Unboxed clean metadata line (Zero-Pill Discipline) */}
                        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-slate-500">
                          <span className="font-medium text-slate-700">{offer.category}</span>
                          <span aria-hidden="true">·</span>
                          <span>{offer.neighborhood}</span>
                          <span aria-hidden="true">·</span>
                          <span className="tabular-nums">{offer.distanceKm.toFixed(1)} km</span>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1 text-amber-700 font-medium tabular-nums">
                            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                            {offer.rating.toFixed(1)} ({offer.reviewCount})
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleOpenOffer(offer)}
                          className="text-left block w-full group"
                        >
                          <p className="text-xs font-semibold text-emerald-800">
                            {offer.businessName}
                          </p>
                          <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug group-hover:text-emerald-800 transition-colors mt-0.5">
                            {offer.title}
                          </h2>
                        </button>

                        <p className="text-xs text-slate-500">{offer.validityLabel}</p>

                        {linkedLoyalty && (
                          <p className="text-xs text-slate-600 pt-0.5">
                            Loyalty perk: <span className="font-medium text-slate-800">{linkedLoyalty.visitsRequired} visits</span> → {linkedLoyalty.rewardTitle}
                          </p>
                        )}
                      </div>

                      <div className="space-y-3 pt-3 border-t border-slate-100">
                        {/* Transparent upfront pricing */}
                        <div className="flex items-baseline justify-between gap-2">
                          <div className="flex items-baseline gap-2">
                            <span className="text-xl font-bold text-slate-900 font-mono tabular-nums">
                              ₹{offer.offerPrice}
                            </span>
                            <span className="text-sm text-slate-400 line-through font-mono tabular-nums">
                              ₹{offer.originalPrice}
                            </span>
                          </div>
                          {savings > 0 && (
                            <span className="text-xs font-semibold text-emerald-800 tabular-nums">
                              Save ₹{savings}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => handleClaim(offer)}
                            className={`min-h-[44px] px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap ${
                              claimed
                                ? 'bg-emerald-50 text-emerald-900 border border-emerald-300 hover:bg-emerald-100'
                                : 'bg-emerald-700 text-white hover:bg-emerald-800 active:scale-[0.99]'
                            }`}
                          >
                            {claimed ? (
                              <>
                                <Check className="w-4 h-4 shrink-0" />
                                <span className="truncate">Code: {claimed.code}</span>
                              </>
                            ) : (
                              <>
                                <Tag className="w-4 h-4 shrink-0" />
                                <span>Claim Deal</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => onOpenWhatsAppShare(offer)}
                            className="min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-slate-50 hover:border-slate-300 transition-colors whitespace-nowrap"
                          >
                            <MessageCircle className="w-4 h-4 text-emerald-700 shrink-0" />
                            <span>WhatsApp</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* Lightweight Validation Prompt adjacent to deals */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Testing LocalGrow in Dehradun?
              </h3>
              <p className="text-xs sm:text-sm text-slate-600">
                Tell us in 2 quick taps whether these neighborhood deals save you time and feel worth paying for.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenFeedback}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
            >
              Quick Feedback: Would You Pay?
            </button>
          </div>
        </div>
      ) : (
        /* My Claims & Loyalty Cards Wallet View */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Claimed Offers Section */}
          <section className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Your Claimed Offer Codes</h2>
                <p className="text-xs text-slate-500">
                  Show the code at the shop counter—no app download or QR scanner needed.
                </p>
              </div>
              <span className="text-xs font-mono tabular-nums text-slate-500">
                {claimedOffers.length} total
              </span>
            </div>

            {claimedOffers.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center space-y-3">
                <Ticket className="w-7 h-7 text-slate-400 mx-auto" />
                <p className="text-sm text-slate-600">
                  You haven&apos;t claimed a local offer yet. Grab a deal from Nearby Deals to generate your counter code.
                </p>
                <button
                  type="button"
                  onClick={() => onChangeSubTab('discover')}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-700 text-white text-sm font-semibold hover:bg-emerald-800 transition-colors"
                >
                  Browse Dehradun Deals
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {claimedOffers.map((claim) => (
                  <div
                    key={claim.id}
                    className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="text-xs text-slate-500 flex items-center gap-1.5">
                        <span className="font-semibold text-emerald-800">{claim.businessName}</span>
                        <span aria-hidden="true">·</span>
                        <span>{claim.neighborhood}</span>
                      </div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900">
                        {claim.title}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-slate-600">
                        <span className="font-mono font-semibold text-slate-900 tabular-nums">
                          Pay ₹{claim.offerPrice}
                        </span>
                        <span className="line-through text-slate-400 font-mono tabular-nums">
                          ₹{claim.originalPrice}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono font-semibold text-emerald-800">
                          Code: {claim.code}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={claim.redeemedInStore}
                      onClick={() => onToggleRedeemed(claim.id)}
                      className={`min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-colors whitespace-nowrap shrink-0 flex items-center justify-center gap-1.5 ${
                        claim.redeemedInStore
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200 cursor-default'
                          : 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{claim.redeemedInStore ? 'Redeemed at Shop' : 'Mark Used in Store'}</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Repeat-Visit Loyalty Cards */}
          <section className="lg:col-span-5 space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Repeat-Visit Loyalty Cards</h2>
              <p className="text-xs text-slate-500">
                Tap &ldquo;Stamp Visit&rdquo; to test how neighborhood regulars unlock rewards.
              </p>
            </div>

            <div className="space-y-3">
              {loyaltyPrograms
                .filter((lp) => lp.active)
                .map((prog) => {
                  const unlocked = prog.currentStamps >= prog.visitsRequired;
                  return (
                    <div
                      key={prog.id}
                      className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs text-slate-500">
                            {prog.category} · {prog.neighborhood}
                          </p>
                          <h3 className="text-base font-bold text-slate-900">
                            {prog.businessName}
                          </h3>
                        </div>
                        <span className="text-xs font-mono font-semibold tabular-nums text-emerald-800">
                          {prog.currentStamps} / {prog.visitsRequired} visits
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-700">
                        Reward: <span className="font-semibold text-slate-900">{prog.rewardTitle}</span>
                      </p>

                      {/* Clean Visual Stamp Slots */}
                      <div className="flex items-center gap-2">
                        {Array.from({ length: prog.visitsRequired }).map((_, idx) => {
                          const filled = idx < prog.currentStamps;
                          return (
                            <div
                              key={idx}
                              className={`h-8 flex-1 rounded-lg border flex items-center justify-center text-xs font-mono font-semibold transition-colors ${
                                filled
                                  ? 'bg-emerald-700 border-emerald-700 text-white'
                                  : 'bg-slate-50 border-slate-200 text-slate-400'
                              }`}
                            >
                              {filled ? <Check className="w-4 h-4" /> : idx + 1}
                            </div>
                          );
                        })}
                      </div>

                      <div className="pt-1">
                        {unlocked ? (
                          <button
                            type="button"
                            onClick={() => onResetLoyaltyCard(prog.id)}
                            className="w-full min-h-[44px] px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs sm:text-sm font-semibold hover:bg-emerald-800 transition-colors flex items-center justify-center gap-2"
                          >
                            <Sparkles className="w-4 h-4" />
                            <span>Reward Unlocked — Redeem & Start Next Card</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onStampLoyalty(prog.id)}
                            className="w-full min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs sm:text-sm font-semibold hover:bg-slate-50 transition-colors"
                          >
                            + Add Visit Stamp (Demo Check-in)
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </section>
        </div>
      )}

      {/* Offer Detail & Loyalty Bottom Sheet / Modal */}
      {selectedOffer && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/50 backdrop-blur-xs p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="offer-detail-title"
        >
          <div className="w-full sm:max-w-xl max-h-[90vh] overflow-y-auto bg-white rounded-t-3xl sm:rounded-2xl border border-slate-200 shadow-xl">
            <div className="sm:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-slate-300" />
            </div>

            <div className="relative aspect-[16/9] w-full bg-slate-100">
              <OfferImage
                src={selectedOffer.imageUrl}
                alt={selectedOffer.businessName}
                businessName={selectedOffer.businessName}
              />
              <button
                type="button"
                onClick={() => setSelectedOfferId(null)}
                aria-label="Close offer details"
                className="absolute top-3 right-3 min-h-[44px] min-w-[44px] rounded-full bg-white/90 text-slate-900 shadow-sm flex items-center justify-center hover:bg-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-5">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-x-1.5 text-xs text-slate-500">
                  <span className="font-semibold text-emerald-800">{selectedOffer.businessName}</span>
                  <span aria-hidden="true">·</span>
                  <span>{selectedOffer.neighborhood}</span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">{selectedOffer.distanceKm.toFixed(1)} km away</span>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1 text-amber-700 font-medium tabular-nums">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    {selectedOffer.rating.toFixed(1)} ({selectedOffer.reviewCount})
                  </span>
                </div>
                <h2 id="offer-detail-title" className="text-xl font-bold text-slate-900">
                  {selectedOffer.title}
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {selectedOffer.description}
                </p>
              </div>

              {/* Transparent Price Block */}
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-slate-500">Final Counter Price (No hidden fees)</p>
                  <div className="flex items-baseline gap-2.5 mt-0.5">
                    <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                      ₹{selectedOffer.offerPrice}
                    </span>
                    <span className="text-sm text-slate-400 line-through font-mono tabular-nums">
                      ₹{selectedOffer.originalPrice}
                    </span>
                    <span className="text-xs font-semibold text-emerald-800 tabular-nums">
                      Save ₹{Math.max(0, selectedOffer.originalPrice - selectedOffer.offerPrice)}
                    </span>
                  </div>
                </div>
                <div className="text-right text-xs text-slate-600">
                  <p className="font-medium text-slate-800">{selectedOffer.validityLabel}</p>
                  <p>{selectedOffer.targetAudience}</p>
                </div>
              </div>

              {/* Claimed Code Confirmation Banner if claimed */}
              {(justClaimedCode || claimedByOfferId.has(selectedOffer.id)) && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-emerald-800">
                      Offer Claimed — Show at {selectedOffer.businessName}
                    </p>
                    <p className="text-lg font-mono font-bold text-emerald-950 tracking-wide">
                      {justClaimedCode ?? claimedByOfferId.get(selectedOffer.id)?.code}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedOfferId(null);
                      onChangeSubTab('wallet');
                    }}
                    className="min-h-[40px] px-3 py-1.5 rounded-lg bg-white border border-emerald-300 text-xs font-semibold text-emerald-900 hover:bg-emerald-100 transition-colors whitespace-nowrap"
                  >
                    Open Wallet
                  </button>
                </div>
              )}

              {/* Loyalty Stamp Card inside Detail Sheet */}
              {selectedOfferLoyalty && (
                <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Shop Loyalty Card ({selectedOfferLoyalty.currentStamps}/{selectedOfferLoyalty.visitsRequired} visits)
                      </h3>
                      <p className="text-xs text-slate-600">
                        Perk: {selectedOfferLoyalty.rewardTitle}
                      </p>
                    </div>
                    {selectedOfferLoyalty.currentStamps >= selectedOfferLoyalty.visitsRequired ? (
                      <button
                        type="button"
                        onClick={() => onResetLoyaltyCard(selectedOfferLoyalty.id)}
                        className="min-h-[40px] px-3 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 transition-colors whitespace-nowrap"
                      >
                        Redeem Reward
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onStampLoyalty(selectedOfferLoyalty.id)}
                        className="min-h-[40px] px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors whitespace-nowrap"
                      >
                        + Stamp Visit
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {Array.from({ length: selectedOfferLoyalty.visitsRequired }).map((_, idx) => {
                      const filled = idx < selectedOfferLoyalty.currentStamps;
                      return (
                        <div
                          key={idx}
                          className={`h-7 flex-1 rounded-md border flex items-center justify-center text-xs font-mono ${
                            filled
                              ? 'bg-emerald-700 border-emerald-700 text-white'
                              : 'bg-slate-50 border-slate-200 text-slate-400'
                          }`}
                        >
                          {filled ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Customer Reviews */}
              <div className="space-y-2.5">
                <h3 className="text-sm font-bold text-slate-900">
                  Recent Dehradun Customer Reviews
                </h3>
                {selectedOffer.reviews.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    New local offer — be the first in your neighborhood to claim and review.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl">
                    {selectedOffer.reviews.map((rev) => (
                      <div key={rev.id} className="p-3.5 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-900">
                            {rev.author} · <span className="font-normal text-slate-500">{rev.context}</span>
                          </span>
                          <span className="text-amber-700 font-medium tabular-nums">
                            ★ {rev.rating.toFixed(1)}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-700">{rev.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sticky/Bottom Action Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleClaim(selectedOffer)}
                  className="min-h-[48px] px-4 py-2.5 rounded-xl bg-emerald-700 text-white text-sm font-semibold hover:bg-emerald-800 transition-colors flex items-center justify-center gap-2"
                >
                  <Tag className="w-4 h-4" />
                  <span>
                    {claimedByOfferId.has(selectedOffer.id)
                      ? 'Offer Already Claimed'
                      : `Claim for ₹${selectedOffer.offerPrice}`}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenWhatsAppShare(selectedOffer)}
                  className="min-h-[48px] px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-700" />
                  <span>Share Deal on WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
