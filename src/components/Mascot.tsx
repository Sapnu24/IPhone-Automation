// Placeholder bee mascot (original flat-vector art). Will be replaced by the
// illustrated turnaround once the reference/inspo art is finalized.
export function Bee({ size = 96 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" aria-label="Buzz the bee">
      <defs>
        <clipPath id="beeBody">
          <ellipse cx="60" cy="74" rx="27" ry="30" />
        </clipPath>
      </defs>
      {/* Wings */}
      <ellipse cx="40" cy="46" rx="15" ry="22" fill="#eaf6ff" stroke="#cfe6f5" transform="rotate(-22 40 46)" opacity="0.9" />
      <ellipse cx="80" cy="46" rx="15" ry="22" fill="#eaf6ff" stroke="#cfe6f5" transform="rotate(22 80 46)" opacity="0.9" />
      {/* Body */}
      <ellipse cx="60" cy="74" rx="27" ry="30" fill="#f5a524" />
      <g clipPath="url(#beeBody)">
        <rect x="30" y="58" width="60" height="9" rx="4.5" fill="#20130a" />
        <rect x="30" y="76" width="60" height="9" rx="4.5" fill="#20130a" />
        <rect x="30" y="94" width="60" height="9" rx="4.5" fill="#20130a" />
      </g>
      {/* Stinger */}
      <path d="M60 104 l6 10 -12 0 z" fill="#20130a" />
      {/* Head */}
      <circle cx="60" cy="40" r="23" fill="#f6b73c" />
      {/* Cheeks */}
      <circle cx="43" cy="47" r="4.5" fill="#ff8fb0" opacity="0.7" />
      <circle cx="77" cy="47" r="4.5" fill="#ff8fb0" opacity="0.7" />
      {/* Eyes */}
      <circle cx="52" cy="39" r="7.5" fill="#fff" />
      <circle cx="68" cy="39" r="7.5" fill="#fff" />
      <circle cx="53" cy="40" r="3.8" fill="#20130a" />
      <circle cx="69" cy="40" r="3.8" fill="#20130a" />
      <circle cx="54.5" cy="38.5" r="1.3" fill="#fff" />
      <circle cx="70.5" cy="38.5" r="1.3" fill="#fff" />
      {/* Smile */}
      <path d="M53 50 q7 6 14 0" fill="none" stroke="#20130a" strokeWidth="2" strokeLinecap="round" />
      {/* Antennae */}
      <path d="M50 22 q-6 -8 -10 -12" fill="none" stroke="#20130a" strokeWidth="2" strokeLinecap="round" />
      <path d="M70 22 q6 -8 10 -12" fill="none" stroke="#20130a" strokeWidth="2" strokeLinecap="round" />
      <circle cx="39" cy="9" r="3" fill="#20130a" />
      <circle cx="81" cy="9" r="3" fill="#20130a" />
      {/* Green cap */}
      <path d="M38 30 q22 -26 44 0 z" fill="#1f9d55" />
      <path d="M38 30 q22 -12 44 0" fill="none" stroke="#0f7a3f" strokeWidth="1.5" />
      <path d="M60 30 h22 q6 0 4 5 l-1 2 q-14 -3 -25 -2 z" fill="#37b06a" />
      {/* Little hex badge on cap */}
      <polygon points="52,20 56,22 56,27 52,29 48,27 48,22" fill="#f6b73c" />
    </svg>
  )
}

export function MascotTip({ text }: { text: string }) {
  return (
    <div className="row" style={{ gap: 12, alignItems: 'flex-start' }}>
      <div
        className="hex"
        style={{
          width: 60,
          height: 60,
          background: 'var(--accent-soft)',
          display: 'grid',
          placeItems: 'center',
          flex: 'none',
        }}
      >
        <Bee size={52} />
      </div>
      <div className="bubble grow">
        <strong>Buzz</strong>
        <div className="dim" style={{ marginTop: 2 }}>
          {text}
        </div>
      </div>
    </div>
  )
}
