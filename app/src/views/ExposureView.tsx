import { Tooltip } from '@base-ui/react/tooltip'
import { useState, type ReactNode } from 'react'
import { BENCH_EXPOSURE, BOOK_AS_OF, BOND_BENCHMARK, BOND_PROFILE, CLASS_COLOR, EXPOSURE, MATURITY_BUCKETS, RATING_BUCKETS } from '../data/data'
import { Button } from '../components/ui/button'
import { Checkbox } from '../components/ui/selection'
import { TooltipPopup } from '../components/ui/tag'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { AllocationBlock } from './Overview'
import { cn } from '../lib/cn'
import { getBook } from '../state/book'
import { benchmarkAlloc, pct, simAlloc, usePortfolio, type SimRow } from '../state/portfolio'

type Mode = 'current' | 'new'
type Against = 'benchmark' | 'current'
/** One item of a chart: its value in the version on screen, and in what it is compared with. */
type Item = { label: string; value: number; other: number; tip?: string }

/*
 * Chart language shared with the team's other dashboards: open sections with a light title (no boxes), labels in the
 * bars, waffles for regions, bubbles for currencies. Every chart compares two series, as in "People like you": the
 * version on screen in navy, the comparison (benchmark, or Current when New is on screen) in pale blue.
 */
const ACCENT = 'var(--color-ubs-chart-19)'
const OTHER = 'var(--color-ubs-border-light)'
const SOFT = 'var(--color-ubs-background-tags-22)'

export function ExposureView({ mode }: { mode: Mode }) {
  const { state } = usePortfolio()
  const rows = state.sim.rows
  const [pick, setPick] = useState<Against>('benchmark')
  // Comparing with Current only makes sense while New is on screen.
  const against: Against = mode === 'new' ? pick : 'benchmark'
  const mine = mode === 'new' ? 'New' : 'Current'
  const theirs = against === 'benchmark' ? 'Benchmark' : 'Current'

  const wOf = (r: SimRow, m: Mode) => (m === 'current' ? r.w : r.removed ? 0 : r.nw)
  const sum = (key: (r: SimRow) => string, m: Mode) => {
    const out = new Map<string, number>()
    rows.forEach((r) => { const w = wOf(r, m); if (w > 0) out.set(key(r), (out.get(key(r)) ?? 0) + w) })
    return out
  }
  /** Both series by label, largest first, at most `n` items; the rest grouped as Other (members on hover). Cash last. */
  const items = (key: (r: SimRow) => string, bench: Record<string, number>, n = 6): Item[] => {
    const now = sum(key, mode)
    const cmp = against === 'benchmark' ? new Map(Object.entries(bench)) : sum(key, 'current')
    const sorted = [...new Set([...now.keys(), ...cmp.keys()])].filter((k) => k !== 'Cash')
      .map((k) => ({ label: k, value: now.get(k) ?? 0, other: cmp.get(k) ?? 0 }))
      .sort((a, b) => b.value - a.value || b.other - a.other)
    const keep = sorted.slice(0, sorted.length > n ? n - 1 : n)
    const rest = sorted.slice(keep.length)
    const out: Item[] = [...keep]
    if (rest.length) out.push({
      label: 'Other', value: rest.reduce((t, i) => t + i.value, 0), other: rest.reduce((t, i) => t + i.other, 0),
      tip: rest.map((i) => `${i.label} ${pct(i.value)} / ${pct(i.other)}`).join(' · '),
    })
    if (now.has('Cash') || cmp.has('Cash')) out.push({ label: 'Cash', value: now.get('Cash') ?? 0, other: cmp.get('Cash') ?? 0 })
    return out
  }
  const expo = (r: SimRow) => EXPOSURE[r.id] ?? { sector: 'Other', region: 'Other', country: 'Other' }

  // Fixed income: bond positions looked through to maturity and rating, as a share of the fixed income part.
  const bondsIn = (m: Mode) => rows.filter((r) => BOND_PROFILE[r.id] && wOf(r, m) > 0)
  const fiW = (m: Mode) => bondsIn(m).reduce((t, r) => t + wOf(r, m), 0)
  const share = (m: Mode, f: (id: string) => number) => (fiW(m) ? bondsIn(m).reduce((t, r) => t + wOf(r, m) * f(r.id), 0) / fiW(m) : 0)
  const split = (pickSplit: (id: string) => Record<string, number>, bench: Record<string, number>, buckets: string[]): Item[] => buckets.map((b) => ({
    label: b, value: share(mode, (id) => pickSplit(id)[b] ?? 0), other: against === 'benchmark' ? bench[b] ?? 0 : share('current', (id) => pickSplit(id)[b] ?? 0),
  }))

  return (
    <div className="pb-6 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
        <div className="flex gap-4 text-fg-muted">
          <span className="inline-flex items-center gap-1.5"><span className="size-2.5" style={{ background: ACCENT }} />{mine}</span>
          <span className="inline-flex items-center gap-1.5"><span className="size-2.5" style={{ background: OTHER }} />{theirs}</span>
        </div>
        {mode === 'new' && (
          <div className="flex items-center gap-1.5" role="group" aria-label="Compare with">
            <span className="mr-1 text-fg-muted">Compare with</span>
            {(['benchmark', 'current'] as const).map((a) => (
              <Button key={a} size="xs" aria-pressed={pick === a} className={cn(pick === a && 'border-selected bg-selected/10')} onClick={() => setPick(a)}>
                {a === 'benchmark' ? 'Benchmark' : 'Current'}
              </Button>
            ))}
          </div>
        )}
      </div>
      {/* Three charts per row; the map and the currency bubbles need more width and take the second row together. */}
      <div className="grid grid-cols-3 gap-x-10 gap-y-9 pt-3">
        {/* Same asset allocation block as the overview strip's details on Component allocation and Simulation. */}
        <Block title="By asset class">
          {against === 'current'
            ? <AllocationBlock rows={[{ label: 'Current', alloc: simAlloc(state, 'current') }, { label: 'New', alloc: simAlloc(state, 'new') }]} focus={1} showChange />
            : <AllocationBlock rows={[{ label: mine, alloc: simAlloc(state, mode) }, { label: 'Benchmark', alloc: benchmarkAlloc(state) }]} focus={0} />}
        </Block>
        <Block title="By sector"><InsideBars items={items((r) => expo(r).sector, BENCH_EXPOSURE.sector)} /></Block>
        <Block title="By region"><Waffles items={items((r) => expo(r).region, BENCH_EXPOSURE.region, 6)} /></Block>
        <div className="col-span-3 grid grid-cols-2 gap-x-10">
          <CountryTable items={items((r) => expo(r).country, BENCH_EXPOSURE.country, 100)} theirs={theirs} />
          <Block title="By currency"><Bubbles items={items((r) => r.ccy, BENCH_EXPOSURE.currency, 7)} /></Block>
        </div>
      </div>

      <div className="mt-10 flex items-baseline gap-3 border-b border-line pb-2">
        <h3 className="text-xl font-light text-fg-secondary">Fixed income</h3>
        <span className="text-fg-muted">{fiW(mode) ? `${pct(fiW(mode))} of the portfolio · maturity and rating as a share of the fixed income part · benchmark: ${BOND_BENCHMARK.name}` : 'No fixed income positions'}</span>
      </div>
      {fiW(mode) > 0 && (
        <div className="grid grid-cols-2 gap-x-10 gap-y-9 pt-5">
          <Block title="Maturity"><Columns items={split((id) => BOND_PROFILE[id].maturity, BOND_BENCHMARK.maturity, MATURITY_BUCKETS)} /></Block>
          <Block title="Rating"><InsideBars items={split((id) => BOND_PROFILE[id].rating, BOND_BENCHMARK.rating, RATING_BUCKETS)} /></Block>
        </div>
      )}

      <Performance mode={mode} />
    </div>
  )
}

function Block({ title, className, children }: { title: string; className?: string; children: ReactNode }) {
  return (
    <section className={cn('min-w-0', className)}>
      <h3 className="mb-3 text-xl font-light text-fg-secondary">{title}</h3>
      {children}
    </section>
  )
}

/** A label with its full content on hover (used for Other). */
function Label({ it, className }: { it: Item; className?: string }) {
  if (!it.tip) return <span className={className}>{it.label}</span>
  return (
    <Tooltip.Root>
      <Tooltip.Trigger render={<span />} className={cn('cursor-help underline decoration-dotted underline-offset-2', className)}>{it.label}</Tooltip.Trigger>
      <TooltipPopup>{it.tip}</TooltipPopup>
    </Tooltip.Root>
  )
}
/** Axis maximum: the largest value rounded up to a step of 5 (or 10 above 30). */
const niceMax = (v: number) => { const step = v > 30 ? 10 : 5; return Math.max(step, Math.ceil(v / step) * step) }
const mainColor = (label: string) => (label === 'Cash' ? CLASS_COLOR.Liquidity : ACCENT)
/** Both values: the version on screen in bold, the comparison muted. */
function Pair({ it, className }: { it: Item; className?: string }) {
  return <span className={cn('tabular-nums whitespace-nowrap', className)}><span className="font-semibold">{pct(it.value)}</span> <span className="text-fg-muted">{pct(it.other)}</span></span>
}

/** Horizontal bars, label inside (outside when the bar is short), comparison bar underneath, axis below. */
function InsideBars({ items }: { items: Item[] }) {
  const max = niceMax(Math.max(...items.map((i) => Math.max(i.value, i.other))))
  const step = max > 30 ? 10 : 5
  const ticks = Array.from({ length: max / step + 1 }, (_, i) => i * step)
  return (
    <div>
      <div className="flex flex-col gap-1.5">
        {items.map((it) => {
          const w = (it.value / max) * 100
          const inside = w >= 38
          return (
            <div key={it.label} className="grid grid-cols-[minmax(0,1fr)_6rem] items-center gap-2">
              <div>
                <div className="relative h-4.5">
                  <div className="absolute inset-y-0 left-0" style={{ width: `${w}%`, background: mainColor(it.label) }} />
                  <span className={cn('absolute inset-y-0 flex items-center whitespace-nowrap', inside ? 'text-white' : 'text-fg')} style={{ left: inside ? 6 : `calc(${w}% + 6px)` }}>
                    <Label it={it} />
                  </span>
                </div>
                <div className="mt-px h-1.5" style={{ width: `${(it.other / max) * 100}%`, background: OTHER }} />
              </div>
              <Pair it={it} className="text-right" />
            </div>
          )
        })}
      </div>
      <div className="mt-1.5 grid grid-cols-[minmax(0,1fr)_6rem] gap-2">
        <div className="relative h-4 border-t border-line-strong text-fg-muted">
          {ticks.map((t) => <span key={t} className="absolute top-0.5 -translate-x-1/2 tabular-nums first:translate-x-0" style={{ left: `${(t / max) * 100}%` }}>{t}</span>)}
        </div>
      </div>
    </div>
  )
}

/** Two waffles per region (10 × 10 squares, one per percentage point): the version on screen and the comparison. */
function Waffles({ items }: { items: Item[] }) {
  const grid = (v: number, color: string) => (
    <div className="grid flex-1 grid-cols-10 gap-px">
      {Array.from({ length: 100 }, (_, i) => {
        const k = (9 - Math.floor(i / 10)) * 10 + (i % 10)
        return <span key={i} className="aspect-square" style={{ background: k < Math.round(v) ? color : SOFT }} />
      })}
    </div>
  )
  return (
    <div className="grid grid-cols-3 gap-x-4 gap-y-3">
      {items.map((it) => (
        <div key={it.label} className="min-w-0" role="img" aria-label={`${it.label} ${pct(it.value)}, compared ${pct(it.other)}`}>
          <div className="flex gap-1">{grid(it.value, mainColor(it.label))}{grid(it.other, OTHER)}</div>
          <Label it={it} className="mt-1 block truncate" />
          <Pair it={it} />
        </div>
      ))}
    </div>
  )
}

/** Currencies as pairs of bubbles on a line (area = share): the version on screen and, beside it, the comparison. */
function Bubbles({ items }: { items: Item[] }) {
  const max = Math.max(...items.map((i) => Math.max(i.value, i.other)))
  const d = (v: number) => (v > 0 ? 8 + Math.sqrt(v / max) * 70 : 0)
  return (
    <div className="relative flex items-start justify-around gap-2">
      <span aria-hidden className="absolute inset-x-0 top-[2.75rem] h-px bg-line" />
      {items.map((it) => (
        <div key={it.label} className="relative flex min-w-0 flex-col items-center">
          <div className="flex h-22 items-center gap-0.5">
            <span className="flex shrink-0 items-center justify-center rounded-full text-white tabular-nums" style={{ width: d(it.value), height: d(it.value), background: mainColor(it.label) }}>
              {d(it.value) >= 48 && pct(it.value)}
            </span>
            <span className="shrink-0 rounded-full" style={{ width: d(it.other), height: d(it.other), background: OTHER }} />
          </div>
          <Label it={it} className="mt-1" />
          <Pair it={it} />
        </div>
      ))}
    </div>
  )
}

/** Vertical column pairs per maturity bucket. */
function Columns({ items }: { items: Item[] }) {
  const max = niceMax(Math.max(...items.map((i) => Math.max(i.value, i.other))))
  return (
    <div>
      <div className="flex h-36 items-end gap-3 border-b border-line-strong">
        {items.map((it) => (
          <div key={it.label} className="flex h-full flex-1 items-end justify-center gap-0.5">
            <span className="w-full max-w-7" style={{ height: `${(it.value / max) * 100}%`, background: ACCENT }} title={`${it.label} ${pct(it.value)}`} />
            <span className="w-full max-w-7" style={{ height: `${(it.other / max) * 100}%`, background: OTHER }} title={`${it.label} ${pct(it.other)}`} />
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-3">
        {items.map((it) => <span key={it.label} className="flex-1 text-center"><span className="block text-fg-muted">{it.label}</span><Pair it={it} /></span>)}
      </div>
    </div>
  )
}

/** Rows that are not a country: funds and cash are summed in the note under the table. */
const NO_COUNTRY = new Set(['Diversified (funds)', 'Cash', 'Other countries', 'Other'])
const TOP = 7

/**
 * By country: a ranked table (largest portfolio weight first) with a small bar pair, both weights and the active
 * weight (difference). The first seven countries are shown; the rest sit in an expandable "Other" row.
 */
function CountryTable({ items, theirs }: { items: Item[]; theirs: string }) {
  const [open, setOpen] = useState(false)
  // Ranked by the portfolio's own weight; countries only the comparison holds follow, by their weight there.
  const rows = items.filter((i) => !NO_COUNTRY.has(i.label)).sort((a, b) => b.value - a.value || b.other - a.other)
  const top = rows.slice(0, TOP)
  // The benchmark's own "Other countries" line belongs with the rest.
  const rest = [...rows.slice(TOP), ...items.filter((i) => i.label === 'Other countries')]
  const max = Math.max(1, ...rows.map((i) => Math.max(i.value, i.other)))
  const sumOf = (l: Item[], f: (i: Item) => number) => l.reduce((t, i) => t + f(i), 0)
  const row = (it: Item, indent?: boolean) => {
    const d = it.value - it.other
    return (
      <tr key={it.label} className="border-b border-line">
        <td className={cn('py-1.5 pr-2', indent && 'pl-4 text-fg-secondary')}>{it.label}</td>
        <td className="py-1.5 pr-3">
          <div className="h-2" style={{ width: `${(it.value / max) * 100}%`, background: ACCENT }} />
          <div className="mt-px h-1" style={{ width: `${(it.other / max) * 100}%`, background: OTHER }} />
        </td>
        <td className="py-1.5 text-right font-semibold tabular-nums">{pct(it.value)}</td>
        <td className="py-1.5 text-right text-fg-muted tabular-nums">{pct(it.other)}</td>
        <td className={cn('py-1.5 text-right tabular-nums', d >= 0 ? 'text-fg' : 'text-fg-muted')}>{Math.abs(d) < 0.05 ? '—' : `${d > 0 ? '+' : '−'}${Math.abs(d).toFixed(1)}`}</td>
      </tr>
    )
  }
  return (
    <section className="min-w-0">
      <h3 className="mb-3 text-xl font-light text-fg-secondary">By country</h3>
      <table className="w-full table-fixed border-collapse">
        <colgroup><col className="w-[30%]" /><col /><col className="w-[15%]" /><col className="w-[16%]" /><col className="w-[12%]" /></colgroup>
        <thead>
          <tr className="border-b border-line text-fg-muted">
            <th className="pb-1.5 text-left font-normal">Country</th><th />
            <th className="pb-1.5 text-right font-normal">Portfolio</th>
            <th className="pb-1.5 text-right font-normal">{theirs}</th>
            <th className="pb-1.5 text-right font-normal">Active</th>
          </tr>
        </thead>
        <tbody>
          {top.map((it) => row(it))}
          {rest.length > 0 && (
            <tr className="border-b border-line">
              <td colSpan={5} className="py-1.5">
                <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="grid w-full cursor-pointer grid-cols-[30%_1fr_15%_16%_12%] items-center text-left hover:bg-surface-subtle">
                  <span className="inline-flex items-center gap-1 text-link">{open ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}Other · {rest.length} more</span>
                  <span />
                  <span className="text-right font-semibold tabular-nums">{pct(sumOf(rest, (i) => i.value))}</span>
                  <span className="text-right text-fg-muted tabular-nums">{pct(sumOf(rest, (i) => i.other))}</span>
                  <span />
                </button>
              </td>
            </tr>
          )}
          {open && rest.map((it) => row(it, true))}
        </tbody>
      </table>
    </section>
  )
}

/** Sample monthly returns in % (supplied by the bank in reality), 1 Oct 2025 – 30 Sep 2026. */
const MONTHS = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep']
const RETURNS: { name: string; color: string; main?: boolean; r: number[] }[] = [
  { name: 'Portfolio', color: ACCENT, main: true, r: [0.9, -0.4, 1.2, 0.6, -1.1, 0.8, 1.5, -0.3, 0.7, 1.1, -0.6, 1.4] },
  { name: 'Benchmark', color: OTHER, main: true, r: [1.2, -0.8, 1.6, 0.9, -1.8, 1.1, 2.0, -0.9, 1.0, 1.4, -1.2, 1.9] },
  { name: 'LUX KEY – EUR Equity Value', color: CLASS_COLOR.Equity, r: [1.4, -0.9, 1.8, 0.4, -1.6, 1.2, 2.2, -0.6, 0.5, 1.6, -1.1, 2.0] },
  { name: 'LUX IM – Global Bond', color: CLASS_COLOR.Bonds, r: [0.3, 0.2, 0.4, -0.2, 0.3, 0.1, 0.2, 0.3, 0.4, -0.1, 0.2, 0.3] },
  { name: 'LUX IM – Active Defender', color: CLASS_COLOR.Alternatives, r: [0.5, 0.1, 0.6, 0.4, -0.3, 0.5, 0.7, 0.2, 0.3, 0.6, 0.0, 0.5] },
]
const cumulative = (r: number[]) => r.reduce<number[]>((acc, x) => [...acc, ((1 + acc[acc.length - 1] / 100) * (1 + x / 100) - 1) * 100], [0])

/**
 * Performance over the last 12 months: cumulative return of the portfolio and its benchmark, building blocks on
 * request, all in one chart. Only the published version (Current) has performance; figures come from the bank and
 * are never calculated or filled in here.
 */
function Performance({ mode }: { mode: Mode }) {
  const { state, update } = usePortfolio()
  const [blocks, setBlocks] = useState(false)
  const [period, setPeriod] = useState<'YTD' | '1Y'>('1Y')
  const entry = getBook().find((e) => e.id === state.book.id)
  const hasData = !state.book.creating && (!entry || entry.perf1y !== undefined)
  const head = <h3 className="text-xl font-light text-fg-secondary">Performance</h3>
  if (mode === 'new' || !hasData) {
    return (
      <section className="mt-10 border-t border-line pt-4">
        {head}
        <p className="mt-2 text-fg-muted">
          {mode === 'new' ? 'Performance exists only for the published version. ' : 'No performance data has been received for this model portfolio yet.'}
          {mode === 'new' && hasData && <Button variant="link" className="text-xs" onClick={() => update((s) => { s.sim.mode = 'current' })}>Show Current</Button>}
        </p>
      </section>
    )
  }
  const from = period === 'YTD' ? MONTHS.indexOf('Jan') : 0
  const series = RETURNS.filter((x) => x.main || blocks).map((x) => ({ ...x, c: cumulative(x.r.slice(from)) }))
  const labels = ['', ...MONTHS.slice(from)]
  const all = series.flatMap((x) => x.c)
  const lo = Math.floor(Math.min(0, ...all) / 2) * 2
  const hi = Math.ceil(Math.max(...all) / 2) * 2
  const W = 1000, H = 240, L = 36, B = 22, R = 8
  const x = (i: number) => L + (i / (labels.length - 1)) * (W - L - R)
  const y = (v: number) => (H - B) - ((v - lo) / (hi - lo)) * (H - B - 8)
  const ticks = Array.from({ length: (hi - lo) / 2 + 1 }, (_, i) => lo + i * 2)
  return (
    <section className="mt-10 border-t border-line pt-4">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div className="flex items-baseline gap-4">
          {head}
          {series.filter((s) => s.main).map((s) => (
            <span key={s.name} className="inline-flex items-center gap-1.5">
              <span className="h-0.5 w-4" style={{ background: s.color }} />{s.name}
              <strong className="font-semibold tabular-nums">{(s.c[s.c.length - 1] >= 0 ? '+' : '') + s.c[s.c.length - 1].toFixed(2)}%</strong>
            </span>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <label className="inline-flex cursor-pointer items-center gap-1.5"><Checkbox checked={blocks} onCheckedChange={setBlocks} />Show building blocks</label>
          <span className="inline-flex gap-1">
            {(['YTD', '1Y'] as const).map((p) => <Button key={p} size="xs" aria-pressed={period === p} className={cn(period === p && 'border-selected bg-selected/10')} onClick={() => setPeriod(p)}>{p}</Button>)}
          </span>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 h-auto w-full" role="img" aria-label="Cumulative performance">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke={t === 0 ? '#8E8D83' : '#E0DFD7'} strokeWidth={t === 0 ? 1 : 0.75} />
            <text x={L - 6} y={y(t) + 3.5} textAnchor="end" className="fill-fg-muted text-[11px]">{t}%</text>
          </g>
        ))}
        {labels.map((l, i) => l && <text key={l} x={x(i)} y={H - 4} textAnchor="middle" className="fill-fg-muted text-[11px]">{l}</text>)}
        {series.map((s) => (
          <polyline key={s.name} fill="none" stroke={s.color} strokeWidth={s.main ? (s.name === 'Portfolio' ? 2.5 : 2) : 1.25} strokeDasharray={s.main ? undefined : '4 3'}
            points={s.c.map((v, i) => `${x(i)},${y(v)}`).join(' ')}>
            <title>{s.name}</title>
          </polyline>
        ))}
      </svg>
      {blocks && (
        <div className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-fg-muted">
          {series.filter((s) => !s.main).map((s) => <span key={s.name} className="inline-flex items-center gap-1.5"><span className="h-0 w-4 border-t-2 border-dashed" style={{ borderColor: s.color }} />{s.name} {(s.c[s.c.length - 1] >= 0 ? '+' : '') + s.c[s.c.length - 1].toFixed(2)}%</span>)}
        </div>
      )}
      <p className="mt-2 text-fg-muted">Cumulative return, {period === 'YTD' ? 'year to date' : 'last 12 months'}, as of {BOOK_AS_OF}. Figures supplied by the bank.</p>
    </section>
  )
}
