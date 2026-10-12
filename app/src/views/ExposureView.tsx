import { Tooltip } from '@base-ui/react/tooltip'
import { useState, type ReactNode } from 'react'
import { BOND_BENCHMARK, BOND_PROFILE, CLASS_COLOR, EXPOSURE, MATURITY_BUCKETS, RATING_BUCKETS } from '../data/data'
import { Checkbox } from '../components/ui/selection'
import { TooltipPopup } from '../components/ui/tag'
import { WORLD, WORLD_VIEWBOX } from '../data/worldMap'
import { AllocationBlock } from './Overview'
import { cn } from '../lib/cn'
import { pct, simAlloc, usePortfolio, type SimRow } from '../state/portfolio'

type Mode = 'current' | 'new'
/** One item of a chart: its value in the version on screen and, for New, in Current. */
type Item = { label: string; value: number; before: number; tip?: string }

/*
 * Chart language shared with the team's other dashboards: open sections with a light title (no boxes), soft bars
 * with the label inside, waffles for regions, bubbles for currencies. Navy for waffles, bubbles and columns, asset
 * classes in their own colours, cash in green. In New, small grey figures give the change against Current.
 */
const ACCENT = 'var(--color-ubs-chart-19)'
const SOFT = 'var(--color-ubs-background-tags-22)'

export function ExposureView({ mode }: { mode: Mode }) {
  const { state } = usePortfolio()
  const rows = state.sim.rows
  const compare = mode === 'new'
  const wOf = (r: SimRow, m: Mode) => (m === 'current' ? r.w : r.removed ? 0 : r.nw)
  const sum = (key: (r: SimRow) => string, m: Mode) => {
    const out = new Map<string, number>()
    rows.forEach((r) => { const w = wOf(r, m); if (w > 0) out.set(key(r), (out.get(key(r)) ?? 0) + w) })
    return out
  }
  /** Largest first, at most `n` items; the rest grouped as Other (members on hover). Cash always last. */
  const items = (key: (r: SimRow) => string, n = 6): Item[] => {
    const now = sum(key, mode)
    const then = sum(key, 'current')
    const sorted = [...new Set([...now.keys(), ...then.keys()])].filter((k) => k !== 'Cash').map((k) => [k, now.get(k) ?? 0] as [string, number]).sort((a, b) => b[1] - a[1])
    const keep = sorted.slice(0, sorted.length > n ? n - 1 : n)
    const rest = sorted.slice(keep.length)
    const out: Item[] = keep.map(([k, v]) => ({ label: k, value: v, before: then.get(k) ?? 0 }))
    if (rest.length) out.push({
      label: 'Other', value: rest.reduce((t, [, v]) => t + v, 0), before: rest.reduce((t, [k]) => t + (then.get(k) ?? 0), 0),
      tip: rest.map(([k, v]) => `${k} ${pct(v)}`).join(' · '),
    })
    if (now.has('Cash') || then.has('Cash')) out.push({ label: 'Cash', value: now.get('Cash') ?? 0, before: then.get('Cash') ?? 0 })
    return out
  }
  const expo = (r: SimRow) => EXPOSURE[r.id] ?? { sector: 'Other', region: 'Other', country: 'Other' }

  const alloc = simAlloc(state, mode)
  const allocBefore = simAlloc(state, 'current')

  // Fixed income: bond positions looked through to maturity and rating, as a share of the fixed income part.
  const bondsIn = (m: Mode) => rows.filter((r) => BOND_PROFILE[r.id] && wOf(r, m) > 0)
  const fiW = (m: Mode) => bondsIn(m).reduce((t, r) => t + wOf(r, m), 0)
  const split = (pick: (id: string) => Record<string, number>, buckets: string[]): Item[] => buckets.map((b) => {
    const share = (m: Mode) => (fiW(m) ? bondsIn(m).reduce((t, r) => t + wOf(r, m) * (pick(r.id)[b] ?? 0), 0) / fiW(m) : 0)
    return { label: b, value: share(mode), before: share('current') }
  })
  const avg = (f: (id: string) => number) => (fiW(mode) ? bondsIn(mode).reduce((t, r) => t + wOf(r, mode) * f(r.id), 0) / fiW(mode) : 0)

  return (
    <div className="pb-6 text-xs">
      {compare && <p className="pt-3 text-right text-fg-muted">New version · small grey figures show the change against Current</p>}
      {/* Three charts per row; the map and the currency bubbles need more width and take the second row together. */}
      <div className="grid grid-cols-3 gap-x-10 gap-y-9 pt-2">
        {/* Same asset allocation block as the overview strip's details on Component allocation and Simulation. */}
        <Block title="By asset class">
          <AllocationBlock rows={[{ label: 'Current', alloc: allocBefore }, { label: 'New', alloc }]} focus={compare ? 1 : 0} showChange={compare} />
        </Block>
        <Block title="By sector"><InsideBars items={items((r) => expo(r).sector)} compare={compare} /></Block>
        <Block title="By region"><Waffles items={items((r) => expo(r).region, 5)} compare={compare} /></Block>
        <div className="col-span-3 grid grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] gap-x-10">
          <CountryMap weights={sum((r) => expo(r).country, mode)} />
          <Block title="By currency"><Bubbles items={items((r) => r.ccy, 7)} compare={compare} /></Block>
        </div>
      </div>

      <div className="mt-10 flex items-baseline gap-3 border-b border-line pb-2">
        <h3 className="text-xl font-light text-fg-secondary">Fixed income</h3>
        <span className="text-fg-muted">{fiW(mode) ? `${pct(fiW(mode))} of the portfolio · maturity and rating as a share of the fixed income part` : 'No fixed income positions'}</span>
      </div>
      {fiW(mode) > 0 && (
        <div className="grid grid-cols-3 gap-x-10 gap-y-9 pt-5">
          <Block title="Maturity"><Columns items={split((id) => BOND_PROFILE[id].maturity, MATURITY_BUCKETS)} compare={compare} /></Block>
          <Block title="Rating"><InsideBars items={split((id) => BOND_PROFILE[id].rating, RATING_BUCKETS)} compare={compare} /></Block>
          <div className="flex flex-col gap-7">
          <Kpi title="Duration" value={avg((id) => BOND_PROFILE[id].duration)} bench={BOND_BENCHMARK.duration} scale={10} fmt={(v) => `${v.toFixed(1)} yrs`}
            note={(d) => `The portfolio's duration is ${Math.abs(d).toFixed(1)} years ${d < 0 ? 'shorter' : 'longer'} than the benchmark's, so it is ${d < 0 ? 'less' : 'more'} sensitive to interest rate changes.`} />
          <Kpi title="Yield to maturity" value={avg((id) => BOND_PROFILE[id].ytm)} bench={BOND_BENCHMARK.ytm} scale={6} fmt={(v) => `${v.toFixed(2)}%`}
            note={(d) => `Held to maturity, the fixed income part would yield ${Math.abs(d).toFixed(2)} points ${d < 0 ? 'less' : 'more'} per year than the benchmark.`} />
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

const delta = (it: Item) => {
  const d = it.value - it.before
  return Math.abs(d) < 0.05 ? '' : `${d > 0 ? '+' : '−'}${Math.abs(Math.round(d * 10) / 10)}`
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

/** Horizontal bars with the label inside, an axis underneath; in New a pale Current bar under each. */
function InsideBars({ items, compare }: { items: Item[]; compare: boolean }) {
  const max = niceMax(Math.max(...items.map((i) => Math.max(i.value, compare ? i.before : 0))))
  const ticks = Array.from({ length: max / (max > 30 ? 10 : 5) + 1 }, (_, i) => i * (max > 30 ? 10 : 5))
  return (
    <div>
      <div className="flex flex-col gap-1">
        {items.map((it) => {
          const w = (it.value / max) * 100
          // The label sits inside its bar (dark on the soft fill, as in the team's dashboards); a short bar keeps it just outside.
          const inside = w >= 38
          return (
          <div key={it.label} className="grid grid-cols-[minmax(0,1fr)_4.5rem] items-center gap-2">
            <div>
              <div className="relative h-5">
                <div className="absolute inset-y-0 left-0" style={{ width: `${w}%`, background: it.label === 'Cash' ? CLASS_COLOR.Liquidity : SOFT }} />
                <span className={cn('absolute inset-y-0 flex items-center whitespace-nowrap', inside && it.label === 'Cash' ? 'text-white' : 'text-fg')} style={{ left: inside ? 6 : `calc(${w}% + 6px)` }}>
                  <Label it={it} />
                </span>
              </div>
            </div>
            <span className="text-right tabular-nums">
              <span className="font-semibold">{pct(it.value)}</span>
              {compare && delta(it) && <span className="ml-1 text-fg-muted">{delta(it)}</span>}
            </span>
          </div>
          )
        })}
      </div>
      <div className="mt-1.5 grid grid-cols-[minmax(0,1fr)_4.5rem] gap-2">
        <div className="relative h-4 border-t border-line-strong text-fg-muted">
          {ticks.map((t) => <span key={t} className="absolute top-0.5 -translate-x-1/2 tabular-nums first:translate-x-0" style={{ left: `${(t / max) * 100}%` }}>{t}</span>)}
        </div>
      </div>
    </div>
  )
}

/** One waffle per region: 10 × 10 squares, one square per percentage point. */
function Waffles({ items, compare }: { items: Item[]; compare: boolean }) {
  return (
    <div className="grid grid-cols-3 gap-x-4 gap-y-3">
      {items.map((it) => {
        const n = Math.round(it.value)
        return (
          <div key={it.label} className="max-w-28 min-w-0">
            <div role="img" aria-label={`${it.label} ${pct(it.value)}`} className="grid grid-cols-10 gap-px">
              {Array.from({ length: 100 }, (_, i) => {
                // Filled from the bottom row up.
                const k = (9 - Math.floor(i / 10)) * 10 + (i % 10)
                return <span key={i} className="aspect-square" style={{ background: k < n ? (it.label === 'Cash' ? CLASS_COLOR.Liquidity : ACCENT) : SOFT }} />
              })}
            </div>
            <div className="mt-1.5 flex items-baseline justify-between gap-1">
              <Label it={it} />
              <span className="shrink-0 font-semibold tabular-nums">{pct(it.value)}</span>
            </div>
            {compare && delta(it) && <div className="text-right text-fg-muted tabular-nums">{delta(it)}</div>}
          </div>
        )
      })}
    </div>
  )
}

/** Currencies as bubbles on a line, area = share; in New a pale Current bubble beside each. */
function Bubbles({ items, compare }: { items: Item[]; compare: boolean }) {
  const max = Math.max(...items.map((i) => Math.max(i.value, i.before)))
  const d = (v: number) => (v > 0 ? 14 + Math.sqrt(v / max) * 82 : 0)
  return (
    <div className="relative flex items-start justify-around gap-2">
      <span aria-hidden className="absolute inset-x-0 top-[3.5rem] h-px bg-line" />
      {items.map((it) => (
        <div key={it.label} className="relative flex min-w-0 flex-col items-center">
          <div className="flex h-28 items-center gap-1">
            <span className="flex items-center justify-center rounded-full text-white tabular-nums" style={{ width: d(it.value), height: d(it.value), background: it.label === 'Cash' ? CLASS_COLOR.Liquidity : ACCENT }}>
              {d(it.value) >= 44 && <span className={d(it.value) >= 70 ? 'text-base' : ''}>{pct(it.value)}</span>}
            </span>
          </div>
          <Label it={it} className="mt-1" />
          {d(it.value) < 44 && <span className="font-semibold tabular-nums">{pct(it.value)}</span>}
          {compare && delta(it) && <span className="text-fg-muted tabular-nums">{delta(it)}</span>}
        </div>
      ))}
    </div>
  )
}

/** Vertical columns (maturity buckets), value on top; in New a pale Current column beside. */
function Columns({ items, compare }: { items: Item[]; compare: boolean }) {
  const max = niceMax(Math.max(...items.map((i) => Math.max(i.value, i.before))))
  return (
    <div>
      <div className="flex h-36 items-end gap-3 border-b border-line-strong">
        {items.map((it) => (
          <div key={it.label} className="flex h-full flex-1 flex-col justify-end">
            <span className="mb-1 text-center font-semibold tabular-nums">{pct(it.value)}</span>
            <div className="flex items-end justify-center gap-0.5" style={{ height: `${(Math.max(it.value, it.before) / max) * 100}%` }}>
              <span className="w-full max-w-10" style={{ height: `${it.value ? (it.value / Math.max(it.value, it.before)) * 100 : 0}%`, background: ACCENT }} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-3 text-fg-muted">
        {items.map((it) => <span key={it.label} className="flex-1 text-center">{it.label}{compare && delta(it) && <span className="block tabular-nums">{delta(it)}</span>}</span>)}
      </div>
    </div>
  )
}

/** Key figure against the benchmark: title and value on one line, a track with both marked, one sentence. */
function Kpi({ title, value, bench, scale, fmt, note }: { title: string; value: number; bench: number; scale: number; fmt: (v: number) => string; note: (diff: number) => string }) {
  const at = (v: number) => `${Math.min(100, (v / scale) * 100)}%`
  return (
    <section>
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-xl font-light text-fg-secondary">{title}</h3>
        <span className="text-xl tabular-nums">{fmt(value)}</span>
      </div>
      <div className="relative mt-2 h-4" style={{ background: SOFT }}>
        <div className="absolute inset-y-0 left-0" style={{ width: at(value), background: ACCENT }} />
        <div className="absolute -inset-y-1 w-0.5 bg-fg" style={{ left: at(bench) }} title={`Benchmark ${fmt(bench)}`} />
      </div>
      <div className="mt-1 flex justify-between text-fg-muted">
        <span>Portfolio {fmt(value)}</span>
        <span>Benchmark {fmt(bench)} <span className="inline-block h-2.5 w-0.5 bg-fg align-[-1px]" /></span>
      </div>
      <p className="mt-2 text-sm text-fg-secondary">{note(value - bench)} Benchmark: {BOND_BENCHMARK.name}.</p>
    </section>
  )
}

/** Countries in the portfolio, by ISO code on the map. Funds and cash have no country. */
const ISO: Record<string, string> = {
  'United States': 'USA', Netherlands: 'NLD', Denmark: 'DNK', Germany: 'DEU', Switzerland: 'CHE', France: 'FRA', Peru: 'PER', China: 'CHN',
  Chile: 'CHL', Mexico: 'MEX', India: 'IND', 'South Africa': 'ZAF', 'United Kingdom': 'GBR', Ireland: 'IRL',
}
const REGIONS = [['ALL', 'All'], ['NA', 'NA'], ['LATAM', 'LATAM'], ['EMEA', 'EMEA'], ['APAC', 'APAC']] as const
type RegionId = (typeof REGIONS)[number][0]
/** Where a region's total is written on the map (viewBox units). */
const REGION_AT: Record<Exclude<RegionId, 'ALL'>, [number, number]> = { NA: [215, 115], LATAM: [320, 285], EMEA: [530, 165], APAC: [770, 175] }

/**
 * By country, as in the team's dashboards: a world map, countries shaded by their weight (darker = more), and region
 * check boxes that bring one region forward with its total written on it. Hover a country for its weight.
 */
function CountryMap({ weights }: { weights: Map<string, number> }) {
  const [region, setRegion] = useState<RegionId>('ALL')
  const byIso = new Map<string, [string, number]>()
  weights.forEach((v, k) => { if (ISO[k]) byIso.set(ISO[k], [k, v]) })
  const max = Math.max(1, ...[...byIso.values()].map(([, v]) => v))
  const regionOf = new Map(WORLD.map(([iso, , reg]) => [iso, reg]))
  const regionTotal = (r: string) => [...byIso.entries()].filter(([iso]) => regionOf.get(iso) === r).reduce((t, [, [, v]]) => t + v, 0)
  const unmapped = [...weights.entries()].filter(([k]) => !ISO[k]).reduce((t, [, v]) => t + v, 0)
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
          const dim = region !== 'ALL' && reg !== region
          // Held countries in navy, darker for a larger weight; the rest in the soft grey.
          const fill = hit ? ACCENT : SOFT
          const opacity = hit ? 0.35 + 0.65 * (hit[1] / max) : 1
          return (
            <path key={iso} d={d} fill={fill} fillOpacity={dim ? (hit ? 0.15 : 0.5) : opacity} stroke="#fff" strokeWidth={0.6}>
              <title>{hit ? `${name} ${pct(hit[1])}` : name}</title>
            </path>
          )
        })}
        {region !== 'ALL' && (
          <text x={REGION_AT[region][0]} y={REGION_AT[region][1]} textAnchor="middle" className="fill-fg text-[44px] font-light" paintOrder="stroke" stroke="#fff" strokeWidth={6}>
            {pct(regionTotal(region))}
          </text>
        )}
      </svg>
      <p className="mt-1.5 text-fg-muted">
        Darker = larger weight; hover a country for its share.{unmapped > 0.004 && ` ${pct(unmapped)} (funds and cash) has no single country.`}
      </p>
    </section>
  )
}
