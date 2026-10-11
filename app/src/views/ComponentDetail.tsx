import { TriangleAlert } from 'lucide-react'
import { Fragment, useState, type ReactNode } from 'react'
import { Tab, Tabs, TabsList } from '../components/ui/tabs'
import { ConflictNote } from '../components/ui/tag'
import { ASSET_CLASSES, benchFor, componentHoldings, figures, type Component, type Holding } from '../data/data'
import { cn } from '../lib/cn'
import { f2, pct, usePortfolio, type Alloc } from '../state/portfolio'
import { Donut, Swatch } from './Overview'

const th = 'border-b border-line bg-surface-subtle px-2.5 py-1.5 text-left font-normal whitespace-nowrap text-fg-muted'
const td = 'border-b border-line px-2.5 py-1.5 align-middle'

/**
 * Component details, used by the Allocation panel and the Learn more window.
 * Left: the component's asset allocation (the same donut and class colours as the portfolio overview), its benchmark and
 * risk / return. Right: every instrument it holds, in two views that mirror Simulation — a flat Instrument view and an
 * Asset class view with group subtotals. An instrument on the portfolio's excluded list is highlighted as a conflict.
 */
export function ComponentDetail({ c }: { c: Component }) {
  const { state } = usePortfolio()
  const [view, setView] = useState<'instrument' | 'class'>('instrument')
  const f = figures(c)
  const list = componentHoldings(c)
  const alloc: Alloc = { Equity: 0, Bonds: 0, Alternatives: 0, Liquidity: 0 }
  list.forEach((h) => { alloc[h.cls] += h.w })
  const excluded = (h: Holding) => !!h.isin && state.prefs.inst.includes(h.isin)
  const conflicts = list.filter(excluded).length

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
      <div className="mt-4.5 flex flex-wrap gap-x-12 gap-y-4">
        <Stat label="Benchmark risk" value={f2(f.r3) + '%'} sub="3 years" />
        <Stat label="Benchmark return" value={f2(f.y3) + '%'} sub="3 years" />
        <Stat label="Current investments" value={String(list.length)} sub="Instruments and accounts" />
      </div>
      <div className="mt-5.5 grid grid-cols-[repeat(auto-fit,minmax(17.5rem,1fr))] items-start gap-x-7 gap-y-5">
        <div className="flex min-w-0 flex-col gap-5">
          <div>
            <div className="pb-1.5 text-xs text-fg-muted">Asset allocation</div>
            <div className="flex items-center gap-x-6 text-xs">
              <Donut alloc={alloc} label={c.name} />
              <table className="border-collapse">
                <tbody>
                  {ASSET_CLASSES.filter((k) => alloc[k] > 0.004).map((k) => (
                    <tr key={k} className="border-t border-line first:border-t-0">
                      <td className="py-0.75 whitespace-nowrap"><Swatch cls={k} />{k}</td>
                      <td className="py-0.75 pl-5 text-right font-semibold tabular-nums">{pct(alloc[k])}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <MiniTable caption="Benchmark" heads={['Index', 'Weight']} numFrom={1} rows={benchFor(c).map(([n, w]) => [n, w + '%'])} />
          <MiniTable
            caption="Risk and return"
            heads={['Period', 'Risk', 'Return']}
            numFrom={1}
            rows={[['YTD', '—', f2(f.ytd) + '%'], ['1 year', f2(f.r1) + '%', f2(f.y1) + '%'], ['3 years', f2(f.r3) + '%', f2(f.y3) + '%'], ['5 years', f2(f.r5) + '%', f2(f.y5) + '%']]}
          />
        </div>

        <div className="min-w-0 text-xs">
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
                : <span className="text-fg-muted">{list.length} included instruments</span>}
            </span>
          </div>
          <table className="w-full border-collapse">
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
      </div>
    </>
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
