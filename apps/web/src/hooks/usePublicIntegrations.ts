import { useQuery } from "@tanstack/react-query";
import type { PublicIntegrationsSettings } from "@tresamigos/types";
import { fetchPublicIntegrations } from "../lib/api";

export const DEFAULT_PUBLIC_INTEGRATIONS: PublicIntegrationsSettings = {
  googleAds: {
    enabled: true,
    conversionId: "AW-16851426878"
  },
  newsletter: {
    enabled: true,
    showFooter: true,
    showHome: true,
    showPages: true
  }
};

export function usePublicIntegrations() {
  return useQuery({
    queryKey: ["public-integrations"],
    queryFn: fetchPublicIntegrations,
    staleTime: 60_000,
    placeholderData: DEFAULT_PUBLIC_INTEGRATIONS
  });
}
