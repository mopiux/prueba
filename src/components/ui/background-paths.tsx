"use client";

import {
  forwardRef,
  useMemo,
  useRef,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

/*
 * Reparto de responsabilidades de animación (para que nunca se pisen):
 * - Framer Motion anima SÓLO los <motion.path> de las órbitas y las letras del título.
 * - GSAP (desde la sección que usa este componente) anima SÓLO los contenedores
 *   marcados con data-gsap: el wrapper de órbitas (rotación con scroll) y el panel.
 */

/* DNA: ember → amber → ice */
const ORBIT_RAMP: ReadonlyArray<readonly [number, readonly [number, number, number]]> = [
  [0, [255, 122, 61]],
  [0.5, [255, 192, 110]],
  [1, [156, 194, 255]],
];

const rampColor = (t: number) => {
  for (let i = 1; i < ORBIT_RAMP.length; i++) {
    const [t1, c1] = ORBIT_RAMP[i];
    if (t <= t1) {
      const [t0, c0] = ORBIT_RAMP[i - 1];
      const k = (t - t0) / (t1 - t0);
      const c = c0.map((v, j) => Math.round(v + (c1[j] - v) * k));
      return `rgb(${c.join(",")})`;
    }
  }
  return "rgb(156,194,255)";
};

const f = (n: number) => n.toFixed(2);

type Orbit = { id: number; d: string; color: string; width: number; opacity: number };

/**
 * Elipses keplerianas: todas comparten un foco (la estrella en el centro del viewBox)
 * y van precesando, así el conjunto se lee como trayectorias orbitales.
 * `position` (1 / -1) espeja el sentido de la precesión, como en el componente original.
 */
function buildOrbits(position: number, count: number): Orbit[] {
  const FX = 500;
  const FY = 500;
  return Array.from({ length: count }, (_, i) => {
    const k = i / Math.max(1, count - 1);
    const a = 70 + k * 640; // semieje mayor
    const e = 0.3 + k * 0.45; // excentricidad
    const b = a * Math.sqrt(1 - e * e);
    const c = a * e;
    const rot = position * (12 + k * 150) + (position < 0 ? 180 : 0);
    const r = (rot * Math.PI) / 180;
    const cx = FX - c * Math.cos(r);
    const cy = FY - c * Math.sin(r);
    const px = cx + a * Math.cos(r);
    const py = cy + a * Math.sin(r);
    const qx = cx - a * Math.cos(r);
    const qy = cy - a * Math.sin(r);
    const d = `M${f(px)} ${f(py)}A${f(a)} ${f(b)} ${f(rot)} 1 1 ${f(qx)} ${f(qy)}A${f(a)} ${f(b)} ${f(rot)} 1 1 ${f(px)} ${f(py)}`;
    return {
      id: i,
      d,
      color: rampColor(position > 0 ? k : 1 - k),
      width: 0.6 + k * 1.1,
      opacity: 0.1 + k * 0.42,
    };
  });
}

function FloatingPaths({
  position,
  count,
  animate,
  every,
}: {
  position: number;
  count: number;
  animate: boolean;
  /** Anima una de cada `every` órbitas; el resto queda fija (menos repintado). */
  every: number;
}) {
  const orbits = useMemo(() => buildOrbits(position, count), [position, count]);

  // Duraciones aleatorias generadas una sola vez por configuración, no en cada render.
  const durations = useMemo(
    // oxlint-disable-next-line react/purity -- aleatorio a propósito, memorizado
    () => orbits.map(() => 20 + Math.random() * 10),
    [orbits]
  );

  return (
    <div className="pointer-events-none absolute inset-0">
      <svg
        className="h-full w-full"
        viewBox="0 0 1000 1000"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        aria-hidden="true"
      >
        {orbits.map((orbit) =>
          animate && orbit.id % every === 0 ? (
            <motion.path
              key={orbit.id}
              d={orbit.d}
              stroke={orbit.color}
              strokeWidth={orbit.width}
              strokeOpacity={orbit.opacity}
              strokeLinecap="round"
              initial={{ pathLength: 0.3, opacity: 0.6 }}
              animate={{
                pathLength: 1,
                opacity: [0.3, 0.6, 0.3],
                pathOffset: [0, 1, 0],
              }}
              transition={{
                duration: durations[orbit.id],
                repeat: Number.POSITIVE_INFINITY,
                ease: "linear",
              }}
            />
          ) : (
            <path
              key={orbit.id}
              d={orbit.d}
              stroke={orbit.color}
              strokeWidth={orbit.width}
              strokeOpacity={orbit.opacity * 0.45}
            />
          )
        )}
      </svg>
    </div>
  );
}

type BackgroundPathsProps = {
  title?: string;
  /** Índices de palabras del título que van en itálica con el acento. */
  accentWords?: number[];
  eyebrow?: ReactNode;
  intro?: ReactNode;
  buttonLabel?: string;
  buttonProps?: ButtonHTMLAttributes<HTMLButtonElement>;
  /** Contenido del panel (formulario). El botón se renderiza al pie. */
  children?: ReactNode;
  footnote?: ReactNode;
  id?: string;
  className?: string;
};

export const BackgroundPaths = forwardRef<HTMLElement, BackgroundPathsProps>(function BackgroundPaths(
  {
    title = "Background Paths",
    accentWords = [],
    eyebrow,
    intro,
    buttonLabel = "Discover Excellence",
    buttonProps,
    children,
    footnote,
    id,
    className,
  },
  ref
) {
  const words = title.split(" ");
  const reduce = useReducedMotion() ?? false;
  const small = useMediaQuery("(max-width: 767px)");
  const sectionRef = useRef<HTMLDivElement>(null);
  const near = useInView(sectionRef, { margin: "300px 0px" });
  const count = small ? 16 : 26;
  const every = small ? 3 : 2;
  const animateOrbits = near && !reduce;

  return (
    <section
      ref={ref}
      id={id}
      className={cn("relative w-full overflow-clip bg-background", className)}
    >
      <div ref={sectionRef} className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="sticky top-0 h-svh w-full overflow-hidden">
          {/* contenedor animado por GSAP (rotación con scroll) */}
          <div data-gsap="orbits" className="absolute inset-[-24%]">
            <FloatingPaths position={1} count={count} animate={animateOrbits} every={every} />
            <FloatingPaths position={-1} count={count} animate={animateOrbits} every={every} />
          </div>
          <div className="absolute left-1/2 top-1/2 size-[46vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgb(255_192_110/0.22)_0%,rgb(255_122_61/0.08)_32%,transparent_70%)]" />
          <div className="absolute left-1/2 top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber shadow-[0_0_24px_6px_rgb(255_192_110/0.55)]" />
          <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_50%,transparent_35%,var(--background)_95%)]" />
          <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-background to-transparent" />
        </div>
      </div>

      <div className="gutter-x section-y relative z-10 mx-auto grid max-w-[88rem] items-center gap-14 lg:grid-cols-[0.82fr_1.18fr] lg:gap-16 xl:gap-20">
        <div>
          {eyebrow}
          <h2
            aria-label={title}
            className="font-display-wonk mt-6 text-[clamp(2.75rem,5.3vw,5.4rem)] leading-[0.94] font-light tracking-[-0.035em]"
          >
            {words.map((word, wordIndex) => {
              const accent = accentWords.includes(wordIndex);
              return (
                <span
                  key={wordIndex}
                  aria-hidden="true"
                  className={cn("mr-[0.22em] inline-block last:mr-0", accent && "italic")}
                >
                  {word.split("").map((letter, letterIndex) => (
                    <motion.span
                      key={`${wordIndex}-${letterIndex}`}
                      initial={reduce ? false : { y: 100, opacity: 0 }}
                      whileInView={{ y: 0, opacity: 1 }}
                      viewport={{ once: true, margin: "-10% 0px" }}
                      transition={{
                        delay: wordIndex * 0.1 + letterIndex * 0.03,
                        type: "spring",
                        stiffness: 150,
                        damping: 25,
                      }}
                      className={cn(
                        "inline-block bg-clip-text pb-[0.08em] text-transparent",
                        accent
                          ? "bg-gradient-to-r from-ember to-amber"
                          : "bg-gradient-to-r from-dust to-dust/80"
                      )}
                    >
                      {letter}
                    </motion.span>
                  ))}
                </span>
              );
            })}
          </h2>
          {intro}
        </div>

        <div data-gsap="panel" className="relative">
          <div className="rounded-[1.4rem] border border-line bg-night/92 p-5 shadow-[inset_0_1px_0_0_rgb(239_231_214/0.06),0_40px_120px_-40px_rgb(0_0_0/0.9)] sm:p-7">
            {children}

            <div className="group relative mt-7 block overflow-hidden rounded-full bg-gradient-to-b from-ember/60 to-amber/20 p-px shadow-[0_18px_60px_-18px_rgb(255_122_61/0.6)] transition-shadow duration-300 hover:shadow-[0_24px_70px_-14px_rgb(255_122_61/0.75)]">
              <Button
                variant="ghost"
                {...buttonProps}
                className={cn(
                  "h-auto w-full rounded-full border border-black/10 bg-ember px-8 py-4 text-base font-semibold text-primary-foreground transition-all duration-300 group-hover:-translate-y-0.5 hover:bg-amber hover:text-primary-foreground",
                  buttonProps?.className
                )}
              >
                <span className="opacity-90 transition-opacity group-hover:opacity-100">
                  {buttonLabel}
                </span>
                <span
                  aria-hidden="true"
                  className="ml-3 opacity-70 transition-all duration-300 group-hover:translate-x-1.5 group-hover:opacity-100"
                >
                  →
                </span>
              </Button>
            </div>
            {footnote}
          </div>
        </div>
      </div>
    </section>
  );
});
