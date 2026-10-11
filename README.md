# portfolio_form_design

Redesign proposal for the **New model portfolio** flow, plus the design system behind it.

Live page: https://serhiihaniuk.github.io/portfolio_form_design/

A React app built on a Tailwind CSS 4 design system with [Base UI](https://base-ui.com) components. Everything is clickable; data is illustrative.

| What | Where |
|---|---|
| App source | [`app/`](app) — see [app/README.md](app/README.md) |
| How the design system works | [app/DESIGN_SYSTEM.md](app/DESIGN_SYSTEM.md) |
| Built app served by GitHub Pages | `index.html` — one minified, self-contained file (generated — don't edit) |
| Earlier single-file HTML prototype | [`prototype.html`](https://serhiihaniuk.github.io/portfolio_form_design/prototype.html) |

## Screens

| Tab | Link | What it does |
|---|---|---|
| Model portfolio book | [#book](https://gegebona.github.io/portfolio_form_design/#book) | Landing list of all model portfolios with search; customized versions listed under their parent; Create model portfolio opens the flow |
| Model portfolio data | [#data](https://serhiihaniuk.github.io/portfolio_form_design/#data) | Code, name, currency; benchmark picked from a searchable list with a joined details panel |
| Preferences | [#preferences](https://serhiihaniuk.github.io/portfolio_form_design/#preferences) | Exclusions: search + suggestion chips, threshold scales for rating and ESG, excluded instruments |
| Component selection | [#components](https://serhiihaniuk.github.io/portfolio_form_design/#components) | Catalogue cards with live conflict tags and Learn more; portfolio components column with instruments and cash |
| Component allocation | [#allocation](https://serhiihaniuk.github.io/portfolio_form_design/#allocation) | Weights per component (field + slider), allocation bar, fill remaining / distribute evenly, component details |
| Simulation | [#simulation](https://serhiihaniuk.github.io/portfolio_form_design/#simulation) | Current vs new overview, positions in four views, conflict resolution, redistribute to 100% |
| Design system | [#design](https://serhiihaniuk.github.io/portfolio_form_design/#design) | Tokens (UBS colours → semantic), components on Base UI, motion, patterns — rendered from the real components |

## Updating the live page

```bash
cd app
npm install
npm run publish:pages   # builds one self-contained index.html and copies it to the repo root
```

Then commit and push; GitHub Pages serves the repo root.
