import { useEffect, useRef, useState } from 'react'
import { cn } from '../lib/cn'
import { ButtonDoc, ChipsTagsDoc, ComboboxDoc, FieldDoc, OverlaysDoc, ScaleDoc, ScrollDoc, SelectionDoc, TabsDoc, WeightDoc } from './Components'
import { C, DocSection, DocTable, H3 } from './doc'
import { Colour, HowItWorks, ShapeElevation, Spacing, Typography } from './Foundations'
import { MotionDoc } from './Motion'

const TOC: { group: string; items: [string, string][] }[] = [
  { group: 'Start here', items: [['how', 'How it works']] },
  { group: 'Foundations', items: [['colour', 'Colour'], ['type', 'Typography'], ['spacing', 'Spacing'], ['shape', 'Shape & elevation'], ['motion', 'Motion']] },
  {
    group: 'Components',
    items: [['c-button', 'Button'], ['c-field', 'Text field & select'], ['c-combobox', 'Combobox'], ['c-selection', 'Checkbox, radio, switch'], ['c-tabs', 'Tabs'],
      ['c-chips', 'Chips & tags'], ['c-scale', 'Threshold scale'], ['c-weight', 'Weight field & slider'], ['c-overlays', 'Modal, menu, tooltip'], ['c-scroll', 'Scroll area']],
  },
  { group: 'Patterns', items: [['p-colour', 'Colour semantics'], ['p-files', 'Where things live']] },
]

export function DesignSystemPage() {
  const scroller = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState('how')
  // Highlight the section whose top has passed the top of the scroll area.
  useEffect(() => {
    const el = scroller.current
    if (!el) return
    const on = () => {
      const ids = TOC.flatMap((g) => g.items.map(([id]) => id))
      let cur = ids[0]
      for (const id of ids) {
        const s = document.getElementById(id)
        if (s && s.getBoundingClientRect().top - el.getBoundingClientRect().top < 80) cur = id
      }
      setActive(cur)
    }
    el.addEventListener('scroll', on)
    return () => el.removeEventListener('scroll', on)
  }, [])

  return (
    <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto grid max-w-340 grid-cols-[12.5rem_minmax(0,1fr)] gap-7 px-6 pt-5 pb-14">
        <nav aria-label="Design system contents" className="sticky top-0 self-start pt-1 text-xs">
          {TOC.map((g) => (
            <div key={g.group}>
              <div className="mt-4 mb-1 ml-2.5 text-fg-muted first:mt-0">{g.group}</div>
              {g.items.map(([id, label]) => (
                <a key={id} href={'#' + id} onClick={(e) => { e.preventDefault(); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }) }}
                  className={cn('block px-2.5 py-1 text-fg hover:bg-surface-subtle', active === id && 'bg-surface-muted font-semibold')}>
                  {label}
                </a>
              ))}
            </div>
          ))}
        </nav>
        <div className="min-w-0">
          <header className="mb-4 border border-line-strong bg-surface px-7 py-6">
            <h1 className="mb-1 text-2xl">Design system</h1>
            <p className="max-w-180 text-fg-muted">Tokens and components behind the New model portfolio flow — the same ones the screens use, so this page is always up to date.</p>
            <p className="mt-2.5 text-xs text-fg-muted">Tailwind CSS 4.3 (CSS-first theme) · Radix UI (<C>radix-ui</C>) + cmdk · React 19 · colours from the UBS tokens on ubs.com</p>
          </header>
          <HowItWorks />
          <Colour />
          <Typography />
          <Spacing />
          <ShapeElevation />
          <MotionDoc />
          <ButtonDoc />
          <FieldDoc />
          <ComboboxDoc />
          <SelectionDoc />
          <TabsDoc />
          <ChipsTagsDoc />
          <ScaleDoc />
          <WeightDoc />
          <OverlaysDoc />
          <ScrollDoc />
          <ColourSemantics />
          <WhereThingsLive />
        </div>
      </div>
    </div>
  )
}

function ColourSemantics() {
  return (
    <DocSection id="p-colour" kicker="Patterns" title="Colour semantics" lead="Colour carries meaning, so each colour means one thing everywhere.">
      <DocTable className="mt-5" heads={['Meaning', 'Look', 'Tokens']} rows={[
        ['Chosen / the main action', 'Accent red: checked boxes, selected tab line, chosen cards, primary button', <C key="1">accent</C>],
        ['Suggested, not chosen', 'Warm grey chip with +', <C key="2">suggested · suggested-border</C>],
        ['Excluded', 'Red tint chip or segment', <C key="3">excluded · excluded-border</C>],
        ['Conflict with exclusions', 'Pale red tag / row, dark-red text, ⚠', <C key="4">excluded-subtle · conflict</C>],
        ['Selected row + its details', 'Same warm grey, joined without a line', <C key="5">surface-muted</C>],
        ['Blocking error', 'Error red text (over 100%, failed checks)', <C key="6">error</C>],
        ['Asset classes', 'Chart colours, always with a printed value', <C key="7">chart-1 … chart-4</C>],
      ]} />
    </DocSection>
  )
}

function WhereThingsLive() {
  return (
    <DocSection id="p-files" kicker="Patterns" title="Where things live" lead="How to find and change things in the code.">
      <DocTable className="mt-5" heads={['What', 'File']} rows={[
        ['All tokens (colours, font)', <C key="1">src/styles/theme.css</C>],
        ['Page defaults (body, focus ring, scrollbars)', <C key="2">src/index.css</C>],
        ['Components (Radix + Tailwind classes)', <C key="3">src/components/ui/*.tsx</C>],
        ['Class merging helper', <C key="4">src/lib/cn.ts — cn(…) lets a className prop override defaults</C>],
        ['Screens', <C key="5">src/views/*.tsx</C>],
        ['This page', <C key="6">src/design-system/*</C>],
      ]} />
      <H3>Adding a token</H3>
      <ol className="list-decimal pl-5 text-fg-secondary">
        <li>Add it to <C>@theme</C> in theme.css, pointing at a palette colour: <C>--color-warning: var(--color-amber-500)</C>.</li>
        <li>Use it: <C>bg-warning</C>, <C>text-warning</C>, <C>border-warning</C> exist immediately.</li>
        <li>Add a row to the Colour section (<C>src/design-system/tokens.ts</C>).</li>
      </ol>
    </DocSection>
  )
}
