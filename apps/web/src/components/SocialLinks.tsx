import { IconInstagram, IconTikTok } from "./NavIcons";

interface Props {
  instagramUrl?: string;
  tiktokUrl?: string;
  className?: string;
}

export function SocialLinks({ instagramUrl, tiktokUrl, className = "" }: Props) {
  if (!instagramUrl && !tiktokUrl) return null;

  return (
    <div className={`social-links${className ? ` ${className}` : ""}`}>
      {instagramUrl ? (
        <a href={instagramUrl} target="_blank" rel="noreferrer">
          <IconInstagram />
          <span>Instagram</span>
        </a>
      ) : null}
      {tiktokUrl ? (
        <a href={tiktokUrl} target="_blank" rel="noreferrer">
          <IconTikTok />
          <span>TikTok</span>
        </a>
      ) : null}
    </div>
  );
}
