import { useEffect, useRef, type ReactNode, type RefObject } from "react";

type Anchor = { x: number; y: number };

type Props = {
  className?: string;
  /** Contenido que va encima del canvas (reemplaza al label original). */
  children?: ReactNode;
  /** Elemento cuya caja atenúa los puntos de atrás, para que el título se lea. */
  keepOutRef?: RefObject<HTMLElement | null>;
  /** Punto (0–1) alrededor del cual orbita la esfera cuando no hay puntero. */
  anchor?: Anchor;
  /** Igual que `anchor`, para pantallas angostas. */
  anchorSmall?: Anchor;
};

const TAU = Math.PI * 2;
const HALF_PI = Math.PI / 2;
const FONT =
  '"JetBrains Mono Variable","JetBrains Mono","Apple Symbols","Segoe UI Symbol","Noto Sans Symbols 2","Noto Sans Symbols","DejaVu Sans",ui-monospace,monospace';

/* Glifos astronómicos. Las estrellas pesan más para que la esfera se lea como
   un astro y no como una pantalla de código. */
const starChars = Array.from("✦✧⋆★✶✷✹∗·");
const bodyChars = Array.from("☉☽☾⊕♁♃♄♅♆");
const greekChars = Array.from("αβγδεζηθλμπσφω");
const digitChars = Array.from("0123456789");
const catalogTokens = ["M8", "M4", "C9"];
const coordChars = Array.from("°′″+−");

const GLYPHS: string[] = [
  ...starChars,
  ...starChars,
  ...starChars,
  ...bodyChars,
  ...bodyChars,
  ...greekChars,
  ...digitChars,
  ...catalogTokens,
  ...coordChars,
];

/* Colores del Design DNA (design-dna.json → tokens.color) */
const DNA = {
  dot: "168,178,210",
  ice: [156, 194, 255],
  dust: [239, 231, 214],
  amber: [255, 192, 110],
  ember: [255, 122, 61],
} as const;

type RGB = readonly [number, number, number];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const mixRGB = (a: RGB, b: RGB, t: number): RGB => [
  lerp(a[0], b[0], t),
  lerp(a[1], b[1], t),
  lerp(a[2], b[2], t),
];
const rampAt = (stops: ReadonlyArray<readonly [number, RGB]>, t: number): RGB => {
  for (let i = 1; i < stops.length; i++) {
    const [t1, c1] = stops[i];
    if (t <= t1) {
      const [t0, c0] = stops[i - 1];
      return mixRGB(c0, c1, (t - t0) / (t1 - t0));
    }
  }
  return stops[stops.length - 1][1];
};
const css = (c: RGB) => `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
const WHITE: RGB = [255, 250, 240];

/* Rampas: lado iluminado frío (ice → dust), terminador cálido (amber → ember). */
const BODY_RAMP: ReadonlyArray<readonly [number, RGB]> = [
  [0, DNA.ice],
  [0.32, DNA.dust],
  [0.62, DNA.amber],
  [1, DNA.ember],
];
const SPARK_RAMP: ReadonlyArray<readonly [number, RGB]> = [
  [0, DNA.dust],
  [1, DNA.amber],
];

/* 0 normal, 360 normal+flash, 720 chispa, 1080 chispa+flash */
const PALETTE: string[] = (() => {
  const p: string[] = new Array(1440);
  for (let k = 0; k < 360; k++) {
    const t = k / 359;
    const body = rampAt(BODY_RAMP, t);
    const spark = rampAt(SPARK_RAMP, t);
    p[k] = css(body);
    p[360 + k] = css(mixRGB(body, WHITE, 0.45));
    p[720 + k] = css(spark);
    p[1080 + k] = css(mixRGB(spark, WHITE, 0.6));
  }
  return p;
})();

const DOT_FILL = `rgb(${DNA.dot})`;
const HAZE_STOPS: ReadonlyArray<readonly [number, number]> = [
  [0, 0.17],
  [0.55, 0.08],
  [1, 0],
];

const sstep = (e0: number, e1: number, x: number): number => {
  const k = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return k * k * (3 - 2 * k);
};

const mulberry32 = (a: number) => () => {
  a |= 0;
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const NB = 16; // alpha buckets for resting dots
const K = 0.6; // globe roundness
const LN = Math.hypot(-0.45, -0.55, 0.7);
const LX = -0.45 / LN;
const LY = -0.55 / LN;
const LZ = 0.7 / LN;

const DEFAULT_ANCHOR: Anchor = { x: 0.7, y: 0.4 };
const DEFAULT_ANCHOR_SMALL: Anchor = { x: 0.62, y: 0.28 };

export default function CodeBackground({
  className,
  children,
  keepOutRef,
  anchor = DEFAULT_ANCHOR,
  anchorSmall = DEFAULT_ANCHOR_SMALL,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { x: ax, y: ay } = anchor;
  const { x: sx, y: sy } = anchorSmall;

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const GN = GLYPHS.length;

    let raf = 0;
    let drawRaf = 0;
    let resizeRaf = 0;
    let touchTimer = 0;
    let disposed = false;
    let inView = true;
    let last = performance.now();
    let t = 0;
    let w = 0;
    let h = 0;
    let dpr = 1;

    // lattice
    let N = 0;
    let spacing = 22;
    let dotR = 1.05;
    let baseFont = 15.8;
    let R = 160;
    let bx = new Float32Array(0);
    let by = new Float32Array(0);
    let seed = new Float32Array(0);
    let mix = new Float32Array(0);
    let flash = new Float32Array(0);
    let nextSwap = new Float32Array(0);
    let scrambleUntil = new Float32Array(0);
    let phase = new Float32Array(0);
    let tw = new Float32Array(0);
    let kp = new Float32Array(0);
    let glyph = new Uint8Array(0);
    // glyph draw queue
    let gx = new Float32Array(0);
    let gy = new Float32Array(0);
    let ga = new Float32Array(0);
    let gf = new Uint8Array(0);
    let gp = new Uint16Array(0);
    let gc = new Uint8Array(0);
    let buckets: Uint16Array[] = [];
    const bCount = new Int32Array(NB);
    let fonts: string[] = [];

    // pointer / sphere
    const ptr = { tx: 0, ty: 0, x: 0, y: 0, vx: 0, vy: 0, active: false };
    let presence = 0;
    let speed = 0;

    const idleTarget = (tt: number) => {
      const small = w < 768;
      const fx = small ? sx : ax;
      const fy = small ? sy : ay;
      const ox = reduce ? 0 : Math.cos(tt * 0.19) * w * (small ? 0.05 : 0.07);
      const oy = reduce ? 0 : Math.sin(tt * 0.27) * h * 0.045;
      return { x: fx * w + ox, y: fy * h + oy };
    };

    const buildLattice = () => {
      const small = Math.min(w, h) < 640;
      spacing = small ? 18 : 22;
      dotR = small ? 0.95 : 1.05;
      let cols = 1;
      let rows = 1;
      for (;;) {
        cols = Math.max(1, Math.floor(w / spacing));
        rows = Math.max(1, Math.floor(h / spacing));
        if (cols * rows <= 12000) break;
        spacing += 1;
      }
      baseFont = small ? Math.max(13, spacing * 0.72) : spacing * 0.72;
      R = Math.min(240, Math.max(w < 640 ? 100 : 130, Math.min(w, h) * 0.22)) * (coarse ? 0.9 : 1);

      const ox = (w % spacing) / 2 + spacing / 2;
      const oy = (h % spacing) / 2 + spacing / 2;
      N = cols * rows;

      bx = new Float32Array(N);
      by = new Float32Array(N);
      seed = new Float32Array(N);
      mix = new Float32Array(N);
      flash = new Float32Array(N);
      nextSwap = new Float32Array(N);
      scrambleUntil = new Float32Array(N);
      phase = new Float32Array(N);
      tw = new Float32Array(N);
      kp = new Float32Array(N);
      glyph = new Uint8Array(N);
      gx = new Float32Array(N);
      gy = new Float32Array(N);
      ga = new Float32Array(N);
      gf = new Uint8Array(N);
      gp = new Uint16Array(N);
      gc = new Uint8Array(N);
      buckets = Array.from({ length: NB }, () => new Uint16Array(N));

      // zona de resguardo detrás del título (superelipse suave)
      let kcx = 0;
      let kcy = 0;
      let krx = 0;
      let kry = 0;
      const keep = keepOutRef?.current;
      if (keep) {
        const rr = root.getBoundingClientRect();
        const kr = keep.getBoundingClientRect();
        kcx = kr.left - rr.left + kr.width / 2;
        kcy = kr.top - rr.top + kr.height / 2;
        krx = kr.width / 2 + spacing * 1.5;
        kry = kr.height / 2 + spacing * 1.5;
      }

      const rng = mulberry32(1337);
      let i = 0;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++, i++) {
          const x = ox + c * spacing;
          const y = oy + r * spacing;
          bx[i] = x;
          by[i] = y;
          seed[i] = rng();
          phase[i] = rng() * TAU;
          glyph[i] = (rng() * GN) | 0;
          nextSwap[i] = rng();
          const tr = rng();
          tw[i] = tr < 0.02 ? 3 + rng() * 4 : 0;
          if (krx > 0) {
            const qx = Math.abs((x - kcx) / krx);
            const qy = Math.abs((y - kcy) / kry);
            const e = Math.pow(qx ** 4 + qy ** 4, 0.25);
            kp[i] = 1 - 0.78 * (1 - sstep(0.82, 1.12, e));
          } else {
            kp[i] = 1;
          }
        }
      }

      fonts = [];
      for (let k = 0; k < 8; k++) {
        const scale = 0.5 + k * (1.3 / 7);
        fonts.push(`${(baseFont * scale).toFixed(1)}px ${FONT}`);
      }
    };

    const ambient = (i: number, tt: number): number => {
      if (reduce) return 0.2;
      let a = 0.2 + 0.1 * Math.sin(tt * 0.5 + bx[i] * 0.006 + by[i] * 0.004);
      const p = tw[i];
      if (p > 0) {
        const s = Math.sin(tt * (TAU / p) + phase[i]);
        if (s > 0) {
          const e = s * s;
          a += (0.6 - a) * e * e;
        }
      }
      return a;
    };

    const draw = (dt: number, tt: number) => {
      // sin puntero, la esfera orbita sola alrededor del ancla
      if (!ptr.active) {
        const it = idleTarget(tt);
        ptr.tx = it.x;
        ptr.ty = it.y;
      }
      presence += (1 - presence) * (1 - Math.exp(-dt * 2.5));
      if (reduce) presence = 1;

      const ppx = ptr.x;
      const ppy = ptr.y;
      const kPos = 1 - Math.exp(-dt * (ptr.active ? 12 : 2.4));
      ptr.x += (ptr.tx - ptr.x) * kPos;
      ptr.y += (ptr.ty - ptr.y) * kPos;
      if (!reduce && dt > 0) {
        ptr.vx = (ptr.x - ppx) / dt;
        ptr.vy = (ptr.y - ppy) / dt;
        speed += (Math.hypot(ptr.vx, ptr.vy) - speed) * (1 - Math.exp(-dt * 10));
      }

      const ease = 1 - Math.pow(1 - presence, 3);
      const Re = R * ease * (1 + Math.min(0.08, speed * 0.00008));
      const cx = ptr.x;
      const cy = ptr.y;
      const hasSphere = presence > 0.002;
      const R15 = Re * 1.5;

      // 1) haze: núcleo frío, borde brasa
      if (hasSphere) {
        const rH = Re * 1.6;
        const wob = 0.5 + 0.5 * Math.sin(tt * 0.3);
        const inner = mixRGB(DNA.ice, DNA.dust, wob);
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rH);
        const hs = HAZE_STOPS;
        g.addColorStop(hs[0][0], `rgba(${inner[0] | 0},${inner[1] | 0},${inner[2] | 0},${hs[0][1] * presence})`);
        g.addColorStop(hs[1][0], `rgba(${DNA.ember.join(",")},${hs[1][1] * presence})`);
        g.addColorStop(hs[2][0], `rgba(${DNA.ember.join(",")},0)`);
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = 1;
        ctx.fillStyle = g;
        ctx.fillRect(cx - rH, cy - rH, rH * 2, rH * 2);
      }

      // 2) cells
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = DOT_FILL;
      bCount.fill(0);
      let gn = 0;

      const kIn = 1 - Math.exp(-dt * 16);
      const kOut = 1 - Math.exp(-dt * 4.5);
      const fd = Math.exp(-dt * 7);
      const sweepY = reduce ? 0 : Math.sin(tt * 0.9) * 0.85;

      for (let i = 0; i < N; i++) {
        const dx = bx[i] - cx;
        const dy = by[i] - cy;
        const inBox = dx < Re && dx > -Re && dy < Re && dy > -Re;
        const d = inBox ? Math.hypot(dx, dy) : 1e9;
        const m0 = mix[i];

        // TIER 1: resting / halo (batched)
        if (d >= Re && m0 < 0.005) {
          if (m0 !== 0) {
            mix[i] = 0;
            flash[i] = 0;
          }
          let a = ambient(i, tt) * kp[i];
          if (hasSphere && dx < R15 && dx > -R15 && dy < R15 && dy > -R15) {
            a += 0.18 * sstep(R15, Re, Math.hypot(dx, dy)) * presence;
          }
          let b = (a * 20) | 0;
          if (b > NB - 1) b = NB - 1;
          if (b < 0) b = 0;
          buckets[b][bCount[b]++] = i;
          continue;
        }

        // TIER 2: active cell (inside sphere or trailing)
        const inside = d < Re;
        const u = inside ? d / Re : 1;
        const tgt = inside ? sstep(0.98, 0.28, u) * presence : 0;
        const m = m0 + (tgt - m0) * (tgt > m0 ? kIn : kOut);
        mix[i] = m;
        if (!reduce && m0 < 0.06 && m >= 0.06) {
          nextSwap[i] = tt;
          scrambleUntil[i] = tt + 0.22;
        }

        let x = bx[i];
        let y = by[i];
        let z = 0.25;
        let nx = 0;
        let ny = 0;
        let rimK = 1;
        let a = ambient(i, tt) * kp[i];

        if (inside) {
          const th = u * HALF_PI;
          const s = Math.sin(th);
          z = Math.max(0, Math.cos(th));
          const rr = Re * (u * (1 - K) + s * K);
          const ux = d > 0.0001 ? dx / d : 0;
          const uy = d > 0.0001 ? dy / d : 0;
          x = cx + ux * rr;
          y = cy + uy * rr;
          nx = ux * s;
          ny = uy * s;
          rimK = 1 - 0.7 * sstep(0.72, 1, u);
          a += 0.18 * presence;
        } else if (hasSphere) {
          a += 0.18 * sstep(R15, Re, Math.hypot(dx, dy)) * presence;
        }

        // dot (fades as glyph takes over)
        const dotA = a * (1 - m) * rimK;
        if (dotA > 0.004) {
          ctx.globalAlpha = Math.min(1, dotA);
          const r = inside ? dotR * (0.55 + 0.6 * z) : dotR;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, TAU);
          ctx.fill();
        }

        // swap timer + flash
        let fl = flash[i];
        if (!reduce) {
          if (inside && tt >= nextSwap[i] && m > 0.15) {
            glyph[i] = (Math.random() * GN) | 0;
            fl = 1;
            nextSwap[i] =
              tt < scrambleUntil[i]
                ? tt + 0.045 + Math.random() * 0.025
                : tt + (1.1 + (0.12 - 1.1) * Math.pow(z, 1.2)) * (0.5 + Math.random());
          }
          fl *= fd;
          flash[i] = fl;
        }

        if (m > 0.01) {
          const lit = Math.max(0, nx * LX + ny * LY + z * LZ);
          const shade = 0.55 + 0.45 * lit;
          let scan = 1;
          if (!reduce && inside) {
            const q = dy / Re - sweepY;
            scan = 1 + 0.9 * Math.exp(-(q * q) / 0.012);
          }
          const alpha =
            (m * (0.35 + 0.65 * Math.pow(z, 0.8)) * shade * scan + 0.35 * fl * m) * kp[i];
          if (alpha > 0.01) {
            const sd = seed[i];
            let tone: number;
            let base: number;
            if (sd < 0.06) {
              // chispas: estrellas cálidas sueltas sobre el astro
              tone = 0.5 + 0.5 * Math.sin(tt * 0.8 + sd * 90);
              base = 720;
            } else {
              // bandas que giran como en un gigante gaseoso + terminador cálido
              const swirl = 0.5 + 0.5 * Math.sin(tt * 0.55 + nx * 2.2 + ny * 1.7 + sd * 1.8);
              tone = 0.66 * (1 - lit) + 0.34 * swirl;
              base = 0;
            }
            const scale = (0.62 + 0.78 * z) * (1 + 0.25 * fl);
            let fi = Math.round((scale - 0.5) / (1.3 / 7));
            if (fi < 0) fi = 0;
            if (fi > 7) fi = 7;
            let pi = (tone * 359) | 0;
            if (pi < 0) pi = 0;
            if (pi > 359) pi = 359;
            gx[gn] = x;
            gy[gn] = y;
            ga[gn] = alpha > 1 ? 1 : alpha;
            gf[gn] = fi;
            gp[gn] = base + (fl > 0.5 ? 360 : 0) + pi;
            gc[gn] = glyph[i];
            gn++;
          }
        }
      }

      // resting dot batches
      ctx.fillStyle = DOT_FILL;
      for (let b = 0; b < NB; b++) {
        const c = bCount[b];
        if (c === 0) continue;
        const arr = buckets[b];
        ctx.globalAlpha = (b + 0.5) / 20;
        ctx.beginPath();
        for (let k = 0; k < c; k++) {
          const i = arr[k];
          const px = bx[i];
          const py = by[i];
          ctx.moveTo(px + dotR, py);
          ctx.arc(px, py, dotR, 0, TAU);
        }
        ctx.fill();
      }

      // 3) glyphs (additive)
      if (gn > 0) {
        ctx.globalCompositeOperation = "lighter";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        let lastF = -1;
        for (let g = 0; g < gn; g++) {
          const f = gf[g];
          if (f !== lastF) {
            ctx.font = fonts[f];
            lastF = f;
          }
          ctx.globalAlpha = ga[g];
          ctx.fillStyle = PALETTE[gp[g]];
          ctx.fillText(GLYPHS[gc[g]], gx[g], gy[g]);
        }
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    };

    // reduced motion: render one frame per input event
    const requestDraw = () => {
      if (!reduce || drawRaf || disposed) return;
      drawRaf = requestAnimationFrame(() => {
        drawRaf = 0;
        ctx.clearRect(0, 0, w, h);
        draw(1, 0);
      });
    };

    const resize = () => {
      const rect = root.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(1, Math.round(rect.width));
      h = Math.max(1, Math.round(rect.height));
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildLattice();
      if (!ptr.active) {
        const it = idleTarget(t);
        ptr.x = ptr.tx = it.x;
        ptr.y = ptr.ty = it.y;
      }
      requestDraw();
    };

    const frame = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
      last = now;
      t += dt;
      ctx.clearRect(0, 0, w, h);
      draw(dt, t);
      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (reduce || raf || disposed || !inView || document.hidden) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    // los eventos se escuchan sólo dentro del hero
    const onMove = (e: PointerEvent) => {
      const rect = root.getBoundingClientRect();
      ptr.tx = e.clientX - rect.left;
      ptr.ty = e.clientY - rect.top;
      ptr.active = true;
      window.clearTimeout(touchTimer);
      if (reduce) {
        ptr.x = ptr.tx;
        ptr.y = ptr.ty;
      }
      requestDraw();
    };

    const leave = () => {
      ptr.active = false;
      if (reduce) {
        const it = idleTarget(0);
        ptr.x = ptr.tx = it.x;
        ptr.y = ptr.ty = it.y;
      }
      requestDraw();
    };

    const onUp = (e: PointerEvent) => {
      if (e.pointerType === "touch") {
        window.clearTimeout(touchTimer);
        touchTimer = window.setTimeout(leave, 900);
      }
    };

    const onCancel = (e: PointerEvent) => {
      // en touch, el scroll cancela el puntero: dejamos que la esfera se quede un instante
      if (e.pointerType === "touch") {
        onUp(e);
        return;
      }
      leave();
    };
    const onLeave = (e: PointerEvent) => {
      if (e.pointerType === "touch") return; // touch lingers via onUp
      leave();
    };

    const onVis = () => {
      if (document.hidden) {
        stop();
        ptr.active = false;
        return;
      }
      start();
    };

    const onResize = () => {
      if (resizeRaf) return;
      resizeRaf = requestAnimationFrame(() => {
        resizeRaf = 0;
        resize();
      });
    };

    root.addEventListener("pointermove", onMove, { passive: true });
    root.addEventListener("pointerdown", onMove, { passive: true });
    root.addEventListener("pointerup", onUp, { passive: true });
    root.addEventListener("pointercancel", onCancel);
    root.addEventListener("pointerleave", onLeave);
    window.addEventListener("blur", leave);
    document.addEventListener("visibilitychange", onVis);

    const ro = new ResizeObserver(onResize);
    ro.observe(root);
    if (keepOutRef?.current) ro.observe(keepOutRef.current);

    // pausa el loop cuando el hero sale de pantalla
    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        if (inView) start();
        else stop();
      },
      { rootMargin: "64px 0px" }
    );
    io.observe(root);

    resize();
    start();

    if (document.fonts) {
      void document.fonts.load(`16px "JetBrains Mono Variable"`).catch(() => undefined);
      void document.fonts.ready.then(() => {
        if (disposed) return;
        resize();
      });
    }

    return () => {
      disposed = true;
      stop();
      cancelAnimationFrame(drawRaf);
      cancelAnimationFrame(resizeRaf);
      window.clearTimeout(touchTimer);
      ro.disconnect();
      io.disconnect();
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerdown", onMove);
      root.removeEventListener("pointerup", onUp);
      root.removeEventListener("pointercancel", onCancel);
      root.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", leave);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [keepOutRef, ax, ay, sx, sy]);

  return (
    <div ref={rootRef} className={className ? `cb-root ${className}` : "cb-root"}>
      <canvas ref={canvasRef} className="cb-canvas" aria-hidden="true" />
      <div className="cb-vignette" aria-hidden="true" />
      <div className="cb-grain" aria-hidden="true" />
      {children}
    </div>
  );
}

export { CodeBackground };
