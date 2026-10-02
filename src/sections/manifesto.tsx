import { useRef } from "react"
import { Eyebrow } from "@/components/site/eyebrow"
import { gsap, MQ, useGSAP } from "@/lib/gsap"
import { cn } from "@/lib/utils"

const TEXT: { t: string; accent?: boolean }[] = [
  { t: "Órbita nace de una idea simple: ver el cielo de verdad no debería ser un privilegio de astrónomos. Por eso subimos telescopios, cámaras y un domo a 4.180 metros, a cien kilómetros de la luz artificial más cercana, para que pases una noche entera" },
  { t: "mirando para arriba.", accent: true },
]

export function Manifesto() {
  const scope = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MQ.motion, () => {
        gsap.fromTo(
          ".mf-word",
          { opacity: 0.14 },
          {
            opacity: 1,
            ease: "none",
            stagger: 0.08,
            scrollTrigger: {
              trigger: ".mf-text",
              start: "top 78%",
              end: "bottom 45%",
              scrub: true,
            },
          }
        )
      })
    },
    { scope }
  )

  return (
    <section ref={scope} id="manifiesto" aria-label="Manifiesto" className="gutter-x section-y relative">
      <div className="mx-auto grid max-w-[88rem] gap-10 lg:grid-cols-12">
        <div className="lg:col-span-3">
          <Eyebrow index="01">Manifiesto</Eyebrow>
        </div>
        <p className="mf-text font-display-wonk text-[clamp(1.85rem,3.7vw,3.75rem)] leading-[1.1] font-light tracking-[-0.022em] lg:col-span-9">
          {TEXT.map((chunk, ci) =>
            chunk.t.split(" ").map((word, wi) => (
              <span
                key={`${ci}-${wi}`}
                className={cn("mf-word", chunk.accent && "italic text-ember")}
              >
                {word}{" "}
              </span>
            ))
          )}
        </p>
      </div>
    </section>
  )
}
