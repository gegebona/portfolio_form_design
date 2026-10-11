import { Info } from 'lucide-react'
import { useState, ViewTransition } from 'react'
import { Field, Input } from '../components/ui/input'
import { Section } from '../components/ui/layout'
import { Select } from '../components/ui/select'
import { BENCHMARKS, PORTFOLIO_CURRENCIES } from '../data/data'
import { usePortfolio } from '../state/portfolio'

export function DataView() {
  // "Required" shows only on a field the user has been in and left empty, so a new form starts clean.
  const [touched, setTouched] = useState({ code: false, name: false })
  const { state, update } = usePortfolio()
  const d = state.data
  return (
    <div className="flex flex-wrap">
      <Section screenHeading title="Model portfolio data" description="Please enter the data specific to the model portfolio." className="w-75 shrink-0 border-r border-line">
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
function BenchmarkPicker({ showError }: { showError?: boolean }) {
  const { state, animate } = usePortfolio()
  const pccy = state.data.ccy
  const sel = BENCHMARKS.find((b) => b.id === state.data.benchmark)
  const items = [...(sel ? [] : [{ value: '', label: 'Select a benchmark…' }]), ...BENCHMARKS.map((b) => ({ value: b.id, label: b.name }))]

  return (
    <div className="mt-5">
      <Field label="Benchmark" error={showError && !sel && 'Required'} className="w-90 max-w-full">
        <Select value={state.data.benchmark} onValueChange={(v) => animate((s) => { s.data.benchmark = v })} items={items} />
      </Field>
      {sel && (
        <div className="mt-5 rounded-sm border border-selected/25 bg-selected/5 px-7 py-5" aria-live="polite">
          <ViewTransition key={sel.id} name="bench-detail" share="swap">
          <div>
            <h3 className="text-lg">{sel.name}</h3>
            <div className="mt-0.5 text-xs text-fg-muted">Currency {sel.ccy} · {sel.parts.length} {sel.parts.length === 1 ? 'index' : 'indices'}</div>
            {sel.ccy !== pccy && (
              <div className="mt-3 flex max-w-155 items-start gap-2 border border-line bg-surface px-3 py-2 text-xs text-fg-secondary">
                <Info className="mt-px size-3.5 shrink-0" strokeWidth={1.5} />
                <span>This benchmark is in {sel.ccy}, while the model portfolio currency is {pccy}.</span>
              </div>
            )}
            <div className="mt-4 max-w-155 border border-line bg-surface" role="table" aria-label="Benchmark composition">
              <Row head>
                <span role="columnheader">Index</span><span role="columnheader" /><span role="columnheader" className="text-right">Weight</span>
              </Row>
              {sel.parts.map(([n, w]) => (
                <Row key={n}>
                  <span role="cell">{n}</span>
                  <span role="cell" aria-hidden className="block h-1.5 bg-surface-muted"><span className="block h-full bg-chart-neutral" style={{ width: `${w}%` }} /></span>
                  <span role="cell" className="text-right tabular-nums">{w}%</span>
                </Row>
              ))}
              <Row total>
                <span role="cell">Total</span><span role="cell" /><span role="cell" className="text-right tabular-nums">{sel.parts.reduce((s, [, w]) => s + w, 0)}%</span>
              </Row>
            </div>
          </div>
          </ViewTransition>
        </div>
      )}
    </div>
  )
}

function Row({ head, total, children }: { head?: boolean; total?: boolean; children: React.ReactNode }) {
  return (
    <div
      role="row"
      className={
        'grid min-h-9 grid-cols-[minmax(0,1fr)_minmax(5rem,12.5rem)_4rem] items-center gap-4 border-t border-surface-muted px-3 first:border-t-0 ' +
        (head ? 'min-h-8 bg-page text-xs text-fg-muted' : total ? 'bg-surface-subtle font-semibold' : '')
      }
    >
      {children}
    </div>
  )
}
