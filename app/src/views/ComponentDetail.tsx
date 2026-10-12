import { TriangleAlert } from 'lucide-react'
import { Fragment, useState, type ReactNode } from 'react'
import { Tab, Tabs, TabsList } from '../components/ui/tabs'
import { ConflictNote } from '../components/ui/tag'
import { ASSET_CLASSES, CLASS_COLOR, componentHoldings, type Component, type Holding } from '../data/data'
import { cn } from '../lib/cn'
import { f2, pct, usePortfolio, type Alloc } from '../state/portfolio'
import { Swatch } from './Overview'

const th = 'border-b border-line bg-surface-subtle px-2.5 py-1.5 text-left font-normal whitespace-nowrap text-fg-muted'
const td = 'border-b border-line px-2.5 py-1.5 align-middle'

/**
 * Component details, used by the Allocation panel and the Learn more window.
 * Three bar charts (asset allocation, sector allocation, region allocation — the same strip pattern as the portfolio
 * overview) above a full-width list of every instrument it holds, in two views that mirror Simulation: a flat Instrument
 * view and an Asset class view with group subtotals. An instrument on the portfolio's excluded list is highlighted as a conflict.
 */
export function ComponentDetail({ c }: { c: Component }) {
  const { state } = usePortfolio()
  const [view, setView] = useState<'instrument' | 'class'>('instrument')
  const list = componentHoldings(c)
  const alloc: Alloc = { Equity: 0, Bonds: 0, Alternatives: 0, Liquidity: 0 }
  list.forEach((h) => { alloc[h.cls] += h.w })
  const excluded = (h: Holding) => !!h.isin && state.prefs.inst.includes(h.isin)
  const conflicts = list.filter(excluded).length
  const inUse = ASSET_CLASSES.filter((k) => alloc[k] > 0.004)
  /**
   * Weight per sector or region, largest first, in at most four rows: up to three items of 10% or more, and everything
   * smaller (cash included) grouped as Other, whose members are listed on hover.
   */
  const breakdown = (key: (h: Holding) => string): [string, number, string?][] => {
    const m = new Map<string, number>()
    list.forEach((h) => m.set(key(h), (m.get(key(h)) ?? 0) + h.w))
    const sorted = [...m.entries()].sort((x, y) => y[1] - x[1])
    const keep = sorted.filter(([k, v]) => k !== 'Cash' && k !== 'Other' && v >= 10).slice(0, 3)
    const rest = sorted.filter((e) => !keep.includes(e))
    const restW = rest.reduce((t, [, v]) => t + v, 0)
    if (rest.length === 1) return [...keep, rest[0]]
    return [...keep, ...(restW > 0.004 ? [['Other', restW, rest.map(([k, v]) => `${k} ${pct(v)}`).join(' · ')] as [string, number, string]] : [])]
  }
  const sectors = breakdown((h) => h.sector)
  const regions = breakdown((h) => h.region)
  const sec = 'min-w-0 px-5 pt-2 pb-2.5 first:pl-0 [&+&]:border-l [&+&]:border-line'
  const title = 'mb-0.5 flex min-h-5 items-center gap-2 font-semibold text-fg'

  const row = (h: Holding, indent?: boolean) => (
    <tr key={h.name} className={excluded(h) ? '*:bg-excluded-subtle' : 'hover:*:bg-surface-subtle'}>
      <td className={cn(td, indent && 'pl-9')}>{h.cls}</td>
      <td className={td}>
        {h.name}
        {h.isin && <span className="block text-fg-muted">{h.isin}</span>}
        {excluded(h) && <ConflictNote>Excluded instrument</ConflictNote>}
      </td>
      <td className={td}>{h.ccy}</td>
      <td className={cn(td, 'text-right tabular-nums')}>{f2(h.w)}</td>
    </tr>
  )

  return (
    <>
      <p className="mt-3 max-w-205 text-fg-secondary">{c.desc} The currency risk is not hedged.</p>
      <div className="mt-4 grid grid-cols-[minmax(0,0.85fr)_minmax(0,1.3fr)_minmax(0,1fr)] border-y border-line text-xs">
        <div className={sec}>
          <div className={title}>Asset allocation</div>
          <BarList rows={inUse.map((k) => [k, alloc[k], CLASS_COLOR[k]] as [string, number, string])} />
        </div>
        <div className={sec}>
          <div className={title}>Sector allocation</div>
          <BarList rows={sectors.map(([k, v, tip]) => [k, v, k === 'Cash' ? CLASS_COLOR.Liquidity : NEUTRAL, tip] as [string, number, string, string?])} />
        </div>
        <div className={sec}>
          <div className={title}>Region allocation</div>
          <BarList rows={regions.map(([k, v, tip]) => [k, v, k === 'Cash' ? CLASS_COLOR.Liquidity : NEUTRAL, tip] as [string, number, string, string?])} />
        </div>
      </div>

      <div className="mt-4 text-xs">
          <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1 border-b border-line">
            <Tabs value={view} onValueChange={(v) => setView(v as 'instrument' | 'class')}>
              <TabsList variant="sub" aria-label="Included instruments view">
                <Tab value="instrument" className="text-xs">Instrument view</Tab>
                <Tab value="class" className="text-xs">Asset class view</Tab>
              </TabsList>
            </Tabs>
            <span role="status" className="inline-flex items-center gap-1.5 pb-1.5">
              {conflicts > 0
                ? <><TriangleAlert className="size-3.5 text-error" strokeWidth={1.75} aria-hidden />{conflicts} {conflicts === 1 ? 'instrument conflicts' : 'instruments conflict'} with exclusions</>
                : null}
              <span className="text-fg-muted">{conflicts > 0 && '· '}{list.length} instruments</span>
            </span>
          </div>
          <table className="w-full table-fixed border-collapse text-xs">
            <colgroup><col className="w-[18%]" /><col /><col className="w-[14%]" /><col className="w-[14%]" /></colgroup>
            <thead>
              <tr><th className={th}>Asset class</th><th className={th}>Instrument / account</th><th className={th}>Currency</th><th className={cn(th, 'text-right')}>Weight %</th></tr>
            </thead>
            <tbody>
              {view === 'instrument'
                ? [...list].sort((a, b) => Number(b.cls === 'Liquidity') - Number(a.cls === 'Liquidity') || b.w - a.w).map((h) => row(h))
                : ASSET_CLASSES.filter((k) => alloc[k] > 0.004).map((k) => {
                    const group = list.filter((h) => h.cls === k).sort((a, b) => b.w - a.w)
                    return (
                      <Fragment key={k}>
                        <tr className="*:bg-surface-subtle">
                          <td className={cn(td, 'font-semibold')} colSpan={3}>
                            <Swatch cls={k} />{k}<span className="font-normal text-fg-muted"> · {group.length} {group.length === 1 ? 'position' : 'positions'}</span>
                          </td>
                          <td className={cn(td, 'text-right font-semibold tabular-nums')}>{f2(alloc[k])}</td>
                        </tr>
                        {group.map((h) => row(h, true))}
                      </Fragment>
                    )
                  })}
            </tbody>
          </table>
      </div>
    </>
  )
}

/** Sectors and regions carry no colour of their own: one dark navy (UBS chart colour, distinct from the asset class colours); cash keeps the Liquidity colour. */
const NEUTRAL = 'var(--color-ubs-chart-19)'

/** Horizontal bar chart: one row per item with label, bar (scaled to 100%) and value. */
function BarList({ rows }: { rows: [label: string, value: number, color: string, tip?: string][] }) {
  return (
    <div role="list" className="grid grid-cols-[max-content_minmax(2rem,1fr)_max-content] items-center gap-x-2.5 gap-y-0.5 leading-4">
      {rows.map(([k, v, color, tip]) => (
        <div key={k} role="listitem" className="contents">
          <span className={cn('max-w-36 truncate', tip && 'cursor-help underline decoration-dotted underline-offset-2')} title={tip ?? k}>{k}</span>
          <span className="block h-1.5 w-full" aria-hidden><span className="block h-full" style={{ width: `${Math.min(100, v)}%`, background: color }} /></span>
          <span className="text-right font-semibold tabular-nums">{pct(v)}</span>
        </div>
      ))}
    </div>
  )
}

export function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div>
      <div className="text-xs text-fg-muted">{label}</div>
      <div className="text-2xl tabular-nums">{value}</div>
      <div className="text-xs text-fg-muted">{sub}</div>
    </div>
  )
}

/** Small bordered table with a caption above (details panels). */
export function MiniTable({ caption, heads, rows, numFrom }: { caption: string; heads: string[]; rows: ReactNode[][]; numFrom: number }) {
  const num = (i: number) => (i >= numFrom ? 'text-right tabular-nums' : 'text-left')
  return (
    <table className="w-full border-collapse border border-line bg-surface text-xs">
      <caption className="pb-1.5 text-left text-fg-muted">{caption}</caption>
      <thead>
        <tr>{heads.map((h, i) => <th key={h} className={'border-b border-surface-muted bg-surface-subtle px-2.5 py-1.5 font-normal text-fg-muted ' + num(i)}>{h}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((r, ri) => (
          <tr key={ri}>{r.map((v, i) => <td key={i} className={'border-t border-line px-2.5 py-1.5 ' + num(i)}>{v}</td>)}</tr>
        ))}
      </tbody>
    </table>
  )
}
