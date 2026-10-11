import { ArrowRight } from 'lucide-react'
import { C, Code, DocSection, DocTable, H3, useCssVar } from './doc'
import { useEffect, useState } from 'react'
import { SEMANTIC_GROUPS, SPACING, TYPE_SCALE } from './tokens'

export function HowItWorks() {
  const layers = [
    { title: 'Tailwind defaults', body: 'Spacing (4px steps), type sizes, weights, radius, shadows, breakpoints — kept as they ship.', eg: 'p-4 · text-sm · shadow-lg' },
    { title: 'UBS colour tokens', body: 'The colours ubs.com publishes (--col-*), under their UBS names. Tailwind colours only where UBS has none.', eg: 'ubs-text-subtle · ubs-background-brand' },
    { title: 'Semantic tokens', body: 'What a colour is for. Every --color-* becomes bg-*, text-*, border-* …', eg: 'text-fg-muted · bg-accent' },
    { title: 'Components', body: 'Base UI parts (behaviour, a11y) + Tailwind classes (look). States via data-* variants.', eg: 'data-checked:bg-accent' },
    { title: 'Screens', body: 'Compose components; only layout classes here (grid, gap, padding).', eg: 'grid gap-7 px-6' },
  ]
  return (
    <DocSection
      id="how"
      kicker="Start here"
      title="How this design system works"
      lead={<>Everything visual is a <b className="font-semibold">token</b> in one CSS file (<C>src/styles/theme.css</C>). Tailwind 4 turns tokens into classes, so the design system <i>is</i> the class list: if a value isn’t a token, there is no class for it. Components are Base UI parts styled with those classes.</>}
    >
      <div className="mt-5 flex flex-wrap items-stretch gap-2">
        {layers.map((l, i) => (
          <div key={l.title} className="flex items-stretch gap-2">
            {i > 0 && <ArrowRight className="size-4 self-center text-fg-subtle" />}
            <div className="flex w-44 flex-col gap-1 border border-line bg-surface-subtle p-3">
              <span className="text-xs text-fg-muted">{i + 1}</span>
              <span className="font-semibold">{l.title}</span>
              <span className="text-xs text-fg-secondary">{l.body}</span>
              <span className="mt-auto pt-1 font-mono text-xs text-fg-muted">{l.eg}</span>
            </div>
          </div>
        ))}
      </div>

      <H3>Rules of thumb</H3>
      <ul className="flex max-w-200 list-disc flex-col gap-1 pl-5 text-fg-secondary">
        <li>Use <b className="font-semibold text-fg">semantic</b> colour classes in components (<C>text-fg-muted</C>), not the UBS tokens directly (<C>text-ubs-text-subtle</C>). Changing what “muted text” means is then one line in theme.css.</li>
        <li>Colours come from UBS. Tailwind’s default palette is switched off (<C>--color-*: initial</C>), so <C>bg-blue-500</C> doesn’t exist. Only where UBS has no fitting colour is a Tailwind colour added back, explicitly and marked in theme.css (today: <C>red-50</C> behind conflict tags, <C>white</C> on the red).</li>
        <li>Sizes come from Tailwind’s built-in scales. 1 spacing step = 4px; halves and quarters are allowed (<C>p-2.5</C> = 10px). Avoid arbitrary values like <C>p-[13px]</C>.</li>
        <li>Style Base UI state with its data attributes: <C>data-checked:</C>, <C>data-active:</C>, <C>data-highlighted:</C>, <C>data-open:</C>, <C>data-disabled:</C>. Base UI does not use Radix’s <C>data-state</C>.</li>
        <li>Variants of a component live in one place (<C>cva</C> in the component file), not in every screen.</li>
      </ul>

      <H3>The whole theme in one file</H3>
      <Code>{`
/* src/index.css */
@import "tailwindcss";
@import "./styles/theme.css";

/* src/styles/theme.css */
@theme static {
  --color-*: initial;                       /* drop Tailwind's palette */
  --font-sans: Frutiger, "Frutiger for UBS Web", "Source Sans 3 Variable", Arial, sans-serif;

  --color-ubs-text-subtle: #5A5D5C;              /* 2. UBS token (--col-text-subtle) */
  --color-ubs-background-brand: #E60000;
  --color-red-50: oklch(97.1% 0.013 17.38);      /*    edge case: Tailwind red-50 */

  --color-fg-muted: var(--color-ubs-text-subtle); /* 3. semantic token */
  --color-accent: var(--color-ubs-background-brand);
  --color-excluded-subtle: var(--color-red-50);
}

/* usage */
<p className="text-fg-muted">…</p>
<Checkbox.Root className="data-checked:bg-accent" />
`}</Code>
    </DocSection>
  )
}

function Swatch({ token }: { token: string }) {
  const hex = useCssVar('--color-' + token)
  return (
    <div className="flex items-center gap-2.5">
      <span className="size-7 shrink-0 border border-line" style={{ background: `var(--color-${token})` }} />
      <span className="flex flex-col"><span className="font-mono text-xs">{token}</span><span className="text-xs text-fg-muted uppercase">{hex}</span></span>
    </div>
  )
}

export function Colour() {
  return (
    <DocSection
      id="colour"
      kicker="Foundations"
      title="Colour"
      lead={<>Semantic tokens are what you use. Each row shows the token, the class to write, and the brand colour it points at (values read live from the CSS).</>}
      badge={`${SEMANTIC_GROUPS.reduce((s, g) => s + g.rows.length, 0)} tokens`}
    >
      {SEMANTIC_GROUPS.map((g) => (
        <div key={g.title}>
          <H3>{g.title}</H3>
          <p className="mb-2 max-w-200 text-xs text-fg-muted">{g.note}</p>
          <DocTable
            heads={['Token', 'Use for', 'Classes', 'Points at']}
            rows={g.rows.map((r) => [<Swatch key="s" token={r.token} />, r.use, <C key="c">{r.classes}</C>, r.primitive ? <C key="p">{r.primitive}</C> : <span key="p" className="text-fg-muted">own value</span>])}
          />
        </div>
      ))}
      <H3>UBS colour tokens</H3>
      <p className="mb-3 max-w-200 text-xs text-fg-muted">The UBS tokens this app uses (from ubs.com <C>--col-*</C>, light theme), as <C>--color-ubs-*</C>. Semantic tokens point at these. Need another colour? Pick it from the full list of 108 in <C>docs/ubs-colour-tokens.md</C> before reaching for anything else.</p>
      <UbsTokens />
    </DocSection>
  )
}

export function Typography() {
  const font = useCssVar('--font-sans')
  return (
    <DocSection id="type" kicker="Foundations" title="Typography" lead={<>Tailwind’s built-in sizes, each with its paired line height. Body is <C>text-sm</C> (14/20), set once on <C>&lt;body&gt;</C>. Two weights: <C>font-normal</C> and <C>font-semibold</C>.</>}>
      <H3>Family</H3>
      <p className="text-xs text-fg-muted">UBS Frutiger when installed on the machine (same names as ubs.com), Source Sans 3 (self-hosted) otherwise.</p>
      <p className="mt-1 font-mono text-xs break-all">--font-sans: {font}</p>
      <H3>Scale</H3>
      <DocTable
        heads={['Class', 'Size / line', 'Sample', 'Use for']}
        rows={TYPE_SCALE.map((t) => [<C key="c">{t.cls}</C>, t.size, <span key="s" className={t.cls}>Model portfolio 1’000’000.00</span>, t.use])}
      />
      <H3>Numbers</H3>
      <p className="text-fg-secondary">Weights, prices and totals use <C>tabular-nums</C> so digits line up in columns, and are right-aligned.</p>
    </DocSection>
  )
}

export function Spacing() {
  return (
    <DocSection id="spacing" kicker="Foundations" title="Spacing" lead={<>One base unit: <C>--spacing: 0.25rem</C> (4px). Every padding, margin, gap, width and height class multiplies it: <C>p-4</C> = 16px, <C>gap-2.5</C> = 10px. These are the steps this UI uses.</>}>
      <div className="mt-5 flex flex-col">
        {SPACING.map((s) => (
          <div key={s.step} className="grid grid-cols-[4rem_3.5rem_14rem_1fr] items-center gap-3 border-b border-line py-1.25 text-xs">
            <C>{s.step}</C>
            <span className="text-fg-muted">{s.px}px</span>
            <span className="h-3 bg-chart-1" style={{ width: s.px * 2 }} />
            <span className="text-fg-secondary">{s.use}</span>
          </div>
        ))}
      </div>
    </DocSection>
  )
}

export function ShapeElevation() {
  return (
    <DocSection id="shape" kicker="Foundations" title="Shape, lines & elevation" lead="Square corners (the brand is square), 1px lines, one shadow for floating surfaces.">
      <DocTable
        className="mt-5"
        heads={['Property', 'Classes', 'Where']}
        rows={[
          ['Radius', <C key="1">rounded-none (default)</C>, 'Everything: panels, cards, inputs, buttons, chips'],
          ['Round', <C key="2">rounded-full</C>, 'Only radio dots, switch, slider handle'],
          ['Line', <C key="3">border · border-line / line-strong / control</C>, 'Dividers / panels / controls'],
          ['Selection line', <C key="4">h-0.75 bg-accent (3px)</C>, 'Tabs indicator; header links'],
          ['Elevation', <C key="5">shadow-pop</C>, 'Popups, menus, modals — nothing else floats (UBS --col-opacity-shadow)'],
          ['Focus', <C key="6">outline-2 outline-offset-1 outline-focus</C>, 'Global :focus-visible in index.css; components only adjust where it would be clipped'],
        ]}
      />
      <div className="mt-5 flex flex-wrap gap-4">
        <div className="flex h-16 w-40 items-center justify-center border border-line-strong bg-surface text-xs">panel · line-strong</div>
        <div className="flex h-16 w-40 items-center justify-center border border-line-strong bg-surface text-xs shadow-pop">popup · shadow-pop</div>
        <button type="button" className="h-8 border border-control bg-surface px-3.5 outline-2 outline-offset-1 outline-focus">focus ring</button>
      </div>
    </DocSection>
  )
}

/** Every UBS token in the theme, grouped by family; read from the CSS so the list can't drift. */
function UbsTokens() {
  const [names, setNames] = useState<string[]>([])
  useEffect(() => {
    const found = new Set<string>()
    const walk = (rules: CSSRuleList) => {
      for (const r of Array.from(rules)) {
        if (r instanceof CSSStyleRule) for (const p of Array.from(r.style)) if (p.startsWith('--color-ubs-')) found.add(p.slice(8))
        if ('cssRules' in r) walk((r as CSSGroupingRule).cssRules)
      }
    }
    for (const s of Array.from(document.styleSheets)) { try { walk(s.cssRules) } catch { /* cross-origin */ } }
    setNames([...found])
  }, [])
  const families = ['text', 'icon', 'link-text', 'background-ui', 'background-tags', 'background', 'border', 'focus', 'chart', 'graph']
  const groups = new Map<string, string[]>()
  names.forEach((n) => {
    const f = families.find((x) => n.startsWith('ubs-' + x + '-')) ?? 'other'
    groups.set(f, [...(groups.get(f) ?? []), n])
  })
  return (
    <div className="flex flex-col gap-4">
      {families.filter((f) => groups.has(f)).map((f) => (
        <div key={f}>
          <div className="mb-1.5 text-xs text-fg-muted">{f}</div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-x-4 gap-y-2">
            {groups.get(f)!.map((n) => <Swatch key={n} token={n} />)}
          </div>
        </div>
      ))}
    </div>
  )
}
