import { Ban, Lock } from 'lucide-react'
import { useState, ViewTransition, type ReactNode } from 'react'
import { Button } from '../components/ui/button'
import { ExclusionChip, RemoveButton, SuggestionChip } from '../components/ui/chip'
import { MultiCombobox } from '../components/ui/combobox'
import { AffixInput, Field, Input } from '../components/ui/input'
import { GroupLabel, Section } from '../components/ui/layout'
import { Checkbox } from '../components/ui/selection'
import { ThresholdScale } from '../components/ui/threshold-scale'
import { CATEGORIES, ESG_SCORES, EXCLUDABLE_INSTRUMENTS, RATINGS, type ExclusionCategory } from '../data/data'
import { cn } from '../lib/cn'
import { instrumentByIsin, optionLabel, parentCode, PREF_KEYS, prefText, resetToInherit, setOwnValue, usePortfolio, type PrefKey } from '../state/portfolio'

const SHOW = 4 // suggestions shown before "+N more"

export function PreferencesView() {
  const { state, update } = usePortfolio()
  const p = state.prefs
  const custom = state.custom
  const clearAll = () => update((s) => {
    CATEGORIES.forEach((c) => { s.prefs.sel[c.id] = [] })
    s.prefs.rating = RATINGS.length; s.prefs.unrated = false; s.prefs.esg = 0; s.prefs.inst = []
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
      <Section screenHeading className="border-b border-line pt-4 pb-4" title="Preferences" description={custom ? `Every preference is inherited from ${parentCode(custom)} unless you give it your own value. Changes to ${parentCode(custom)} reach inherited preferences automatically and skip your own values.` : 'Please configure the preferences specific to the model portfolio in the fields below.'}>
        <div className="mt-3 flex flex-wrap items-end gap-x-10 gap-y-3">
          <Field label="Minimum position size" description={lockNote}>
            <AffixInput disabled={!!custom} value={p.minPos} onValueChange={(v) => update((s) => { s.prefs.minPos = v })} inputMode="decimal" suffix="%" className={cn('w-37.5', custom && 'bg-surface-muted text-fg-muted')} />
          </Field>
          <Field label="Maximum number of instruments" description={lockNote}>
            <Input disabled={!!custom} value={p.maxInst} onValueChange={(v) => update((s) => { s.prefs.maxInst = v })} inputMode="numeric" className="w-67.5" />
          </Field>
        </div>
      </Section>

      <Section
        title="Exclusions"
        description="Please configure the exclusionary preferences specific to the model portfolio in the fields below."
        actions={<Button variant="link" onClick={clearAll}>Clear all</Button>}
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
function Row({ label, htmlFor, labelId, count, k, children }: { label: string; htmlFor?: string; labelId?: string; count?: string; k: PrefKey; children: ReactNode }) {
  const Label = htmlFor ? 'label' : 'span'
  return (
    <div className="grid grid-cols-[9rem_minmax(0,1fr)] gap-x-4 border-b border-line py-2.5 last:border-b-0">
      <div className="pt-1">
        <Label htmlFor={htmlFor} id={labelId} className="block text-sm">{label}</Label>
        {count && <span className="block text-xs text-fg-muted">{count}</span>}
      </div>
      <div className="min-w-0">
        <Source k={k} />
        {children}
      </div>
    </div>
  )
}

/** One exclusion category: search field and one-click suggestions on the first line, chosen exclusions on the second. */
function CategoryRow({ cat }: { cat: ExclusionCategory }) {
  const { state, animate } = usePortfolio()
  const [more, setMore] = useState(false)
  const sel = state.prefs.sel[cat.id]
  const setSel = (next: string[]) => animate((s) => { s.prefs.sel[cat.id] = next; setOwnValue(s, cat.id) })
  const sugg = cat.suggested.filter((id) => !sel.includes(id))
  const visible = more ? sugg : sugg.slice(0, SHOW)
  return (
    <Row label={cat.label.replace(' exclusions', '')} htmlFor={'f-' + cat.id} count={sel.length ? `${sel.length} excluded` : 'Nothing excluded'} k={cat.id}>
      {/* Line 1: search and suggestions. Line 2: what is excluded. */}
      <div className="flex flex-wrap items-center gap-1.5">
        <MultiCombobox id={'f-' + cat.id} options={cat.options} value={sel} onValueChange={setSel} placeholder={cat.placeholder} className="mr-1.5 w-44 shrink-0" />
        {sugg.length > 0 && (
          <>
            <span className="ml-1 text-xs text-fg-muted">Suggested</span>
            {visible.map((id) => {
              const l = optionLabel(cat.id, id)
              return <SuggestionChip key={id} onClick={() => setSel([...sel, id])} aria-label={'Exclude ' + l}>{l}</SuggestionChip>
            })}
            {sugg.length > SHOW && (
              <Button variant="link" className="text-xs" aria-expanded={more} onClick={() => setMore(!more)}>{more ? 'Show less' : `+${sugg.length - SHOW} more`}</Button>
            )}
          </>
        )}
      </div>
      {sel.length > 0 && (
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
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
    <Row label="Credit rating" labelId="rating-label" count={limited ? `${RATINGS[p.rating]} and below excluded` : 'Click a grade to exclude it and below'} k="rating">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <ThresholdScale
          aria-labelledby="rating-label"
          labels={RATINGS}
          isExcluded={(i) => i >= p.rating}
          cutAt={p.rating}
          onPick={(i) => update((s) => { s.prefs.rating = i === s.prefs.rating ? RATINGS.length : i; setOwnValue(s, 'rating') })}
          className="flex-[0_1_24rem]"
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
    <Row label="ESG" labelId="esg-label" count={p.esg > 0 ? `Score ${ESG_SCORES[p.esg - 1]} and below excluded` : 'Click a score to exclude it and below'} k="esg">
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
      <GroupLabel htmlFor="inst-q" count={inst.length ? `${inst.length} excluded` : undefined}>Excluded instruments</GroupLabel>
      <Source k="inst" />
      <MultiCombobox
        id="inst-q"
        options={EXCLUDABLE_INSTRUMENTS.map((x) => ({ id: x.isin, label: x.name, sub: x.isin }))}
        value={inst}
        onValueChange={setInst}
        placeholder="Add by ISIN or instrument name…"
        showTrigger={false}
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
