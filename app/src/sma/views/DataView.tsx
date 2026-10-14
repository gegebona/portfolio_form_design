import { Lock } from 'lucide-react'
import { useState, ViewTransition } from 'react'
import { Field, Input } from '../components/ui/input'
import { Section } from '../components/ui/layout'
import { Select } from '../components/ui/select'
import { BENCHMARKS, PORTFOLIO_CURRENCIES } from '../data/data'
import { parentCode, usePortfolio } from '../state/portfolio'
import { ParentLink } from './ParentLink'

export function DataView() {
  // "Required" shows only on a field the user has been in and left empty, so a new form starts clean.
  const [touched, setTouched] = useState({ code: false, name: false })
  const { state, update } = usePortfolio()
  const d = state.data
  if (state.custom) return <CustomDataView />
  return (
    <div className="flex flex-wrap">
      <Section screenHeading title="Model portfolio data" description="Please enter the data specific to the model portfolio." className="w-90 shrink-0 border-r border-line">
        <div className="mt-5 flex flex-col gap-4">
          <Field label="Model portfolio code" error={touched.code && !d.code.trim() && 'Required'}>
            <Input aria-invalid={touched.code && !d.code.trim()} onBlur={() => setTouched((t) => ({ ...t, code: true }))} value={d.code} onValueChange={(v) => update((s) => { s.data.code = v })} />
          </Field>
          <Field label="Model portfolio name" error={touched.name && !d.name.trim() && 'Required'}>
            <Input aria-invalid={touched.name && !d.name.trim()} onBlur={() => setTouched((t) => ({ ...t, name: true }))} value={d.name} onValueChange={(v) => update((s) => { s.data.name = v })} />
          </Field>
          <Field label="Currency">
            <Select value={d.ccy} onValueChange={(v) => update((s) => { s.data.ccy = v })} items={PORTFOLIO_CURRENCIES.map((c) => ({ value: c, label: c }))} />
          </Field>
        </div>
      </Section>
      <Section title="Benchmark" description="Please select the benchmark associated to the model portfolio." className="min-w-0 flex-[1_1_45rem]">
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
    <div className="mt-5">
      <Field label="Benchmark" error={showError && !sel && 'Required'} description={readOnly && <Inherited />} className="w-78 max-w-full">
        {readOnly
          ? <Input disabled value={sel?.name ?? ''} />
          : <Select value={state.data.benchmark} onValueChange={(v) => animate((s) => { s.data.benchmark = v })} items={items} placeholder="Select a benchmark…" />}
      </Field>
      {sel && (
        <div className="mt-6" aria-live="polite">
          <ViewTransition key={sel.id} name="bench-detail" share="swap">
          <div>
            <h3 className="text-lg">{sel.name}</h3>
            <div className="mt-0.5 text-xs text-fg-muted">{sel.parts.length} {sel.parts.length === 1 ? 'index' : 'indices'}</div>
            {/* Same table pattern as the client book's small lists: grey header band with column dividers, white rows,
                numbers right-aligned, one framed box. */}
            <table className="mt-4 w-full max-w-155 border-collapse border border-line-strong bg-surface" aria-label="Benchmark composition">
              <thead>
                <tr className="bg-shell-band text-left text-xs">
                  <th className="border-b border-line px-3 py-1.5 font-normal"><span className="block border-r border-line pr-3">Index</span></th>
                  <th className="w-32 border-b border-line px-3 py-1.5 text-right font-normal"><span className="block border-r border-line pr-3">Weight %</span></th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {sel.parts.map(([n, w]) => (
                  <tr key={n}>
                    <td className="border-b border-line px-3 py-2">{n}</td>
                    <td className="border-b border-line px-3 py-2 pr-6 text-right tabular-nums">{w.toFixed(1)}</td>
                  </tr>
                ))}
                <tr className="font-semibold">
                  <td className="px-3 py-2">Total</td>
                  <td className="px-3 py-2 pr-6 text-right tabular-nums">{sel.parts.reduce((t, [, w]) => t + w, 0).toFixed(1)}</td>
                </tr>
              </tbody>
            </table>
          </div>
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
          <Field label="Model portfolio code" error={touched.code && !d.code.trim() && 'Required'}>
            <Input aria-invalid={touched.code && !d.code.trim()} onBlur={() => setTouched((t) => ({ ...t, code: true }))} value={d.code} onValueChange={(v) => update((s) => { s.data.code = v })} />
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
