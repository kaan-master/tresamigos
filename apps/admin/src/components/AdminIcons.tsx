import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      {children}
    </svg>
  );
}

export function IconOverview(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 3v18h18" />
      <path d="M7 16l4-6 4 3 5-7" />
    </Icon>
  );
}

export function IconHome(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V20h14V9.5" />
    </Icon>
  );
}

export function IconLocations(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </Icon>
  );
}

export function IconProducts(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 13h12" />
      <path d="M12 3v10" />
      <path d="M8 7h8l-1 14H9L8 7Z" />
    </Icon>
  );
}

export function IconVideos(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="6" width="14" height="12" rx="2" />
      <path d="m17 10 4-2v8l-4-2" />
    </Icon>
  );
}

export function IconMedia(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="10" r="2" />
      <path d="m21 15-5-5L5 19" />
    </Icon>
  );
}

export function IconApplications(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </Icon>
  );
}

export function IconReviews(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m12 3 2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 15.8 6.2 18l.9-5.4L3.2 8.7l5.4-.8L12 3Z" />
    </Icon>
  );
}

export function IconSeo(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
      <path d="M8 11h6M11 8v6" />
    </Icon>
  );
}

export function IconFooter(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 14h18" />
    </Icon>
  );
}

export function IconSave(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
      <path d="M17 21v-8H7v8M7 3v5h8" />
    </Icon>
  );
}

export function IconLogout(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </Icon>
  );
}

export function IconUpload(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 16V4M8 8l4-4 4 4" />
      <path d="M4 20h16" />
    </Icon>
  );
}

export function IconRefresh(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v6h-6" />
    </Icon>
  );
}

export function IconCopy(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </Icon>
  );
}

export function IconTrash(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
    </Icon>
  );
}

export const tabIcons = {
  overview: IconOverview,
  home: IconHome,
  locations: IconLocations,
  products: IconProducts,
  videos: IconVideos,
  media: IconMedia,
  applications: IconApplications,
  reviews: IconReviews,
  seo: IconSeo,
  footer: IconFooter
} as const;
