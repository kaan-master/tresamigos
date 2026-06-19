import type { SeoPageKey, SiteContent } from "@tresamigos/types";

export function pageSeo(content: SiteContent, key: SeoPageKey) {
  return content.site.seo.pages[key];
}
