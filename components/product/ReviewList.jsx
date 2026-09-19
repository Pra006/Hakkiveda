"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Icon from "@/components/ui/Icon";
import Rating from "@/components/ui/Rating";
import Button from "@/components/ui/Button";
import { toast } from "react-toastify";

const STARS = [1, 2, 3, 4, 5];

function ReviewForm({ productId, onSubmitted }) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (rating < 1) {
      toast.error("Please select a star rating");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, rating, title: title.trim() || undefined, body: body.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Could not submit review");
        return;
      }
      toast.success(data.message || "Review submitted!");
      setRating(0);
      setTitle("");
      setBody("");
      onSubmitted?.();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 p-5 rounded-xl bg-surface-container-low border border-outline-variant/60">
      <h3 className="font-headline text-lg text-forest-deep">Write a Review</h3>

      <div className="mt-3 flex items-center gap-1">
        {STARS.map((s) => (
          <button
            key={s}
            type="button"
            onMouseEnter={() => setHovered(s)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => setRating(s)}
            className="p-0.5"
          >
            <Icon
              name="star"
              size={24}
              filled={s <= (hovered || rating)}
              className={s <= (hovered || rating) ? "text-antique-gold" : "text-on-surface-variant/40"}
            />
          </button>
        ))}
        {rating > 0 && <span className="ml-2 text-sm font-semibold text-forest-deep">{rating}/5</span>}
      </div>

      <input
        type="text"
        placeholder="Review title (optional)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={120}
        className="mt-3 w-full border border-outline-variant rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-forest-base/30"
      />

      <textarea
        placeholder="Share your experience…"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        maxLength={2000}
        className="mt-2 w-full border border-outline-variant rounded-lg px-3 py-2 text-sm bg-white resize-none focus:outline-none focus:ring-2 focus:ring-forest-base/30"
      />

      <Button type="submit" size="sm" className="mt-3" disabled={submitting || rating < 1}>
        {submitting ? "Submitting…" : "Submit Review"}
      </Button>
    </form>
  );
}

export default function ReviewList({ productId }) {
  const { data: session } = useSession();
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState({ avgRating: 0, count: 0, distribution: [0, 0, 0, 0, 0] });
  const [loading, setLoading] = useState(true);

  async function fetchReviews() {
    try {
      const res = await fetch(`/api/reviews?productId=${productId}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews);
        setSummary(data.summary);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (productId) fetchReviews();
  }, [productId]);

  const totalDist = summary.distribution.reduce((a, b) => a + b, 0) || 1;

  return (
    <div>
      <h2 className="font-headline text-2xl text-forest-deep">Reviews</h2>

      {loading ? (
        <div className="mt-4 text-sm text-on-surface-variant">Loading reviews…</div>
      ) : (
        <>
          <div className="mt-4 grid sm:grid-cols-[220px_1fr] gap-6 items-start">
            <div className="p-5 rounded-xl bg-surface-container-low border border-outline-variant/60 text-center">
              <div className="font-headline text-5xl text-forest-deep">
                {summary.count > 0 ? summary.avgRating.toFixed(1) : "—"}
              </div>
              {summary.count > 0 && (
                <div className="flex justify-center mt-1">
                  <Rating value={summary.avgRating} showCount={false} />
                </div>
              )}
              <p className="text-xs text-on-surface-variant mt-1">
                {summary.count.toLocaleString()} {summary.count === 1 ? "review" : "reviews"}
              </p>
              {session?.user && (
                <a href="#write-review" className="inline-block mt-4 w-full">
                  <Button size="sm" variant="secondary" className="w-full">Write a review</Button>
                </a>
              )}
            </div>

            {summary.count > 0 && (
              <div className="space-y-3">
                {[5, 4, 3, 2, 1].map((r) => {
                  const starCount = summary.distribution[r - 1] || 0;
                  const pct = Math.round((starCount / totalDist) * 100);
                  return (
                    <div key={r} className="flex items-center gap-3 text-xs">
                      <span className="w-4 font-semibold text-forest-deep">{r}</span>
                      <Icon name="star" size={14} className="text-antique-gold" filled />
                      <div className="flex-1 h-2 rounded-full bg-surface-container-high overflow-hidden">
                        <div className="h-full bg-antique-gold" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-on-surface-variant w-10 text-right">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Individual reviews */}
          {reviews.length > 0 ? (
            <div className="mt-8 divide-y divide-outline-variant/60">
              {reviews.map((r) => {
                const name = [r.customer.firstName, r.customer.lastName].filter(Boolean).join(" ") || "Customer";
                const initial = name[0]?.toUpperCase() || "?";
                const when = new Date(r.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                });
                return (
                  <article key={r.id} className="py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-forest-base text-antique-gold flex items-center justify-center font-semibold overflow-hidden">
                        {r.customer.image ? (
                          <img src={r.customer.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          initial
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-forest-deep">{name}</span>
                          <span className="inline-flex items-center gap-0.5 text-[10px] uppercase tracking-widest text-herbal-jade font-bold">
                            <Icon name="verified" size={12} /> Verified
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Rating value={r.rating} showCount={false} size={12} />
                          <span className="text-xs text-on-surface-variant">{when}</span>
                        </div>
                      </div>
                    </div>
                    {r.title && <h4 className="mt-3 font-semibold text-forest-deep">{r.title}</h4>}
                    {r.body && <p className="mt-1 text-sm text-on-surface-variant leading-relaxed">{r.body}</p>}
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="mt-8 text-sm text-on-surface-variant">
              No reviews yet. Be the first to share your experience!
            </p>
          )}

          {/* Review submission form for logged-in users */}
          {session?.user && (
            <div id="write-review">
              <ReviewForm productId={productId} onSubmitted={fetchReviews} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
