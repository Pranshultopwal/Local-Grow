import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  Check,
  Copy,
  ExternalLink,
  Gift,
  Megaphone,
  Pause,
  Play,
  Plus,
  Trash2,
} from 'lucide-react';
import { CATEGORY_IMAGES, DEHRADUN_NEIGHBORHOODS } from '../data/seedData';
import {
  BusinessCategory,
  FeedbackEntry,
  LoyaltyProgram,
  Offer,
} from '../types';

interface BusinessOwnerViewProps {
  offers: Offer[];
  loyaltyPrograms: LoyaltyProgram[];
  feedbackEntries: FeedbackEntry[];
  onCreateOffer: (offer: Omit<Offer, 'id' | 'views' | 'claims' | 'whatsappShares' | 'createdAt' | 'reviews' | 'rating' | 'reviewCount' | 'distanceKm'>) => Promise<Offer> | Offer;
  onToggleOfferActive: (offerId: string) => void;
  onDeleteOffer: (offerId: string) => void;
  onSaveLoyaltyPerk: (program: Omit<LoyaltyProgram, 'id' | 'currentStamps'> & { id?: string }) => void;
  onIncrementWhatsAppShare: (offerId: string) => void;
  onSwitchToCustomerPreview: () => void;
}

type OwnerTab = 'create' | 'whatsapp' | 'loyalty';
type PromoTone = 'students' | 'weekend' | 'winback';

export function BusinessOwnerView({
  offers,
  loyaltyPrograms,
  feedbackEntries,
  onCreateOffer,
  onToggleOfferActive,
  onDeleteOffer,
  onSaveLoyaltyPerk,
  onIncrementWhatsAppShare,
  onSwitchToCustomerPreview,
}: BusinessOwnerViewProps) {
  const [ownerTab, setOwnerTab] = useState<OwnerTab>('create');

  // Create Offer Form State
  const [businessName, setBusinessName] = useState('Rajpur Roast & Co.');
  const [neighborhood, setNeighborhood] = useState('Rajpur Road');
  const [category, setCategory] = useState<BusinessCategory>('Cafés');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [originalPrice, setOriginalPrice] = useState('650');
  const [offerPrice, setOfferPrice] = useState('480');
  const [validityLabel, setValidityLabel] = useState('Valid Mon–Fri · 12 PM – 7 PM');
  const [targetAudience, setTargetAudience] = useState('College Students & Young Professionals');
  const [publishSuccessName, setPublishSuccessName] = useState<string | null>(null);

  // WhatsApp Promo Generator State
  const [selectedPromoOfferId, setSelectedPromoOfferId] = useState<string>(
    offers[0]?.id ?? ''
  );
  const [promoTone, setPromoTone] = useState<PromoTone>('students');
  const [copiedPromo, setCopiedPromo] = useState(false);

  // Loyalty Configurator State
  const [editingProgramId, setEditingProgramId] = useState<string>(
    loyaltyPrograms[0]?.id ?? 'new'
  );
  const currentEditingProgram = loyaltyPrograms.find((lp) => lp.id === editingProgramId);
  const [loyBusinessName, setLoyBusinessName] = useState(
    currentEditingProgram?.businessName ?? 'Doon Pour Coffee Co.'
  );
  const [loyNeighborhood, setLoyNeighborhood] = useState(
    currentEditingProgram?.neighborhood ?? 'Rajpur Road'
  );
  const [loyCategory, setLoyCategory] = useState<BusinessCategory>(
    currentEditingProgram?.category ?? 'Cafés'
  );
  const [loyVisitsRequired, setLoyVisitsRequired] = useState<number>(
    currentEditingProgram?.visitsRequired ?? 3
  );
  const [loyRewardTitle, setLoyRewardTitle] = useState(
    currentEditingProgram?.rewardTitle ?? 'Free Iced Latte or ₹100 Off'
  );
  const [loyActive, setLoyActive] = useState<boolean>(
    currentEditingProgram?.active ?? true
  );
  const [loyaltySavedFlag, setLoyaltySavedFlag] = useState(false);

  useEffect(() => {
    if (loyaltyPrograms.length > 0 && editingProgramId === 'new' && !loyBusinessName) {
      const first = loyaltyPrograms[0];
      setEditingProgramId(first.id);
      setLoyBusinessName(first.businessName);
      setLoyNeighborhood(first.neighborhood);
      setLoyCategory(first.category);
      setLoyVisitsRequired(first.visitsRequired);
      setLoyRewardTitle(first.rewardTitle);
      setLoyActive(first.active);
    }
  }, [loyaltyPrograms, editingProgramId, loyBusinessName]);

  // Traction metrics (Demo / MVP Validation Data)
  const metrics = useMemo(() => {
    const totalViews = offers.reduce((sum, o) => sum + o.views, 0);
    const totalClaims = offers.reduce((sum, o) => sum + o.claims, 0);
    const totalShares = offers.reduce((sum, o) => sum + o.whatsappShares, 0);
    const avgOfferPrice =
      offers.length > 0
        ? Math.round(offers.reduce((sum, o) => sum + o.offerPrice, 0) / offers.length)
        : 495;
    return { totalViews, totalClaims, totalShares, avgOfferPrice };
  }, [offers]);

  const promoOffer =
    offers.find((o) => o.id === selectedPromoOfferId) ?? offers[0] ?? null;

  const generatedWhatsAppMessage = useMemo(() => {
    if (!promoOffer) return '';
    const savings = Math.max(0, promoOffer.originalPrice - promoOffer.offerPrice);
    const prefix = promoOffer.redemptionCodePrefix || 'LOCAL';
    const hook =
      promoTone === 'students'
        ? `Hey Dehradun students & hostel crew around ${promoOffer.neighborhood}!`
        : promoTone === 'weekend'
        ? `Weekend plans in ${promoOffer.neighborhood}? Drop by ${promoOffer.businessName}!`
        : `We miss seeing you at ${promoOffer.businessName} in ${promoOffer.neighborhood}!`;

    return `${hook}\n\n*${promoOffer.title}*\nFlat Offer Price: ₹${promoOffer.offerPrice} (Usually ₹${promoOffer.originalPrice} · You save ₹${savings})\n${promoOffer.validityLabel}\n\nJust show code *${prefix}-WA* at the counter to claim. Forward this to a friend who'd join you!`;
  }, [promoOffer, promoTone]);

  const handlePublishOffer = async (e: FormEvent) => {
    e.preventDefault();
    const orig = Math.max(100, Number(originalPrice) || 600);
    const deal = Math.max(50, Math.min(orig, Number(offerPrice) || 450));
    const cleanTitle = title.trim() || '2 Beverages + Snack Combo';
    const cleanBusiness = businessName.trim() || 'Dehradun Local Shop';
    const codePrefix = cleanBusiness
      .replace(/[^A-Za-z]/g, '')
      .slice(0, 4)
      .toUpperCase() || 'DDN';

    const created = await onCreateOffer({
      businessName: cleanBusiness,
      neighborhood,
      category,
      title: cleanTitle,
      description:
        description.trim() ||
        `Transparent local offer in ${neighborhood} crafted for students and young professionals.`,
      originalPrice: orig,
      offerPrice: deal,
      validityLabel: validityLabel.trim() || 'Valid All Week',
      targetAudience: targetAudience.trim() || 'Ages 18–30 · Nearby Locals',
      imageUrl: CATEGORY_IMAGES[category] ?? CATEGORY_IMAGES.Cafés,
      redemptionCodePrefix: codePrefix,
      active: true,
    });

    setSelectedPromoOfferId(created.id);
    setPublishSuccessName(created.title);
    setTitle('');
    setDescription('');
    setTimeout(() => setPublishSuccessName(null), 5000);
  };

  const handleCopyPromo = async () => {
    if (!promoOffer || !generatedWhatsAppMessage) return;
    try {
      await navigator.clipboard.writeText(generatedWhatsAppMessage);
    } catch {
      // Fallback handled cleanly via feedback
    }
    setCopiedPromo(true);
    onIncrementWhatsAppShare(promoOffer.id);
    setTimeout(() => setCopiedPromo(false), 2000);
  };

  const handleSelectProgramToEdit = (id: string) => {
    setEditingProgramId(id);
    if (id === 'new') {
      setLoyBusinessName('');
      setLoyNeighborhood('Rajpur Road');
      setLoyCategory('Cafés');
      setLoyVisitsRequired(3);
      setLoyRewardTitle('₹100 Off Next Visit');
      setLoyActive(true);
      return;
    }
    const found = loyaltyPrograms.find((lp) => lp.id === id);
    if (found) {
      setLoyBusinessName(found.businessName);
      setLoyNeighborhood(found.neighborhood);
      setLoyCategory(found.category);
      setLoyVisitsRequired(found.visitsRequired);
      setLoyRewardTitle(found.rewardTitle);
      setLoyActive(found.active);
    }
  };

  const handleSaveLoyalty = (e: FormEvent) => {
    e.preventDefault();
    onSaveLoyaltyPerk({
      id: editingProgramId === 'new' ? undefined : editingProgramId,
      businessName: loyBusinessName.trim() || 'Dehradun Local Shop',
      neighborhood: loyNeighborhood,
      category: loyCategory,
      visitsRequired: loyVisitsRequired,
      rewardTitle: loyRewardTitle.trim() || 'Free Beverage or ₹100 Off',
      active: loyActive,
    });
    setLoyaltySavedFlag(true);
    setTimeout(() => setLoyaltySavedFlag(false), 3000);
  };

  const savingsPreview = Math.max(
    0,
    (Number(originalPrice) || 0) - (Number(offerPrice) || 0)
  );

  return (
    <div className="space-y-6">
      {/* Header & Demo Data Transparency */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-1.5 max-w-2xl">
          <p className="text-xs font-medium text-emerald-800">
            Local Business Owner Studio · Simple & Stress-Free
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 text-balance">
            Launch a Dehradun offer & WhatsApp promo in under a minute
          </h1>
          <p className="text-sm text-slate-600">
            No complex ad manager. Publish transparent ₹ deals, copy ready-made WhatsApp broadcasts, and reward repeat walk-ins.
          </p>
        </div>

        <button
          type="button"
          onClick={onSwitchToCustomerPreview}
          className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs sm:text-sm font-semibold hover:bg-slate-50 transition-colors whitespace-nowrap self-start lg:self-auto"
        >
          Preview Live Customer Feed →
        </button>
      </div>

      {/* MVP Traction Metrics (Clearly Labeled Demo / MVP Data) */}
      <section aria-label="MVP validation traction metrics" className="space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xs font-semibold text-slate-500">
            Demo / MVP Traction Snapshot (Sample + Live Session Data)
          </h2>
          <span className="text-xs text-slate-500">
            Benchmark LocalGrow Plan: <span className="font-mono font-semibold text-slate-800">₹499/mo</span> flat · Sample offer range <span className="font-mono font-semibold text-slate-800">₹450–₹550</span>
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4">
            <p className="text-xs text-slate-500">Offer Views</p>
            <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
              {metrics.totalViews.toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-slate-500 mt-1">Across {offers.length} local deals</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4">
            <p className="text-xs text-slate-500">Claims & Redemptions</p>
            <p className="text-2xl font-bold font-mono tabular-nums text-emerald-800 mt-1">
              {metrics.totalClaims.toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-slate-500 mt-1">Demo counter codes issued</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4">
            <p className="text-xs text-slate-500">WhatsApp Shares</p>
            <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
              {metrics.totalShares.toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-slate-500 mt-1">Organic peer forwards</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4">
            <p className="text-xs text-slate-500">Avg Sample Offer Price</p>
            <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
              ₹{metrics.avgOfferPrice}
            </p>
            <p className="text-xs text-slate-500 mt-1">Youth sweet spot: ₹450–₹550</p>
          </div>
        </div>
      </section>

      {/* Owner Workspace Tabs */}
      <div
        className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1"
        role="tablist"
        aria-label="Business owner tools"
      >
        {[
          { id: 'create', label: '1. Publish Offer (< 1 min)' },
          { id: 'whatsapp', label: '2. WhatsApp Promo Builder' },
          { id: 'loyalty', label: '3. Loyalty Perk & Feedback' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={ownerTab === tab.id}
            onClick={() => setOwnerTab(tab.id as OwnerTab)}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-colors whitespace-nowrap shrink-0 ${
              ownerTab === tab.id
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Under-1-Minute Offer Creator + Live Active Offers Table */}
      {ownerTab === 'create' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form
            onSubmit={handlePublishOffer}
            className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Create New Local Offer</h2>
              <span className="text-xs text-emerald-800 font-medium">Publishes live immediately</span>
            </div>

            {publishSuccessName && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 flex items-center justify-between gap-3">
                <p className="text-xs sm:text-sm font-medium text-emerald-900">
                  Published &ldquo;{publishSuccessName}&rdquo; to the Dehradun Customer feed.
                </p>
                <button
                  type="button"
                  onClick={onSwitchToCustomerPreview}
                  className="text-xs font-semibold text-emerald-800 underline whitespace-nowrap"
                >
                  View Live
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label htmlFor="owner-biz-name" className="text-xs font-semibold text-slate-700">
                  Business Name
                </label>
                <input
                  id="owner-biz-name"
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="owner-area" className="text-xs font-semibold text-slate-700">
                  Dehradun Neighborhood
                </label>
                <select
                  id="owner-area"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                >
                  {DEHRADUN_NEIGHBORHOODS.filter((a) => a !== 'All Areas').map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label htmlFor="owner-category" className="text-xs font-semibold text-slate-700">
                  Category
                </label>
                <select
                  id="owner-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as BusinessCategory)}
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                >
                  <option value="Cafés">Cafés</option>
                  <option value="Salons">Salons</option>
                  <option value="Retail">Retail</option>
                  <option value="Boutiques">Boutiques</option>
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="owner-validity" className="text-xs font-semibold text-slate-700">
                  Validity Window
                </label>
                <input
                  id="owner-validity"
                  type="text"
                  required
                  value={validityLabel}
                  onChange={(e) => setValidityLabel(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="owner-title" className="text-xs font-semibold text-slate-700">
                Offer Title (Clear & specific)
              </label>
              <input
                id="owner-title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Cold Brew + Wood-Fired Garlic Bread Combo"
                className="w-full min-h-[44px] rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label htmlFor="owner-orig-price" className="text-xs font-semibold text-slate-700">
                  Regular Price (₹)
                </label>
                <input
                  id="owner-orig-price"
                  type="number"
                  min={100}
                  required
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-mono tabular-nums text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="owner-deal-price" className="text-xs font-semibold text-slate-700">
                  Offer Price (₹)
                </label>
                <input
                  id="owner-deal-price"
                  type="number"
                  min={50}
                  required
                  value={offerPrice}
                  onChange={(e) => setOfferPrice(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-mono tabular-nums text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="owner-audience" className="text-xs font-semibold text-slate-700">
                Target Crowd
              </label>
              <input
                id="owner-audience"
                type="text"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="owner-desc" className="text-xs font-semibold text-slate-700">
                Short Description (optional)
              </label>
              <textarea
                id="owner-desc"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mention nearby landmark or what makes this deal great..."
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 flex items-center justify-between text-xs sm:text-sm">
              <span className="text-slate-600">Upfront Customer Savings:</span>
              <span className="font-mono font-bold text-emerald-800 tabular-nums">
                Save ₹{savingsPreview} (Pay ₹{Number(offerPrice) || 0})
              </span>
            </div>

            <button
              type="submit"
              className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-emerald-700 text-white text-sm font-semibold hover:bg-emerald-800 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Publish Offer to Dehradun Feed</span>
            </button>
          </form>

          {/* Active Offers List */}
          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Your Published Offers</h2>
              <span className="text-xs font-mono tabular-nums text-slate-500">
                {offers.filter((o) => o.active).length} active
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {offers.map((offer) => (
                <div
                  key={offer.id}
                  className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <span className="font-semibold text-slate-800">{offer.businessName}</span>
                      <span aria-hidden="true">·</span>
                      <span>{offer.neighborhood}</span>
                      <span aria-hidden="true">·</span>
                      <span
                        className={
                          offer.active
                            ? 'text-emerald-700 font-semibold'
                            : 'text-amber-700 font-semibold'
                        }
                      >
                        {offer.active ? 'Live' : 'Paused'}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-900 truncate">{offer.title}</p>
                    <p className="text-xs text-slate-500 font-mono tabular-nums">
                      ₹{offer.offerPrice} (was ₹{offer.originalPrice}) · {offer.views} views ·{' '}
                      {offer.claims} claims · {offer.whatsappShares} shares
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPromoOfferId(offer.id);
                        setOwnerTab('whatsapp');
                      }}
                      title="Generate WhatsApp Promo"
                      className="min-h-[40px] px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      WhatsApp
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleOfferActive(offer.id)}
                      aria-label={offer.active ? 'Pause offer' : 'Activate offer'}
                      className="min-h-[40px] min-w-[40px] rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center justify-center transition-colors"
                    >
                      {offer.active ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4 text-emerald-700" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteOffer(offer.id)}
                      aria-label="Delete offer"
                      className="min-h-[40px] min-w-[40px] rounded-lg border border-slate-200 text-slate-500 hover:text-red-700 hover:border-red-200 hover:bg-red-50 flex items-center justify-center transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: WhatsApp Promotional Message Generator */}
      {ownerTab === 'whatsapp' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Megaphone className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">WhatsApp Broadcast Copy</h2>
                <p className="text-xs text-slate-500">
                  Tailored for local Dehradun customer lists & status updates
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="wa-offer-select" className="text-xs font-semibold text-slate-700">
                Select Offer to Promote
              </label>
              <select
                id="wa-offer-select"
                value={promoOffer?.id ?? ''}
                onChange={(e) => setSelectedPromoOfferId(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                {offers.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.businessName} — {o.title} (₹{o.offerPrice})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-700 block">
                Audience & Campaign Tone
              </span>
              <div className="grid grid-cols-1 gap-2">
                {[
                  {
                    id: 'students',
                    title: 'Campus & Student Crowd',
                    desc: 'Great for Graphic Era, DIT, UPES, and DAV groups',
                  },
                  {
                    id: 'weekend',
                    title: 'Weekend Walk-In Rush',
                    desc: 'Short, punchy nudge for Friday–Sunday footfall',
                  },
                  {
                    id: 'winback',
                    title: 'Repeat Customer Win-Back',
                    desc: 'Warm personal note for past regulars on WhatsApp',
                  },
                ].map((tone) => (
                  <button
                    key={tone.id}
                    type="button"
                    onClick={() => setPromoTone(tone.id as PromoTone)}
                    className={`min-h-[48px] p-3 rounded-xl border text-left transition-colors ${
                      promoTone === tone.id
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-950'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <p className="text-sm font-semibold">{tone.title}</p>
                    <p className="text-xs text-slate-500">{tone.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Ready-to-Send WhatsApp Preview</h3>
              {promoOffer && (
                <span className="text-xs font-mono text-slate-500">
                  {promoOffer.neighborhood} · Code {promoOffer.redemptionCodePrefix}-WA
                </span>
              )}
            </div>

            <div className="rounded-2xl bg-emerald-50/70 border border-emerald-200 p-4 sm:p-5 text-sm text-slate-800 whitespace-pre-line leading-relaxed">
              {generatedWhatsAppMessage || 'Publish an offer first to generate a WhatsApp promo.'}
            </div>

            {promoOffer && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleCopyPromo}
                  className="min-h-[46px] px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors"
                >
                  {copiedPromo ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-700" />
                      <span>Copied to Clipboard</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-600" />
                      <span>Copy Promo Message</span>
                    </>
                  )}
                </button>

                <a
                  href={`https://wa.me/?text=${encodeURIComponent(generatedWhatsAppMessage)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => onIncrementWhatsAppShare(promoOffer.id)}
                  className="min-h-[46px] px-4 py-2.5 rounded-xl bg-emerald-700 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-emerald-800 transition-colors"
                >
                  <span>Open in WhatsApp</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Loyalty Perk Configurator + Live Tester Validation Feedback */}
      {ownerTab === 'loyalty' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form
            onSubmit={handleSaveLoyalty}
            className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Repeat-Visit Loyalty Perk</h2>
                <p className="text-xs text-slate-500">
                  Changes sync immediately with the Customer Loyalty Wallet
                </p>
              </div>
            </div>

            {loyaltySavedFlag && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs sm:text-sm font-medium text-emerald-900">
                Loyalty perk saved! Switch to Customer View → Claims & Loyalty to test stamping it.
              </div>
            )}

            <div className="space-y-1">
              <label htmlFor="loy-select" className="text-xs font-semibold text-slate-700">
                Edit Existing Shop or Create New
              </label>
              <select
                id="loy-select"
                value={editingProgramId}
                onChange={(e) => handleSelectProgramToEdit(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                {loyaltyPrograms.map((lp) => (
                  <option key={lp.id} value={lp.id}>
                    {lp.businessName} ({lp.visitsRequired} visits)
                  </option>
                ))}
                <option value="new">+ Add New Shop Loyalty Card</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label htmlFor="loy-biz" className="text-xs font-semibold text-slate-700">
                  Shop Name
                </label>
                <input
                  id="loy-biz"
                  type="text"
                  required
                  value={loyBusinessName}
                  onChange={(e) => setLoyBusinessName(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="loy-area" className="text-xs font-semibold text-slate-700">
                  Dehradun Area
                </label>
                <select
                  id="loy-area"
                  value={loyNeighborhood}
                  onChange={(e) => setLoyNeighborhood(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                >
                  {DEHRADUN_NEIGHBORHOODS.filter((a) => a !== 'All Areas').map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label htmlFor="loy-visits" className="text-xs font-semibold text-slate-700">
                  Visits Required
                </label>
                <select
                  id="loy-visits"
                  value={loyVisitsRequired}
                  onChange={(e) => setLoyVisitsRequired(Number(e.target.value))}
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                >
                  <option value={3}>3 visits (Fastest repeat)</option>
                  <option value={4}>4 visits</option>
                  <option value={5}>5 visits</option>
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="loy-cat" className="text-xs font-semibold text-slate-700">
                  Category
                </label>
                <select
                  id="loy-cat"
                  value={loyCategory}
                  onChange={(e) => setLoyCategory(e.target.value as BusinessCategory)}
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                >
                  <option value="Cafés">Cafés</option>
                  <option value="Salons">Salons</option>
                  <option value="Retail">Retail</option>
                  <option value="Boutiques">Boutiques</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="loy-reward" className="text-xs font-semibold text-slate-700">
                Reward Perk
              </label>
              <input
                id="loy-reward"
                type="text"
                required
                value={loyRewardTitle}
                onChange={(e) => setLoyRewardTitle(e.target.value)}
                placeholder="e.g., Free Cold Coffee or ₹100 Off Next Bill"
                className="w-full min-h-[44px] rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={loyActive}
                onChange={(e) => setLoyActive(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
              />
              <span>Show this loyalty card in Customer View</span>
            </label>

            <button
              type="submit"
              className="w-full min-h-[46px] px-4 py-2.5 rounded-xl bg-emerald-700 text-white text-sm font-semibold hover:bg-emerald-800 transition-colors"
            >
              Save Loyalty Perk
            </button>
          </form>

          {/* Live Tester Feedback Log */}
          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">MVP Validation Responses</h2>
                <p className="text-xs text-slate-500">
                  Live &ldquo;Quick Feedback / Would You Pay?&rdquo; submissions from testers
                </p>
              </div>
              <span className="text-xs font-mono tabular-nums text-slate-500">
                {feedbackEntries.length} responses
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {feedbackEntries.map((fb) => {
                const payLabel =
                  fb.willingToPay === 'pass_49'
                    ? '₹49/mo Youth Pass'
                    : fb.willingToPay === 'pay_per_deal'
                    ? '₹15–₹25 per deal'
                    : fb.willingToPay === 'owner_499'
                    ? '₹499/mo Owner Plan'
                    : 'Free with local offers';
                const timeLabel =
                  fb.savesTimeAndMoney === 'yes'
                    ? 'Saves time & money: Yes'
                    : fb.savesTimeAndMoney === 'somewhat'
                    ? 'Saves time & money: Somewhat'
                    : 'Saves time & money: No';

                return (
                  <div key={fb.id} className="py-3.5 first:pt-0 last:pb-0 space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-slate-800">
                        {fb.roleAtSubmission === 'owner' ? 'Business Owner Tester' : 'Customer Tester (18–30)'}
                      </span>
                      <span className="font-mono text-emerald-800 font-semibold">{payLabel}</span>
                    </div>
                    <p className="text-xs text-slate-500">{timeLabel}</p>
                    {fb.comment && (
                      <p className="text-sm text-slate-700 pt-0.5">&ldquo;{fb.comment}&rdquo;</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
