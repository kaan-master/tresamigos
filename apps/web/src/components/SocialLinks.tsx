import { IconInstagram, IconTikTok } from "./NavIcons";

interface Props {
  instagramUrl?: string;
  tiktokUrl?: string;
  className?: string;
}

export function SocialLinks({ instagramUrl, tiktokUrl, className = "" }: Props) {
  if (!instagramUrl && !tiktokUrl) return null;

  const resolvedTiktok =
    tiktokUrl && /^https?:\/\/(www\.)?tiktok\.com\/?$/i.test(tiktokUrl.trim())
      ? "https://www.tiktok.com/@tresamigosamsterdam"
      : tiktokUrl;

  return (
    <div className={`social-links${className ? ` ${className}` : ""}`}>
      {instagramUrl ? (
        <a href={instagramUrl} target="_blank" rel="noopener noreferrer">
          <IconInstagram />
          <span>Instagram</span>
        </a>
      ) : null}
      {resolvedTiktok ? (
        <a href={resolvedTiktok} target="_blank" rel="noopener noreferrer">
          <IconTikTok />
          <span>TikTok</span>
        </a>
      ) : null}
    </div>
  );
}
