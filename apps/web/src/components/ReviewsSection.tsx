import { useEffect, useRef, useState } from "react";
import type { GoogleReview, ReviewsSettings } from "@tresamigos/types";
import { apiUrl } from "../lib/api";

function Stars({ rating }: { rating: number }) {
  return (
    <div className="review-stars" aria-label={`${rating} van 5 sterren`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <span className={index < rating ? "is-filled" : ""} key={index} aria-hidden="true">
          ★
        </span>
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: GoogleReview }) {
  const initial = review.author.trim().charAt(0).toUpperCase() || "G";
  return (
    <article className="review-card">
      <header className="review-card-head">
        <span className="review-avatar" aria-hidden="true">
          {initial}
        </span>
        <div>
          <strong>{review.author}</strong>
          {review.relativeTime ? <span>{review.relativeTime}</span> : null}
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

  if (!settings.enabled || !reviews.length) return null;

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
        <div className="reviews-carousel">
          <button className="reviews-nav prev" type="button" aria-label="Vorige reviews" onClick={() => scrollBy(-1)}>
            ‹
          </button>
          <div className="reviews-track" ref={trackRef}>
            {reviews.map((review) => (
              <ReviewCard review={review} key={review.id} />
            ))}
          </div>
          <button className="reviews-nav next" type="button" aria-label="Volgende reviews" onClick={() => scrollBy(1)}>
            ›
          </button>
        </div>
      </div>
    </section>
  );
}
