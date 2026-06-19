import { Injectable, Logger } from "@nestjs/common";
import type { GoogleReview, ReviewsResponse } from "@tresamigos/types";
import { ContentService } from "../content/content.service";
import { RedisService } from "../redis/redis.module";

interface GooglePlaceReview {
  author_name?: string;
  rating?: number;
  text?: string;
  relative_time_description?: string;
  time?: number;
}

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(
    private readonly contentService: ContentService,
    private readonly redis: RedisService
  ) {}

  async getPublicReviews(): Promise<ReviewsResponse> {
    const content = await this.contentService.getContent();
    const settings = content.site.reviews;

    if (!settings.enabled) {
      return { reviews: [], source: "curated", updatedAt: new Date().toISOString() };
    }

    const cacheKey = `reviews:${settings.googlePlaceId || "curated"}:${settings.minRating}`;
    const cached = await this.redis.client.get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as ReviewsResponse;
    }

    const googleReviews = await this.fetchGoogleReviews(settings.googlePlaceId, settings.minRating);
    const reviews =
      googleReviews.length > 0
        ? googleReviews
        : settings.curated.filter((review) => review.rating >= settings.minRating).slice(0, 12);

    const payload: ReviewsResponse = {
      reviews,
      source: googleReviews.length > 0 ? "google" : "curated",
      updatedAt: new Date().toISOString()
    };

    await this.redis.client.set(cacheKey, JSON.stringify(payload), "EX", 60 * 60 * 6);
    return payload;
  }

  private async fetchGoogleReviews(placeId: string, minRating: number): Promise<GoogleReview[]> {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY || "";
    if (!placeId || !apiKey) return [];

    try {
      const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
      url.searchParams.set("place_id", placeId);
      url.searchParams.set("fields", "reviews,rating");
      url.searchParams.set("key", apiKey);
      url.searchParams.set("reviews_sort", "newest");

      const response = await fetch(url);
      if (!response.ok) return [];

      const data = (await response.json()) as {
        result?: { reviews?: GooglePlaceReview[] };
      };

      return (data.result?.reviews || [])
        .filter((review) => (review.rating || 0) >= minRating && cleanText(review.text))
        .slice(0, 12)
        .map((review, index) => ({
          id: `google-${review.time || index}`,
          author: cleanText(review.author_name, "Google review"),
          rating: Math.min(5, Math.max(1, Number(review.rating) || 5)),
          text: cleanText(review.text, ""),
          relativeTime: cleanText(review.relative_time_description, ""),
          publishedAt: review.time ? new Date(review.time * 1000).toISOString().slice(0, 10) : undefined
        }));
    } catch (error) {
      this.logger.warn(`Google reviews ophalen mislukt: ${error instanceof Error ? error.message : "unknown"}`);
      return [];
    }
  }
}

function cleanText(value: unknown, fallback = "", max = 1200) {
  if (typeof value !== "string") return fallback;
  return value.trim().slice(0, max);
}
