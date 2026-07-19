interface Props {
  className?: string;
}

export function ShieldLogo({ className }: Props) {
  return (
    <svg
      viewBox="0 0 64 72"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="shieldGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="oklch(0.72 0.18 258)" />
          <stop offset="100%" stopColor="oklch(0.5 0.22 278)" />
        </linearGradient>
        <linearGradient id="shieldStroke" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.9 0.1 258)" />
          <stop offset="100%" stopColor="oklch(0.4 0.15 278)" />
        </linearGradient>
      </defs>
      <path
        d="M32 2 L60 12 V34 C60 52 46 66 32 70 C18 66 4 52 4 34 V12 Z"
        fill="url(#shieldGrad)"
        stroke="url(#shieldStroke)"
        strokeWidth="1.5"
      />
      <path
        d="M32 8 L54 16 V34 C54 48 43 60 32 63 C21 60 10 48 10 34 V16 Z"
        fill="none"
        stroke="oklch(0.98 0.02 258 / 0.35)"
        strokeWidth="1"
      />
      {/* Star */}
      <g transform="translate(32 32)" fill="oklch(0.98 0.02 90)">
        <polygon points="0,-12 3.5,-3.7 12.5,-3.7 5.2,2 8,10.9 0,5.5 -8,10.9 -5.2,2 -12.5,-3.7 -3.5,-3.7" />
      </g>
      {/* Banner */}
      <rect x="14" y="42" width="36" height="8" rx="2" fill="oklch(0.15 0.02 265 / 0.75)" />
      <text
        x="32"
        y="48.2"
        textAnchor="middle"
        fontFamily="Space Grotesk, sans-serif"
        fontSize="5.5"
        fontWeight="700"
        letterSpacing="1.5"
        fill="oklch(0.98 0.02 90)"
      >
        REC UNIT
      </text>
    </svg>
  );
}
