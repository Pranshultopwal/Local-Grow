import { FormEvent, useState } from 'react';
import { CheckCircle2, MessageSquareText, X } from 'lucide-react';
import { FeedbackEntry, RoleMode } from '../types';

interface FeedbackModalProps {
  isOpen: boolean;
  currentRole: RoleMode;
  onClose: () => void;
  onSubmitFeedback: (entry: Omit<FeedbackEntry, 'id' | 'createdAt'>) => void;
}

export function FeedbackModal({
  isOpen,
  currentRole,
  onClose,
  onSubmitFeedback,
}: FeedbackModalProps) {
  const [savesTimeAndMoney, setSavesTimeAndMoney] = useState<'yes' | 'somewhat' | 'no'>('yes');
  const [willingToPay, setWillingToPay] = useState<
    'pass_49' | 'pay_per_deal' | 'free_only' | 'owner_499'
  >(currentRole === 'owner' ? 'owner_499' : 'pass_49');
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmitFeedback({
      roleAtSubmission: currentRole,
      savesTimeAndMoney,
      willingToPay,
      comment: comment.trim(),
    });
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setComment('');
      onClose();
    }, 1300);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/50 backdrop-blur-xs p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-modal-title"
    >
      <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-300" />
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <MessageSquareText className="w-5 h-5" />
            </div>
            <div>
              <h3 id="feedback-modal-title" className="text-base font-bold text-slate-900">
                Quick Feedback — Would You Pay?
              </h3>
              <p className="text-xs text-slate-500">
                30-second MVP check · Saved locally for demo validation
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close feedback modal"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-slate-900">Thanks for validating LocalGrow!</h4>
            <p className="text-sm text-slate-600">
              Your response is now logged in the Business Owner validation summary.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-5">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-900">
                1. Does this save you time or money in Dehradun?
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'yes', label: 'Yes, clearly' },
                  { value: 'somewhat', label: 'Somewhat' },
                  { value: 'no', label: 'Not really' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSavesTimeAndMoney(opt.value as 'yes' | 'somewhat' | 'no')}
                    className={`min-h-[44px] px-3 py-2 rounded-xl text-xs sm:text-sm font-medium border transition-colors ${
                      savesTimeAndMoney === opt.value
                        ? 'bg-emerald-700 text-white border-emerald-700'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-900">
                2. Would you pay for this value?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { value: 'pass_49', label: '₹49/mo Student & Youth Pass' },
                  { value: 'pay_per_deal', label: '₹15–₹25 per claimed deal' },
                  { value: 'owner_499', label: '₹499/mo Business Listing' },
                  { value: 'free_only', label: 'Prefer free with local offers' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() =>
                      setWillingToPay(
                        opt.value as 'pass_49' | 'pay_per_deal' | 'free_only' | 'owner_499'
                      )
                    }
                    className={`min-h-[44px] px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium border text-left transition-colors ${
                      willingToPay === opt.value
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="feedback-note" className="block text-sm font-semibold text-slate-900">
                3. Quick note (optional)
              </label>
              <textarea
                id="feedback-note"
                rows={2}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="e.g., Would love more cafés near Premnagar or Jakhan..."
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="min-h-[44px] px-5 py-2 rounded-xl bg-emerald-700 text-white text-sm font-semibold hover:bg-emerald-800 active:scale-[0.99] transition-all"
              >
                Submit Validation
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
