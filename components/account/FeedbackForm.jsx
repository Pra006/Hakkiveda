"use client";

import { useState } from "react";
import Icon from "@/components/ui/Icon";
import { toast } from "react-toastify";

const CATEGORIES = [
  { value: "PRODUCT", label: "Product", icon: "inventory_2" },
  { value: "DELIVERY", label: "Delivery", icon: "local_shipping" },
  { value: "WEBSITE", label: "Website", icon: "language" },
  { value: "CUSTOMER_SERVICE", label: "Customer Service", icon: "support_agent" },
  { value: "OTHER", label: "Other", icon: "more_horiz" },
];

const MESSAGE_MAX = 2000;
const STARS = [1, 2, 3, 4, 5];

export default function FeedbackForm({ userName, userEmail }) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting || done) return; // guard against double submit

    if (rating < 1 || rating > 5) {
      toast.error("Please select a star rating");
      return;
    }
    if (!category) {
      toast.error("Please choose a category");
      return;
    }
    if (!message.trim()) {
      toast.error("Please write your feedback");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/account/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, category, message: message.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not submit your feedback");
      setDone(true);
      toast.success(data.message || "Thank you for your feedback!");
    } catch (err) {
      toast.error(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl text-center px-6 py-16">
        <div className="mx-auto w-16 h-16 rounded-full bg-herbal-jade/10 flex items-center justify-center mb-4">
          <Icon name="check_circle" size={36} filled className="text-herbal-jade" />
        </div>
        <h2 className="font-headline text-xl text-forest-deep">
          Thank you for your feedback!
        </h2>
        <p className="text-sm text-on-surface-variant mt-2 max-w-sm mx-auto">
          We appreciate your time. Our team reads every submission to make Hakkiveda better.
        </p>
        <button
          type="button"
          onClick={() => {
            setDone(false);
            setRating(0);
            setCategory("");
            setMessage("");
          }}
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-forest-base/30 text-sm font-semibold text-forest-deep hover:bg-forest-base/5 transition-colors"
        >
          <Icon name="add_comment" size={16} />
          Share more feedback
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-5 sm:p-7 space-y-6"
    >
      {/* Identity (read-only, from session) */}
      <div className="flex items-center gap-3 pb-5 border-b border-outline-variant/50">
        <div className="w-11 h-11 rounded-full bg-forest-base text-antique-gold flex items-center justify-center font-bold shrink-0">
          {(userName || userEmail || "?").charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-forest-deep truncate">{userName || "Hakkiveda Customer"}</p>
          <p className="text-xs text-on-surface-variant truncate">{userEmail}</p>
        </div>
      </div>

      {/* Rating */}
      <div>
        <label className="block text-sm font-semibold text-forest-deep mb-2">
          How would you rate your experience?
        </label>
        <div
          className="flex items-center gap-1"
          role="radiogroup"
          aria-label="Star rating"
          onMouseLeave={() => setHovered(0)}
        >
          {STARS.map((s) => {
            const active = s <= (hovered || rating);
            return (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={rating === s}
                aria-label={`${s} star${s > 1 ? "s" : ""}`}
                onMouseEnter={() => setHovered(s)}
                onClick={() => setRating(s)}
                className="p-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-antique-gold"
              >
                <Icon
                  name="star"
                  size={32}
                  filled={active}
                  className={active ? "text-antique-gold" : "text-outline-variant"}
                />
              </button>
            );
          })}
          {rating > 0 && (
            <span className="ml-2 text-sm font-semibold text-forest-deep">{rating}/5</span>
          )}
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-semibold text-forest-deep mb-2">Category</label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => {
            const selected = category === c.value;
            return (
              <button
                key={c.value}
                type="button"
                aria-pressed={selected}
                onClick={() => setCategory(c.value)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-antique-gold ${
                  selected
                    ? "bg-forest-base text-white border-forest-base"
                    : "bg-surface text-on-surface-variant border-outline-variant hover:border-forest-base/40 hover:text-forest-deep"
                }`}
              >
                <Icon name={c.icon} size={15} />
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Message */}
      <div>
        <label htmlFor="feedback-message" className="block text-sm font-semibold text-forest-deep mb-2">
          Your feedback
        </label>
        <textarea
          id="feedback-message"
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, MESSAGE_MAX))}
          rows={5}
          required
          maxLength={MESSAGE_MAX}
          placeholder="Tell us what went well or what we can improve…"
          className="w-full rounded-lg border border-outline-variant bg-surface px-3.5 py-3 text-sm outline-none focus:border-forest-base focus:ring-1 focus:ring-forest-base/30 resize-y"
        />
        <div className="mt-1 text-right text-xs text-on-surface-variant">
          {message.length}/{MESSAGE_MAX}
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-forest-base text-antique-gold text-sm font-semibold hover:bg-forest-deep disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {submitting ? (
          <>
            <Icon name="progress_activity" size={18} className="animate-spin" />
            Submitting…
          </>
        ) : (
          <>
            <Icon name="send" size={16} />
            Submit Feedback
          </>
        )}
      </button>
    </form>
  );
}
