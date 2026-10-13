# New model portfolio — React + Tailwind 4 + Radix

React version of the HTML prototype in the repo root (`../index.html`), built on a Tailwind 4 design system with [Radix UI](https://www.radix-ui.com) components.

**New to Tailwind design systems? Read [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) first.**

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build into dist/
```

| Route | Screen |
|---|---|
| `#data` | Model portfolio data |
| `#preferences` | Preferences (exclusions) |
| `#components` | Component selection |
| `#allocation` | Component allocation |
| `#simulation` | Simulation |
| `#design` | Design system (tokens, components, patterns — live) |

## Structure

```
src/
  styles/theme.css        all design tokens (@theme)
  index.css               Tailwind import + base layer
  lib/cn.ts               class merging helper
  components/ui/          Radix components styled with tokens
  views/                  the five screens
  design-system/          the Design system page
  state/portfolio.tsx     state of the whole flow (one store)
  data/data.ts            illustrative data
```

Stack: Vite 8 · React 19 · TypeScript · Tailwind CSS 4.3 · radix-ui · cmdk · class-variance-authority · tailwind-merge · lucide-react.
