import { Check, TriangleAlert } from 'lucide-react'
import { ViewTransition } from 'react'
import { Button } from '../components/ui/button'
import { ASSET_CLASSES, CLASS_COLOR, PASS_SCORE, QUALITY_CHECKS } from '../data/data'
import { cn } from '../lib/cn'
import { benchmarkById, exclusionSummary, pct, preferenceRows, usePortfolio, type Alloc } from '../state/portfolio'

export type AllocRow = { label: string; alloc: Alloc }

/**
 * Overview strip above Component allocation and Simulation: three columns with one row rhythm —
 * Asset allocation | Preferences | Portfolio. Full by default; compact = two lines per column.
 * Preferences sits in the middle because it explains the flags in the tables below: limits and every exclusion at a glance.
 */
type OverviewProps = { rows: [AllocRow, AllocRow]; focus: 0 | 1; showChange?: boolean; compact?: boolean; /** Show the Quality checks column. Off everywhere for now. */ quality?: boolean }

/**
 * The same strip sits on Component allocation and on Simulation. One fixed view-transition name makes it a
 * shared element: when the step changes it morphs in place (numbers cross-fade, position glides) instead of
 * sliding out with one screen and back in with the next. Going to a screen without it, it slides like the rest.
 */
export function Overview(props: OverviewProps) {
  return (
    <ViewTransition
      name="portfolio-overview"
      share="morph"
      enter={{ forward: 'step-forward', back: 'step-back', default: 'none' }}
      exit={{ forward: 'step-forward', back: 'step-back', default: 'none' }}
      update="none"
    >
      <OverviewBody {...props} />
    </ViewTransition>
  )
}

function OverviewBody({ rows, focus, showChange, compact, quality = false }: OverviewProps) {
  const grid = cn('grid shrink-0 border-y border-line text-xs', quality ? 'grid-cols-[minmax(0,1.3fr)_minmax(0,0.8fr)_minmax(0,1fr)]' : 'grid-cols-[minmax(0,1.1fr)_minmax(0,1.5fr)_minmax(0,0.9fr)]')
  const { state } = usePortfolio()
  const failed = QUALITY_CHECKS.filter(([, s]) => s < PASS_SCORE)
  const excl = exclusionSummary(state.prefs)
  const bench = benchmarkById(state.data.benchmark)?.name ?? ''
  const editExclusions = <Button variant="link" className="text-xs" onClick={() => { location.hash = 'preferences' }}>Edit</Button>
  const status = (
    <span className={cn('inline-flex items-center gap-1.25', failed.length ? 'text-error' : 'text-fg')}>
      {failed.length ? <TriangleAlert className="size-3" strokeWidth={1.75} /> : <Check className="size-3" strokeWidth={2.5} />}
      {failed.length ? `${failed.length} of ${QUALITY_CHECKS.length} failed${compact ? ': ' + failed.map(([n]) => n).join(', ') : ''}` : `${QUALITY_CHECKS.length} of ${QUALITY_CHECKS.length} passed`}
    </span>
  )
  const sec = cn('min-w-0 px-6 first:pl-0 [&+&]:border-l [&+&]:border-line', compact ? 'py-2.5' : 'pt-3 pb-3.5')
  const title = cn('flex min-h-5 items-center justify-between gap-2 text-fg-muted', compact ? 'mb-0.5' : 'mb-1.5')

  if (compact) {
    const f = rows[focus].alloc
    const other = rows[1 - focus].alloc
    const inUse = ASSET_CLASSES.filter((c) => f[c] > 0.004)
    const line = `${state.data.code} · Standard · ${state.data.ccy} · ${bench}`
    const prefLine = excl.length ? excl.join(' · ') : 'No exclusions'
    return (
      <div className={grid}>
        <div className={sec}>
          <div className={title}>
            <span>Asset allocation</span>
            <span role="img" aria-label={`${rows[focus].label}: ${inUse.map((c) => `${c} ${pct(f[c])}`).join(', ')}`} className="ml-4 flex h-2 max-w-90 flex-1 gap-0.5 bg-surface-strong">
              {inUse.map((c) => <span key={c} className="h-full" style={{ width: `${Math.min(100, f[c])}%`, background: CLASS_COLOR[c] }} />)}
            </span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 leading-relaxed">
            {ASSET_CLASSES.filter((c) => f[c] > 0.004 || other[c] > 0.004).map((c) => {
              const moved = showChange && focus === 1 && Math.abs(f[c] - other[c]) >= 0.05
              return (
                <span key={c} className="whitespace-nowrap">
                  <Swatch cls={c} />{c} {moved && <span className="text-fg-subtle">{pct(other[c])} → </span>}<strong className="font-semibold">{pct(f[c])}</strong>
                </span>
              )
            })}
          </div>
        </div>
        {quality && <div className={sec}><div className={title}>Quality checks</div><div className="leading-relaxed">{status}</div></div>}
        {!quality && (
          <div className={sec}>
            <div className={title}><span>Preferences</span>{editExclusions}</div>
            <div className="truncate leading-relaxed" title={prefLine}>{prefLine}</div>
          </div>
        )}
        <div className={sec}>
          <div className={title}>Portfolio</div>
          <div className="truncate leading-relaxed" title={line}>{line}</div>
        </div>
      </div>
    )
  }

  return (
    <div className={grid}>
      <div className={sec}>
        <div className={title}>Asset allocation</div>
        <AllocationBlock rows={rows} focus={focus} showChange={showChange} />
      </div>
      {quality && (
      <div className={sec}>
        <div className={title}><span>Quality checks</span>{status}</div>
        <ul>
          {QUALITY_CHECKS.map(([name, score]) => {
            const fail = score < PASS_SCORE
            return (
              <li key={name} className={cn('grid grid-cols-[minmax(max-content,1fr)_minmax(3rem,0.8fr)_1.75rem] items-center gap-3 border-t border-line py-0.75 first:border-t-0', fail && 'text-error')}>
                <span className="inline-flex items-center gap-1">{fail && <TriangleAlert className="size-3" />}{name}</span>
                <ScoreDashes score={score} fail={fail} />
                <span className="text-right tabular-nums">{score.toFixed(1)}</span>
              </li>
            )
          })}
        </ul>
      </div>
      )}
      {!quality && (
        <div className={sec}>
          <div className={title}><span>Preferences</span>{editExclusions}</div>
          {/* Three columns of label / value pairs; unset preferences read "None" in a quieter ink so the active ones stand out. */}
          <dl className="grid grid-cols-3 gap-x-6">
            {preferenceRows(state.prefs).map(([k, v]) => (
              <div key={k} className="min-w-0 border-t border-line py-0.75 [&:nth-child(-n+3)]:border-t-0">
                <dt className="text-fg-muted">{k}</dt>
                <dd className={cn('truncate', v === 'None' && 'text-fg-subtle')} title={v}>{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
      <div className={sec}>
        <div className={title}>Portfolio</div>
        <dl>
          {[
            ['Code', state.data.code], ['Type', 'Standard'], ['Currency', state.data.ccy], ['Benchmark', bench],
          ].map(([k, v]) => <FactRow key={k} k={k}>{v}</FactRow>)}
        </dl>
      </div>
    </div>
  )
}

function FactRow({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-2.5 border-t border-line py-0.75 first:border-t-0">
      <dt className="text-fg-muted">{k}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  )
}

/** Score as five short dashes, one filled per point; crispEdges keeps every row the same thickness. */
function ScoreDashes({ score, fail }: { score: number; fail: boolean }) {
  return (
    <svg viewBox="0 0 100 4" preserveAspectRatio="none" shapeRendering="crispEdges" aria-hidden className="block h-1 w-full">
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} x={i * 20.75} y="0" width="17" height="4" className={i < Math.round(score) ? (fail ? 'fill-error' : 'fill-fg-secondary') : 'fill-surface-strong'} />
      ))}
    </svg>
  )
}

export function Swatch({ cls }: { cls: keyof typeof CLASS_COLOR }) {
  return <span className="mr-1.5 inline-block size-2.5 rounded-xs align-[-1px]" style={{ background: CLASS_COLOR[cls] }} />
}

/** Compact donut of the allocation in focus + a table comparing both (Portfolio | Benchmark, or Current | New). */
export function AllocationBlock({ rows, focus, showChange }: { rows: [AllocRow, AllocRow]; focus: 0 | 1; showChange?: boolean }) {
  const [a, b] = [rows[0].alloc, rows[1].alloc]
  const f = rows[focus].alloc
  const used = ASSET_CLASSES.reduce((s, c) => s + f[c], 0)
  return (
    <div className="flex items-center gap-x-6">
      <Donut alloc={f} label={rows[focus].label} />
      <div className="shrink-0">
        <table className="border-collapse">
          <thead>
            <tr>
              <th />
              {rows.map((r) => <th key={r.label} className="pb-0.75 pl-5 text-right font-normal text-fg-muted">{r.label}</th>)}
              {showChange && <th className="pb-0.75 pl-5 text-right font-normal text-fg-muted">Change</th>}
            </tr>
          </thead>
          <tbody>
            {ASSET_CLASSES.map((c) => {
              const d = b[c] - a[c]
              return (
                <tr key={c} className="border-t border-line">
                  <td className="py-0.75 whitespace-nowrap"><Swatch cls={c} />{c}</td>
                  {[a[c], b[c]].map((v, i) => <td key={i} className={cn('py-0.75 pl-5 text-right tabular-nums', i === focus && 'font-semibold')}>{pct(v)}</td>)}
                  {showChange && <td className="py-0.75 pl-5 text-right text-xs text-fg-muted">{Math.abs(d) < 0.05 ? '—' : (d > 0 ? '+' : '−') + Math.round(Math.abs(d) * 10) / 10}</td>}
                </tr>
              )
            })}
          </tbody>
        </table>
        {used > 0 && used < 99.995 && <div className="mt-1.5 text-fg-muted">{(100 - used).toFixed(2)}% not allocated yet</div>}
      </div>
    </div>
  )
}

/** Compact donut (96px) with 2px gaps between segments and the largest class in the centre. Colours come from the chart tokens. */
function Donut({ alloc, label }: { alloc: Alloc; label: string }) {
  const R = 42
  const C = 2 * Math.PI * R
  const inUse = ASSET_CLASSES.filter((c) => alloc[c] > 0.004)
  const gap = inUse.length > 1 ? 2 : 0
  let start = 0
  const top = [...inUse].sort((x, y) => alloc[y] - alloc[x])[0]
  return (
    <svg viewBox="0 0 112 112" role="img" aria-label={`${label}: ${inUse.map((c) => `${c} ${pct(alloc[c])}`).join(', ') || 'nothing allocated'}`} className="size-24 shrink-0">
      <circle cx="56" cy="56" r={R} fill="none" strokeWidth="14" className="stroke-surface-strong" />
      {inUse.map((c) => {
        const len = (Math.min(100, alloc[c]) / 100) * C
        const dash = Math.max(0.5, len - gap)
        const el = (
          <circle key={c} cx="56" cy="56" r={R} fill="none" strokeWidth="14" stroke={CLASS_COLOR[c]} strokeDasharray={`${dash.toFixed(2)} ${(C - dash).toFixed(2)}`} strokeDashoffset={(-start).toFixed(2)} transform="rotate(-90 56 56)" className="transition-[stroke-dasharray,stroke-dashoffset] duration-200 hover:[stroke-width:16]">
            <title>{`${label}: ${c} ${pct(alloc[c])}`}</title>
          </circle>
        )
        start += len
        return el
      })}
      {top ? (
        <>
          <text x="56" y="58" textAnchor="middle" className="fill-fg text-xl font-semibold">{Math.round(alloc[top])}%</text>
          <text x="56" y="74" textAnchor="middle" className="fill-fg-muted text-xs">{top}</text>
        </>
      ) : (
        <text x="56" y="61" textAnchor="middle" className="fill-fg-muted text-xs">Not allocated</text>
      )}
    </svg>
  )
}
