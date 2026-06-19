import { Injectable, Logger } from "@nestjs/common";
import type { InstagramFeedPost, InstagramFeedResponse, InstagramSettings } from "@tresamigos/types";
import { ContentService } from "../content/content.service";
import { RedisService } from "../redis/redis.module";

const IG_APP_ID = "936619743392459";
const CACHE_TTL_SECONDS = 60 * 60 * 6;

interface GraphMediaItem {
  id: string;
  media_type?: string;
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
  caption?: string;
  timestamp?: string;
}

interface WebProfileNode {
  shortcode?: string;
  display_url?: string;
  thumbnail_src?: string;
  is_video?: boolean;
  edge_media_to_caption?: { edges?: Array<{ node?: { text?: string } }> };
}

@Injectable()
export class InstagramService {
  private readonly logger = new Logger(InstagramService.name);
  private memoryCache: { key: string; payload: InstagramFeedResponse; expires: number } | null = null;

  constructor(
    private readonly contentService: ContentService,
    private readonly redis: RedisService
  ) {}

  async getFeed(): Promise<InstagramFeedResponse> {
    const content = await this.contentService.getContent();
    const settings = content.site.instagram;
    if (!settings.enabled) {
      return this.emptyFeed(settings, "fallback");
    }

    const cacheKey = `instagram:feed:${settings.handle}`;
    const cached = await this.readCache(cacheKey);
    if (cached) return cached;

    const token = process.env.INSTAGRAM_ACCESS_TOKEN || "";
    let posts: InstagramFeedPost[] = [];
    let source: InstagramFeedResponse["source"] = "fallback";
    let bio = settings.bio;
    let profileImage: string | undefined;

    if (token) {
      const graph = await this.fetchGraphFeed(token, settings);
      if (graph.posts.length) {
        posts = graph.posts;
        source = "instagram";
        bio = graph.bio || bio;
        profileImage = graph.profileImage;
      }
    }

    if (!posts.length) {
      const publicFeed = await this.fetchPublicProfileFeed(settings.handle);
      if (publicFeed.posts.length) {
        posts = publicFeed.posts;
        source = "instagram";
        bio = publicFeed.bio || bio;
        profileImage = publicFeed.profileImage;
      }
    }

    if (!posts.length) {
      posts = this.fallbackPosts(settings);
    }

    const payload: InstagramFeedResponse = {
      enabled: true,
      handle: settings.handle,
      profileUrl: settings.profileUrl,
      bio,
      profileImage,
      posts,
      source,
      updatedAt: new Date().toISOString()
    };

    await this.writeCache(cacheKey, payload);
    return payload;
  }

  private emptyFeed(settings: InstagramSettings, source: InstagramFeedResponse["source"]): InstagramFeedResponse {
    return {
      enabled: false,
      handle: settings.handle,
      profileUrl: settings.profileUrl,
      bio: settings.bio,
      posts: [],
      source,
      updatedAt: new Date().toISOString()
    };
  }

  private fallbackPosts(settings: InstagramSettings): InstagramFeedPost[] {
    return settings.posts
      .filter((post) => post.active !== false)
      .map((post) => ({
        id: post.id,
        image: post.image,
        url: post.url,
        caption: post.caption
      }));
  }

  private async fetchGraphFeed(token: string, settings: InstagramSettings) {
    try {
      const userId = process.env.INSTAGRAM_USER_ID || (await this.resolveGraphUserId(token));
      if (!userId) return { posts: [] as InstagramFeedPost[], bio: settings.bio, profileImage: undefined };

      const url = new URL(`https://graph.instagram.com/${userId}/media`);
      url.searchParams.set(
        "fields",
        "id,media_type,media_url,thumbnail_url,permalink,caption,timestamp"
      );
      url.searchParams.set("limit", "12");
      url.searchParams.set("access_token", token);

      const response = await fetch(url);
      if (!response.ok) throw new Error(`Graph API ${response.status}`);

      const data = (await response.json()) as { data?: GraphMediaItem[] };
      const posts = (data.data || []).map((item) => this.graphItemToPost(item)).filter(Boolean) as InstagramFeedPost[];

      return { posts, bio: settings.bio, profileImage: undefined };
    } catch (error) {
      this.logger.warn(`Instagram Graph API mislukt: ${error instanceof Error ? error.message : "unknown"}`);
      return { posts: [] as InstagramFeedPost[], bio: settings.bio, profileImage: undefined };
    }
  }

  private async resolveGraphUserId(token: string) {
    const response = await fetch(`https://graph.instagram.com/me?fields=id,username&access_token=${encodeURIComponent(token)}`);
    if (!response.ok) return "";
    const data = (await response.json()) as { id?: string };
    return data.id || "";
  }

  private graphItemToPost(item: GraphMediaItem): InstagramFeedPost | null {
    const image = item.media_type === "VIDEO" ? item.thumbnail_url || item.media_url : item.media_url || item.thumbnail_url;
    if (!image || !item.permalink) return null;
    return {
      id: item.id,
      image,
      url: item.permalink,
      caption: item.caption || "",
      isVideo: item.media_type === "VIDEO"
    };
  }

  private async fetchPublicProfileFeed(handle: string) {
    try {
      const response = await fetch(
        `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(handle)}`,
        {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "X-IG-App-ID": IG_APP_ID,
            "X-Requested-With": "XMLHttpRequest"
          }
        }
      );

      if (!response.ok) throw new Error(`web_profile_info ${response.status}`);

      const payload = (await response.json()) as {
        data?: {
          user?: {
            biography?: string;
            profile_pic_url_hd?: string;
            edge_owner_to_timeline_media?: { edges?: Array<{ node?: WebProfileNode }> };
          };
        };
      };

      const user = payload.data?.user;
      const edges = user?.edge_owner_to_timeline_media?.edges || [];
      const posts = edges
        .map((edge) => {
          const node = edge.node;
          if (!node?.shortcode) return null;
          const image = node.display_url || node.thumbnail_src;
          if (!image) return null;
          return {
            id: node.shortcode,
            image,
            url: `https://www.instagram.com/p/${node.shortcode}/`,
            caption: node.edge_media_to_caption?.edges?.[0]?.node?.text || "",
            isVideo: node.is_video === true
          } satisfies InstagramFeedPost;
        })
        .filter(Boolean) as InstagramFeedPost[];

      return {
        posts,
        bio: user?.biography || "",
        profileImage: user?.profile_pic_url_hd
      };
    } catch (error) {
      this.logger.warn(`Instagram public feed mislukt: ${error instanceof Error ? error.message : "unknown"}`);
      return { posts: [] as InstagramFeedPost[], bio: "", profileImage: undefined };
    }
  }

  private async readCache(key: string) {
    if (this.redis.isAvailable()) {
      const cached = await this.redis.client.get(key);
      if (cached) return JSON.parse(cached) as InstagramFeedResponse;
      return null;
    }

    if (this.memoryCache && this.memoryCache.key === key && this.memoryCache.expires > Date.now()) {
      return this.memoryCache.payload;
    }
    return null;
  }

  private async writeCache(key: string, payload: InstagramFeedResponse) {
    if (this.redis.isAvailable()) {
      await this.redis.client.set(key, JSON.stringify(payload), "EX", CACHE_TTL_SECONDS);
      return;
    }

    this.memoryCache = {
      key,
      payload,
      expires: Date.now() + CACHE_TTL_SECONDS * 1000
    };
  }
}
