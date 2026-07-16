import { useEffect, useState } from "react";
import type { InstagramFeedPost, InstagramFeedResponse, InstagramSettings } from "@tresamigos/types";
import { apiUrl, assetUrl } from "../lib/api";
import { isVideoSrc } from "../lib/isVideoSrc";

function isRemoteUrl(value: string) {
  return value.startsWith("http://") || value.startsWith("https://");
}

function postMediaUrl(post: InstagramFeedPost) {
  return isRemoteUrl(post.image) ? post.image : assetUrl(post.image);
}

export function InstagramSection({ settings }: { settings: InstagramSettings }) {
  const [feed, setFeed] = useState<InstagramFeedResponse | null>(null);

  useEffect(() => {
    if (!settings.enabled) return;
    let active = true;

    async function load() {
      try {
        const response = await fetch(apiUrl("/api/instagram/feed"));
        if (!response.ok) return;
        const data = (await response.json()) as InstagramFeedResponse;
        if (active) setFeed(data);
      } catch {
        // fallback op CMS-instellingen
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [settings.enabled, settings.handle]);

  if (!settings.enabled) return null;

  const posts: InstagramFeedPost[] =
    feed?.posts.length
      ? feed.posts
      : settings.posts
          .filter((post) => post.active !== false)
          .map((post) => ({
            id: post.id,
            image: post.image,
            url: post.url,
            caption: post.caption,
            isVideo: post.isVideo
          }));

  if (!posts.length) return null;

  const handle = feed?.handle || settings.handle;
  const profileUrl = feed?.profileUrl || settings.profileUrl;
  const bio = feed?.bio || settings.bio;
  const avatar = feed?.profileImage || assetUrl("/assets/site/tres-amigos-logo-new.png");

  return (
    <section className="section instagram-section">
      <div className="shell">
        <div className="instagram-shell">
          <div className="instagram-head">
            <div className="instagram-profile">
              <span className="instagram-avatar" aria-hidden="true">
                <img src={avatar} alt="" />
              </span>
              <div>
                <h2 className="section-title">@{handle}</h2>
                {bio ? <p className="instagram-bio">{bio}</p> : null}
              </div>
            </div>
            <a className="btn primary instagram-follow" href={profileUrl} target="_blank" rel="noreferrer">
              Follow on Instagram
            </a>
          </div>

          <div className="instagram-carousel">
            <div className="instagram-track">
              {posts.map((post) => {
                const media = postMediaUrl(post);
                const playAsVideo = isVideoSrc(media);
                const showVideoBadge = post.isVideo === true || playAsVideo;

                return (
                  <a className="instagram-post" href={post.url} key={post.id} target="_blank" rel="noreferrer">
                    {playAsVideo ? (
                      <video
                        src={media}
                        muted
                        autoPlay
                        loop
                        playsInline
                        preload="metadata"
                        data-boot-defer="1"
                        aria-label={post.caption || "Instagram video"}
                      />
                    ) : (
                      <img src={media} alt={post.caption || "Instagram post"} loading="lazy" />
                    )}
                    {showVideoBadge ? <span className="instagram-post-badge">Video</span> : null}
                    {post.caption ? <span className="instagram-post-caption">{post.caption}</span> : null}
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
