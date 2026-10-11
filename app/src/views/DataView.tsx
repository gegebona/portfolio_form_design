import { Info } from 'lucide-react'
import { useState, ViewTransition } from 'react'
import { Field, Input, SearchInput } from '../components/ui/input'
import { Section } from '../components/ui/layout'
import { Select } from '../components/ui/select'
import { Radio, RadioGroup } from '../components/ui/selection'
import { CurrencyTag } from '../components/ui/tag'
import { BENCHMARKS, PORTFOLIO_CURRENCIES } from '../data/data'
import { usePortfolio } from '../state/portfolio'

/** showErrors: set once the user has tried to continue or save, so an empty new form is not covered in errors. */
export function DataView({ showErrors }: { showErrors?: boolean }) {
  const { state, update } = usePortfolio()
  const d = state.data
  return (
    <div className="flex flex-wrap">
      <Section screenHeading title="Model portfolio data" description="Please enter the data specific to the model portfolio." className="w-75 shrink-0 border-r border-line">
        <div className="mt-5 flex flex-col gap-4">
          <Field label="Model portfolio code" error={showErrors && !d.code.trim() && 'Required'}>
            <Input aria-invalid={showErrors && !d.code.trim()} value={d.code} onValueChange={(v) => update((s) => { s.data.code = v })} />
          </Field>
          <Field label="Model portfolio name" error={showErrors && !d.name.trim() && 'Required'}>
            <Input aria-invalid={showErrors && !d.name.trim()} value={d.name} onValueChange={(v) => update((s) => { s.data.name = v })} />
          </Field>
          <Field label="Currency">
            <Select value={d.ccy} onValueChange={(v) => update((s) => { s.data.ccy = v })} items={PORTFOLIO_CURRENCIES.map((c) => ({ value: c, label: c }))} />
          </Field>
        </div>
      </Section>
      <Section title="Benchmark" description="Please select the benchmark associated to the model portfolio." className="min-w-0 flex-[1_1_45rem]">
        <BenchmarkPicker showErrors={showErrors} />
      </Section>
    </div>
  )
}

/** Searchable radio list joined to a details panel: the selected row shares the panel's fill and runs into it. */
function BenchmarkPicker({ showErrors }: { showErrors?: boolean }) {
  const { state, animate } = usePortfolio()
  const [q, setQ] = useState('')
  const pccy = state.data.ccy
  const ql = q.trim().toLowerCase()
  const list = BENCHMARKS.filter((b) => !ql || b.name.toLowerCase().includes(ql) || b.parts.some(([p]) => p.toLowerCase().includes(ql)))
  const sel = BENCHMARKS.find((b) => b.id === state.data.benchmark)

  return (
    <div className="mt-5 grid grid-cols-[22.5rem_minmax(0,1fr)] grid-rows-[auto_1fr]">
      <div className="pr-5">
        <SearchInput value={q} onValueChange={setQ} placeholder="Search benchmarks or indices…" aria-label="Search benchmarks" />
        <div className="mt-2.5 mb-2 text-xs text-fg-muted">{ql ? `${list.length} of ${BENCHMARKS.length} benchmarks` : `${BENCHMARKS.length} benchmarks`}{showErrors && !sel && <span className="ml-2 text-error">Required: select one</span>}</div>
      </div>
      <div />
      <RadioGroup aria-label="Benchmark" value={state.data.benchmark} onValueChange={(v) => animate((s) => { s.data.benchmark = v as string })} className="min-w-0 border-t border-line">
        {list.map((b) => (
          <label
            key={b.id}
            className="flex cursor-pointer items-start gap-2.5 border-b border-line bg-surface py-2.75 pr-5 pl-3 hover:bg-surface-subtle has-data-checked:bg-surface-muted"
          >
            <Radio value={b.id} className="mt-0.5" />
            <span className="flex min-w-0 flex-1 flex-col gap-px">
              <span>{b.name}</span>
              <span className="text-xs text-fg-muted">{b.parts.map(([n, w]) => `${n} ${w}%`).join(' · ')}</span>
            </span>
            {b.ccy !== pccy && <CurrencyTag ccy={b.ccy} portfolioCcy={pccy} />}
          </label>
        ))}
        {!list.length && <div className="p-3 text-fg-subtle">No benchmarks match “{q}”</div>}
      </RadioGroup>
      <div className="min-w-0 bg-surface-muted px-7 py-5" aria-live="polite">
        {sel ? (
          // Same name on the old and new details → the browser cross-fades between them (a “share” transition).
          <ViewTransition key={sel.id} name="bench-detail" share="swap">
          <div className="sticky top-4">
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
        ) : (
          <p className="text-fg-subtle">Select a benchmark from the list.</p>
        )}
      </div>
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
