import { useRef } from "react"
import { Eyebrow } from "@/components/site/eyebrow"
import { STATS } from "@/lib/content"
import { gsap, MQ, useGSAP } from "@/lib/gsap"

const fmt = (n: number, decimals: number) =>
  new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n)

export function Stats() {
  const scope = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MQ.motion, () => {
        gsap.utils.toArray<HTMLElement>(".stat-value", scope.current).forEach((el, i) => {
          const target = Number(el.dataset.value)
          const decimals = Number(el.dataset.decimals)
          const counter = { v: 0 }
          el.textContent = fmt(0, decimals)
          gsap.to(counter, {
            v: target,
            duration: 2.4,
            delay: i * 0.12,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 88%", once: true },
            onUpdate: () => {
              el.textContent = fmt(counter.v, decimals)
            },
          })
        })

        gsap.from(".stat-rule", {
          scaleX: 0,
          transformOrigin: "left center",
          duration: 1.4,
          ease: "expo.out",
          stagger: 0.12,
          scrollTrigger: { trigger: ".stat-grid", start: "top 85%", once: true },
        })
      })
    },
    { scope }
  )

  return (
    <section ref={scope} id="datos" aria-labelledby="datos-title" className="gutter-x section-y relative">
      <div className="mx-auto max-w-[88rem]">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Eyebrow index="04">El lugar en números</Eyebrow>
          </div>
          <h2
            id="datos-title"
            className="font-display-wonk text-[clamp(2.4rem,4.8vw,4.75rem)] leading-[0.95] font-light tracking-[-0.035em] lg:col-span-8"
          >
            No es poesía: <em className="text-ember">es física.</em> El aire seco y quieto de
            la Puna es lo más parecido a estar en órbita sin despegar.
          </h2>
        </div>

        <dl className="stat-grid mt-16 grid gap-x-8 gap-y-14 sm:grid-cols-2 md:mt-24 xl:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="relative pt-7">
              <span aria-hidden="true" className="stat-rule absolute inset-x-0 top-0 h-px bg-line" />
              <dt className="eyebrow text-muted-foreground">{s.label}</dt>
              <dd className="mt-5">
                <span className="flex items-baseline gap-3">
                  <span
                    className="stat-value font-display-wonk text-[clamp(4rem,8vw,7.5rem)] leading-[0.85] font-light tracking-[-0.05em] tabular-nums"
                    data-value={s.value}
                    data-decimals={s.decimals}
                  >
                    {fmt(s.value, s.decimals)}
                  </span>
                  <span className="eyebrow text-amber">{s.unit}</span>
                </span>
                <span className="mt-5 block max-w-[18rem] text-sm leading-relaxed text-dust/65">{s.note}</span>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
