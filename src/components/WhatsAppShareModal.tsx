import { useState } from 'react';
import { Check, Copy, ExternalLink, MessageCircle, X } from 'lucide-react';
import { Offer } from '../types';

interface WhatsAppShareModalProps {
  offer: Offer | null;
  onClose: () => void;
  onConfirmShare: (offerId: string) => void;
}

export function WhatsAppShareModal({
  offer,
  onClose,
  onConfirmShare,
}: WhatsAppShareModalProps) {
  const [copied, setCopied] = useState(false);

  if (!offer) return null;

  const savings = Math.max(0, offer.originalPrice - offer.offerPrice);
  const message = `Hey! Found a great local deal in ${offer.neighborhood}, Dehradun on LocalGrow:\n\n*${offer.businessName}*\n${offer.title}\nOffer Price: ₹${offer.offerPrice} (Usually ₹${offer.originalPrice} · Save ₹${savings})\n${offer.validityLabel}\n\nShow code *${offer.redemptionCodePrefix}-DDN* at the counter to claim!`;

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      onConfirmShare(offer.id);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      onConfirmShare(offer.id);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/50 backdrop-blur-xs p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wa-share-title"
    >
      <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in duration-150">
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-300" />
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 id="wa-share-title" className="text-base font-bold text-slate-900">
                Share Deal on WhatsApp
              </h3>
              <p className="text-xs text-slate-500">Ready-to-send message for friends in Dehradun</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close share dialog"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="rounded-xl bg-emerald-50/70 border border-emerald-200/80 p-4 text-sm text-slate-800 whitespace-pre-line leading-relaxed">
            {message}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={handleCopy}
              className="min-h-[46px] px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-medium text-sm flex items-center justify-center gap-2 hover:bg-slate-50 active:scale-[0.99] transition-all whitespace-nowrap"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-700" />
                  <span>Copied Message</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-600" />
                  <span>Copy Message</span>
                </>
              )}
            </button>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onConfirmShare(offer.id)}
              className="min-h-[46px] px-4 py-2.5 rounded-xl bg-emerald-700 text-white font-medium text-sm flex items-center justify-center gap-2 hover:bg-emerald-800 active:scale-[0.99] transition-all whitespace-nowrap"
            >
              <span>Open WhatsApp</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
