import { Ban, Lock } from 'lucide-react'
import { useLayoutEffect, useRef, useState, ViewTransition, type ReactNode } from 'react'
import { Button } from '../components/ui/button'
import { ExclusionChip, RemoveButton, SuggestionChip } from '../components/ui/chip'
import { MultiCombobox } from '../components/ui/combobox'
import { AffixInput, Field, Input } from '../components/ui/input'
import { GroupLabel, Section } from '../components/ui/layout'
import { Checkbox } from '../components/ui/selection'
import { ThresholdScale } from '../components/ui/threshold-scale'
import { CATEGORIES, ESG_SCORES, EXCLUDABLE_INSTRUMENTS, RATINGS, type ExclusionCategory } from '../data/data'
import { cn } from '../lib/cn'
import { instrumentByIsin, maxInstError, minPosError, optionLabel, parentCode, PREF_KEYS, prefText, resetToInherit, setOwnValue, usePortfolio, type PrefKey } from '../state/portfolio'


export function PreferencesView() {
  const { state, update } = usePortfolio()
  const p = state.prefs
  const custom = state.custom
  const clearAll = () => update((s) => {
    CATEGORIES.forEach((c) => { s.prefs.sel[c.id] = [] })
    s.prefs.rating = RATINGS.length; s.prefs.unrated = false; s.prefs.esg = 0; s.prefs.inst = []
    if (!s.custom) { s.prefs.minPos = ''; s.prefs.maxInst = '' }
    PREF_KEYS.forEach((k) => setOwnValue(s, k))
  })
  // Customized: the two limits always come from the parent and cannot be changed here.
  const lockNote = custom && (
    <span className="inline-flex items-center gap-1 text-xs text-fg-muted">
      <Lock className="size-3" strokeWidth={1.75} aria-hidden />
      Locked · inherited from {parentCode(custom)}
    </span>
  )

  return (
    <>
      <Section screenHeading className="border-b border-line pt-4 pb-4" title="Preferences" actions={<Button variant="link" onClick={clearAll}>Clear all</Button>} description={custom ? `Every preference is inherited from ${parentCode(custom)} unless you give it your own value. Changes to ${parentCode(custom)} reach inherited preferences automatically and skip your own values.` : 'Please configure the preferences specific to the model portfolio in the fields below.'}>
        <div className="mt-3 flex flex-wrap items-start gap-x-10 gap-y-3">
          <Field label="Minimum position size" description={lockNote} error={!custom && minPosError(p.minPos)}>
            <AffixInput aria-invalid={!custom && !!minPosError(p.minPos)} disabled={!!custom} value={p.minPos} onValueChange={(v) => update((s) => { s.prefs.minPos = v })} inputMode="decimal" suffix="%" className={cn('w-78 max-w-full', custom && 'bg-surface-muted text-fg-muted')} />
          </Field>
          <Field label="Maximum number of instruments" description={lockNote} error={!custom && maxInstError(p.maxInst)}>
            <Input aria-invalid={!custom && !!maxInstError(p.maxInst)} disabled={!!custom} value={p.maxInst} onValueChange={(v) => update((s) => { s.prefs.maxInst = v })} inputMode="numeric" className="w-78 max-w-full" />
          </Field>
        </div>
      </Section>

      <Section
        title="Exclusions"
        description="Select a suggestion to exclude it in one click, or search the dropdown for any other value."
        className="pt-4"
      >
        <div className="mt-1 flex flex-wrap gap-x-7">
          <div className="min-w-0 flex-[999_1_45rem]">
            {CATEGORIES.map((c) => <CategoryRow key={c.id} cat={c} />)}
            <RatingRow />
            <EsgRow />
          </div>
          <InstrumentsColumn />
        </div>
      </Section>
    </>
  )
}

/**
 * Compact row: the preference's name (and what is excluded) in a fixed left column, its controls on the right, so
 * each preference takes one or two lines and the whole list fits on screen.
 */
function Row({ label, htmlFor, labelId, count, active, k, children }: { label: string; htmlFor?: string; labelId?: string; count?: string; /** Something is excluded: the count reads in red, as excluded items do in Simulation. */ active?: boolean; k: PrefKey; children: ReactNode }) {
  const Label = htmlFor ? 'label' : 'span'
  return (
    <div className="grid grid-cols-[9.5rem_minmax(0,1fr)] gap-x-4 border-b border-line py-3 last:border-b-0">
      <div className="pt-1">
        <Label htmlFor={htmlFor} id={labelId} className="block text-sm">{label}</Label>
        {count && <span className={cn('block text-xs', active ? 'text-conflict' : 'text-fg-muted')}>{count}</span>}
      </div>
      {/* Same height for every preference, chosen values or not: room for the controls line and the chips line. */}
      <div className="min-h-17 min-w-0">
        <Source k={k} />
        {children}
      </div>
    </div>
  )
}

/**
 * One exclusion category. Line 1: one-click suggestions first (the quickest way to exclude), filling the row up to the
 * search field, which sits at the right end, next to the excluded instruments column. Suggestions that do not fit wait
 * behind "+N more". Line 2: what is excluded.
 */
function CategoryRow({ cat }: { cat: ExclusionCategory }) {
  const { state, animate } = usePortfolio()
  const [more, setMore] = useState(false)
  const sel = state.prefs.sel[cat.id]
  const setSel = (next: string[]) => animate((s) => { s.prefs.sel[cat.id] = next; setOwnValue(s, cat.id) })
  // The suggested values first, then every other option, so the line is never half empty.
  const sugg = [...cat.suggested, ...cat.options.map((o) => o.id).filter((id) => !cat.suggested.includes(id))].filter((id) => !sel.includes(id))
  const box = useRef<HTMLDivElement>(null)
  const [fit, setFit] = useState(sugg.length)
  // How many chips fit on one line, measured on resize and whenever the list changes.
  useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    const measure = () => {
      const max = el.clientWidth
      let n = 0
      for (const c of Array.from(el.children) as HTMLElement[]) { if (c.offsetLeft + c.offsetWidth <= max + 0.5) n++; else break }
      setFit(n)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [sugg.join(), more])
  const hidden = more ? 0 : sugg.length - fit
  return (
    <Row label={cat.label.replace(' exclusions', '')} htmlFor={'f-' + cat.id} count={sel.length ? `${sel.length} excluded` : 'Nothing excluded'} active={sel.length > 0} k={cat.id}>
      <div className="flex items-start gap-1.5">
        <div ref={box} className={cn('relative flex min-w-0 flex-1 gap-1.5 py-0.75', more ? 'flex-wrap' : 'overflow-hidden')}>
          {sugg.map((id, i) => {
            const l = optionLabel(cat.id, id)
            const off = !more && i >= fit
            return (
              <span key={id} className={cn('shrink-0', off && 'invisible')} inert={off} aria-hidden={off || undefined}>
                <SuggestionChip onClick={() => setSel([...sel, id])} aria-label={'Exclude ' + l}>{l}</SuggestionChip>
              </span>
            )
          })}
        </div>
        {(hidden > 0 || more) && (
          <Button variant="link" className="h-8 shrink-0 text-xs" aria-expanded={more} onClick={() => setMore(!more)}>{more ? 'Show less' : `+${hidden} more`}</Button>
        )}
        <MultiCombobox id={'f-' + cat.id} options={cat.options} value={sel} onValueChange={setSel} placeholder={cat.placeholder} className="ml-2 w-78 shrink-0" />
      </div>
      {sel.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {sel.map((id) => {
            const l = optionLabel(cat.id, id)
            return (
              <ViewTransition key={id} enter="item-in" exit="item-out" update="item-move">
                <ExclusionChip onRemove={() => setSel(sel.filter((x) => x !== id))} removeLabel={'Remove ' + l}>{l}</ExclusionChip>
              </ViewTransition>
            )
          })}
        </div>
      )}
    </Row>
  )
}

function RatingRow() {
  const { state, update } = usePortfolio()
  const p = state.prefs
  const limited = p.rating < RATINGS.length
  return (
    <Row label="Credit rating" labelId="rating-label" count={limited ? `${RATINGS[p.rating]} and below excluded` : 'Click a grade to exclude it and below'} active={limited} k="rating">
      <div className="flex flex-col items-start gap-2">
        {/* Shown from the lowest grade up (C … Aaa), like the ESG scores: what is excluded sits on the left. */}
        <ThresholdScale
          aria-labelledby="rating-label"
          labels={[...RATINGS].reverse()}
          isExcluded={(j) => RATINGS.length - 1 - j >= p.rating}
          cutAt={RATINGS.length - p.rating}
          onPick={(j) => update((s) => { const r = RATINGS.length - 1 - j; s.prefs.rating = r === s.prefs.rating ? RATINGS.length : r; setOwnValue(s, 'rating') })}
          className="w-full text-xs"
        />
        <label className="inline-flex cursor-pointer items-center gap-1.5">
          <Checkbox checked={p.unrated} onCheckedChange={(v) => update((s) => { s.prefs.unrated = v; setOwnValue(s, 'rating') })} />
          Also exclude not rated
        </label>
      </div>
    </Row>
  )
}

function EsgRow() {
  const { state, update } = usePortfolio()
  const p = state.prefs
  return (
    <Row label="ESG" labelId="esg-label" count={p.esg > 0 ? `Score ${ESG_SCORES[p.esg - 1]} and below excluded` : 'Click a score to exclude it and below'} active={p.esg > 0} k="esg">
      <ThresholdScale
        aria-labelledby="esg-label"
        labels={ESG_SCORES.map((s) => 'Score ' + s)}
        isExcluded={(i) => i < p.esg}
        cutAt={p.esg}
        onPick={(i) => update((s) => { s.prefs.esg = i === s.prefs.esg - 1 ? 0 : i + 1; setOwnValue(s, 'esg') })}
        className="max-w-85"
      />
    </Row>
  )
}

/** Side column (same 380px as the Component selection sidebar): excluded instruments as borderless rows. */
function InstrumentsColumn() {
  const { state, animate } = usePortfolio()
  const inst = state.prefs.inst
  const setInst = (next: string[]) => animate((s) => { s.prefs.inst = next; setOwnValue(s, 'inst') })
  return (
    <div className="min-w-0 flex-[1_1_23.75rem] border-l border-line py-2.5 pr-1.5 pl-7">
      <GroupLabel htmlFor="inst-q" count={inst.length ? <span className="text-conflict">{inst.length} excluded</span> : undefined}>Excluded instruments</GroupLabel>
      <Source k="inst" />
      <MultiCombobox
        id="inst-q"
        options={EXCLUDABLE_INSTRUMENTS.map((x) => ({ id: x.isin, label: x.name, sub: x.isin }))}
        value={inst}
        onValueChange={setInst}
        placeholder="Add by ISIN or instrument name…"
        showTrigger={false}
        className="w-78 max-w-full"
      />
      <div className="mt-3.5 flex flex-col gap-0.5">
        {inst.map((isin) => {
          const n = instrumentByIsin(isin).name
          return (
            <ViewTransition key={isin} enter="item-in" exit="item-out" update="item-move">
            <div className="flex min-h-7.5 items-center gap-2.5">
              <Ban className="size-3.25 shrink-0 text-error" strokeWidth={2} aria-label="Excluded" />
              <span className="min-w-0 flex-1">{n}<span className="ml-1.5 text-xs text-fg-muted">{isin}</span></span>
              <RemoveButton onClick={() => setInst(inst.filter((x) => x !== isin))} label={'Remove ' + n} className="text-fg-subtle" />
            </div>
            </ViewTransition>
          )
        })}
        {!inst.length && <span className="text-fg-subtle">No instruments excluded</span>}
      </div>
    </div>
  )
}

/**
 * Customized only: where a preference's value comes from. Inherited (follows the parent, parent changes flow in) or
 * own value (parent changes are skipped, never a conflict), with the parent's value when they differ and a reset.
 */
function Source({ k }: { k: PrefKey }) {
  const { state, update } = usePortfolio()
  const c = state.custom
  if (!c) return null
  const own = c.overrides.includes(k)
  const parent = prefText(c.parentPrefs, k)
  const differs = parent !== prefText(state.prefs, k)
  const pc = parentCode(c)
  return (
    <div className="-mt-0.5 mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
      <span className={cn('rounded-xs px-1.5 text-xs/4.5 whitespace-nowrap', own ? 'bg-selected/10 text-fg' : 'border border-line-strong text-fg-muted')}>{own ? 'Own value' : 'Inherited'}</span>
      <span className="text-fg-muted">
        {own ? `Changes to ${pc} are skipped` : `Follows ${pc}`}
        {own && differs && <> · {pc}: <span className="text-fg">{parent}</span></>}
        {!own && differs && <> · {pc} now has <span className="text-fg">{parent}</span>, not applied yet</>}
      </span>
      {own && <Button variant="link" className="text-xs" onClick={() => update((s) => resetToInherit(s, k))}>Follow {pc} again</Button>}
    </div>
  )
}
