export type RoleMode = 'customer' | 'owner';

export type BusinessCategory = 'Cafés' | 'Salons' | 'Retail' | 'Boutiques';

export type CustomerSubTab = 'discover' | 'wallet';

export interface CustomerReview {
  id: string;
  author: string;
  context: string;
  rating: number;
  comment: string;
  dateLabel: string;
}

export interface LoyaltyProgram {
  id: string;
  ownerId?: string;
  businessName: string;
  neighborhood: string;
  category: BusinessCategory;
  visitsRequired: number;
  currentStamps: number;
  rewardTitle: string;
  active: boolean;
}

export interface Offer {
  id: string;
  ownerId?: string;
  businessName: string;
  neighborhood: string;
  distanceKm: number;
  category: BusinessCategory;
  title: string;
  description: string;
  originalPrice: number;
  offerPrice: number;
  validityLabel: string;
  targetAudience: string;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  redemptionCodePrefix: string;
  views: number;
  claims: number;
  whatsappShares: number;
  active: boolean;
  createdAt: string;
  reviews: CustomerReview[];
}

export interface ClaimedOffer {
  id: string;
  userId?: string;
  offerId: string;
  businessName: string;
  neighborhood: string;
  title: string;
  offerPrice: number;
  originalPrice: number;
  code: string;
  claimedAt: string;
  redeemedInStore: boolean;
}

export interface FeedbackEntry {
  id: string;
  userId?: string;
  roleAtSubmission: RoleMode;
  savesTimeAndMoney: 'yes' | 'somewhat' | 'no';
  willingToPay: 'pass_49' | 'pay_per_deal' | 'free_only' | 'owner_499';
  comment: string;
  createdAt: string;
}

export interface LocalGrowState {
  offers: Offer[];
  loyaltyPrograms: LoyaltyProgram[];
  claimedOffers: ClaimedOffer[];
  feedbackEntries: FeedbackEntry[];
}
