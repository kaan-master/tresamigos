import { useQuery } from "@tanstack/react-query";
import type { SiteContent } from "@tresamigos/types";
import { fetchContent } from "../lib/api";

export function useSiteContent() {
  return useQuery<SiteContent>({
    queryKey: ["site-content"],
    queryFn: fetchContent
  });
}
