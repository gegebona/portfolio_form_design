import { MoreHorizontal } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../components/ui/button'
import { EmptySlot, ExclusionChip, SuggestionChip } from '../components/ui/chip'
import { MultiCombobox } from '../components/ui/combobox'
import { Modal } from '../components/ui/dialog'
import { AffixInput, Field, Input, SearchInput } from '../components/ui/input'
import { Menu, MenuTrigger } from '../components/ui/menu'
import { ScrollArea } from '../components/ui/scroll-area'
import { Select } from '../components/ui/select'
import { Checkbox, Radio, RadioGroup, Switch } from '../components/ui/selection'
import { Tab, TabCount, Tabs, TabsList } from '../components/ui/tabs'
import { ThresholdScale } from '../components/ui/threshold-scale'
import { ConflictNote, ConflictTag, CurrencyTag } from '../components/ui/tag'
import { WeightField, WeightSlider } from '../components/ui/weight'
import { CATEGORIES, RATINGS } from '../data/data'
import { Anatomy, C, Cap, Code, Demo, DocSection, DocTable, H3 } from './doc'

const stateTable = (rows: [string, string, string][]) => (
  <DocTable heads={['State', 'Radix marks it with', 'Tailwind classes']} rows={rows.map(([s, a, c]) => [s, <C key="a">{a}</C>, <C key="c">{c}</C>])} />
)

export function ButtonDoc() {
  return (
    <DocSection id="c-button" kicker="Components" title="Button" badge="button + Radix Slot"
      lead={<>One <b className="font-semibold">primary</b> per screen (the forward step), <b className="font-semibold">secondary</b> for everything else, <b className="font-semibold">link</b> for actions inside content, <b className="font-semibold">ghost</b> for icon buttons. Variants are declared once with <C>cva</C>.</>}>
      <Anatomy>{'Button  (renders <button type="button">; asChild hands the look to its child via Radix Slot)'}</Anatomy>
      <H3>Variants × states</H3>
      <Demo>
        <Cap label="Primary"><Button variant="primary">Component allocation</Button></Cap>
        <Cap label="Secondary"><Button>Save as draft</Button></Cap>
        <Cap label="Disabled"><Button disabled>Redistribute to 100%</Button></Cap>
        <Cap label="Small"><Button size="sm">Keep</Button></Cap>
        <Cap label="Link"><Button variant="link">Clear all</Button></Cap>
        <Cap label="Ghost (icon)"><Button variant="ghost" size="icon" aria-label="More"><MoreHorizontal className="size-4" /></Button></Cap>
      </Demo>
      <Demo className="mt-2 bg-surface-inverse">
        <Cap label="On dark: secondary" className="[&>span]:text-fg-subtle"><Button tone="onDark" size="lg">Save as draft</Button></Cap>
        <Cap label="On dark: primary" className="[&>span]:text-fg-subtle"><Button variant="primary" tone="onDark" size="lg">Publish</Button></Cap>
        <Cap label="On dark: link" className="[&>span]:text-fg-subtle"><Button variant="link" tone="onDark">Cancel</Button></Cap>
      </Demo>
      <H3>Sizes</H3>
      <p className="text-fg-secondary"><C>sm</C> 28px (<C>h-7</C>) in table rows · <C>md</C> 32px (<C>h-8</C>) default, same as inputs · <C>lg</C> 36px (<C>h-9</C>) action bar.</p>
      <H3>Usage</H3>
      <Code>{`
<Button variant="primary" onClick={next}>Component allocation <ChevronRight /></Button>
<Button>Save as draft</Button>
<Button variant="link">Fill remaining (+3.00%)</Button>
`}</Code>
    </DocSection>
  )
}

export function FieldDoc() {
  const [v, setV] = useState('MP_STD_0001')
  const [ccy, setCcy] = useState('EUR')
  return (
    <DocSection id="c-field" kicker="Components" title="Text field & select" badge="Field · Input · Select"
      lead={<>All boxed controls share one look: 32px, <C>border-control</C>, darker <C>border-control-active</C> while focused or open. Field ties label, control and description together for screen readers.</>}>
      <Anatomy>{'Field (div) > Label.Root (Radix, htmlFor = control id), Input, description'}</Anatomy>
      <Anatomy>{'Select.Root > Select.Trigger (Value, Icon), Portal > Content > Viewport > Item (ItemIndicator, ItemText)'}</Anatomy>
      <H3>Variants</H3>
      <Demo className="items-end">
        <Field label="Text" className="w-56"><Input value={v} onValueChange={setV} /></Field>
        <Field label="Search" className="w-56"><SearchInput placeholder="Search components…" /></Field>
        <Field label="With unit" className="w-40"><AffixInput defaultValue="0.5" suffix="%" /></Field>
        <Field label="Select" className="w-40"><Select value={ccy} onValueChange={setCcy} items={['EUR', 'USD', 'CHF', 'GBP'].map((c) => ({ value: c, label: c }))} /></Field>
        <Field label="Disabled" className="w-40"><Input disabled defaultValue="Locked" /></Field>
      </Demo>
      <H3>States</H3>
      {stateTable([
        ['Focused', ':focus (native)', 'focus:border-control-active'],
        ['Select open', 'data-state=open', 'data-[state=open]:border-control-active'],
        ['Option under keyboard / mouse', 'data-highlighted', 'data-highlighted:bg-surface-muted'],
        ['Placeholder shown', 'data-placeholder (Trigger)', 'data-placeholder:text-fg-subtle'],
        ['Disabled', 'disabled / data-disabled', 'disabled:bg-surface-muted disabled:text-fg-disabled'],
      ])}
      <H3>Usage</H3>
      <Code>{`
<Field label="Model portfolio code">
  <Input value={code} onValueChange={setCode} />
</Field>
<Select value={ccy} onValueChange={setCcy} items={[{ value: 'EUR', label: 'EUR' }]} />
`}</Code>
    </DocSection>
  )
}

export function ComboboxDoc() {
  const cat = CATEGORIES[1]
  const [sel, setSel] = useState<string[]>(['energy', 'ind'])
  return (
    <DocSection id="c-combobox" kicker="Components" title="Combobox (multi-select)" badge="cmdk + Radix Popover"
      lead="Type to filter, pick several. Chosen values are not shown inside the field: each screen renders them where they belong (exclusion chips under the field, instrument rows in a list), so the field stays one line.">
      <Anatomy>{'Command > Popover.Root > Popover.Anchor (input, chevron button), Portal > Content > Command.List > Empty, Item…'}</Anatomy>
      <H3>Live</H3>
      <Demo className="items-start">
        <MultiCombobox options={cat.options} value={sel} onValueChange={setSel} placeholder={cat.placeholder} className="w-55" />
        <div className="flex flex-wrap gap-2">{sel.map((id) => <ExclusionChip key={id} onRemove={() => setSel(sel.filter((x) => x !== id))} removeLabel="Remove">{cat.options.find((o) => o.id === id)?.label}</ExclusionChip>)}</div>
      </Demo>
      <H3>States</H3>
      {stateTable([
        ['Open', 'data-state=open (field)', 'data-[state=open]:border-control-active · rotate-180 (chevron)'],
        ['Option chosen', 'data-checked (Item, set by the wrapper)', 'data-checked:bg-excluded-subtle · checkbox look filled'],
        ['Option highlighted', 'data-highlighted (Item)', 'data-highlighted:bg-surface-muted'],
        ['No results', 'Combobox.Empty renders its text', 'empty:p-0 (no padding when there is nothing to say)'],
      ])}
      <H3>Usage</H3>
      <Code>{`
<MultiCombobox
  options={category.options}            // { id, label, sub? }[]
  value={selectedIds}
  onValueChange={setSelectedIds}
  placeholder="Add sector…"
/>
`}</Code>
    </DocSection>
  )
}

export function SelectionDoc() {
  const [a, setA] = useState(true)
  const [r, setR] = useState('glob')
  const [s, setS] = useState(false)
  return (
    <DocSection id="c-selection" kicker="Components" title="Checkbox, radio & switch" badge="Checkbox · Radio · Switch"
      lead={<>Chosen = accent red on every control. Radix renders a <C>&lt;button&gt;</C> and marks state with <C>data-state</C> — so the whole look is Tailwind variants. Wrap in a <C>&lt;label&gt;</C> to make the text clickable.</>}>
      <Anatomy>{'Checkbox.Root > Checkbox.Indicator     RadioGroup.Root > RadioGroup.Item > RadioGroup.Indicator     Switch.Root > Switch.Thumb'}</Anatomy>
      <H3>Variants × states</H3>
      <Demo>
        <Cap label="Checkbox"><label className="flex items-center gap-2"><Checkbox checked={a} onCheckedChange={setA} />Also exclude not rated</label></Cap>
        <Cap label="Unchecked"><Checkbox checked={false} /></Cap>
        <Cap label="Disabled"><Checkbox checked disabled /></Cap>
        <Cap label="Radio group">
          <RadioGroup value={r} onValueChange={(v) => setR(v as string)} className="flex-row gap-4">
            <label className="flex items-center gap-2"><Radio value="glob" />Global</label>
            <label className="flex items-center gap-2"><Radio value="eu" />Europe</label>
          </RadioGroup>
        </Cap>
        <Cap label="Switch"><label className="flex items-center gap-2 text-xs"><Switch checked={s} onCheckedChange={setS} />Show zero-weighted positions</label></Cap>
      </Demo>
      <H3>States</H3>
      {stateTable([
        ['Checked', 'data-state=checked', 'data-[state=checked]:bg-selected data-[state=checked]:border-selected'],
        ['Unchecked (indicator)', 'Indicator not rendered', '— (Radix only mounts the indicator while checked)'],
        ['Switch on', 'data-state=checked (Root and Thumb)', 'data-[state=checked]:bg-selected · data-[state=checked]:translate-x-3.5'],
        ['Disabled', 'data-disabled', 'data-disabled:opacity-50'],
        ['Row holding a checked control', 'data-state=checked on a child', 'has-data-[state=checked]:bg-surface-muted'],
      ])}
    </DocSection>
  )
}

export function TabsDoc() {
  const [t1, setT1] = useState('a')
  const [t2, setT2] = useState('bb')
  const [t3, setT3] = useState('new')
  return (
    <DocSection id="c-tabs" kicker="Components" title="Tabs" badge="Radix Tabs"
      lead={<>One look for every tab type; only label size and the colour of inactive labels differ. The line is the active trigger’s own bottom border (<C>data-[state=active]:border-tab-active</C>).</>}>
      <Anatomy>{'Tabs.Root > Tabs.List > Tabs.Trigger…;  Tabs.Content'}</Anatomy>
      <H3>Variants</H3>
      <div className="flex flex-col gap-2">
        <Cap label="step — screens of the flow (14px)"><Demo className="py-0"><Tabs value={t1} onValueChange={(v) => setT1(v as string)}><TabsList variant="step"><Tab value="a">Preferences</Tab><Tab value="b">Component selection</Tab><Tab value="c" disabled>Reporting</Tab></TabsList></Tabs></Demo></Cap>
        <Cap label="sub — content inside a screen (14px, inactive muted, with count)"><Demo className="py-0"><Tabs value={t2} onValueChange={(v) => setT2(v as string)}><TabsList variant="sub"><Tab value="bb">Building blocks <TabCount>16</TabCount></Tab><Tab value="mp">Model portfolios <TabCount>10</TabCount></Tab></TabsList></Tabs></Demo></Cap>
        <Cap label="version — Current / New (16px)"><Demo className="py-0"><Tabs value={t3} onValueChange={(v) => setT3(v as string)}><TabsList variant="version"><Tab value="cur">Current</Tab><Tab value="new">New <TabCount>2 changes</TabCount></Tab></TabsList></Tabs></Demo></Cap>
      </div>
      <H3>Spec & states</H3>
      {stateTable([
        ['Active', 'data-state=active (Trigger)', 'data-[state=active]:text-fg data-[state=active]:border-tab-active'],
        ['Hover', ':hover', 'hover:border-line-strong (3px light line)'],
        ['Disabled', 'data-disabled', 'data-disabled:text-fg-disabled'],
        ['Spacing', '—', 'gap-6 between tabs · pb-1.5 label → line · h-0.75 line'],
      ])}
      <H3>Usage</H3>
      <Code>{`
<Tabs value={kind} onValueChange={setKind}>
  <TabsList variant="sub" className="border-b border-line">
    <Tab value="bb">Building blocks <TabCount>{n}</TabCount></Tab>
    <Tab value="mp">Model portfolios</Tab>
  </TabsList>
</Tabs>
`}</Code>
    </DocSection>
  )
}

export function ChipsTagsDoc() {
  return (
    <DocSection id="c-chips" kicker="Components" title="Chips & tags" badge="Plain elements"
      lead="Grey always means “suggested, not chosen”; red tint means excluded or in conflict. Chips act, tags only inform.">
      <H3>Chips</H3>
      <Demo>
        <Cap label="Suggestion"><SuggestionChip onClick={() => {}}>APAC</SuggestionChip></Cap>
        <Cap label="Exclusion"><ExclusionChip onRemove={() => {}} removeLabel="Remove Energy">Energy</ExclusionChip></Cap>
        <Cap label="Empty slot"><EmptySlot>Nothing excluded</EmptySlot></Cap>
      </Demo>
      <H3>Tags</H3>
      <Demo>
        <Cap label="Conflict tag (cards, rows)"><ConflictTag>Conflicts with exclusions: Energy</ConflictTag></Cap>
        <Cap label="Conflict note (inside a pink row)"><ConflictNote>Conflicts with exclusions: excluded instrument</ConflictNote></Cap>
        <Cap label="Currency tag (hover for tooltip)"><CurrencyTag ccy="USD" portfolioCcy="EUR" /></Cap>
      </Demo>
      <H3>Tokens</H3>
      <DocTable heads={['Element', 'Classes']} rows={[
        ['Suggestion', <C key="1">border-suggested-border bg-suggested hover:bg-surface-strong</C>],
        ['Exclusion', <C key="2">border-excluded-border bg-excluded</C>],
        ['Empty slot', <C key="3">border-dashed border-line-strong text-fg-muted</C>],
        ['Conflict tag', <C key="4">bg-excluded-subtle text-conflict</C>],
      ]} />
    </DocSection>
  )
}

export function ScaleDoc() {
  const [cut, setCut] = useState(4)
  return (
    <DocSection id="c-scale" kicker="Components" title="Threshold scale" badge="Radix Toggle Group"
      lead="Pick a grade to exclude it and everything below. Each segment is a Toggle that is pressed when excluded, so screen readers hear “Ba, excluded”. A 3px accent bar marks the cut.">
      <Anatomy>{'ToggleGroup.Root type="multiple" > ToggleGroup.Item…  (pressed: data-state=on)'}</Anatomy>
      <Demo className="mt-4"><ThresholdScale labels={RATINGS} isExcluded={(i) => i >= cut} cutAt={cut} onPick={(i) => setCut(i === cut ? RATINGS.length : i)} className="w-130" /></Demo>
      <H3>States</H3>
      {stateTable([
        ['Excluded', 'data-state=on', 'data-[state=on]:bg-excluded data-[state=on]:border-excluded-border'],
        ['Hover', ':hover', 'hover:outline hover:outline-fg-secondary'],
      ])}
    </DocSection>
  )
}

export function WeightDoc() {
  const [w, setW] = useState(18)
  return (
    <DocSection id="c-weight" kicker="Components" title="Weight field & slider" badge="NumberField · Slider"
      lead="The field is for exact numbers, the slider for quick moves; both edit the same value. Field: 2 decimals, ↑/↓ step 0.1, Shift 1, mouse wheel while focused. Slider: the share line in the asset-class colour, with a small handle.">
      <Anatomy>{'WeightField: box > input (+ “%”), plain Tailwind (Radix has no number field)      Slider.Root > Track > Range, Thumb'}</Anatomy>
      <Demo className="mt-4 max-w-105 flex-col items-stretch">
        <div className="flex items-center gap-3"><span className="flex-1">LUX KEY – EUR Equity Value</span><WeightField value={w} onValueChange={setW} aria-label="Weight" /></div>
        <WeightSlider value={w} onValueChange={setW} color="var(--color-chart-1)" aria-label="Weight slider" />
      </Demo>
      <H3>States</H3>
      {stateTable([
        ['Focused field', ':focus inside Group', 'has-[input:focus]:border-control-active'],
        ['Dragging', 'data-dragging', '(available; not styled — the handle follows the pointer)'],
        ['Colour', 'style --fill', 'bg-(--fill) on Range and Thumb'],
      ])}
      <H3>Usage</H3>
      <Code>{`
<WeightField value={w} onValueChange={setW} aria-label="Weight of LUX KEY in percent" />
<WeightSlider value={w} onValueChange={setW} color="var(--color-chart-1)" aria-label="…" />
`}</Code>
    </DocSection>
  )
}

export function OverlaysDoc() {
  const [open, setOpen] = useState(false)
  return (
    <DocSection id="c-overlays" kicker="Components" title="Modal, menu & tooltip" badge="Dialog · Menu · Tooltip"
      lead={<>Every floating surface shares <C>popupSurface</C>: white, <C>border-line-strong</C>, <C>shadow-pop</C>. Radix renders them in a portal; the app root has <C>isolation: isolate</C> so they always sit on top.</>}>
      <Anatomy>{'Dialog.Root > Portal > Overlay, Content > Title, Description, Close'}</Anatomy>
      <Anatomy>{'DropdownMenu.Root > Trigger, Portal > Content > Item…'}</Anatomy>
      <Anatomy>{'Tooltip.Provider > Root > Trigger (asChild), Portal > Content'}</Anatomy>
      <Demo className="mt-4">
        <Button onClick={() => setOpen(true)}>Open modal</Button>
        <Menu
          trigger={<MenuTrigger render={<Button variant="ghost" size="icon" aria-label="Row actions" />}><MoreHorizontal className="size-4" /></MenuTrigger>}
          items={[{ label: 'Reset to current weight', onClick: () => {} }, { label: 'Remove position', onClick: () => {} }]}
          align="start"
        />
        <CurrencyTag ccy="CHF" portfolioCcy="EUR" />
      </Demo>
      <Modal open={open} onOpenChange={setOpen} title="HOLT – MSCI Europe Proxy" meta="Equity · Europe · HOLT"
        footer={<><Button onClick={() => setOpen(false)}>Close</Button><Button variant="primary" onClick={() => setOpen(false)}>Add building block</Button></>}>
        <p className="mt-3 text-fg-secondary">Quantitative proxy tracking the MSCI Europe index using HOLT valuation metrics.</p>
      </Modal>
      <H3>Rules</H3>
      <ul className="list-disc pl-5 text-fg-secondary">
        <li>Modal: one primary action in the footer (the same as on the screen behind it), Close next to it. Esc, backdrop and Close all dismiss; focus returns to the opener.</li>
        <li>Menu: for row actions that don’t deserve a visible button.</li>
        <li>Tooltip: explanations only, never the only place important information lives.</li>
      </ul>
    </DocSection>
  )
}

export function ScrollDoc() {
  return (
    <DocSection id="c-scroll" kicker="Components" title="Scroll area" badge="Radix Scroll Area"
      lead={<>The wrapper marks the root with <C>data-overflow-y-start</C> / <C>-end</C> (measured on scroll and resize) while there is more content above / below, so edge hints are pure CSS. Where a scrollbar would cut a selected row off from its details panel, use <C>hints=&quot;edges&quot;</C>: no bar, a soft shadow and a ▲ / ▼ at the right edge.</>}>
      <Anatomy>{'ScrollArea.Root > Viewport;  Scrollbar > Thumb'}</Anatomy>
      <div className="mt-4 flex flex-wrap gap-6">
        <Cap label='hints="edges"'>
          <ScrollArea hints="edges" className="h-40 w-64 border border-line bg-surface">
            {Array.from({ length: 12 }, (_, i) => <div key={i} className="border-b border-line px-3 py-2">Row {i + 1}</div>)}
          </ScrollArea>
        </Cap>
        <Cap label='hints="bar"'>
          <ScrollArea hints="bar" className="h-40 w-64 border border-line bg-surface">
            {Array.from({ length: 12 }, (_, i) => <div key={i} className="border-b border-line px-3 py-2">Row {i + 1}</div>)}
          </ScrollArea>
        </Cap>
      </div>
      <H3>States</H3>
      {stateTable([
        ['More above', 'data-overflow-y-start (Root)', 'group-data-overflow-y-start/scroll:opacity-100 (top shadow + ▲)'],
        ['More below', 'data-overflow-y-end (Root)', 'group-data-overflow-y-end/scroll:opacity-100 (bottom shadow + ▼)'],
        ['Scrolling / hovering', 'data-scrolling / data-hovering (Scrollbar)', 'data-hovering:opacity-100 data-scrolling:opacity-100'],
      ])}
    </DocSection>
  )
}
