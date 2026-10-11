import { Tooltip } from '@base-ui/react/tooltip'
import { X } from 'lucide-react'
import { addTransitionType, startTransition, useState, ViewTransition } from 'react'
import { Button } from '../components/ui/button'
import { Section } from '../components/ui/layout'
import { ScrollArea } from '../components/ui/scroll-area'
import { ConflictTag, TooltipPopup } from '../components/ui/tag'
import { WeightField, WeightSlider } from '../components/ui/weight'
import { ASSET_CLASSES, CLASS_COLOR } from '../data/data'
import { cn } from '../lib/cn'
import {
  allocItems, benchmarkAlloc, conflictsOf, f2, near100, portfolioAlloc, removeItem, round2, setWeight, usePortfolio, weightOf, type AllocItem,
} from '../state/portfolio'
import { ComponentDetail } from './ComponentDetail'
import { Overview } from './Overview'

export function AllocationView() {
  const { state, update } = usePortfolio()
  // Compact by default: the strip is context, the tables below are the work. Full view is one click away.
  const [compact, setCompact] = useState(true)
  const [selKey, setSelKey] = useState<string | null>(null)
  const list = allocItems(state)
  const sel = list.find((it) => it.key === selKey) ?? list[0]
  const total = list.reduce((s, it) => s + weightOf(state, it), 0)
  // Clicking a row's name animates the details panel; focusing its field or pressing its slider selects instantly,
  // so typing and dragging are never held up by an animation.
  const pick = (key: string) => startTransition(() => { addTransitionType('detail'); setSelKey(key) })
  const setW = (it: AllocItem, v: number) => update((s) => setWeight(s, it, round2(Math.min(100, Math.max(0, v)))))

  const distributeEvenly = () => update((s) => {
    const each = Math.floor(10000 / list.length) / 100
    list.forEach((it) => setWeight(s, it, each))
    setWeight(s, list[0], round2(each + (100 - each * list.length)))
  })

  return (
    <Section
      screenHeading
      title="Component allocation"
      description="Set the weight of each component. Weights must add up to 100%."
      actions={<Button variant="link" className="self-end" aria-pressed={compact} onClick={() => setCompact(!compact)}>{compact ? 'Full view' : 'Compact view'}</Button>}
      className="flex min-h-0 flex-1 flex-col"
    >
      <div className="mt-3.5">
        <Overview rows={[{ label: 'Portfolio', alloc: portfolioAlloc(state) }, { label: 'Benchmark', alloc: benchmarkAlloc(state) }]} focus={0} compact={compact} quality={false} />
      </div>
      <div className="mt-4 grid min-h-0 flex-1 grid-cols-[26.25rem_minmax(0,1fr)] grid-rows-[minmax(0,1fr)]">
        <div className="flex min-h-0 flex-col">
          <div className="flex justify-between pr-5 pb-2 text-xs text-fg-muted"><span>Components</span><span>Weight</span></div>
          <ScrollArea hints="edges" className="flex-1 border-t border-line">
            {list.map((it) => (
              <AllocRow key={it.key} it={it} selected={it.key === sel?.key} onPick={() => pick(it.key)} onSelect={() => setSelKey(it.key)} total={total} setW={setW} />
            ))}
            {!list.length && <p className="p-3 text-fg-subtle">No components yet. Add them on the Component selection tab.</p>}
          </ScrollArea>
          <TotalBar list={list} selKey={sel?.key} total={total} onDistribute={list.length > 1 ? distributeEvenly : undefined} />
        </div>
        {/* The scrolling panel itself is the boundary, so the cross-fade stays clipped to the panel. */}
        <ViewTransition update={{ detail: 'swap', default: 'none' }} default="none">
        <div className="min-h-0 overflow-y-auto bg-surface-muted px-7 pt-5 pb-6" aria-live="polite">
          {sel ? (
            <>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg">{sel.name}</h3>
                  <div className="text-xs text-fg-muted">{sel.meta}</div>
                </div>
                {/* Cash positions cannot be removed; their weight can go to 0%. */}
                {sel.kind !== 'cash' && <Button variant="link" className="gap-1.5" onClick={() => update((s) => removeItem(s, sel.key))}>
                  <X className="size-2.5" strokeWidth={2.5} />
                  {{ bb: 'Remove building block', mp: 'Remove model portfolio', inst: 'Remove instrument', cash: 'Remove cash position' }[sel.kind]}
                </Button>}
              </div>
              {sel.comp ? <ComponentDetail c={sel.comp} />
                : <p className="mt-3 text-fg-secondary">{sel.kind === 'inst' ? 'Single instrument held directly in the model portfolio. Price, currency and ESG data are shown in Simulation.' : `Cash held in ${sel.cashCcy} for liquidity.`}</p>}
            </>
          ) : <p className="text-fg-subtle">Add components on the Component selection tab.</p>}
        </div>
        </ViewTransition>
      </div>
    </Section>
  )
}

/** One weight row: select area (name, meta, conflict), weight field, and the share line that doubles as a slider. */
function AllocRow({ it, selected, onPick, onSelect, total, setW }: { it: AllocItem; selected: boolean; onPick: () => void; onSelect: () => void; total: number; setW: (it: AllocItem, v: number) => void }) {
  const { state } = usePortfolio()
  const w = weightOf(state, it)
  const cf = it.comp ? conflictsOf(it.comp, state.prefs) : []
  const left = 100 - total
  return (
    <div className={cn('flex flex-col gap-2 border-b border-line pt-2.5 pr-5 pb-3 pl-3', selected ? 'bg-surface-muted' : 'bg-surface hover:bg-surface-subtle')}>
      <div className="flex items-center gap-3">
        <button type="button" onClick={onPick} aria-pressed={selected} className="flex min-w-0 flex-1 cursor-pointer flex-col text-left">
          <span>{it.name}</span>
          <span className="text-xs text-fg-muted">{it.meta}</span>
          {cf.length > 0 && <ConflictTag className="mt-1">Conflicts with exclusions: {cf.join(', ')}</ConflictTag>}
        </button>
        <WeightField value={w} onValueChange={(v) => setW(it, v)} onFocus={onSelect} aria-label={`Weight of ${it.name} in percent`} />
      </div>
      {/* Pressing the slider selects its row immediately; the drag is not interrupted because the slider is not re-mounted. */}
      <WeightSlider value={w} onValueChange={(v) => setW(it, v)} onPointerDown={onSelect} color={CLASS_COLOR[it.cls]} aria-label={`Weight of ${it.name} (slider)`} />
      {selected && left > 0.004 && (
        <div className="flex justify-end">
          <Button variant="link" className="text-xs" onClick={() => setW(it, w + left)}>Fill remaining (+{f2(left)}%)</Button>
        </div>
      )}
    </div>
  )
}

/** Total: one stacked bar of all components (grouped by asset class), then the total line. */
function TotalBar({ list, selKey, total, onDistribute }: { list: AllocItem[]; selKey?: string; total: number; onDistribute?: () => void }) {
  const { state } = usePortfolio()
  const segs = list
    .map((it, i) => ({ it, i, w: weightOf(state, it) }))
    .filter((x) => x.w > 0.004)
    .sort((a, b) => ASSET_CLASSES.indexOf(a.it.cls) - ASSET_CLASSES.indexOf(b.it.cls) || a.i - b.i)
  const over = total > 100.005
  return (
    <div className="flex flex-col gap-2 border-t border-line-strong pt-3 pr-5 pb-0.5 pl-3">
      <div role="img" aria-label="Allocation of all components" className="flex h-3.5 gap-0.5 bg-surface-strong">
        {segs.map(({ it, w }) => (
          <Tooltip.Root key={it.key}>
            <Tooltip.Trigger
              render={<span />}
              className={cn('relative block h-full hover:brightness-90', it.key === selKey && 'after:absolute after:inset-x-0 after:-bottom-1.25 after:h-0.5 after:bg-fg')}
              style={{ width: `${Math.min(100, w)}%`, background: CLASS_COLOR[it.cls] }}
            />
            <TooltipPopup>{it.name} · {it.cls} · {f2(w)}%</TooltipPopup>
          </Tooltip.Root>
        ))}
      </div>
      <div className="flex items-baseline gap-3">
        <span>Total</span>
        <span className={cn('text-xs', over ? 'text-error' : 'text-fg-muted')}>
          {near100(total) ? 'Fully allocated' : total < 100 ? `${f2(100 - total)}% left to allocate` : `${f2(total - 100)}% over 100%`}
        </span>
        {onDistribute && <Button variant="link" className="text-xs" onClick={onDistribute}>Distribute evenly</Button>}
        <strong className={cn('ml-auto text-lg font-semibold tabular-nums', over && 'text-error')}>{f2(total)}%</strong>
      </div>
    </div>
  )
}
