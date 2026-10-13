import { Check, Info } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../components/ui/button'
import { Field } from '../components/ui/input'
import { GroupLabel, Section } from '../components/ui/layout'
import { Select } from '../components/ui/select'
import { Checkbox } from '../components/ui/selection'
import { getBook } from '../state/book'
import { usePortfolio } from '../state/portfolio'

const FAMILIES = ['Equities', 'FI Government', 'FI Corporate'] as const
type Family = (typeof FAMILIES)[number]
const REGIONS = ['USA', 'Europe', 'Global']
const LANGUAGES = ['Italian', 'English']
const HORIZONS = ['Year to date', '1 year', '3 years', '5 years']
/** Exposure chart sections each report family offers; a section not listed for a family is simply not offered. */
const EXPOSURE: Record<Family, string[]> = {
  Equities: ['Asset allocation', 'Sector allocation', 'Region allocation', 'Country allocation', 'Currency allocation'],
  'FI Government': ['Asset allocation', 'Region allocation', 'Country allocation', 'Currency allocation', 'Maturity', 'Duration', 'Yield to maturity', 'Rating'],
  'FI Corporate': ['Asset allocation', 'Sector allocation', 'Region allocation', 'Country allocation', 'Currency allocation', 'Maturity', 'Duration', 'Yield to maturity', 'Rating'],
}
const opts = (v: readonly string[]) => v.map((x) => ({ value: x, label: x }))

type SectionRow = { name: string; kind: 'mandatory' | 'optional' | 'unavailable'; group?: string }

/**
 * Reporting: configure a PDF report for the open model portfolio.
 * Left: report family, regional variant, language and time horizon. Middle: the sections that family allows —
 * mandatory ones are locked on, optional ones are preselected and removable, and a section whose data has not been
 * supplied is shown disabled with the reason. Right: the resulting report outline, in page order.
 */
export function ReportingView() {
  const { state } = usePortfolio()
  const [family, setFamily] = useState<Family>('Equities')
  const [region, setRegion] = useState('Europe')
  const [language, setLanguage] = useState('Italian')
  const [horizon, setHorizon] = useState('1 year')
  const [removed, setRemoved] = useState<Set<string>>(new Set())
  const [generated, setGenerated] = useState('')

  // Performance comes from the bank; nothing is calculated here, so without supplied data the section is unavailable.
  const hasPerformance = getBook().find((e) => e.id === state.book.id)?.perf1y !== undefined
  const rows: SectionRow[] = [
    { name: 'Cover page', kind: 'mandatory' },
    { name: 'Model portfolio composition details', kind: 'mandatory' },
    { name: 'Instrument list', kind: 'optional' },
    { name: 'Top holdings', kind: 'optional' },
    ...EXPOSURE[family].map((name) => ({ name, kind: 'optional' as const, group: 'Exposure charts' })),
    { name: 'Performance', kind: hasPerformance ? 'optional' : 'unavailable' },
    { name: 'Disclaimer', kind: 'mandatory' },
  ]
  const included = rows.filter((r) => r.kind === 'mandatory' || (r.kind === 'optional' && !removed.has(r.name)))
  const optional = rows.filter((r) => r.kind === 'optional')
  const toggle = (name: string) => setRemoved((s) => { const n = new Set(s); if (n.has(name)) n.delete(name); else n.add(name); return n })
  const key = [family, region, language, horizon, ...included.map((r) => r.name)].join('|')
  const name = state.data.name || 'New model portfolio'

  return (
    <div className="flex min-h-0 flex-1 flex-wrap">
      <Section screenHeading title="Reporting" description="Please configure the report for this model portfolio." className="w-90 shrink-0 border-r border-line">
        <div className="mt-5 flex flex-col gap-4">
          <Field label="Report family"><Select value={family} onValueChange={(v) => setFamily(v as Family)} items={opts(FAMILIES)} /></Field>
          <Field label="Regional variant"><Select value={region} onValueChange={setRegion} items={opts(REGIONS)} /></Field>
          <Field label="Language"><Select value={language} onValueChange={setLanguage} items={opts(LANGUAGES)} /></Field>
          <Field label="Time horizon"><Select value={horizon} onValueChange={setHorizon} items={opts(HORIZONS)} /></Field>
        </div>
      </Section>

      <Section title="Sections" description="Mandatory sections are always included. Untick a section to leave it out." className="min-w-0 flex-[1_1_24rem] border-r border-line"
        actions={<Button variant="link" disabled={!removed.size} onClick={() => setRemoved(new Set())}>Select all</Button>}>
        <div className="mt-4">
          <GroupLabel count={`${included.length} of ${rows.filter((r) => r.kind !== 'unavailable').length} included`}>Report content</GroupLabel>
          <ul className="border-t border-line">
            {rows.map((r, i) => {
              const on = included.includes(r)
              const firstOfGroup = r.group && rows[i - 1]?.group !== r.group
              return (
                <li key={r.name}>
                  {firstOfGroup && <div className="border-b border-line bg-surface-subtle px-3 py-1.5 text-xs text-fg-muted">{r.group}</div>}
                  <label className={`flex min-h-9 items-center gap-2.5 border-b border-line px-3 ${r.group ? 'pl-7' : ''} ${r.kind === 'optional' ? 'cursor-pointer hover:bg-surface-subtle' : ''}`}>
                    <Checkbox checked={on} disabled={r.kind !== 'optional'} onCheckedChange={() => toggle(r.name)} />
                    <span className={r.kind === 'unavailable' ? 'text-fg-disabled' : ''}>{r.name}</span>
                    {r.kind === 'mandatory' && <span className="ml-auto text-xs text-fg-muted">Mandatory</span>}
                    {r.kind === 'unavailable' && <span className="ml-auto inline-flex items-center gap-1 text-xs text-fg-muted"><Info className="size-3.5" strokeWidth={1.5} aria-hidden />Unavailable: no performance data supplied yet</span>}
                  </label>
                </li>
              )
            })}
          </ul>
        </div>
      </Section>

      <Section title="Report outline" description="What the PDF will contain, in page order." className="min-w-0 flex-[1_1_20rem]">
        <div className="mt-4 border border-line bg-surface p-4">
          <div className="text-lg">{name}</div>
          <div className="mt-0.5 text-xs text-fg-muted">{family} · {region} · {language} · {horizon}</div>
          <ol className="mt-3 border-t border-line">
            {included.map((r, i) => (
              <li key={r.name} className="flex items-center gap-3 border-b border-line py-1.5 last:border-b-0">
                <span className="w-5 text-right text-xs text-fg-muted tabular-nums">{i + 1}</span>
                <span>{r.name}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button variant="primary" onClick={() => setGenerated(key)}>Generate PDF report</Button>
          {generated === key && (
            <span role="status" className="inline-flex items-center gap-1.5 text-xs text-fg-secondary">
              <Check className="size-3.5" strokeWidth={2.5} aria-hidden />
              Report generated with {included.length} sections. This prototype does not produce a file.
            </span>
          )}
        </div>
        {optional.length - optional.filter((r) => removed.has(r.name)).length === 0 && <p className="mt-3 text-xs text-fg-muted">Only the mandatory sections are included.</p>}
      </Section>
    </div>
  )
}
