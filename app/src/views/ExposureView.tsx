import { Tooltip } from '@base-ui/react/tooltip'
import { useState, type ReactNode } from 'react'
import { BENCH_EXPOSURE, BOND_BENCHMARK, BOND_PROFILE, CLASS_COLOR, EXPOSURE, MATURITY_BUCKETS, RATING_BUCKETS } from '../data/data'
import { Button } from '../components/ui/button'
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
// Blue is kept for what can be clicked or is selected (and for Equity); data series use neutrals: charcoal for the
// version on screen, warm grey for what it is compared with.
const ACCENT = 'var(--color-ubs-background-ui-80)'
const OTHER = 'var(--color-ubs-text-disabled)'
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
        <Block title="By sector"><InsideBars items={items((r) => expo(r).sector, BENCH_EXPOSURE.sector, 7)} mine={mine} theirs={theirs} /></Block>
        <Block title="By region"><Waffles items={items((r) => expo(r).region, BENCH_EXPOSURE.region, 6)} /></Block>
        <div className="col-span-3 grid grid-cols-2 gap-x-10">
          <CountryTable items={items((r) => expo(r).country, BENCH_EXPOSURE.country, 100)} mine={mine} theirs={theirs} />
          <Block title="By currency"><Bubbles items={items((r) => r.ccy, BENCH_EXPOSURE.currency, 7)} /></Block>
        </div>
      </div>

      <div className="mt-10 flex items-baseline gap-3 border-b border-line pb-2">
        <h3 className="text-xl font-light text-fg-secondary">Fixed income</h3>
        <span className="text-fg-muted">{fiW(mode) ? `${pct(fiW(mode))} of the portfolio · maturity and rating as a share of the fixed income part · benchmark: ${BOND_BENCHMARK.name}` : 'No fixed income positions'}</span>
      </div>
      {fiW(mode) > 0 && (
        <div className="grid grid-cols-3 gap-x-10 gap-y-9 pt-5">
          <Block title="Maturity"><Columns items={split((id) => BOND_PROFILE[id].maturity, BOND_BENCHMARK.maturity, MATURITY_BUCKETS)} /></Block>
          <Block title="Rating"><InsideBars items={split((id) => BOND_PROFILE[id].rating, BOND_BENCHMARK.rating, RATING_BUCKETS)} mine={mine} theirs={theirs} /></Block>
          <Block title="Yield to maturity">
            <InsideBars items={[{
              label: 'Fixed income part', value: share(mode, (id) => BOND_PROFILE[id].ytm),
              other: against === 'benchmark' ? BOND_BENCHMARK.ytm : share('current', (id) => BOND_PROFILE[id].ytm),
            }]} mine={mine} theirs={theirs} />
            <p className="mt-2 text-fg-muted">Weighted average yield if held to maturity, in % per year.</p>
          </Block>
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

/**
 * Ranked bar table, same look as By country: label, a bar pair (navy = version on screen, grey = comparison, both on
 * one scale), then both values in aligned columns.
 */
function InsideBars({ items, mine, theirs }: { items: Item[]; mine: string; theirs: string }) {
  const max = Math.max(1, ...items.map((i) => Math.max(i.value, i.other)))
  return (
    <table className="w-full table-fixed border-collapse">
      <colgroup><col className="w-[36%]" /><col /><col className="w-[14%]" /><col className="w-[18%]" /></colgroup>
      <thead>
        <tr className="border-b border-line text-fg-muted">
          <th className="pb-1.5" /><th />
          <th className="pb-1.5 text-right font-normal">{mine}</th>
          <th className="pb-1.5 text-right font-normal">{theirs}</th>
        </tr>
      </thead>
      <tbody>
        {items.map((it) => (
          <tr key={it.label} className="border-b border-line">
            <td className="truncate py-1.5 pr-2"><Label it={it} /></td>
            <td className="py-1.5 pr-3">
              <div className="h-2" style={{ width: `${(it.value / max) * 100}%`, background: mainColor(it.label) }} />
              <div className="mt-px h-1" style={{ width: `${(it.other / max) * 100}%`, background: OTHER }} />
            </td>
            <td className="py-1.5 text-right font-semibold tabular-nums">{pct(it.value)}</td>
            <td className="py-1.5 text-right text-fg-muted tabular-nums">{pct(it.other)}</td>
          </tr>
        ))}
      </tbody>
    </table>
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
function CountryTable({ items, mine, theirs }: { items: Item[]; mine: string; theirs: string }) {
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
            <th className="pb-1.5 text-right font-normal">{mine}</th>
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

/** Sample daily performance (supplied by the bank in reality): weekdays from 1 Oct 2024 to 30 Sep 2026. */
type Day = { d: Date; p: number; b: number }
const DAYS: Day[] = (() => {
  // Deterministic pseudo-random daily returns (mulberry32), the benchmark moving with the portfolio.
  let seed = 20240930
  const rnd = () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
  const out: Day[] = []
  for (let t = Date.UTC(2024, 9, 1); t <= Date.UTC(2026, 8, 30); t += 86400000) {
    const d = new Date(t)
    if (d.getUTCDay() === 0 || d.getUTCDay() === 6) continue
    const market = (rnd() - 0.5) * 1.6
    out.push({ d, p: 0.028 + market * 0.75 + (rnd() - 0.5) * 0.35, b: 0.033 + market + (rnd() - 0.5) * 0.25 })
  }
  return out
})()
const iso = (d: Date) => d.toISOString().slice(0, 10)
const dmy = (d: Date) => d.toLocaleDateString('en-GB', { timeZone: 'UTC' })
const FIRST = iso(DAYS[0].d)
const LAST = iso(DAYS[DAYS.length - 1].d)
const back = (months: number) => { const d = new Date(DAYS[DAYS.length - 1].d); d.setUTCMonth(d.getUTCMonth() - months); return iso(d) }
const PRESETS: [string, () => string][] = [['1M', () => back(1)], ['3M', () => back(3)], ['6M', () => back(6)], ['YTD', () => `${LAST.slice(0, 4)}-01-01`], ['1Y', () => back(12)], ['Max', () => FIRST]]

/**
 * Performance between two chosen dates (daily data): cumulative return of the portfolio and its benchmark. Only the
 * published version (Current) has performance; figures come from the bank and are never calculated or filled in here.
 */
function Performance({ mode }: { mode: Mode }) {
  const { state, update } = usePortfolio()
  const [from, setFrom] = useState(back(12))
  const [to, setTo] = useState(LAST)
  const [hover, setHover] = useState<number | null>(null)
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
  const days = DAYS.filter((x) => iso(x.d) >= from && iso(x.d) <= to)
  // Cumulative return from the first day of the range (that day's return not counted).
  const cum = (k: 'p' | 'b') => days.reduce<number[]>((acc, x, i) => [...acc, i === 0 ? 0 : ((1 + acc[i - 1] / 100) * (1 + x[k] / 100) - 1) * 100], [])
  const series = [{ name: 'Portfolio', color: ACCENT, c: cum('p'), w: 2.25 }, { name: 'Benchmark', color: OTHER, c: cum('b'), w: 1.75 }]
  const all = series.flatMap((x) => x.c)
  const step = Math.max(1, Math.ceil((Math.max(...all, 0) - Math.min(...all, 0)) / 5))
  const lo = Math.floor(Math.min(0, ...all) / step) * step
  const hi = Math.ceil(Math.max(0.5, ...all) / step) * step
  const W = 1000, H = 240, L = 40, B = 22, R = 8
  const n = Math.max(1, days.length - 1)
  const x = (i: number) => L + (i / n) * (W - L - R)
  const y = (v: number) => (H - B) - ((v - lo) / (hi - lo)) * (H - B - 8)
  const ticks = Array.from({ length: Math.round((hi - lo) / step) + 1 }, (_, i) => lo + i * step)
  const labels = Array.from({ length: 6 }, (_, k) => Math.round((k / 5) * n))
  const end = (c: number[]) => c[c.length - 1] ?? 0
  const sign = (v: number) => (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(2) + '%'
  const dateInput = 'h-7 rounded-sm border border-control bg-surface px-2 text-xs text-fg outline-none focus:border-control-active'
  return (
    <section className="mt-10 border-t border-line pt-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-4">
          {head}
          {series.map((s) => (
            <span key={s.name} className="inline-flex items-center gap-1.5">
              <span className="h-0.5 w-4" style={{ background: s.color }} />{s.name}<strong className="font-semibold tabular-nums">{sign(end(s.c))}</strong>
            </span>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex gap-1">
            {PRESETS.map(([label, start]) => {
              const on = from === start() && to === LAST
              return <Button key={label} size="xs" aria-pressed={on} className={cn(on && 'border-selected bg-selected/10')} onClick={() => { setFrom(start()); setTo(LAST) }}>{label}</Button>
            })}
          </span>
          <label className="ml-2 inline-flex items-center gap-1.5 text-fg-muted">From
            <input type="date" className={dateInput} value={from} min={FIRST} max={to} onChange={(e) => e.target.value && setFrom(e.target.value)} />
          </label>
          <label className="inline-flex items-center gap-1.5 text-fg-muted">to
            <input type="date" className={dateInput} value={to} min={from} max={LAST} onChange={(e) => e.target.value && setTo(e.target.value)} />
          </label>
        </div>
      </div>
      {days.length < 2 ? <p className="mt-4 text-fg-muted">Choose a range of at least two days.</p> : (
        <svg
          viewBox={`0 0 ${W} ${H}`} className="mt-3 h-auto w-full" role="img" aria-label="Cumulative performance"
          onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); const px = ((e.clientX - r.left) / r.width) * W; setHover(Math.max(0, Math.min(n, Math.round(((px - L) / (W - L - R)) * n)))) }}
          onMouseLeave={() => setHover(null)}
        >
          {ticks.map((t) => (
            <g key={t}>
              <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke={t === 0 ? '#8E8D83' : '#E0DFD7'} strokeWidth={t === 0 ? 1 : 0.75} />
              <text x={L - 6} y={y(t) + 3.5} textAnchor="end" className="fill-fg-muted text-[11px]">{t}%</text>
            </g>
          ))}
          {labels.map((i) => <text key={i} x={x(i)} y={H - 4} textAnchor={i === 0 ? 'start' : i === n ? 'end' : 'middle'} className="fill-fg-muted text-[11px]">{dmy(days[i].d)}</text>)}
          {series.map((s) => <polyline key={s.name} fill="none" stroke={s.color} strokeWidth={s.w} strokeLinejoin="round" points={s.c.map((v, i) => `${x(i)},${y(v)}`).join(' ')} />)}
          {hover !== null && (
            <g>
              <line x1={x(hover)} x2={x(hover)} y1={8} y2={H - B} stroke="#404040" strokeDasharray="3 3" strokeWidth={0.75} />
              <g transform={`translate(${Math.min(x(hover) + 8, W - 190)}, 12)`}>
                <rect width={180} height={52} rx={2} fill="#fff" stroke="#E0DFD7" />
                <text x={8} y={16} className="fill-fg text-[11px] font-semibold">{dmy(days[hover].d)}</text>
                {series.map((s, k) => <text key={s.name} x={8} y={31 + k * 14} className="text-[11px]" fill={s.name === 'Portfolio' ? '#1C1C1C' : '#5A5D5C'}>{s.name} {sign(s.c[hover])}</text>)}
              </g>
            </g>
          )}
        </svg>
      )}
      <p className="mt-2 text-fg-muted">Cumulative return from {dmy(new Date(from))} to {dmy(new Date(to))}. Daily figures supplied by the bank, available from {dmy(DAYS[0].d)}.</p>
    </section>
  )
}
