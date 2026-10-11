import { Ban } from 'lucide-react'
import { useState, ViewTransition } from 'react'
import { Button } from '../components/ui/button'
import { EmptySlot, ExclusionChip, RemoveButton, SuggestionChip } from '../components/ui/chip'
import { MultiCombobox } from '../components/ui/combobox'
import { AffixInput, Field, Input } from '../components/ui/input'
import { GroupLabel, Section } from '../components/ui/layout'
import { Checkbox } from '../components/ui/selection'
import { ThresholdScale } from '../components/ui/threshold-scale'
import { CATEGORIES, ESG_SCORES, EXCLUDABLE_INSTRUMENTS, RATINGS, type ExclusionCategory } from '../data/data'
import { instrumentByIsin, optionLabel, usePortfolio } from '../state/portfolio'

const SHOW = 4 // suggestions shown before "+N more"

export function PreferencesView() {
  const { state, update } = usePortfolio()
  const p = state.prefs
  const clearAll = () => update((s) => {
    CATEGORIES.forEach((c) => { s.prefs.sel[c.id] = [] })
    s.prefs.rating = RATINGS.length; s.prefs.unrated = false; s.prefs.esg = 0; s.prefs.inst = []
  })

  return (
    <>
      <Section screenHeading title="Preferences" description="Please configure the preferences specific to the model portfolio in the fields below." className="border-b border-line">
        <div className="mt-4 flex flex-wrap items-end gap-x-10 gap-y-4">
          <Field label="Minimum position size">
            <AffixInput value={p.minPos} onValueChange={(v) => update((s) => { s.prefs.minPos = v })} inputMode="decimal" suffix="%" className="w-37.5" />
          </Field>
          <Field label="Maximum number of instruments">
            <Input value={p.maxInst} onValueChange={(v) => update((s) => { s.prefs.maxInst = v })} inputMode="numeric" className="w-67.5" />
          </Field>
        </div>
      </Section>

      <Section
        title="Exclusions"
        description="Please configure the exclusionary preferences specific to the model portfolio in the fields below."
        actions={<Button variant="link" onClick={clearAll}>Clear all</Button>}
      >
        <div className="mt-2 flex flex-wrap gap-x-7">
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

const rowClass = 'border-b border-line py-3.5 last:border-b-0'

/** One exclusion category: search field + suggestions on one line, chosen exclusions underneath. */
function CategoryRow({ cat }: { cat: ExclusionCategory }) {
  const { state, animate } = usePortfolio()
  const [more, setMore] = useState(false)
  const sel = state.prefs.sel[cat.id]
  const setSel = (next: string[]) => animate((s) => { s.prefs.sel[cat.id] = next })
  const sugg = cat.suggested.filter((id) => !sel.includes(id))
  const visible = more ? sugg : sugg.slice(0, SHOW)

  return (
    <div className={rowClass}>
      <GroupLabel htmlFor={'f-' + cat.id} count={sel.length ? `${sel.length} excluded` : undefined}>{cat.label}</GroupLabel>
      <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
        <MultiCombobox id={'f-' + cat.id} options={cat.options} value={sel} onValueChange={setSel} placeholder={cat.placeholder} className="w-55 shrink-0" />
        {sugg.length > 0 && (
          <div className="flex min-h-8 min-w-0 flex-[1_1_18.75rem] flex-wrap items-center gap-x-2 gap-y-1.5">
            {visible.map((id) => {
              const l = optionLabel(cat.id, id)
              return <SuggestionChip key={id} onClick={() => setSel([...sel, id])} aria-label={'Exclude ' + l}>{l}</SuggestionChip>
            })}
            {sugg.length > SHOW && (
              <Button variant="link" aria-expanded={more} onClick={() => setMore(!more)}>{more ? 'Show less' : `+${sugg.length - SHOW} more`}</Button>
            )}
          </div>
        )}
      </div>
      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        {sel.length ? sel.map((id) => {
          const l = optionLabel(cat.id, id)
          return (
            <ViewTransition key={id} enter="item-in" exit="item-out" update="item-move">
              <ExclusionChip onRemove={() => setSel(sel.filter((x) => x !== id))} removeLabel={'Remove ' + l}>{l}</ExclusionChip>
            </ViewTransition>
          )
        }) : <EmptySlot>Nothing excluded</EmptySlot>}
      </div>
    </div>
  )
}

function RatingRow() {
  const { state, update } = usePortfolio()
  const p = state.prefs
  const limited = p.rating < RATINGS.length
  return (
    <div className={rowClass}>
      <GroupLabel id="rating-label" count={limited ? `${RATINGS[p.rating]} and below excluded` : 'Click a grade to exclude it and everything below'}>Credit rating exclusions</GroupLabel>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <ThresholdScale
          aria-labelledby="rating-label"
          labels={RATINGS}
          isExcluded={(i) => i >= p.rating}
          cutAt={p.rating}
          onPick={(i) => update((s) => { s.prefs.rating = i === s.prefs.rating ? RATINGS.length : i })}
          className="flex-[0_1_33rem]"
        />
        <label className="inline-flex cursor-pointer items-center gap-1.5">
          <Checkbox checked={p.unrated} onCheckedChange={(v) => update((s) => { s.prefs.unrated = v })} />
          Also exclude not rated
        </label>
      </div>
    </div>
  )
}

function EsgRow() {
  const { state, update } = usePortfolio()
  const p = state.prefs
  return (
    <div className={rowClass}>
      <GroupLabel id="esg-label" count={p.esg > 0 ? `Score ${ESG_SCORES[p.esg - 1]} and below excluded` : 'Click a score to exclude it and everything below'}>ESG exclusions</GroupLabel>
      <ThresholdScale
        aria-labelledby="esg-label"
        labels={ESG_SCORES.map((s) => 'Score ' + s)}
        isExcluded={(i) => i < p.esg}
        cutAt={p.esg}
        onPick={(i) => update((s) => { s.prefs.esg = i === s.prefs.esg - 1 ? 0 : i + 1 })}
        className="max-w-85"
      />
    </div>
  )
}

/** Side column (same 380px as the Component selection sidebar): excluded instruments as borderless rows. */
function InstrumentsColumn() {
  const { state, animate } = usePortfolio()
  const inst = state.prefs.inst
  const setInst = (next: string[]) => animate((s) => { s.prefs.inst = next })
  return (
    <div className="min-w-0 flex-[1_1_23.75rem] border-l border-line py-3.5 pr-1.5 pl-7">
      <GroupLabel htmlFor="inst-q" count={inst.length ? `${inst.length} excluded` : undefined}>Excluded instruments</GroupLabel>
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
