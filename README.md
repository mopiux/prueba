# Órbita

Landing de Órbita, un observatorio astronómico ficticio en la Puna de Atacama.

Stack: Vite + React + TypeScript + Tailwind 4 + shadcn/ui + GSAP (ScrollTrigger) + Framer Motion.

```bash
npm install
npm run dev      # http://localhost:5173/
npm run build    # genera dist/ con base /prueba/ para GitHub Pages
npm run preview  # sirve dist/ en http://localhost:4173/prueba/
```

- `design-dna.json`: tokens de diseño (color, tipografía, motion) mapeados al tema de Tailwind/shadcn en `src/index.css`.
- `src/components/ui/code-background.tsx` y `background-paths.tsx`: componentes de 21st.dev adaptados.
- `.github/workflows/deploy.yml`: compila y publica en GitHub Pages en cada push a `main`.
