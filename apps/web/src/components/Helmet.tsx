export function Helmet({
  title,
  description,
  noindex = false
}: {
  title: string;
  description: string;
  noindex?: boolean;
}) {
  if (typeof document !== "undefined") {
    document.title = title;

    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", description);

    let robots = document.querySelector('meta[name="robots"]');
    if (noindex) {
      if (!robots) {
        robots = document.createElement("meta");
        robots.setAttribute("name", "robots");
        document.head.appendChild(robots);
      }
      robots.setAttribute("content", "noindex, nofollow");
    } else if (robots) {
      robots.remove();
    }
  }
  return null;
}

export function SiteHead({
  googleSiteVerification,
  bingSiteVerification
}: {
  googleSiteVerification?: string;
  bingSiteVerification?: string;
}) {
  if (typeof document === "undefined") return null;

  function setMeta(name: string, content: string) {
    if (!content.trim()) return;
    let tag = document.querySelector(`meta[name="${name}"]`);
    if (!tag) {
      tag = document.createElement("meta");
      tag.setAttribute("name", name);
      document.head.appendChild(tag);
    }
    tag.setAttribute("content", content.trim());
  }

  setMeta("google-site-verification", googleSiteVerification || "");
  setMeta("msvalidate.01", bingSiteVerification || "");

  return null;
}
