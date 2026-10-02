import { useMemo } from "react"

/* Ilustraciones lineales generativas para las tarjetas de experiencias.
   Paleta del DNA: dust, ember, amber, ice. */

function rng(seed: number) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function Backdrop({ seed, count = 70 }: { seed: number; count?: number }) {
  const dots = useMemo(() => {
    const r = rng(seed)
    return Array.from({ length: count }, () => ({
      x: r() * 400,
      y: r() * 300,
      r: 0.4 + r() * 0.9,
      o: 0.15 + r() * 0.45,
    }))
  }, [seed, count])
  return (
    <g>
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={d.r} fill="#efe7d6" opacity={d.o} />
      ))}
    </g>
  )
}

/* E/01 — Cruz del Sur con los Punteros y el láser del guía */
export function ConstellationArt() {
  const stars = [
    { id: "Gacrux", x: 196, y: 64, r: 3.4, c: "#ffc06e" },
    { id: "Acrux", x: 214, y: 214, r: 4.2, c: "#9cc2ff" },
    { id: "Mimosa", x: 136, y: 138, r: 3.8, c: "#9cc2ff" },
    { id: "Imai", x: 266, y: 124, r: 2.8, c: "#efe7d6" },
    { id: "Ginan", x: 240, y: 168, r: 1.8, c: "#efe7d6" },
    { id: "Rigil Kent", x: 352, y: 248, r: 4.6, c: "#ffc06e" },
    { id: "Hadar", x: 318, y: 196, r: 4, c: "#9cc2ff" },
  ]
  const s = Object.fromEntries(stars.map((st) => [st.id, st]))
  return (
    <svg viewBox="0 0 400 300" className="h-full w-full" aria-hidden="true">
      <Backdrop seed={3} />
      <g stroke="#efe7d6" strokeOpacity="0.35" strokeWidth="1">
        <line x1={s.Gacrux.x} y1={s.Gacrux.y} x2={s.Acrux.x} y2={s.Acrux.y} />
        <line x1={s.Mimosa.x} y1={s.Mimosa.y} x2={s.Imai.x} y2={s.Imai.y} />
        <line x1={s["Rigil Kent"].x} y1={s["Rigil Kent"].y} x2={s.Hadar.x} y2={s.Hadar.y} strokeDasharray="2 5" />
      </g>
      <line x1="18" y1="300" x2={s.Acrux.x - 3} y2={s.Acrux.y + 3} stroke="#ff7a3d" strokeWidth="1.4" strokeDasharray="1 0" opacity="0.9" />
      <line x1="18" y1="300" x2={s.Acrux.x - 3} y2={s.Acrux.y + 3} stroke="#ff7a3d" strokeWidth="6" opacity="0.12" />
      {stars.map((st) => (
        <g key={st.id}>
          <circle cx={st.x} cy={st.y} r={st.r * 3.2} fill={st.c} opacity="0.12" />
          <circle cx={st.x} cy={st.y} r={st.r} fill={st.c} />
        </g>
      ))}
      <text x={s.Gacrux.x + 12} y={s.Gacrux.y - 6} fill="#efe7d6" fillOpacity="0.55" fontSize="9" fontFamily="JetBrains Mono Variable, monospace" letterSpacing="1.5">
        CRUX
      </text>
      <text x={s.Hadar.x - 44} y={s.Hadar.y - 14} fill="#efe7d6" fillOpacity="0.45" fontSize="9" fontFamily="JetBrains Mono Variable, monospace" letterSpacing="1.5">
        α β CEN
      </text>
    </svg>
  )
}

/* E/02 — trazos estelares alrededor del polo sur celeste */
export function StarTrailsArt() {
  const arcs = useMemo(() => {
    const r = rng(21)
    const cx = 286
    const cy = 250
    const out: { d: string; c: string; o: number; w: number }[] = []
    const colors = ["#9cc2ff", "#efe7d6", "#ffc06e", "#ff7a3d"]
    for (let rad = 10; rad < 420; rad += 3.5 + r() * 4) {
      const start = r() * Math.PI * 2
      const sweep = 0.45 + r() * 0.55
      const x1 = cx + rad * Math.cos(start)
      const y1 = cy + rad * Math.sin(start)
      const x2 = cx + rad * Math.cos(start + sweep)
      const y2 = cy + rad * Math.sin(start + sweep)
      out.push({
        d: `M${x1.toFixed(1)} ${y1.toFixed(1)}A${rad} ${rad} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`,
        c: colors[(r() * colors.length) | 0],
        o: 0.2 + r() * 0.6,
        w: 0.5 + r() * 0.9,
      })
    }
    return out
  }, [])
  return (
    <svg viewBox="0 0 400 300" className="h-full w-full" aria-hidden="true">
      <g fill="none" strokeLinecap="round">
        {arcs.map((a, i) => (
          <path key={i} d={a.d} stroke={a.c} strokeOpacity={a.o} strokeWidth={a.w} />
        ))}
      </g>
      <circle cx="286" cy="250" r="2" fill="#efe7d6" />
      <path d="M0 262 L60 248 L118 256 L170 236 L214 244 L262 226 L300 238 L352 230 L400 240 L400 300 L0 300 Z" fill="#05060a" />
      <g stroke="#efe7d6" strokeOpacity="0.7" strokeWidth="1.2" fill="none">
        <line x1="96" y1="250" x2="86" y2="276" />
        <line x1="96" y1="250" x2="106" y2="276" />
        <line x1="96" y1="250" x2="96" y2="278" />
        <rect x="88" y="238" width="16" height="11" rx="2" fill="#05060a" />
        <circle cx="96" cy="243.5" r="2.6" />
      </g>
    </svg>
  )
}

/* E/03 — domo geodésico (hemisferio proyectado con anillos alternados) */
export function DomeArt() {
  const { front, back } = useMemo(() => {
    const R = 118
    const cx = 200
    const cy = 252
    const tilt = (14 * Math.PI) / 180
    const rings = [
      { phi: 0, n: 10, off: 0 },
      { phi: 24, n: 10, off: 0.5 },
      { phi: 48, n: 10, off: 0 },
      { phi: 70, n: 5, off: 0.5 },
      { phi: 90, n: 1, off: 0 },
    ]
    const pts = rings.map(({ phi, n, off }) => {
      const p = (phi * Math.PI) / 180
      return Array.from({ length: n }, (_, i) => {
        const th = ((i + off) / n) * Math.PI * 2
        const x = R * Math.cos(p) * Math.cos(th)
        const y = R * Math.sin(p)
        const z = R * Math.cos(p) * Math.sin(th)
        return {
          sx: cx + x,
          sy: cy - y * Math.cos(tilt) + z * Math.sin(tilt),
          depth: z * Math.cos(tilt) + y * Math.sin(tilt),
          th,
        }
      })
    })
    const edges: { x1: number; y1: number; x2: number; y2: number; d: number }[] = []
    const add = (a: (typeof pts)[0][0], b: (typeof pts)[0][0]) =>
      edges.push({ x1: a.sx, y1: a.sy, x2: b.sx, y2: b.sy, d: (a.depth + b.depth) / 2 })
    const angDist = (a: number, b: number) => {
      const d = Math.abs(a - b) % (Math.PI * 2)
      return Math.min(d, Math.PI * 2 - d)
    }
    pts.forEach((ring, k) => {
      if (ring.length > 1) ring.forEach((p, i) => add(p, ring[(i + 1) % ring.length]))
      const next = pts[k + 1]
      if (!next) return
      ring.forEach((p) => {
        const sorted = [...next].sort((a, b) => angDist(a.th, p.th) - angDist(b.th, p.th))
        sorted.slice(0, Math.min(2, next.length)).forEach((q) => add(p, q))
      })
    })
    return { front: edges.filter((e) => e.d >= -4), back: edges.filter((e) => e.d < -4) }
  }, [])

  return (
    <svg viewBox="0 0 400 300" className="h-full w-full" aria-hidden="true">
      <Backdrop seed={9} count={60} />
      <ellipse cx="200" cy="252" rx="150" ry="18" fill="#ff7a3d" opacity="0.07" />
      <g stroke="#efe7d6" strokeLinecap="round">
        {back.map((e, i) => (
          <line key={`b${i}`} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} strokeOpacity="0.12" strokeWidth="0.8" />
        ))}
        {front.map((e, i) => (
          <line key={`f${i}`} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} strokeOpacity="0.62" strokeWidth="1.1" />
        ))}
      </g>
      <path d="M186 281 L186 262 Q200 248 214 262 L214 281 Z" fill="#ffc06e" opacity="0.85" />
      <path d="M186 281 L186 262 Q200 248 214 262 L214 281 Z" fill="#ff7a3d" opacity="0.4" filter="blur(6px)" />
      <line x1="20" y1="282" x2="380" y2="282" stroke="#efe7d6" strokeOpacity="0.25" />
    </svg>
  )
}
