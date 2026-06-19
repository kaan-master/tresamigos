import { Injectable, Logger } from "@nestjs/common";
import type { GoogleReview, ReviewsResponse } from "@tresamigos/types";
import { ContentService } from "../content/content.service";
import { RedisService } from "../redis/redis.module";
import { ReviewSubmissionsService } from "./review-submissions.service";

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
    private readonly redis: RedisService,
    private readonly submissions: ReviewSubmissionsService
  ) {}

  async getPublicReviews(): Promise<ReviewsResponse> {
    const content = await this.contentService.getContent();
    const settings = content.site.reviews;

    if (!settings.enabled) {
      return { reviews: [], source: "curated", updatedAt: new Date().toISOString() };
    }

    const cacheKey = `reviews:public:${settings.googlePlaceId || "curated"}:${settings.minRating}`;
    const cached = await this.redis.client.get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as ReviewsResponse;
    }

    const googleReviews = await this.fetchGoogleReviews(settings.googlePlaceId, settings.minRating);
    const approvedSubmissions = await this.submissions.listApprovedPublic(settings.minRating);
    const curated = settings.curated.filter((review) => review.rating >= settings.minRating);

    let reviews: GoogleReview[];
    let source: ReviewsResponse["source"];

    if (googleReviews.length > 0) {
      reviews = googleReviews;
      source = "google";
    } else {
      reviews = mergeReviews(curated, approvedSubmissions);
      source = approvedSubmissions.length ? "mixed" : "curated";
    }

    const payload: ReviewsResponse = {
      reviews: reviews.slice(0, 24),
      source,
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

function mergeReviews(curated: GoogleReview[], approved: GoogleReview[]) {
  const merged = new Map<string, GoogleReview>();
  for (const review of [...curated, ...approved]) {
    merged.set(review.id, review);
  }

  return [...merged.values()].sort((left, right) => {
    const leftDate = left.publishedAt || "";
    const rightDate = right.publishedAt || "";
    return rightDate.localeCompare(leftDate);
  });
}

function cleanText(value: unknown, fallback = "", max = 1200) {
  if (typeof value !== "string") return fallback;
  return value.trim().slice(0, max);
}
