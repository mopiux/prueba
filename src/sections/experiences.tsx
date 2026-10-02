import { useRef, type ComponentType } from "react"
import { Eyebrow } from "@/components/site/eyebrow"
import { ConstellationArt, DomeArt, StarTrailsArt } from "@/components/site/illustrations"
import { useMagnetic } from "@/hooks/use-magnetic"
import { EXPERIENCES, formatUSD, type Experience, type ExperienceId } from "@/lib/content"
import { gsap, MQ, useGSAP } from "@/lib/gsap"

const ART: Record<ExperienceId, ComponentType> = {
  observacion: ConstellationArt,
  astrofoto: StarTrailsArt,
  domo: DomeArt,
}

function ExperienceCard({
  xp,
  onChoose,
}: {
  xp: Experience
  onChoose: (id: ExperienceId) => void
}) {
  const ref = useRef<HTMLElement>(null)
  useMagnetic(ref, { strength: 10, tilt: 4, inner: ".xp-art", innerStrength: 12 })
  const Art = ART[xp.id]

  return (
    <article
      ref={ref}
      aria-labelledby={`xp-${xp.id}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-[1.25rem] border border-line bg-night/80 shadow-[inset_0_1px_0_0_rgb(239_231_214/0.06)] transition-colors duration-500 [--mx:50%] [--my:30%] hover:border-ember/35"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(520px circle at var(--mx) var(--my), rgb(255 122 61 / 0.13), transparent 60%)",
        }}
      />
      <div className="relative aspect-[4/3] overflow-hidden border-b border-line bg-[radial-gradient(120%_90%_at_70%_20%,#10142a_0%,#05060a_70%)]">
        <div className="xp-art absolute inset-[-6%]">
          <Art />
        </div>
      </div>

      <div className="relative z-10 flex flex-1 flex-col p-6 md:p-7">
        <div className="eyebrow flex items-center justify-between text-muted-foreground">
          <span className="text-ember">{xp.code}</span>
          <span>{xp.kicker}</span>
        </div>
        <h3
          id={`xp-${xp.id}`}
          className="font-display-wonk mt-5 text-[clamp(2rem,2.7vw,2.6rem)] leading-[0.95] font-light tracking-[-0.03em]"
        >
          {xp.name}
        </h3>
        <p className="mt-4 text-[0.98rem] leading-relaxed text-dust/70">{xp.description}</p>
        <ul className="mt-6 space-y-2.5 text-sm text-dust/85">
          {xp.features.map((f) => (
            <li key={f} className="flex gap-3">
              <span aria-hidden="true" className="text-amber">✦</span>
              {f}
            </li>
          ))}
        </ul>

        <div className="mt-auto pt-8">
          <dl className="grid grid-cols-3 gap-3 border-t border-line pt-6 text-sm">
            <div>
              <dt className="eyebrow text-muted-foreground">Duración</dt>
              <dd className="mt-2 text-dust">{xp.duration}</dd>
            </div>
            <div>
              <dt className="eyebrow text-muted-foreground">Grupo</dt>
              <dd className="mt-2 text-dust">{xp.groupShort}</dd>
            </div>
            <div>
              <dt className="eyebrow text-muted-foreground">Desde</dt>
              <dd className="mt-2 text-dust">
                {formatUSD(xp.price)}
                <span className="block text-xs text-muted-foreground">por {xp.priceUnit}</span>
              </dd>
            </div>
          </dl>
        </div>

        <button
          type="button"
          onClick={() => onChoose(xp.id)}
          className="mt-7 inline-flex cursor-pointer items-center justify-between rounded-full border border-dust/15 px-5 py-3 text-sm text-dust transition-colors hover:border-ember hover:bg-ember hover:text-primary-foreground"
        >
          Elegir esta experiencia
          <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">→</span>
        </button>
      </div>
    </article>
  )
}

export function Experiences({ onChoose }: { onChoose: (id: ExperienceId) => void }) {
  const scope = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MQ.motion, () => {
        gsap.from(".xp-reveal", {
          y: 80,
          opacity: 0,
          duration: 1.2,
          ease: "expo.out",
          stagger: 0.12,
          scrollTrigger: { trigger: ".xp-grid", start: "top 82%", once: true },
        })
      })
    },
    { scope }
  )

  return (
    <section ref={scope} id="experiencias" aria-labelledby="xp-title" className="gutter-x section-y relative">
      <div className="mx-auto max-w-[88rem]">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <Eyebrow index="03">Experiencias</Eyebrow>
            <h2
              id="xp-title"
              className="font-display-wonk mt-7 text-[clamp(2.75rem,6.2vw,6.25rem)] leading-[0.9] font-light tracking-[-0.04em]"
            >
              Tres maneras de <em className="text-ember">quedarte despierto.</em>
            </h2>
          </div>
          <p className="max-w-[30rem] text-[1.05rem] leading-relaxed text-dust/70 lg:col-span-5 lg:justify-self-end">
            Todas incluyen traslado desde Salta capital, ropa de altura y un astrónomo
            que conoce cada estrella por su nombre. Vos sólo traé ganas de mirar para arriba.
          </p>
        </div>

        <div className="xp-grid mt-16 grid gap-5 md:mt-20 lg:grid-cols-3 lg:gap-6">
          {EXPERIENCES.map((xp) => (
            <div key={xp.id} className="xp-reveal">
              <ExperienceCard xp={xp} onChoose={onChoose} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
