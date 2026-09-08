// Buzz — the app's original bee mascot, hand-illustrated as vector art.
// One shared palette + gradients, drawn in four views for a proper turnaround.
// `Bee` (the default front view) is used across the app; `BuzzTurnaround`
// shows all four views as a model sheet.

export type BeeView = 'front' | 'right' | 'back' | 'left'

const HONEY = '#f5a524'
const HONEY_LT = '#f8c467'
const HONEY_DK = '#e08c0d'
const INK = '#20130a'
const GREEN = '#1f9d55'
const GREEN_DK = '#0f7a3f'
const GREEN_LT = '#37b06a'

/** Gradients + clips shared by every view. Rendered once per <svg>. */
function Defs({ uid }: { uid: string }) {
  return (
    <defs>
      <linearGradient id={`${uid}-body`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={HONEY_LT} />
        <stop offset="1" stopColor={HONEY_DK} />
      </linearGradient>
      <radialGradient id={`${uid}-head`} cx="0.42" cy="0.36" r="0.72">
        <stop offset="0" stopColor="#fbd07f" />
        <stop offset="1" stopColor={HONEY} />
      </radialGradient>
      <linearGradient id={`${uid}-wing`} x1="0" y1="0" x2="0.4" y2="1">
        <stop offset="0" stopColor="#f2faff" />
        <stop offset="1" stopColor="#cfe7f8" />
      </linearGradient>
      <linearGradient id={`${uid}-cap`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={GREEN_LT} />
        <stop offset="1" stopColor={GREEN} />
      </linearGradient>
    </defs>
  )
}

/** A single translucent wing with a couple of vein lines. */
function Wing({ cx, cy, rot, uid, rx = 15, ry = 23 }: { cx: number; cy: number; rot: number; uid: string; rx?: number; ry?: number }) {
  return (
    <g transform={`rotate(${rot} ${cx} ${cy})`} opacity="0.92">
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={`url(#${uid}-wing)`} stroke="#bcdcf0" strokeWidth="1" />
      <path d={`M${cx} ${cy - ry + 3} Q${cx + rx * 0.5} ${cy} ${cx} ${cy + ry - 5}`} fill="none" stroke="#bcdcf0" strokeWidth="1" opacity="0.8" />
    </g>
  )
}

/** A fuzzy collar (little bumps) where the head meets the body. */
function Collar({ y }: { y: number }) {
  const bumps = [40, 47, 54, 60, 66, 73, 80]
  return (
    <g>
      {bumps.map((x, i) => (
        <circle key={i} cx={x} cy={y + (i % 2 ? 1.5 : 0)} r="4.6" fill={HONEY_LT} />
      ))}
    </g>
  )
}

/** The brand green cap. `flip` mirrors it for the back view (seam showing). */
function Cap({ uid, back = false }: { uid: string; back?: boolean }) {
  return (
    <g>
      <path d="M37 30 q23 -27 46 0 z" fill={`url(#${uid}-cap)`} />
      <path d="M37 30 q23 -13 46 0" fill="none" stroke={GREEN_DK} strokeWidth="1.5" />
      {back ? (
        <>
          <path d="M60 8 v22" stroke={GREEN_DK} strokeWidth="1.4" opacity="0.7" />
          <ellipse cx="60" cy="12" rx="4" ry="3" fill={GREEN_LT} />
        </>
      ) : (
        <>
          <path d="M60 30 h22 q6 0 4 5 l-1 2 q-14 -3 -25 -2 z" fill={GREEN_LT} />
          {/* little hex badge — the honeycomb brand mark */}
          <polygon points="52,19 56,21 56,27 52,29 48,27 48,21" fill={HONEY} stroke={GREEN_DK} strokeWidth="0.8" />
        </>
      )}
    </g>
  )
}

/** Antennae with knob tips (front view). */
function Antennae() {
  return (
    <g stroke={INK} strokeWidth="2" fill="none" strokeLinecap="round">
      <path d="M50 22 q-6 -8 -11 -12" />
      <path d="M70 22 q6 -8 11 -12" />
      <circle cx="38" cy="9" r="3" fill={INK} stroke="none" />
      <circle cx="82" cy="9" r="3" fill={INK} stroke="none" />
    </g>
  )
}

/* ---- Front view (the app-wide mascot) ---------------------------------- */
function Front({ uid }: { uid: string }) {
  return (
    <>
      <ellipse cx="60" cy="112" rx="26" ry="4.5" fill="rgba(20,19,10,0.10)" />
      <Wing cx={41} cy={44} rot={-24} uid={uid} />
      <Wing cx={79} cy={44} rot={24} uid={uid} />
      {/* arms with mitten hands — left one waving hello */}
      <g stroke={HONEY_DK} strokeWidth="1.5">
        <path d="M36 72 Q24 66 20 56" fill="none" strokeWidth="5" strokeLinecap="round" stroke={HONEY} />
        <circle cx="19" cy="53" r="6" fill={HONEY_LT} />
        <path d="M85 78 Q95 82 97 90" fill="none" strokeWidth="5" strokeLinecap="round" stroke={HONEY} />
        <circle cx="98" cy="92" r="6" fill={HONEY_LT} />
      </g>
      {/* body */}
      <ellipse cx="60" cy="76" rx="28" ry="30" fill={`url(#${uid}-body)`} />
      <clipPath id={`${uid}-bodyclip`}>
        <ellipse cx="60" cy="76" rx="28" ry="30" />
      </clipPath>
      <g clipPath={`url(#${uid}-bodyclip)`}>
        <rect x="28" y="60" width="64" height="9" rx="4.5" fill={INK} />
        <rect x="28" y="78" width="64" height="9" rx="4.5" fill={INK} />
        <rect x="28" y="96" width="64" height="9" rx="4.5" fill={INK} />
        <ellipse cx="50" cy="66" rx="12" ry="16" fill="#ffffff" opacity="0.12" />
      </g>
      <path d="M60 105 l6 10 -12 0 z" fill={INK} />
      <Collar y={54} />
      {/* head */}
      <circle cx="60" cy="40" r="23" fill={`url(#${uid}-head)`} />
      <circle cx="43" cy="47" r="4.6" fill="#ff8fb0" opacity="0.65" />
      <circle cx="77" cy="47" r="4.6" fill="#ff8fb0" opacity="0.65" />
      {/* eyes */}
      <circle cx="52" cy="39" r="7.6" fill="#fff" />
      <circle cx="68" cy="39" r="7.6" fill="#fff" />
      <circle cx="53" cy="40" r="3.9" fill={INK} />
      <circle cx="69" cy="40" r="3.9" fill={INK} />
      <circle cx="54.6" cy="38.4" r="1.4" fill="#fff" />
      <circle cx="70.6" cy="38.4" r="1.4" fill="#fff" />
      <path d="M53 50 q7 6.5 14 0" fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
      <Antennae />
      <Cap uid={uid} />
    </>
  )
}

/* ---- Side view (profile). `dir` = which way Buzz faces. ----------------- */
function Side({ uid, dir }: { uid: string; dir: 1 | -1 }) {
  // Draw facing right, then mirror for left.
  const inner = (
    <>
      <ellipse cx="60" cy="112" rx="26" ry="4.5" fill="rgba(20,19,10,0.10)" />
      {/* far + near wings */}
      <Wing cx={52} cy={42} rot={-10} uid={uid} rx={13} ry={20} />
      <Wing cx={58} cy={46} rot={18} uid={uid} rx={15} ry={24} />
      {/* one arm forward */}
      <g>
        <path d="M74 78 Q84 78 88 84" fill="none" strokeWidth="5" strokeLinecap="round" stroke={HONEY} />
        <circle cx="90" cy="86" r="6" fill={HONEY_LT} />
      </g>
      {/* body leaning forward */}
      <ellipse cx="58" cy="78" rx="26" ry="29" fill={`url(#${uid}-body)`} transform="rotate(8 58 78)" />
      <clipPath id={`${uid}-sideclip`}>
        <ellipse cx="58" cy="78" rx="26" ry="29" transform="rotate(8 58 78)" />
      </clipPath>
      <g clipPath={`url(#${uid}-sideclip)`}>
        <rect x="26" y="62" width="64" height="9" rx="4.5" fill={INK} transform="rotate(8 58 78)" />
        <rect x="26" y="80" width="64" height="9" rx="4.5" fill={INK} transform="rotate(8 58 78)" />
        <rect x="26" y="98" width="64" height="9" rx="4.5" fill={INK} transform="rotate(8 58 78)" />
      </g>
      {/* stinger pointing back */}
      <path d="M35 92 l-11 3 6 -9 z" fill={INK} />
      {/* head toward the front (right) */}
      <circle cx="70" cy="40" r="22" fill={`url(#${uid}-head)`} />
      <circle cx="60" cy="49" r="4.4" fill="#ff8fb0" opacity="0.6" />
      {/* single eye */}
      <circle cx="76" cy="39" r="7.4" fill="#fff" />
      <circle cx="78" cy="40" r="3.8" fill={INK} />
      <circle cx="79.4" cy="38.5" r="1.3" fill="#fff" />
      {/* smile toward front */}
      <path d="M74 51 q6 4 11 1" fill="none" stroke={INK} strokeWidth="2.1" strokeLinecap="round" />
      {/* one pair of antennae leaning forward */}
      <g stroke={INK} strokeWidth="2" fill="none" strokeLinecap="round">
        <path d="M68 20 q4 -9 12 -12" />
        <path d="M74 20 q6 -8 14 -10" />
      </g>
      <circle cx="80" cy="7" r="3" fill={INK} />
      <circle cx="88" cy="9" r="3" fill={INK} />
      {/* cap sits on top, brim toward front */}
      <path d="M50 30 q20 -25 42 -4 z" fill={`url(#${uid}-cap)`} />
      <path d="M78 27 h14 q6 1 3 6 l-1 1 q-8 -3 -16 -3 z" fill={GREEN_LT} />
      <polygon points="62,19 66,21 66,27 62,29 58,27 58,21" fill={HONEY} stroke={GREEN_DK} strokeWidth="0.8" />
    </>
  )
  return dir === 1 ? inner : <g transform="translate(120 0) scale(-1 1)">{inner}</g>
}

/* ---- Back view --------------------------------------------------------- */
function Back({ uid }: { uid: string }) {
  return (
    <>
      <ellipse cx="60" cy="112" rx="26" ry="4.5" fill="rgba(20,19,10,0.10)" />
      {/* wings spread wide */}
      <Wing cx={38} cy={42} rot={-30} uid={uid} rx={16} ry={24} />
      <Wing cx={82} cy={42} rot={30} uid={uid} rx={16} ry={24} />
      {/* body from behind */}
      <ellipse cx="60" cy="76" rx="28" ry="30" fill={`url(#${uid}-body)`} />
      <clipPath id={`${uid}-backclip`}>
        <ellipse cx="60" cy="76" rx="28" ry="30" />
      </clipPath>
      <g clipPath={`url(#${uid}-backclip)`}>
        <rect x="28" y="60" width="64" height="9" rx="4.5" fill={INK} />
        <rect x="28" y="78" width="64" height="9" rx="4.5" fill={INK} />
        <rect x="28" y="96" width="64" height="9" rx="4.5" fill={INK} />
        {/* soft spine highlight */}
        <rect x="58" y="50" width="4" height="56" rx="2" fill="#ffffff" opacity="0.10" />
      </g>
      <path d="M60 105 l6 10 -12 0 z" fill={INK} />
      <Collar y={54} />
      {/* back of head — no face */}
      <circle cx="60" cy="40" r="23" fill={`url(#${uid}-head)`} />
      <ellipse cx="60" cy="46" rx="16" ry="12" fill={HONEY_DK} opacity="0.18" />
      {/* antennae tips poke above the cap */}
      <g stroke={INK} strokeWidth="2" fill="none" strokeLinecap="round">
        <path d="M52 20 q-3 -8 -8 -13" />
        <path d="M68 20 q3 -8 8 -13" />
      </g>
      <circle cx="44" cy="6" r="3" fill={INK} />
      <circle cx="76" cy="6" r="3" fill={INK} />
      <Cap uid={uid} back />
    </>
  )
}

export function Bee({ size = 96, view = 'front' }: { size?: number; view?: BeeView }) {
  const uid = 'b' + view
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" role="img" aria-label="Buzz the bee">
      <Defs uid={uid} />
      {view === 'front' && <Front uid={uid} />}
      {view === 'right' && <Side uid={uid} dir={1} />}
      {view === 'left' && <Side uid={uid} dir={-1} />}
      {view === 'back' && <Back uid={uid} />}
    </svg>
  )
}

const VIEWS: { view: BeeView; label: string }[] = [
  { view: 'front', label: 'Front' },
  { view: 'right', label: 'Side' },
  { view: 'back', label: 'Back' },
  { view: 'left', label: 'Side' },
]

/** Model-sheet turnaround: Buzz from four angles. */
export function BuzzTurnaround({ size = 78 }: { size?: number }) {
  return (
    <div className="turnaround">
      {VIEWS.map((v) => (
        <div key={v.view} className="turnaround__cell">
          <Bee size={size} view={v.view} />
          <span className="turnaround__label">{v.label}</span>
        </div>
      ))}
    </div>
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
