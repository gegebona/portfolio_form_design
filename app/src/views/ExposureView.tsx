import { Tooltip } from '@base-ui/react/tooltip'
import { useState, type ReactNode } from 'react'
import { BENCH_EXPOSURE, BOND_BENCHMARK, BOND_PROFILE, CLASS_COLOR, EXPOSURE, MATURITY_BUCKETS, RATING_BUCKETS } from '../data/data'
import { Button } from '../components/ui/button'
import { Checkbox } from '../components/ui/selection'
import { TooltipPopup } from '../components/ui/tag'
import { WORLD, WORLD_VIEWBOX } from '../data/worldMap'
import { AllocationBlock } from './Overview'
import { cn } from '../lib/cn'
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
const OTHER = 'var(--color-ubs-background-tags-08)'
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
        <div className="col-span-3 grid grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] gap-x-10">
          <CountryMap items={items((r) => expo(r).country, BENCH_EXPOSURE.country, 40)} theirs={theirs} />
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
          <Block title="Rating"><InsideBars items={split((id) => BOND_PROFILE[id].rating, BOND_BENCHMARK.rating, RATING_BUCKETS)} /></Block>
          <div className="flex flex-col gap-7">
            <Kpi title="Duration" value={share(mode, (id) => BOND_PROFILE[id].duration)} other={against === 'benchmark' ? BOND_BENCHMARK.duration : share('current', (id) => BOND_PROFILE[id].duration)} theirs={theirs} scale={10} fmt={(v) => `${v.toFixed(1)} yrs`} />
            <Kpi title="Yield to maturity" value={share(mode, (id) => BOND_PROFILE[id].ytm)} other={against === 'benchmark' ? BOND_BENCHMARK.ytm : share('current', (id) => BOND_PROFILE[id].ytm)} theirs={theirs} scale={6} fmt={(v) => `${v.toFixed(2)}%`} />
          </div>
        </div>
      )}
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
            <span className="flex items-center justify-center rounded-full text-white tabular-nums" style={{ width: d(it.value), height: d(it.value), background: mainColor(it.label) }}>
              {d(it.value) >= 48 && pct(it.value)}
            </span>
            <span className="rounded-full" style={{ width: d(it.other), height: d(it.other), background: OTHER }} />
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

/** Key figure: value on the right of the title, a bar for it and a marker for the comparison, one explaining line. */
function Kpi({ title, value, other, theirs, scale, fmt }: { title: string; value: number; other: number; theirs: string; scale: number; fmt: (v: number) => string }) {
  const at = (v: number) => `${Math.min(100, (v / scale) * 100)}%`
  const diff = value - other
  return (
    <section>
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-xl font-light text-fg-secondary">{title}</h3>
        <span className="text-xl tabular-nums">{fmt(value)}</span>
      </div>
      <div className="relative mt-2 h-4" style={{ background: SOFT }}>
        <div className="absolute inset-y-0 left-0" style={{ width: at(value), background: ACCENT }} />
        <div className="absolute inset-y-0 left-0 h-1.5 translate-y-full" style={{ width: at(other), background: OTHER }} />
      </div>
      <p className="mt-2 text-sm text-fg-secondary">
        {Math.abs(diff) < 0.005 ? `Same as ${theirs.toLowerCase() === 'current' ? 'Current' : 'the benchmark'}.` : `${fmt(Math.abs(diff)).replace(' yrs', ' years')} ${diff < 0 ? 'below' : 'above'} ${theirs === 'Current' ? 'Current' : 'the benchmark'} (${fmt(other)}).`}
      </p>
    </section>
  )
}

/** Countries in the portfolio, by ISO code on the map. Funds and cash have no country. */
const ISO: Record<string, string> = {
  'United States': 'USA', Netherlands: 'NLD', Denmark: 'DNK', Germany: 'DEU', Switzerland: 'CHE', France: 'FRA', Peru: 'PER', China: 'CHN',
  Chile: 'CHL', Mexico: 'MEX', India: 'IND', 'South Africa': 'ZAF', 'United Kingdom': 'GBR', Ireland: 'IRL', Japan: 'JPN', Canada: 'CAN',
  Australia: 'AUS', Sweden: 'SWE',
}
const REGIONS = [['ALL', 'All'], ['NA', 'NA'], ['LATAM', 'LATAM'], ['EMEA', 'EMEA'], ['APAC', 'APAC']] as const
type RegionId = (typeof REGIONS)[number][0]
/** Where a region's total is written on the map (viewBox units). */
const REGION_AT: Record<Exclude<RegionId, 'ALL'>, [number, number]> = { NA: [215, 115], LATAM: [320, 285], EMEA: [530, 165], APAC: [770, 175] }

/**
 * By country, as in the team's dashboards: a world map, countries shaded by their weight (darker = more), and region
 * check boxes that bring one region forward with both totals written on it. Hover a country for both weights.
 */
function CountryMap({ items, theirs }: { items: Item[]; theirs: string }) {
  const [region, setRegion] = useState<RegionId>('ALL')
  const byIso = new Map(items.filter((i) => ISO[i.label]).map((i) => [ISO[i.label], i]))
  const max = Math.max(1, ...[...byIso.values()].map((i) => i.value))
  const regionOf = new Map(WORLD.map(([iso, , reg]) => [iso, reg]))
  const total = (r: string, f: (i: Item) => number) => [...byIso.entries()].filter(([iso]) => regionOf.get(iso) === r).reduce((t, [, i]) => t + f(i), 0)
  const unmapped = items.filter((i) => !ISO[i.label]).reduce((t, i) => t + i.value, 0)
  return (
    <section className="min-w-0">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="text-xl font-light text-fg-secondary">By country</h3>
        <div className="flex flex-wrap gap-x-3.5 gap-y-1" role="radiogroup" aria-label="Region">
          {REGIONS.map(([id, label]) => (
            <label key={id} className="inline-flex cursor-pointer items-center gap-1.5">
              <Checkbox checked={region === id} onCheckedChange={() => setRegion(id)} />
              {label}
            </label>
          ))}
        </div>
      </div>
      <svg viewBox={WORLD_VIEWBOX} className="h-auto w-full" role="img" aria-label="Portfolio weight by country">
        {WORLD.map(([iso, name, reg, d]) => {
          const hit = byIso.get(iso)
          const held = !!hit && hit.value > 0.004
          const dim = region !== 'ALL' && reg !== region
          return (
            <path key={iso} d={d} fill={held ? ACCENT : hit ? OTHER : SOFT} fillOpacity={dim ? 0.25 : held ? 0.35 + 0.65 * (hit.value / max) : 1} stroke="#fff" strokeWidth={0.6}>
              <title>{hit ? `${name} ${pct(hit.value)} · ${theirs} ${pct(hit.other)}` : name}</title>
            </path>
          )
        })}
        {region !== 'ALL' && (
          <text x={REGION_AT[region][0]} y={REGION_AT[region][1]} textAnchor="middle" className="fill-fg text-[40px] font-light" paintOrder="stroke" stroke="#fff" strokeWidth={6}>
            {pct(total(region, (i) => i.value))}
            <tspan className="fill-fg-muted text-[24px]"> / {pct(total(region, (i) => i.other))}</tspan>
          </text>
        )}
      </svg>
      <p className="mt-1.5 text-fg-muted">
        Navy: held, darker = larger weight. Pale blue: only in the comparison. Hover a country for both weights.{unmapped > 0.004 && ` ${pct(unmapped)} (funds and cash) has no single country.`}
      </p>
    </section>
  )
}
