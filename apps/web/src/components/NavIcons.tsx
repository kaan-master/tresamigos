export function IconLocation(props: { width?: number; height?: number }) {
  const { width = 16, height = 16 } = props;
  return (
    <svg className="nav-icon" viewBox="0 0 24 24" width={width} height={height} aria-hidden="true">
      <path
        d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="12" cy="10" r="2.5" fill="currentColor" />
    </svg>
  );
}

export function IconLogin(props: { width?: number; height?: number }) {
  const { width = 16, height = 16 } = props;
  return (
    <svg className="nav-icon" viewBox="0 0 24 24" width={width} height={height} aria-hidden="true">
      <path
        d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconInstagram(props: { width?: number; height?: number }) {
  const { width = 18, height = 18 } = props;
  return (
    <svg className="social-icon" viewBox="0 0 24 24" width={width} height={height} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" />
    </svg>
  );
}

export function IconTikTok(props: { width?: number; height?: number }) {
  const { width = 18, height = 18 } = props;
  return (
    <svg className="social-icon" viewBox="0 0 24 24" width={width} height={height} aria-hidden="true">
      <path
        d="M16.5 3c.4 2.8 1.8 4.8 4.5 5.5v3.8c-1.7 0-3.2-.5-4.5-1.5v6.8c0 3.4-2.6 6.2-6 6.2S4.5 20.9 4.5 17.5 7.1 11.3 10.5 11.3c.3 0 .7 0 1 .1v3.9a2.4 2.4 0 1 0 1.7 2.3V3h3.3Z"
        fill="currentColor"
      />
    </svg>
  );
}
