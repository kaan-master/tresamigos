import { useEffect, useRef, useState } from "react";
import type { GoogleReview, ReviewsSettings } from "@tresamigos/types";
import { apiUrl } from "../lib/api";
import { ReviewSubmitForm } from "./ReviewSubmitForm";

function Stars({ rating }: { rating: number }) {
  return (
    <div className="review-stars" aria-label={`${rating} of 5 stars`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <span className={index < rating ? "is-filled" : ""} key={index} aria-hidden="true">
          ★
        </span>
      ))}
    </div>
  );
}

function formatReviewDate(review: GoogleReview) {
  if (review.relativeTime) return review.relativeTime;
  if (!review.publishedAt) return null;
  const date = new Date(review.publishedAt);
  if (Number.isNaN(date.getTime())) return review.publishedAt;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function ReviewCard({ review }: { review: GoogleReview }) {
  const initial = review.author.trim().charAt(0).toUpperCase() || "G";
  const dateLabel = formatReviewDate(review);

  return (
    <article className="review-card">
      <header className="review-card-head">
        <span className="review-avatar" aria-hidden="true">
          {initial}
        </span>
        <div className="review-card-meta">
          <strong>{review.author}</strong>
          {dateLabel ? <span className="review-card-date">{dateLabel}</span> : null}
        </div>
        <img className="review-google-mark" src="/assets/brand/platforms/google-g.svg" alt="Google" loading="lazy" />
      </header>
      <Stars rating={review.rating} />
      <p>{review.text}</p>
    </article>
  );
}

export function ReviewsSection({ settings }: { settings: ReviewsSettings }) {
  const [reviews, setReviews] = useState<GoogleReview[]>(settings.curated);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!settings.enabled) return;
    let active = true;

    async function load() {
      try {
        const response = await fetch(apiUrl("/api/reviews"));
        if (!response.ok) return;
        const data = (await response.json()) as { reviews?: GoogleReview[] };
        if (active && data.reviews?.length) {
          setReviews(data.reviews);
        }
      } catch {
        // fallback blijft curated
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [settings.enabled]);

  if (!settings.enabled) return null;

  function scrollBy(direction: -1 | 1) {
    trackRef.current?.scrollBy({ left: direction * 340, behavior: "smooth" });
  }

  return (
    <section className="section section-soft reviews-section">
      <div className="shell">
        <div className="section-heading">
          <div>
            <span className="mini-label">{settings.eyebrow}</span>
            <h2 className="section-title">{settings.title}</h2>
          </div>
        </div>

        <ReviewSubmitForm settings={settings} />

        {reviews.length ? (
          <div className="reviews-carousel">
            <button className="reviews-nav prev" type="button" aria-label="Previous reviews" onClick={() => scrollBy(-1)}>
              ‹
            </button>
            <div className="reviews-track" ref={trackRef}>
              {reviews.map((review) => (
                <ReviewCard review={review} key={review.id} />
              ))}
            </div>
            <button className="reviews-nav next" type="button" aria-label="Next reviews" onClick={() => scrollBy(1)}>
              ›
            </button>
          </div>
        ) : (
          <div className="reviews-empty">No reviews yet. Be the first to share your experience.</div>
        )}
      </div>
    </section>
  );
}
