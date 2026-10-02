import { useMemo, useRef, type CSSProperties } from "react"
import { Eyebrow } from "@/components/site/eyebrow"
import { INTRO_SKY, PHASES } from "@/lib/content"
import { gsap, MQ, ScrollTrigger, useGSAP } from "@/lib/gsap"

type Star = { x: number; y: number; s: number; o: number; g: number }

function seeded(seed: number) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function makeStars(count: number, seed: number, yMax: number): Star[] {
  const rnd = seeded(seed)
  return Array.from({ length: count }, () => {
    const big = rnd() < 0.08
    return {
      x: rnd() * 100,
      y: Math.pow(rnd(), 1.25) * yMax,
      s: big ? 2 + rnd() * 1.2 : 0.8 + rnd() * 1.1,
      o: big ? 0.85 : 0.3 + rnd() * 0.55,
      g: (rnd() * 3) | 0,
    }
  })
}

/* estrellas concentradas sobre la banda de la Vía Láctea (distribución ~gaussiana) */
function makeBandStars(count: number, seed: number): Star[] {
  const rnd = seeded(seed)
  return Array.from({ length: count }, () => {
    const gy = (rnd() + rnd() + rnd() - 1.5) / 1.5
    return {
      x: rnd() * 100,
      y: 50 + gy * 42,
      s: 0.6 + rnd() * 1.1,
      o: 0.25 + rnd() * 0.6,
      g: (rnd() * 3) | 0,
    }
  })
}

const SKIES = [INTRO_SKY, ...PHASES.map((p) => p.sky)]
/* valor de cada capa en cada parada: intro, atardecer, hora azul, vía láctea, amanecer */
const STARS_OP = [0, 0.08, 0.55, 1, 0.12]
const MILKY_OP = [0, 0, 0.08, 1, 0]
const SUN_X = [76, 70, 64, 58, 84]
const SUN_Y = [79, 83, 95, 112, 81]
const SUN_OP = [1, 1, 0.6, 0, 1]

export function NightPhases() {
  const sectionRef = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const stars = useMemo(() => makeStars(170, 7, 72), [])
  const bandStars = useMemo(() => makeBandStars(320, 11), [])

  useGSAP(
    () => {
      const section = sectionRef.current
      const track = trackRef.current
      if (!section || !track) return
      const mm = gsap.matchMedia()

      mm.add(MQ.motion, () => {
        const panels = gsap.utils.toArray<HTMLElement>(".phase-panel", track)
        const labels = gsap.utils.toArray<HTMLElement>(".phase-label", section)
        const distance = () => Math.max(0, track.scrollWidth - window.innerWidth)

        // progreso (0–1) en el que cada panel queda centrado: paradas de color
        let keys: number[] = []
        const computeKeys = () => {
          const d = distance() || 1
          keys = panels.map((p) =>
            gsap.utils.clamp(0, 1, (p.offsetLeft + p.offsetWidth / 2 - window.innerWidth / 2) / d)
          )
          keys[0] = 0
          keys[keys.length - 1] = 1
        }

        const lerpStops = <T,>(values: T[], p: number, mix: (a: T, b: T, t: number) => T) => {
          for (let i = 1; i < keys.length; i++) {
            if (p <= keys[i]) {
              const span = keys[i] - keys[i - 1] || 1
              return mix(values[i - 1], values[i], (p - keys[i - 1]) / span)
            }
          }
          return values[values.length - 1]
        }
        const mixColor = (a: string, b: string, t: number) => gsap.utils.interpolate(a, b, t)
        const mixNum = (a: number, b: number, t: number) => a + (b - a) * t

        let active = -1
        const apply = (p: number) => {
          const s = section.style
          s.setProperty("--sky-top", lerpStops(SKIES.map((k) => k.top), p, mixColor))
          s.setProperty("--sky-mid", lerpStops(SKIES.map((k) => k.mid), p, mixColor))
          s.setProperty("--sky-bottom", lerpStops(SKIES.map((k) => k.bottom), p, mixColor))
          s.setProperty("--stars", String(lerpStops(STARS_OP, p, mixNum)))
          s.setProperty("--milky", String(lerpStops(MILKY_OP, p, mixNum)))
          s.setProperty("--sun-x", `${lerpStops(SUN_X, p, mixNum)}%`)
          s.setProperty("--sun-y", `${lerpStops(SUN_Y, p, mixNum)}%`)
          s.setProperty("--sun-o", String(lerpStops(SUN_OP, p, mixNum)))
          s.setProperty("--progress", String(p))

          let nearest = 0
          for (let i = 1; i < keys.length; i++) {
            if (Math.abs(keys[i] - p) < Math.abs(keys[nearest] - p)) nearest = i
          }
          if (nearest !== active) {
            active = nearest
            labels.forEach((l, i) => (l.dataset.active = String(i + 1 === nearest)))
            section.dataset.phase = String(nearest)
          }
        }

        const tween = gsap.to(track, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: section,
            pin: true,
            scrub: 1,
            start: "top top",
            end: () => `+=${distance()}`,
            invalidateOnRefresh: true,
            anticipatePin: 1,
            snap: {
              snapTo: (v: number) => keys.reduce((a, b) => (Math.abs(b - v) < Math.abs(a - v) ? b : a), 0),
              inertia: false,
              duration: { min: 0.25, max: 0.7 },
              delay: 0.12,
              ease: "power2.inOut",
            },
            onRefresh: (self) => {
              computeKeys()
              apply(self.progress)
            },
            onUpdate: (self) => apply(self.progress),
          },
        })

        computeKeys()
        apply(0)

        // cada panel entra con un pequeño desfasaje (containerAnimation)
        panels.slice(1).forEach((panel) => {
          gsap.from(panel.querySelectorAll(".phase-reveal"), {
            x: 90,
            opacity: 0,
            ease: "power3.out",
            stagger: 0.06,
            scrollTrigger: {
              trigger: panel,
              containerAnimation: tween,
              start: "left 85%",
              end: "left 40%",
              scrub: true,
            },
          })
          gsap.fromTo(
            panel.querySelector(".phase-ghost"),
            { xPercent: 30 },
            {
              xPercent: -30,
              ease: "none",
              scrollTrigger: {
                trigger: panel,
                containerAnimation: tween,
                start: "left right",
                end: "right left",
                scrub: true,
              },
            }
          )
        })

        return () => {
          section.removeAttribute("style")
        }
      })

      return () => mm.revert()
    },
    { scope: sectionRef }
  )

  // recalcular cuando cargan las tipografías (cambia el ancho del track)
  useGSAP(() => {
    void document.fonts?.ready.then(() => ScrollTrigger.refresh())
  })

  const initialSky = {
    "--sky-top": INTRO_SKY.top,
    "--sky-mid": INTRO_SKY.mid,
    "--sky-bottom": INTRO_SKY.bottom,
    "--stars": 0,
    "--milky": 0,
    "--sun-x": "76%",
    "--sun-y": "79%",
    "--sun-o": 1,
    "--progress": 0,
  } as CSSProperties

  return (
    <section
      ref={sectionRef}
      id="noche"
      aria-labelledby="noche-title"
      className="phases-pin relative h-svh min-h-[560px] overflow-hidden bg-void"
      style={initialSky}
    >
      {/* ---------- cielo ---------- */}
      <div aria-hidden="true" className="phases-sky-layer pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,var(--sky-top)_0%,var(--sky-mid)_58%,var(--sky-bottom)_100%)]" />

        <div className="absolute inset-0" style={{ opacity: "var(--stars)" }}>
          {stars.map((s, i) => (
            <span
              key={i}
              className={`absolute rounded-full bg-dust ${s.g === 0 ? "phase-twinkle" : ""}`}
              style={{
                left: `${s.x}%`,
                top: `${s.y}%`,
                width: s.s,
                height: s.s,
                opacity: s.o,
                animationDelay: `${(i % 7) * -0.6}s`,
              }}
            />
          ))}
        </div>

        <div className="absolute inset-0" style={{ opacity: "var(--milky)" }}>
          <div className="absolute top-[34%] left-1/2 h-[38%] w-[170%] -translate-x-1/2 -translate-y-1/2 -rotate-[24deg]">
            <div className="absolute inset-0 bg-[radial-gradient(50%_50%_at_50%_50%,rgb(239_231_214/0.34)_0%,rgb(156_194_255/0.16)_40%,transparent_72%)] blur-2xl" />
            <div className="absolute inset-x-[10%] inset-y-[30%] bg-[radial-gradient(50%_50%_at_50%_50%,rgb(239_231_214/0.22)_0%,transparent_70%)] blur-xl" />
            <div className="absolute inset-y-[12%] left-[40%] w-[20%] bg-[radial-gradient(closest-side,rgb(255_192_110/0.28),transparent)] blur-2xl" />
            <div className="absolute inset-x-0 top-[45%] h-[9%] bg-[linear-gradient(90deg,transparent,rgb(5_6_10/0.7)_30%,rgb(5_6_10/0.55)_60%,transparent)] blur-lg" />
            {bandStars.map((s, i) => (
              <span
                key={i}
                className="absolute rounded-full bg-dust"
                style={{
                  left: `${s.x}%`,
                  top: `${s.y}%`,
                  width: s.s,
                  height: s.s,
                  opacity: s.o,
                }}
              />
            ))}
          </div>
        </div>

        <div
          className="absolute grid size-[clamp(16rem,24vw,24rem)] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[radial-gradient(closest-side,rgb(255_122_61/0.38),rgb(255_122_61/0.12)_45%,transparent)]"
          style={{ left: "var(--sun-x)", top: "var(--sun-y)", opacity: "var(--sun-o)" }}
        >
          <div className="size-[clamp(4.25rem,7vw,7rem)] rounded-full bg-[radial-gradient(circle,#fff3dc_0%,#ffc06e_40%,#ff7a3d_72%,#ff7a3d_100%)]" />
        </div>

        <svg
          className="absolute inset-x-0 bottom-0 h-[30%] w-full"
          viewBox="0 0 1440 320"
          preserveAspectRatio="xMidYMax slice"
        >
          <path
            d="M0 214 L120 196 L210 152 L262 126 L300 146 L380 186 L470 172 L560 118 L612 90 L642 84 L672 94 L734 134 L822 168 L902 158 L982 128 L1032 108 L1084 122 L1162 164 L1242 178 L1322 148 L1382 138 L1440 156 L1440 320 L0 320 Z"
            style={{ fill: "color-mix(in oklab, var(--sky-bottom) 24%, #09080f)" }}
          />
          <rect x="0" y="236" width="1440" height="3" style={{ fill: "color-mix(in oklab, var(--sky-bottom) 40%, transparent)" }} />
          <path
            d="M0 258 L90 248 L180 260 L300 238 L420 253 L520 234 L640 246 L760 228 L880 244 L1000 236 L1120 250 L1240 234 L1340 246 L1440 238 L1440 320 L0 320 Z"
            fill="#04050a"
          />
        </svg>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgb(5_6_10/0.55),transparent_55%)]" />
      </div>

      {/* ---------- HUD de progreso ---------- */}
      <div className="gutter-x pointer-events-none absolute inset-x-0 top-20 z-20 md:top-24 motion-reduce:hidden">
        <div className="mx-auto max-w-[88rem]">
          <div className="flex items-center justify-between gap-6">
            <Eyebrow index="02" className="text-dust/70">
              Una noche en Órbita
            </Eyebrow>
            <ol className="hidden gap-8 lg:flex">
              {PHASES.map((p) => (
                <li
                  key={p.id}
                  data-active="false"
                  className="phase-label eyebrow text-dust/40 transition-colors duration-500 data-[active=true]:text-dust"
                >
                  <span className="mr-2 text-ember/80">{p.time}</span>
                  {p.name}
                  {p.accent}
                </li>
              ))}
            </ol>
          </div>
          <div className="mt-4 h-px w-full bg-dust/15">
            <div className="h-px w-full origin-left bg-ember" style={{ transform: "scaleX(var(--progress))" }} />
          </div>
        </div>
      </div>

      {/* ---------- paneles ---------- */}
      <div ref={trackRef} className="phases-track relative z-10 flex h-full w-max will-change-transform">
        <div
          className="phase-panel gutter-x flex h-full w-screen shrink-0 items-center md:w-[56vw]"
          style={{ "--panel-sky": `linear-gradient(to bottom, ${INTRO_SKY.top}, ${INTRO_SKY.mid} 60%, ${INTRO_SKY.bottom})` } as CSSProperties}
        >
          <div className="max-w-[34rem] md:ml-[max(0px,calc((100vw-88rem)/2))]">
            <h2
              id="noche-title"
              className="font-display-wonk text-[clamp(3rem,7vw,7rem)] leading-[0.9] font-light tracking-[-0.04em]"
            >
              Una noche,
              <br />
              <em className="text-amber">cuatro cielos.</em>
            </h2>
            <p className="mt-8 max-w-[28rem] text-[1.05rem] leading-relaxed text-dust/80">
              De las siete de la tarde a las siete de la mañana, el cielo de la Puna
              cambia de piel cuatro veces. Seguí bajando y mirá cómo se apaga el día.
            </p>
            <p className="eyebrow mt-10 flex items-center gap-3 text-dust/60 motion-reduce:hidden">
              <span aria-hidden="true" className="inline-block h-px w-10 bg-dust/40" />
              Scrolleá
            </p>
          </div>
        </div>

        {PHASES.map((p) => (
          <article
            key={p.id}
            aria-labelledby={`fase-${p.id}`}
            className="phase-panel gutter-x relative flex h-full w-screen shrink-0 items-center md:w-[64vw]"
            style={{ "--panel-sky": `linear-gradient(to bottom, ${p.sky.top}, ${p.sky.mid} 60%, ${p.sky.bottom})` } as CSSProperties}
          >
            <span
              aria-hidden="true"
              className="phase-ghost font-display-wonk pointer-events-none absolute right-[4vw] bottom-[16%] text-[clamp(10rem,30vw,26rem)] leading-none font-light text-transparent [-webkit-text-stroke:1px_rgb(239_231_214/0.16)]"
            >
              {p.index}
            </span>
            <div className="relative max-w-[36rem] [text-shadow:0_1px_24px_rgb(5_6_10/0.45)]">
              <p className="phase-reveal eyebrow flex items-center gap-3 text-dust/75">
                <span className="text-ember">{p.index}</span>
                <span aria-hidden="true" className="h-px w-6 bg-dust/30" />
                <span>{p.time} h</span>
              </p>
              <h3
                id={`fase-${p.id}`}
                className="phase-reveal font-display-wonk mt-6 text-[clamp(3.2rem,8.5vw,8.5rem)] leading-[0.88] font-light tracking-[-0.045em]"
              >
                {p.name}
                <em className="pr-[0.05em] text-amber">{p.accent}</em>
              </h3>
              <p className="phase-reveal mt-7 max-w-[30rem] text-[1.02rem] leading-relaxed text-dust/85">
                {p.text}
              </p>
              <ul className="phase-reveal mt-8 flex flex-wrap gap-2">
                {p.sights.map((s) => (
                  <li
                    key={s}
                    className="rounded-full border border-dust/20 bg-void/25 px-3.5 py-1.5 text-[0.8rem] text-dust/85 backdrop-blur-sm"
                  >
                    <span aria-hidden="true" className="mr-1.5 text-amber">✦</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
