import { useRef } from "react"
import { ArrowDownRight } from "lucide-react"
import CodeBackground from "@/components/ui/code-background"
import { useMagnetic } from "@/hooks/use-magnetic"
import { SITE } from "@/lib/content"
import { gsap, MQ, useGSAP } from "@/lib/gsap"
import { cn } from "@/lib/utils"

const TITLE = [
  [{ w: "Apagá" }, { w: "la" }, { w: "ciudad." }],
  [{ w: "Prendé", accent: true }, { w: "el" }, { w: "cielo." }],
]
const TITLE_TEXT = TITLE.map((l) => l.map((x) => x.w).join(" ")).join(" ")

export function Hero() {
  const scope = useRef<HTMLElement>(null)
  const titleRef = useRef<HTMLDivElement>(null)
  const ctaRef = useRef<HTMLAnchorElement>(null)
  useMagnetic(ctaRef, { strength: 8 })

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MQ.motion, () => {
        const tl = gsap.timeline({ delay: 0.2 })
        tl.from(".hero-char", {
          yPercent: 118,
          rotate: 7,
          opacity: 0,
          duration: 1.3,
          ease: "expo.out",
          stagger: 0.032,
        }).from(
          ".hero-fade",
          { y: 22, opacity: 0, duration: 1.1, ease: "power3.out", stagger: 0.09 },
          "-=0.95"
        )

        gsap.to(".hero-inner", {
          yPercent: -14,
          opacity: 0.15,
          ease: "none",
          scrollTrigger: {
            trigger: scope.current,
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        })
      })
    },
    { scope }
  )

  return (
    <section ref={scope} id="top" aria-labelledby="hero-title" className="relative">
      <CodeBackground
        className="h-svh min-h-[620px] w-full"
        keepOutRef={titleRef}
        anchor={{ x: 0.75, y: 0.38 }}
        anchorSmall={{ x: 0.62, y: 0.165 }}
      >
        <div className="cb-content gutter-x hero-inner flex h-full flex-col justify-end pb-[clamp(5.5rem,11vh,8.5rem)] pt-28">
          <div className="mx-auto w-full max-w-[88rem]">
            <div ref={titleRef} className="w-fit">
            <p className="hero-fade eyebrow mb-7 flex flex-wrap items-center gap-x-3 gap-y-2 text-dust/70">
              <span className="inline-block size-1.5 rounded-full bg-ember shadow-[0_0_10px_2px_rgb(255_122_61/0.7)]" />
              Observatorio de cielo profundo
              <span aria-hidden="true" className="h-px w-6 bg-line" />
              Puna de Atacama, Salta
            </p>

            <h1
              id="hero-title"
              aria-label={TITLE_TEXT}
              className="font-display-wonk max-w-[12ch] text-[clamp(3.6rem,10.4vw,10.75rem)] leading-[0.86] font-light tracking-[-0.045em] text-dust"
            >
              {TITLE.map((line, li) => (
                <span
                  key={li}
                  aria-hidden="true"
                  className="-my-[0.14em] block overflow-hidden py-[0.14em]"
                >
                  {line.map((part, wi) => (
                    <span
                      key={wi}
                      className={cn(
                        "mr-[0.2em] inline-block whitespace-nowrap last:mr-0",
                        part.accent && "pr-[0.04em] italic text-ember"
                      )}
                    >
                      {Array.from(part.w).map((ch, ci) => (
                        <span key={ci} className="hero-char inline-block will-change-transform">
                          {ch}
                        </span>
                      ))}
                    </span>
                  ))}
                </span>
              ))}
            </h1>
            </div>

            <div className="mt-10 grid gap-8 md:mt-12 md:grid-cols-[minmax(0,34rem)_1fr] md:items-end">
              <p className="hero-fade max-w-[34rem] text-[clamp(1.05rem,1.35vw,1.3rem)] leading-relaxed text-dust/75">
                Noches de observación y astrofotografía a 4.180 metros, en uno de los
                cielos más secos y oscuros del planeta. Llegás con la última luz y te
                vas con la Vía Láctea en la retina.
              </p>

              <div className="hero-fade grid grid-cols-1 gap-3 min-[420px]:flex min-[420px]:flex-wrap min-[420px]:items-center md:justify-end">
                <a
                  ref={ctaRef}
                  href="#reserva"
                  className="inline-flex h-13 items-center justify-center gap-2.5 rounded-full bg-ember px-7 text-[0.95rem] font-semibold text-primary-foreground shadow-[0_18px_50px_-18px_rgb(255_122_61/0.8)] transition-colors hover:bg-amber"
                >
                  Reservar mi noche
                  <span aria-hidden="true">→</span>
                </a>
                <a
                  href="#noche"
                  className="inline-flex h-13 items-center justify-center gap-2 rounded-full border border-dust/20 px-6 text-[0.95rem] text-dust/85 backdrop-blur-sm transition-colors hover:border-dust/50 hover:text-dust"
                >
                  Cómo es una noche
                  <ArrowDownRight aria-hidden="true" className="size-4" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="gutter-x pointer-events-none absolute inset-x-0 bottom-0 z-[3] hidden pb-6 md:block">
          <div className="hero-fade eyebrow mx-auto flex max-w-[88rem] items-center justify-between border-t border-line pt-4 text-dust/55">
            <span>{SITE.coords}</span>
            <span className="cb-sheen [@media(pointer:coarse)]:hidden" aria-hidden="true">
              Mové el cursor — el cielo te sigue
            </span>
            <span className="flex gap-6">
              <span>{SITE.altitude}</span>
              <span>{SITE.bortle}</span>
            </span>
          </div>
        </div>

        <p
          aria-hidden="true"
          className="cb-hint eyebrow whitespace-nowrap text-dust/60 md:hidden [@media(pointer:fine)]:hidden"
        >
          Tocá el cielo
        </p>
      </CodeBackground>
    </section>
  )
}
