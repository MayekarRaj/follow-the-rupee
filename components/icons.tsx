/* Small line icons (decorative: always paired with a text label). */
const base = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true as const,
  focusable: false as const,
};

/** City hall: columns under a pediment. */
export const IconCity = () => (
  <svg {...base}>
    <path d="M3 9.5 12 4l9 5.5" />
    <path d="M5 10v8M10 10v8M14 10v8M19 10v8" />
    <path d="M3 21h18" />
  </svg>
);

/** Flag on a pole. */
export const IconFlag = () => (
  <svg {...base}>
    <path d="M6 21V4" />
    <path d="M6 5h11l-2.5 3.5L17 12H6" />
  </svg>
);

/** Magnifier. */
export const IconSearch = () => (
  <svg {...base}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4.5 4.5" />
  </svg>
);

/** Question mark in a circle. */
export const IconHelp = () => (
  <svg {...base}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9.5a2.6 2.6 0 1 1 3.7 2.4c-.8.4-1.2.9-1.2 1.8" />
    <path d="M12 17h.01" />
  </svg>
);

/** Hamburger / close. */
export const IconMenu = () => (
  <svg {...base}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);

export const IconChevron = () => (
  <svg {...base} width={16} height={16}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

/** Sidebar toggle: a panel with a left rail. */
export const IconSidebar = () => (
  <svg {...base}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="1" />
    <path d="M9.5 4.5v15" />
  </svg>
);

/** Three nodes joined by a line: how the pieces connect. */
export const IconFlow = () => (
  <svg {...base}>
    <rect x="3" y="4" width="6" height="5" rx="1" />
    <rect x="15" y="4" width="6" height="5" rx="1" />
    <rect x="9" y="15" width="6" height="5" rx="1" />
    <path d="M6 9v3h12V9M12 12v3" />
  </svg>
);
