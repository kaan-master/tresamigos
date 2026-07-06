type IconProps = { width?: number; height?: number; className?: string };

function base({ width = 18, height = 18, className = "catering-icon" }: IconProps) {
  return { width, height, className, "aria-hidden": true as const };
}

export function IconTruck(props: IconProps) {
  const svg = base(props);
  return (
    <svg {...svg} viewBox="0 0 24 24">
      <path
        d="M3 6h11v9H3V6Zm11 2h4l3 4v3h-7V8ZM6.5 18a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm10 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconGrid(props: IconProps) {
  const svg = base(props);
  return (
    <svg {...svg} viewBox="0 0 24 24">
      <rect x="3" y="3" width="8" height="8" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <rect x="13" y="3" width="8" height="8" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <rect x="3" y="13" width="8" height="8" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <rect x="13" y="13" width="8" height="8" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function IconPackage(props: IconProps) {
  const svg = base(props);
  return (
    <svg {...svg} viewBox="0 0 24 24">
      <path
        d="M12 3 3 8v8l9 5 9-5V8l-9-5Zm0 2.2 6.5 3.6L12 12.4 5.5 8.8 12 5.2ZM5 10.1l7 3.9v6.8L5 16.9v-6.8Zm14 0v6.8l-7 3.9v-6.8l7-3.9Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconShoppingCart(props: IconProps) {
  const svg = base(props);
  return (
    <svg {...svg} viewBox="0 0 24 24">
      <path
        d="M6 6h15l-1.5 9h-11L5 3H2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="20" r="1.5" fill="currentColor" />
      <circle cx="18" cy="20" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function IconClipboard(props: IconProps) {
  const svg = base(props);
  return (
    <svg {...svg} viewBox="0 0 24 24">
      <rect x="5" y="4" width="14" height="17" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9 4h6a2 2 0 0 1 2 2v1H7V6a2 2 0 0 1 2-2Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 11h8M8 15h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function IconCheckCircle(props: IconProps) {
  const svg = base(props);
  return (
    <svg {...svg} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="m8 12.5 2.5 2.5 5.5-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconX(props: IconProps) {
  const svg = base(props);
  return (
    <svg {...svg} viewBox="0 0 24 24">
      <path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconTrash(props: IconProps) {
  const svg = base(props);
  return (
    <svg {...svg} viewBox="0 0 24 24">
      <path d="M4 7h16M9 7V5h6v2M7 7l1 13h8l1-13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconClock(props: IconProps) {
  const svg = base(props);
  return (
    <svg {...svg} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 7v5l3 2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function IconCalendar(props: IconProps) {
  const svg = base(props);
  return (
    <svg {...svg} viewBox="0 0 24 24">
      <rect x="3" y="5" width="18" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 3v4M16 3v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function IconPlus(props: IconProps) {
  const svg = base(props);
  return (
    <svg {...svg} viewBox="0 0 24 24">
      <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconMinus(props: IconProps) {
  const svg = base(props);
  return (
    <svg {...svg} viewBox="0 0 24 24">
      <path d="M5 12h14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
