import { BOND_BENCHMARK, BOND_PROFILE, CLASS_COLOR, ASSET_CLASSES, EXPOSURE, MATURITY_BUCKETS, RATING_BUCKETS } from '../data/data'
import { cn } from '../lib/cn'
import { f2, pct, simAlloc, usePortfolio, type SimRow } from '../state/portfolio'

type Mode = 'current' | 'new'
type Bar = { label: string; value: number; before?: number; color: string; tip?: string }
/** Sectors, regions, countries, maturities and ratings carry no colour meaning: one navy. Asset classes and cash keep theirs. */
const NAVY = 'var(--color-ubs-chart-19)'
const colorOf = (label: string) => (label === 'Cash' ? CLASS_COLOR.Liquidity : NAVY)

/**
 * Exposure view of Simulation: the portfolio from several angles (asset class, sector, region, country, currency,
 * and for its fixed income part maturity, rating, duration and yield). Same horizontal bar charts as the building
 * block details. In New, each value shows its change against Current.
 */
export function ExposureView({ mode }: { mode: Mode }) {
  const { state } = usePortfolio()
  const rows = state.sim.rows
  const cur = mode === 'current'
  const wOf = (r: SimRow, m: Mode) => (m === 'current' ? r.w : r.removed ? 0 : r.nw)
  const sum = (key: (r: SimRow) => string, m: Mode) => {
    const out = new Map<string, number>()
    rows.forEach((r) => { const w = wOf(r, m); if (w > 0) out.set(key(r), (out.get(key(r)) ?? 0) + w) })
    return out
  }
  /** Largest first, at most `n` rows; the rest grouped as Other (its members on hover). Cash always last. */
  const bars = (key: (r: SimRow) => string, n = 6): Bar[] => {
    const now = sum(key, mode)
    const then = sum(key, 'current')
    const sorted = [...now.entries()].filter(([k]) => k !== 'Cash').sort((a, b) => b[1] - a[1])
    const keep = sorted.slice(0, n - 1)
    const rest = sorted.slice(n - 1)
    const out: Bar[] = keep.map(([k, v]) => ({ label: k, value: v, before: then.get(k) ?? 0, color: colorOf(k) }))
    if (rest.length === 1) out.push({ label: rest[0][0], value: rest[0][1], before: then.get(rest[0][0]) ?? 0, color: NAVY })
    else if (rest.length) out.push({
      label: 'Other', value: rest.reduce((t, [, v]) => t + v, 0), before: rest.reduce((t, [k]) => t + (then.get(k) ?? 0), 0), color: NAVY,
      tip: rest.map(([k, v]) => `${k} ${pct(v)}`).join(' · '),
    })
    if (now.has('Cash')) out.push({ label: 'Cash', value: now.get('Cash') ?? 0, before: then.get('Cash') ?? 0, color: colorOf('Cash') })
    return out
  }
  const expo = (r: SimRow) => EXPOSURE[r.id] ?? { sector: 'Other', region: 'Other', country: 'Other' }

  const alloc = simAlloc(state, mode)
  const allocBefore = simAlloc(state, 'current')
  const assetBars: Bar[] = ASSET_CLASSES.filter((c) => alloc[c] > 0.004 || allocBefore[c] > 0.004).map((c) => ({ label: c, value: alloc[c], before: allocBefore[c], color: CLASS_COLOR[c] }))

  // Fixed income: bond positions looked through to maturity and rating, as a share of the fixed income part.
  const bonds = rows.filter((r) => BOND_PROFILE[r.id] && wOf(r, mode) > 0)
  const fiW = bonds.reduce((t, r) => t + wOf(r, mode), 0)
  const split = (pick: (id: string) => Record<string, number>, buckets: string[]): Bar[] => buckets
    .map((b) => ({ label: b, value: fiW ? bonds.reduce((t, r) => t + wOf(r, mode) * (pick(r.id)[b] ?? 0), 0) / fiW : 0, color: NAVY }))
    .filter((b) => b.value > 0.004)
  const avg = (f: (id: string) => number) => (fiW ? bonds.reduce((t, r) => t + wOf(r, mode) * f(r.id), 0) / fiW : 0)
  const duration = avg((id) => BOND_PROFILE[id].duration)
  const ytm = avg((id) => BOND_PROFILE[id].ytm)

  const panel = 'min-w-0 rounded-sm border border-line px-4 pt-3 pb-3.5'
  return (
    <div className="grid grid-cols-6 gap-3 py-3 text-xs">
      <Panel className={cn(panel, 'col-span-2')} title="Asset allocation" bars={assetBars} cur={cur} />
      <Panel className={cn(panel, 'col-span-2')} title="Sector allocation" bars={bars((r) => expo(r).sector)} cur={cur} />
      <Panel className={cn(panel, 'col-span-2')} title="Region allocation" bars={bars((r) => expo(r).region)} cur={cur} />
      <Panel className={cn(panel, 'col-span-3')} title="Country allocation" bars={bars((r) => expo(r).country, 8)} cur={cur} />
      <Panel className={cn(panel, 'col-span-3')} title="Currency allocation" bars={bars((r) => r.ccy, 8)} cur={cur} />

      <div className="col-span-6 mt-2 flex items-baseline gap-2 border-b border-line pb-1.5">
        <h3 className="text-sm font-semibold">Fixed income</h3>
        <span className="text-fg-muted">{fiW ? `${pct(fiW)} of the portfolio · maturity and rating as a share of the fixed income part` : 'No fixed income positions'}</span>
      </div>
      {fiW > 0 && (
        <>
          <Panel className={cn(panel, 'col-span-2')} title="Maturity" bars={split((id) => BOND_PROFILE[id].maturity, MATURITY_BUCKETS)} cur />
          <Panel className={cn(panel, 'col-span-2')} title="Rating" bars={split((id) => BOND_PROFILE[id].rating, RATING_BUCKETS)} cur />
          <div className={cn(panel, 'col-span-2')}>
            <div className="mb-2 font-semibold">Duration and yield to maturity</div>
            <table className="w-full border-collapse">
              <thead>
                <tr className="text-fg-muted"><th className="pb-1 text-left font-normal" /><th className="pb-1 text-right font-normal">Portfolio</th><th className="pb-1 text-right font-normal">Benchmark</th></tr>
              </thead>
              <tbody>
                <tr className="border-t border-line"><td className="py-1.5">Duration</td><td className="py-1.5 text-right font-semibold tabular-nums">{duration.toFixed(1)} yrs</td><td className="py-1.5 text-right tabular-nums">{BOND_BENCHMARK.duration.toFixed(1)} yrs</td></tr>
                <tr className="border-t border-line"><td className="py-1.5">Yield to maturity</td><td className="py-1.5 text-right font-semibold tabular-nums">{f2(ytm)}%</td><td className="py-1.5 text-right tabular-nums">{f2(BOND_BENCHMARK.ytm)}%</td></tr>
              </tbody>
            </table>
            <div className="mt-2 text-fg-muted">Benchmark: {BOND_BENCHMARK.name}</div>
          </div>
        </>
      )}
    </div>
  )
}

/** One chart panel: horizontal bars (label, bar, value) and, in New, the change against Current. */
function Panel({ title, bars, cur, className }: { title: string; bars: Bar[]; /** Hide the change column (Current, or shares of a part). */ cur?: boolean; className?: string }) {
  const max = Math.max(1, ...bars.map((b) => b.value))
  const chg = (b: Bar) => {
    const d = b.value - (b.before ?? b.value)
    return Math.abs(d) < 0.05 ? <span className="text-fg-subtle">—</span> : <span className="text-fg-muted">{(d > 0 ? '+' : '−') + Math.abs(Math.round(d * 10) / 10)}</span>
  }
  return (
    <div className={className}>
      <div className="mb-2 font-semibold">{title}</div>
      <div role="list" className={cn('grid items-center gap-x-2.5 gap-y-1 leading-4', cur ? 'grid-cols-[max-content_minmax(2rem,1fr)_max-content]' : 'grid-cols-[max-content_minmax(2rem,1fr)_max-content_2.5rem]')}>
        {bars.map((b) => (
          <div key={b.label} role="listitem" className="contents">
            <span className={cn('max-w-40 truncate', b.tip && 'cursor-help underline decoration-dotted underline-offset-2')} title={b.tip ?? b.label}>{b.label}</span>
            {/* Bars are scaled to the largest value of the chart, so small exposures stay readable. */}
            <span className="block h-1.5 w-full" aria-hidden><span className="block h-full" style={{ width: `${(b.value / max) * 100}%`, background: b.color }} /></span>
            <span className="text-right font-semibold tabular-nums">{pct(b.value)}</span>
            {!cur && <span className="text-right tabular-nums">{chg(b)}</span>}
          </div>
        ))}
      </div>
    </div>
  )
}
