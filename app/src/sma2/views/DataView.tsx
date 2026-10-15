import { Lock } from 'lucide-react'
import { useState, ViewTransition } from 'react'
import { Field, Input } from '../components/ui/input'
import { Section } from '../components/ui/layout'
import { Select } from '../components/ui/select'
import { BENCHMARKS, PORTFOLIO_CURRENCIES } from '../data/data'
import { codeTaken, parentCode, usePortfolio } from '../state/portfolio'
import { ParentLink } from './ParentLink'

export function DataView() {
  // "Required" shows only on a field the user has been in and left empty, so a new form starts clean.
  const [touched, setTouched] = useState({ code: false, name: false })
  const { state, update } = usePortfolio()
  const d = state.data
  if (state.custom) return <CustomDataView />
  return (
    <div className="flex min-h-full flex-wrap">
      {/* As the form design: a 392px column of 250px fields (28px high, 12px labels), divided from the benchmark by a rule.
          A required field left empty turns red with its label, without a message. */}
      <Section screenHeading title="Model portfolio data" description="Please enter the data specific to the model portfolio." className="min-h-full w-98 shrink-0 border-r border-line-strong pt-6">
        <div className="mt-8 flex flex-col gap-8">
          <Field label="Model portfolio code" invalid={touched.code && !d.code.trim()} error={codeTaken(state) && 'This code is already used by another model portfolio'}>
            <Input className="h-7 w-62.5" aria-invalid={codeTaken(state) || (touched.code && !d.code.trim())} onBlur={() => setTouched((t) => ({ ...t, code: true }))} value={d.code} onValueChange={(v) => update((s) => { s.data.code = v })} />
          </Field>
          <Field label="Model portfolio name" invalid={touched.name && !d.name.trim()}>
            <Input className="h-7 w-62.5" aria-invalid={touched.name && !d.name.trim()} onBlur={() => setTouched((t) => ({ ...t, name: true }))} value={d.name} onValueChange={(v) => update((s) => { s.data.name = v })} />
          </Field>
          <Field label="Currency">
            <Select className="h-7 w-62.5" value={d.ccy} onValueChange={(v) => update((s) => { s.data.ccy = v })} items={PORTFOLIO_CURRENCIES.map((c) => ({ value: c, label: c }))} />
          </Field>
        </div>
      </Section>
      <Section title="Benchmark" description="Please select the benchmark associated to the model portfolio." className="min-w-0 flex-[1_1_45rem] pt-6">
        <BenchmarkPicker showError={touched.code || touched.name} />
      </Section>
    </div>
  )
}

/** Benchmark dropdown. Nothing about its composition shows until one is selected; then its name and constituent indices appear, read-only. */
function BenchmarkPicker({ showError, readOnly }: { showError?: boolean; /** Customized: the parent's benchmark, shown but not changeable. */ readOnly?: boolean }) {
  const { state, animate } = usePortfolio()
  const sel = BENCHMARKS.find((b) => b.id === state.data.benchmark)
  const items = BENCHMARKS.map((b) => ({ value: b.id, label: b.name }))

  return (
    <div className="mt-8">
      <Field label="Benchmark" invalid={showError && !sel} description={readOnly && <Inherited />} className="w-62.5 max-w-full">
        {readOnly
          ? <Input className="h-7" disabled value={sel?.name ?? ''} />
          : <Select className="h-7" invalid={showError && !sel} value={state.data.benchmark} onValueChange={(v) => animate((s) => { s.data.benchmark = v })} items={items} />}
      </Field>
      {sel && (
        <div className="mt-6" aria-live="polite">
          <ViewTransition key={sel.id} name="bench-detail" share="swap">
          {/* As the form design: the benchmark's indices straight under the field, names as links, no total. */}
          <table className="w-140 max-w-full border-collapse border border-line-strong bg-surface" aria-label={`Composition of ${sel.name}`}>
            <thead>
              <tr className="bg-surface-subtle text-left text-sm">
                <th className="border-b border-line-strong px-3 py-2 font-normal">Index</th>
                <th className="w-32 border-b border-line-strong px-3 py-2 text-right font-normal">Weight %</th>
              </tr>
            </thead>
            <tbody className="text-base">
              {sel.parts.map(([n, w]) => (
                <tr key={n} className="hover:bg-field-focus">
                  <td className="border-b border-line px-3 py-1.5"><span className="cursor-pointer text-link hover:underline">{n}</span></td>
                  <td className="border-b border-line px-3 py-1.5 text-right tabular-nums">{Number.isInteger(w) ? w : w.toFixed(1)} %</td>
                </tr>
              ))}
            </tbody>
          </table>
          </ViewTransition>
        </div>
      )}
    </div>
  )
}

/**
 * Customized version (creating one or opening one): the page says which parent it is a version of. Code and name are
 * its own; currency and benchmark are inherited from the parent and read-only, shown as in the standard first step.
 */
function CustomDataView() {
  const [touched, setTouched] = useState({ code: false, name: false })
  const { state, update } = usePortfolio()
  const d = state.data
  const creating = state.custom?.version === 0
  return (
    <div className="flex flex-wrap">
      <Section
        screenHeading
        title="Model portfolio data"
        description={<>{creating ? 'You are creating a customized version of ' : 'Customized version of '}<ParentLink />.</>}
        className="w-90 shrink-0 border-r border-line"
      >
        <div className="mt-5 flex flex-col gap-4">
          <Field label="Model portfolio code" error={codeTaken(state) ? 'This code is already used by another model portfolio' : touched.code && !d.code.trim() && 'Required'}>
            <Input aria-invalid={codeTaken(state) || (touched.code && !d.code.trim())} onBlur={() => setTouched((t) => ({ ...t, code: true }))} value={d.code} onValueChange={(v) => update((s) => { s.data.code = v })} />
          </Field>
          <Field label="Model portfolio name" error={touched.name && !d.name.trim() && 'Required'}>
            <Input aria-invalid={touched.name && !d.name.trim()} onBlur={() => setTouched((t) => ({ ...t, name: true }))} value={d.name} onValueChange={(v) => update((s) => { s.data.name = v })} />
          </Field>
          <Field label="Currency" description={<Inherited />}>
            <Input disabled value={d.ccy} />
          </Field>
        </div>
      </Section>
      <Section title="Benchmark" description={<>The benchmark of <ParentLink />, inherited and read-only.</>} className="min-w-0 flex-[1_1_45rem]">
        <BenchmarkPicker readOnly />
      </Section>
    </div>
  )
}

function Inherited() {
  const { state } = usePortfolio()
  return <span className="inline-flex items-center gap-1 text-xs text-fg-muted"><Lock className="size-3" strokeWidth={1.75} aria-hidden />Inherited from {state.custom && parentCode(state.custom)}</span>
}
