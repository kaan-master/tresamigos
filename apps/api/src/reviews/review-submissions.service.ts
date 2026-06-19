import { BadRequestException, Injectable } from "@nestjs/common";
import type { CreateReviewInput, ReviewSubmission, UpdateReviewSubmissionInput } from "@tresamigos/types";
import { sanitizeCreateReviewInput, sanitizeReviewSubmission } from "@tresamigos/utils";
import { PrismaService } from "../prisma/prisma.module";
import { RedisService } from "../redis/redis.module";

@Injectable()
export class ReviewSubmissionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService
  ) {}

  private toDto(record: {
    id: string;
    createdAt: Date;
    status: string;
    author: string;
    email: string;
    rating: number;
    text: string;
    publishedAt: string;
  }): ReviewSubmission {
    return sanitizeReviewSubmission({
      id: record.id,
      createdAt: record.createdAt.toISOString(),
      status: record.status,
      author: record.author,
      email: record.email,
      rating: record.rating,
      text: record.text,
      publishedAt: record.publishedAt
    });
  }

  private async clearReviewCache() {
    if (!this.redis.isAvailable()) return;
    const client = this.redis.client;
    const keys = await client.keys("reviews:*");
    if (keys.length) await client.del(...keys);
  }

  async create(input: CreateReviewInput) {
    const review = sanitizeCreateReviewInput(input);
    if (!review.author || !review.text) {
      throw new BadRequestException({ message: "Naam en reviewtekst zijn verplicht." });
    }

    const record = await this.prisma.reviewSubmission.create({
      data: {
        status: "pending",
        author: review.author,
        email: review.email || "",
        rating: review.rating,
        text: review.text,
        publishedAt: new Date().toISOString().slice(0, 10)
      }
    });

    return {
      message: "Review ontvangen. Bedankt!",
      submission: this.toDto(record)
    };
  }

  async listAdmin() {
    const records = await this.prisma.reviewSubmission.findMany({
      orderBy: { createdAt: "desc" }
    });
    return records.map((record) => this.toDto(record));
  }

  async updateStatus(id: string, input: UpdateReviewSubmissionInput) {
    const status = input.status === "approved" || input.status === "spam" ? input.status : "pending";
    const existing = await this.prisma.reviewSubmission.findUnique({ where: { id } });
    if (!existing) {
      throw new BadRequestException({ message: "Review niet gevonden." });
    }

    const record = await this.prisma.reviewSubmission.update({
      where: { id },
      data: { status }
    });

    await this.clearReviewCache();
    return this.toDto(record);
  }

  async listApprovedPublic(minRating: number) {
    const records = await this.prisma.reviewSubmission.findMany({
      where: { status: "approved" },
      orderBy: { createdAt: "desc" },
      take: 24
    });

    return records
      .filter((record) => record.rating >= minRating)
      .map((record) => ({
        id: `submission-${record.id}`,
        author: record.author,
        rating: record.rating,
        text: record.text,
        publishedAt: record.publishedAt || record.createdAt.toISOString().slice(0, 10),
        relativeTime: formatRelativeDate(record.createdAt)
      }));
  }
}

function formatRelativeDate(date: Date) {
  const diffMs = Date.now() - date.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months === 1) return "1 month ago";
  return `${months} months ago`;
}
