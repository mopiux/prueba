import type { RefObject } from "react"
import { gsap, MQ, useGSAP } from "@/lib/gsap"

type Options = {
  /** Desplazamiento máximo en px. */
  strength?: number
  /** Inclinación máxima en grados (0 = sin tilt). */
  tilt?: number
  /** Selector de una capa interna que se mueve de más (parallax). */
  inner?: string
  innerStrength?: number
}

/**
 * Efecto magnético: el elemento sigue al cursor con inercia y vuelve con un
 * rebote elástico. Sólo con puntero fino y sin reduced motion.
 */
export function useMagnetic(
  ref: RefObject<HTMLElement | null>,
  { strength = 14, tilt = 0, inner, innerStrength = 10 }: Options = {}
) {
  useGSAP(
    () => {
      const el = ref.current
      if (!el) return
      const mm = gsap.matchMedia()
      mm.add(`${MQ.motion} and ${MQ.finePointer}`, () => {
        const innerEl = inner ? el.querySelector<HTMLElement>(inner) : null
        const xTo = gsap.quickTo(el, "x", { duration: 0.6, ease: "power3.out" })
        const yTo = gsap.quickTo(el, "y", { duration: 0.6, ease: "power3.out" })
        const rxTo = tilt ? gsap.quickTo(el, "rotationX", { duration: 0.6, ease: "power3.out" }) : null
        const ryTo = tilt ? gsap.quickTo(el, "rotationY", { duration: 0.6, ease: "power3.out" }) : null
        const ixTo = innerEl ? gsap.quickTo(innerEl, "x", { duration: 0.8, ease: "power3.out" }) : null
        const iyTo = innerEl ? gsap.quickTo(innerEl, "y", { duration: 0.8, ease: "power3.out" }) : null
        if (tilt) gsap.set(el, { transformPerspective: 900 })

        const onMove = (e: PointerEvent) => {
          const r = el.getBoundingClientRect()
          const rx = (e.clientX - r.left) / r.width - 0.5
          const ry = (e.clientY - r.top) / r.height - 0.5
          xTo(rx * strength * 2)
          yTo(ry * strength * 2)
          rxTo?.(-ry * tilt * 2)
          ryTo?.(rx * tilt * 2)
          ixTo?.(rx * innerStrength * 2)
          iyTo?.(ry * innerStrength * 2)
          el.style.setProperty("--mx", `${((rx + 0.5) * 100).toFixed(1)}%`)
          el.style.setProperty("--my", `${((ry + 0.5) * 100).toFixed(1)}%`)
        }
        const onLeave = () => {
          const back = { duration: 1.1, ease: "elastic.out(1, 0.45)", overwrite: true }
          gsap.to(el, { x: 0, y: 0, rotationX: 0, rotationY: 0, ...back })
          if (innerEl) gsap.to(innerEl, { x: 0, y: 0, ...back })
        }

        el.addEventListener("pointermove", onMove)
        el.addEventListener("pointerleave", onLeave)
        return () => {
          el.removeEventListener("pointermove", onMove)
          el.removeEventListener("pointerleave", onLeave)
        }
      })
      return () => mm.revert()
    },
    { dependencies: [strength, tilt, inner, innerStrength] }
  )
}
