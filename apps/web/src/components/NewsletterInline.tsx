import { usePublicIntegrations } from "../hooks/usePublicIntegrations";
import { NewsletterSection } from "./NewsletterSection";

type Placement = "home" | "page";

export function NewsletterInline({ placement, id }: { placement: Placement; id?: string }) {
  const { data } = usePublicIntegrations();
  const newsletter = data?.newsletter;
  if (!newsletter?.enabled) return null;
  if (placement === "home" && !newsletter.showHome) return null;
  if (placement === "page" && !newsletter.showPages) return null;

  return <NewsletterSection variant="compact" id={id} />;
}
