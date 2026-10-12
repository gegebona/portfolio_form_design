import { Ban, Check, TriangleAlert } from 'lucide-react'
import { useLayoutEffect, useRef, useState, ViewTransition } from 'react'
import { Button } from '../components/ui/button'
import { Popover, PopoverTrigger } from '../components/ui/popover'
import { ASSET_CLASSES, CLASS_COLOR, PASS_SCORE, QUALITY_CHECKS } from '../data/data'
import { cn } from '../lib/cn'
import { benchmarkById, exclusionGroups, exclusionSummary, pct, usePortfolio, type Alloc } from '../state/portfolio'

export type AllocRow = { label: string; alloc: Alloc }

/**
 * Overview strip above Component allocation and Simulation: three columns with one row rhythm —
 * Asset allocation | Exclusionary preferences | Portfolio. Full by default; compact = two lines per column.
 * Exclusions sit in the middle because they explain the flags in the tables below. They are plain text under a
 * ⊘ heading (the system's sign for "excluded"): clear about what they are, without competing with the tables.
 */
type OverviewProps = { rows: [AllocRow, AllocRow]; focus: 0 | 1; showChange?: boolean; compact?: boolean; /** Shows the strip's own Show / Hide details control (in its last panel), so the control sits on the thing it changes. */ onToggleCompact?: () => void; /** Show the Quality checks column. Off everywhere for now. */ quality?: boolean }

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

function OverviewBody({ rows, focus, showChange, compact, quality = false, onToggleCompact }: OverviewProps) {
  const toggle = onToggleCompact && <Button variant="link" className="text-xs" aria-expanded={!compact} onClick={onToggleCompact}>{compact ? 'Show details' : 'Hide details'}</Button>
  const grid = cn('grid shrink-0 border-y border-line text-xs', quality ? 'grid-cols-[minmax(0,1.3fr)_minmax(0,0.8fr)_minmax(0,1fr)]' : 'grid-cols-[minmax(0,1.1fr)_minmax(0,1.5fr)_minmax(0,0.9fr)]')
  const { state } = usePortfolio()
  const failed = QUALITY_CHECKS.filter(([, s]) => s < PASS_SCORE)
  const excl = exclusionSummary(state.prefs)
  const bench = benchmarkById(state.data.benchmark)?.name ?? ''
  const editExclusions = <Button variant="link" className="text-xs" onClick={() => { location.hash = 'preferences' }}>Edit</Button>
  const status = (
    <span className={cn('inline-flex items-center gap-1.25', failed.length ? 'text-error' : 'text-fg')}>
      {failed.length ? <TriangleAlert className="size-3 text-error" strokeWidth={1.75} /> : <Check className="size-3" strokeWidth={2.5} />}
      {failed.length ? `${failed.length} of ${QUALITY_CHECKS.length} failed${compact ? ': ' + failed.map(([n]) => n).join(', ') : ''}` : `${QUALITY_CHECKS.length} of ${QUALITY_CHECKS.length} passed`}
    </span>
  )
  const sec = cn('min-w-0 px-6 first:pl-0 [&+&]:border-l [&+&]:border-line', compact ? 'py-2.5' : 'pt-3 pb-3.5')
  const title = cn('flex min-h-5 items-center justify-between gap-2 text-fg-muted', compact ? 'mb-0.5' : 'mb-1.5')

  if (compact) {
    const f = rows[focus].alloc
    const other = rows[1 - focus].alloc
    const inUse = ASSET_CLASSES.filter((c) => f[c] > 0.004)
    const line = `${state.data.code} · ${state.custom ? `Customized of MP_${state.custom.parentId}` : 'Standard'} · ${state.data.ccy} · ${bench}`
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
            <div className={title}><span>Exclusionary preferences</span>{editExclusions}</div>
            {excl.length ? <ExclusionLine groups={exclusionGroups(state.prefs)} /> : <div className="leading-relaxed">{prefLine}</div>}
          </div>
        )}
        <div className={sec}>
          <div className={title}><span>Portfolio</span>{toggle}</div>
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
                <span className="inline-flex items-center gap-1">{fail && <TriangleAlert className="size-3 text-error" />}{name}</span>
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
          <div className={title}><span className="inline-flex items-center gap-1.5"><Ban className="size-3 text-conflict" strokeWidth={1.75} aria-hidden />Exclusionary preferences</span>{editExclusions}</div>
          {exclusionGroups(state.prefs).length ? (
            <p className="leading-relaxed">
              {exclusionGroups(state.prefs).map((g, i) => (
                <span key={g.label} title={g.values.join(', ')}>
                  {i > 0 && <span className="text-fg-subtle"> · </span>}
                  <span className="text-fg-muted">{g.label}: </span>
                  <span className="text-conflict">{g.values.slice(0, 3).join(', ')}{g.values.length > 3 && ` +${g.values.length - 3}`}</span>
                </span>
              ))}
            </p>
          ) : <p className="text-fg-subtle">Nothing excluded</p>}
          <div className="mt-1 text-fg-muted">Limits: min. position {state.prefs.minPos || '—'}% · max. {state.prefs.maxInst || '—'} instruments</div>
        </div>
      )}
      <div className={sec}>
        <div className={title}><span>Portfolio</span>{toggle}</div>
        <dl>
          {[
            ['Code', state.data.code], ['Type', state.custom ? 'Customized' : 'Standard'], ['Currency', state.data.ccy], ['Benchmark', bench],
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
export function Donut({ alloc, label }: { alloc: Alloc; label: string }) {
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

/**
 * Exclusions on at most two lines, never cut off: as many groups as fit, the rest behind “+N more” (same pattern as
 * conflict tags). Measured after layout and again whenever the width changes.
 */
/** Short group names for the strip. */
const SHORT: Record<string, string> = { 'Instrument category': 'Category', 'Credit rating': 'Rating' }
/** A group's values in the strip: up to two, then "+n" (all of them are in the “more” list). */
const brief = (v: string[]) => (v.length > 2 ? `${v.slice(0, 2).join(', ')} +${v.length - 2}` : v.join(', '))

function ExclusionLine({ groups }: { groups: { label: string; values: string[] }[] }) {
  const items = groups
  const ref = useRef<HTMLDivElement>(null)
  const [n, setN] = useState(items.length)
  const key = items.map((g) => g.label + g.values.join()).join('|')
  // Start again from the full list when the exclusions or the available width change.
  useLayoutEffect(() => {
    setN(items.length)
    const el = ref.current
    if (!el) return
    let w = el.clientWidth
    const ro = new ResizeObserver(() => { if (el.clientWidth !== w) { w = el.clientWidth; setN(items.length) } })
    ro.observe(el)
    return () => ro.disconnect()
  }, [key])
  // Drop one group at a time until everything, “+N more” included, fits in two lines.
  useLayoutEffect(() => {
    const el = ref.current
    if (el && n > 1 && el.scrollHeight > el.clientHeight + 1) setN(n - 1)
  })
  const more = items.length - n
  return (
    // Each group reads "Label values": the label in grey, the excluded values in red; a group never breaks over two lines.
    <div ref={ref} className="line-clamp-2 leading-relaxed">
      {items.slice(0, n).map((g) => (
        <span key={g.label} className="mr-3.5 inline-block whitespace-nowrap">
          <span className="text-fg-muted">{SHORT[g.label] ?? g.label}</span> <span className="text-conflict">{brief(g.values)}</span>
        </span>
      ))}
      {more > 0 && (
        <Popover
          title="Exclusionary preferences"
          description="Everything excluded from this model portfolio."
          className="w-80"
          trigger={<PopoverTrigger openOnHover delay={150} className="cursor-pointer font-semibold whitespace-nowrap text-conflict underline underline-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-selected">+{more} more</PopoverTrigger>}
        >
          <ul className="text-xs">
            {items.map((g) => <li key={g.label} className="border-t border-line py-1.5 first:border-t-0"><span className="text-fg-muted">{g.label}</span> <span className="text-conflict">{g.values.join(', ')}</span></li>)}
          </ul>
        </Popover>
      )}
    </div>
  )
}
