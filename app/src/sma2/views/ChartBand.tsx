import { Button } from '../components/ui/button'
import { ASSET_CLASSES, type AssetClass } from '../data/data'
import { getBook } from '../state/book'
import { benchmarkAlloc, benchmarkById, exclusionGroups, usePortfolio, type Alloc } from '../state/portfolio'

/** A portfolio version drawn as a marker on the allocation chart: ▼ the one in place, ▲ the one being worked on. */
export type Marker = { label: string; alloc: Alloc; shape: 'down' | 'up' }

const LABEL: Record<AssetClass, string> = { Liquidity: 'Liquidity', Bonds: 'Fixed income', Equity: 'Equity', Alternatives: 'Alternatives' }
/** Same order as the client book: liquidity first, then fixed income, equity and alternatives. */
const ORDER: AssetClass[] = ['Liquidity', 'Bonds', 'Equity', 'Alternatives']
const TICKS = [0, 20, 40, 60, 80, 100]

/**
 * The band of three panels above the positions, as on the client book's portfolio page: what the portfolio excludes,
 * its facts, and its asset allocation against the benchmark. One light band, panels divided by rules, no cards.
 */
export function ChartBand({ markers }: { markers: Marker[] }) {
  const { state } = usePortfolio()
  const groups = exclusionGroups(state.prefs)
  const entry = getBook().find((e) => e.id === state.book.id)
  const held = state.sim.rows.filter((r) => (state.sim.mode === 'current' ? r.w > 0 : !r.removed && r.nw > 0)).length
  const facts: [string, string][] = [
    ['Code', state.data.code || '—'],
    ['Type', state.custom ? 'Customized' : entry?.type ?? 'Standard'],
    ['Currency', state.data.ccy],
    ['Benchmark', benchmarkById(state.data.benchmark)?.name ?? '—'],
    ['Positions', String(held)],
    ['Status', state.book.creating ? 'New, not saved' : entry?.status ?? 'Draft'],
  ]
  const title = 'mb-2.5 text-lg/6 text-fg'
  const row = 'flex items-baseline justify-between gap-4 border-b border-line py-0.75 text-xs'
  return (
    <div className="grid shrink-0 grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)_minmax(0,1.35fr)] border border-line bg-surface-subtle">
      <section className="min-w-0 px-4 pt-3 pb-4">
        <div className="flex items-baseline justify-between">
          <h3 className={title}>Exclusions</h3>
          <Button variant="link" className="text-xs" onClick={() => { location.hash = 'sma2/preferences' }}>Edit</Button>
        </div>
        {groups.length ? groups.map((g) => (
          <div key={g.label} className={row}>
            <span className="shrink-0 text-fg">{g.label}</span>
            <span className="min-w-0 truncate text-right text-conflict" title={g.values.join(', ')}>
              {g.values.length > 2 ? `${g.values.slice(0, 2).join(', ')} +${g.values.length - 2}` : g.values.join(', ')}
            </span>
          </div>
        )) : <p className="text-xs text-fg-muted">No exclusions.</p>}
      </section>
      <section className="min-w-0 border-l border-line px-4 pt-3 pb-4">
        <h3 className={title}>Portfolio</h3>
        {facts.map(([k, v]) => (
          <div key={k} className={row}>
            <span className="text-fg">{k}</span>
            <span className="min-w-0 truncate text-right" title={v}>{v}</span>
          </div>
        ))}
      </section>
      <section className="min-w-0 border-l border-line px-4 pt-3 pb-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4">
          <h3 className={title}>Asset allocation</h3>
          <div className="flex items-center gap-3.5 text-xs">
            <span className="inline-flex items-center gap-1.5"><Dot />Benchmark</span>
            {markers.map((m) => <span key={m.label} className="inline-flex items-center gap-1.5"><Tri shape={m.shape} />{m.label}</span>)}
          </div>
        </div>
        <AllocChart bench={benchmarkAlloc(state)} markers={markers} />
      </section>
    </div>
  )
}

/** One row per asset class on a 0–100% scale: the benchmark as a dot on its band, each version as a triangle with its value. */
function AllocChart({ bench, markers }: { bench: Alloc; markers: Marker[] }) {
  const main = markers[markers.length - 1]
  return (
    <div className="text-xs">
      {ORDER.filter((c) => ASSET_CLASSES.includes(c)).map((c) => (
        <div key={c} className="grid h-9 grid-cols-[6.5rem_minmax(0,1fr)] items-center">
          <span>{LABEL[c]}</span>
          <div className="relative h-full">
            <Grid />
            {/* The benchmark's weight as a light band from 0, its value as a dot at the end. */}
            <div className="absolute top-1/2 left-0 h-3 -translate-y-1/2 bg-chart-2-light" style={{ width: bench[c] + '%' }} />
            <span className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ left: bench[c] + '%' }}><Dot /></span>
            {markers.map((m) => (
              <span key={m.label} className={m.shape === 'down' ? 'absolute top-0.5 -translate-x-1/2' : 'absolute bottom-0.5 -translate-x-1/2'} style={{ left: m.alloc[c] + '%' }} title={`${m.label}: ${m.alloc[c].toFixed(1)}%`}>
                <Tri shape={m.shape} />
              </span>
            ))}
            {main && <span className="absolute top-0 ml-2 text-[11px] text-fg-muted tabular-nums" style={{ left: main.alloc[c] + '%' }}>{main.alloc[c].toFixed(1)}%</span>}
          </div>
        </div>
      ))}
      <div className="grid grid-cols-[6.5rem_minmax(0,1fr)]">
        <span />
        <div className="relative h-4 text-[11px] text-fg-muted">
          {TICKS.map((t) => <span key={t} className="absolute -translate-x-1/2" style={{ left: t + '%' }}>{t}%</span>)}
        </div>
      </div>
    </div>
  )
}

function Grid() {
  return <>{TICKS.map((t) => <span key={t} aria-hidden className="absolute inset-y-0 w-px bg-line" style={{ left: t + '%' }} />)}</>
}
const Dot = () => <span aria-hidden className="inline-block size-2 rounded-full bg-fg" />
const Tri = ({ shape }: { shape: 'down' | 'up' }) => (
  <svg aria-hidden viewBox="0 0 10 9" className={shape === 'down' ? 'size-2.5 fill-fg' : 'size-2.5 fill-link'}>
    <path d={shape === 'down' ? 'M0 0h10L5 9z' : 'M5 0l5 9H0z'} />
  </svg>
)
