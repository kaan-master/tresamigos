import { useState } from "react";
import type { ReviewsSettings } from "@tresamigos/types";
import { apiUrl } from "../lib/api";

function StarPicker({ value, onChange }: { value: number; onChange: (rating: number) => void }) {
  return (
    <div className="review-star-picker" role="radiogroup" aria-label="Rating">
      {Array.from({ length: 5 }).map((_, index) => {
        const rating = index + 1;
        return (
          <button
            key={rating}
            type="button"
            className={rating <= value ? "is-filled" : ""}
            aria-label={`${rating} stars`}
            aria-checked={rating === value}
            role="radio"
            onClick={() => onChange(rating)}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}

export function ReviewSubmitForm({ settings }: { settings: ReviewsSettings }) {
  const [author, setAuthor] = useState("");
  const [email, setEmail] = useState("");
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!settings.submitEnabled) return null;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(apiUrl("/api/reviews/submit"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author, email, rating, text })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Review versturen mislukt.");

      setMessage(settings.submitSuccessMessage);
      setAuthor("");
      setEmail("");
      setRating(5);
      setText("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Review versturen mislukt.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <article className="review-submit-card">
      <div className="review-submit-copy">
        <h3>{settings.submitTitle}</h3>
        <p>{settings.submitIntro}</p>
      </div>
      <form className="review-submit-form" onSubmit={(event) => void handleSubmit(event)}>
        <label className="form-field">
          <span>Your name</span>
          <input value={author} onChange={(event) => setAuthor(event.target.value)} required maxLength={120} />
        </label>
        <label className="form-field">
          <span>Email (optional)</span>
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={180} />
        </label>
        <div className="form-field">
          <span>Rating</span>
          <StarPicker value={rating} onChange={setRating} />
        </div>
        <label className="form-field">
          <span>Your review</span>
          <textarea value={text} onChange={(event) => setText(event.target.value)} required rows={4} maxLength={1200} />
        </label>
        {error ? <p className="form-message is-error">{error}</p> : null}
        {message ? <p className="form-message is-success">{message}</p> : null}
        <button className="btn primary" type="submit" disabled={submitting}>
          {submitting ? "Sending..." : "Send review"}
        </button>
      </form>
    </article>
  );
}
