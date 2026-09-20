/**
 * Vector product renderings in the brand palette — stand-ins until real
 * photography is supplied. Each `art-panel` block is a one-line swap to <img>.
 * `kind` is a loose string (see Product.category in types.ts) — anything
 * unrecognised falls through to the default illustration below.
 */
export function ProductArt({ kind }: { kind: string }) {
  const gid = `bg-${kind}`;
  const grad = (
    <defs>
      <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#173C54" />
        <stop offset="100%" stopColor="#0F2A3D" />
      </linearGradient>
    </defs>
  );
  const label = (
    <>
      <rect x="18" y="52" width="44" height="26" fill="#F7F3EA" />
      <rect x="18" y="62" width="44" height="2" fill="#B8935A" />
      <text x="40" y="70" fontFamily="Newsreader,serif" fontSize="11" fill="#0F2A3D" textAnchor="middle">
        E
      </text>
    </>
  );

  const common = { viewBox: "0 0 80 130", width: 70, height: 114 };

  switch (kind) {
    case "syrup":
      return (
        <svg {...common}>
          {grad}
          <ellipse cx="40" cy="122" rx="24" ry="6" fill="#000" opacity="0.08" />
          <rect x="33" y="8" width="14" height="12" fill="#B8935A" />
          <path
            d="M30 20 h20 v14 l8 10 v70 a6 6 0 0 1 -6 6 h-24 a6 6 0 0 1 -6 -6 v-70 l8 -10 z"
            fill={`url(#${gid})`}
          />
          {label}
        </svg>
      );
    case "jar":
      return (
        <svg {...common}>
          {grad}
          <ellipse cx="40" cy="112" rx="28" ry="6" fill="#000" opacity="0.08" />
          <rect x="20" y="24" width="40" height="10" rx="2" fill="#B8935A" />
          <path d="M18 34 h44 v66 a8 8 0 0 1 -8 8 h-28 a8 8 0 0 1 -8 -8 z" fill={`url(#${gid})`} />
          <rect x="14" y="56" width="52" height="24" fill="#F7F3EA" />
          <rect x="14" y="66" width="52" height="2" fill="#B8935A" />
          <text x="40" y="72" fontFamily="Newsreader,serif" fontSize="11" fill="#0F2A3D" textAnchor="middle">
            E
          </text>
        </svg>
      );
    case "pump":
      return (
        <svg {...common}>
          {grad}
          <ellipse cx="38" cy="122" rx="24" ry="6" fill="#000" opacity="0.08" />
          <rect x="44" y="6" width="7" height="20" fill="#8C6A3A" />
          <rect x="30" y="18" width="24" height="10" rx="3" fill="#B8935A" />
          <path
            d="M24 28 h28 a4 4 0 0 1 4 4 v78 a6 6 0 0 1 -6 6 h-24 a6 6 0 0 1 -6 -6 v-78 a4 4 0 0 1 4 -4 z"
            fill={`url(#${gid})`}
          />
          {label}
        </svg>
      );
    case "tube":
      return (
        <svg {...common}>
          {grad}
          <ellipse cx="40" cy="118" rx="22" ry="5" fill="#000" opacity="0.08" />
          <path d="M32 10 l16 0 l6 10 l-28 0 z" fill="#8C6A3A" />
          <path
            d="M26 20 h28 v18 a8 8 0 0 1 3 6 v54 a10 10 0 0 1 -10 10 h-14 a10 10 0 0 1 -10 -10 v-54 a8 8 0 0 1 3 -6 z"
            fill={`url(#${gid})`}
          />
          <rect x="22" y="60" width="36" height="22" fill="#F7F3EA" />
          <rect x="22" y="69" width="36" height="2" fill="#B8935A" />
          <text x="40" y="76" fontFamily="Newsreader,serif" fontSize="10" fill="#0F2A3D" textAnchor="middle">
            E
          </text>
        </svg>
      );
    case "dropper":
      return (
        <svg {...common}>
          {grad}
          <ellipse cx="40" cy="120" rx="22" ry="6" fill="#000" opacity="0.08" />
          <rect x="37" y="6" width="6" height="18" fill="#8C6A3A" />
          <rect x="30" y="18" width="20" height="10" rx="2" fill="#B8935A" />
          <path
            d="M26 28 h28 a3 3 0 0 1 3 3 v78 a8 8 0 0 1 -8 8 h-18 a8 8 0 0 1 -8 -8 v-78 a3 3 0 0 1 3 -3 z"
            fill={`url(#${gid})`}
          />
          {label}
        </svg>
      );
    case "granule":
      // a crimped sachet, wider than tall
      return (
        <svg {...common}>
          {grad}
          <ellipse cx="40" cy="112" rx="30" ry="6" fill="#000" opacity="0.08" />
          <path
            d="M14 40 q0 -10 10 -12 l32 0 q10 2 10 12 v50 q0 12 -12 14 h-28 q-12 -2 -12 -14 z"
            fill={`url(#${gid})`}
          />
          <rect x="14" y="38" width="52" height="6" fill="#8C6A3A" />
          <rect x="14" y="94" width="52" height="6" fill="#8C6A3A" />
          <rect x="18" y="58" width="44" height="24" fill="#F7F3EA" />
          <rect x="18" y="68" width="44" height="2" fill="#B8935A" />
          <text x="40" y="75" fontFamily="Newsreader,serif" fontSize="11" fill="#0F2A3D" textAnchor="middle">
            E
          </text>
        </svg>
      );
    case "cream":
      // a wide, shallow tub — flatter than the "jar" upright tub
      return (
        <svg {...common}>
          {grad}
          <ellipse cx="40" cy="108" rx="30" ry="6" fill="#000" opacity="0.08" />
          <path d="M14 46 h52 v50 a10 10 0 0 1 -10 10 h-32 a10 10 0 0 1 -10 -10 z" fill={`url(#${gid})`} />
          <rect x="10" y="34" width="60" height="16" rx="4" fill="#B8935A" />
          <rect x="16" y="66" width="48" height="24" fill="#F7F3EA" />
          <rect x="16" y="76" width="48" height="2" fill="#B8935A" />
          <text x="40" y="83" fontFamily="Newsreader,serif" fontSize="11" fill="#0F2A3D" textAnchor="middle">
            E
          </text>
        </svg>
      );
    case "powder":
      // a tall cylindrical tin with a flat lid
      return (
        <svg {...common}>
          {grad}
          <ellipse cx="40" cy="122" rx="26" ry="6" fill="#000" opacity="0.08" />
          <rect x="18" y="8" width="44" height="12" rx="2" fill="#B8935A" />
          <path d="M20 20 h40 v96 a4 4 0 0 1 -4 4 h-32 a4 4 0 0 1 -4 -4 z" fill={`url(#${gid})`} />
          <rect x="16" y="56" width="48" height="26" fill="#F7F3EA" />
          <rect x="16" y="67" width="48" height="2" fill="#B8935A" />
          <text x="40" y="74" fontFamily="Newsreader,serif" fontSize="11" fill="#0F2A3D" textAnchor="middle">
            E
          </text>
        </svg>
      );
    case "condom":
      // a small flat blister/box pack
      return (
        <svg {...common}>
          {grad}
          <ellipse cx="40" cy="100" rx="26" ry="6" fill="#000" opacity="0.08" />
          <rect x="14" y="34" width="52" height="64" rx="4" fill={`url(#${gid})`} />
          <rect x="14" y="34" width="52" height="14" rx="4" fill="#B8935A" />
          <rect x="18" y="58" width="44" height="30" fill="#F7F3EA" />
          <rect x="18" y="70" width="44" height="2" fill="#B8935A" />
          <text x="40" y="78" fontFamily="Newsreader,serif" fontSize="11" fill="#0F2A3D" textAnchor="middle">
            E
          </text>
        </svg>
      );
    case "bottle":
    default:
      return (
        <svg {...common}>
          {grad}
          <ellipse cx="40" cy="122" rx="26" ry="6" fill="#000" opacity="0.08" />
          <rect x="30" y="10" width="20" height="14" rx="2" fill="#B8935A" />
          <path
            d="M22 24 h36 a4 4 0 0 1 4 4 v82 a6 6 0 0 1 -6 6 h-32 a6 6 0 0 1 -6 -6 v-82 a4 4 0 0 1 4 -4 z"
            fill={`url(#${gid})`}
          />
          {label}
        </svg>
      );
  }
}
