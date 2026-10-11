// What the Design system page shows about tokens. Values are read live from the CSS at runtime,
// so this file only lists names, the primitive each token points at, and when to use it.

export type TokenRow = { token: string; primitive?: string; use: string; classes: string }

export const SEMANTIC_GROUPS: { title: string; note: string; rows: TokenRow[] }[] = [
  {
    title: 'Text',
    note: 'Ink for words and icons. Never use a chart or status colour for body text.',
    rows: [
      { token: 'fg', primitive: 'ubs-text-primary', use: 'Body text, values, headings', classes: 'text-fg' },
      { token: 'fg-secondary', primitive: 'ubs-background-ui-80', use: 'Descriptions, secondary icons', classes: 'text-fg-secondary' },
      { token: 'fg-muted', primitive: 'ubs-text-subtle', use: 'Labels, counts, meta lines, table headers', classes: 'text-fg-muted' },
      { token: 'fg-subtle', primitive: 'ubs-icon-readonly', use: 'Placeholders, empty states, quiet icons', classes: 'text-fg-subtle placeholder:text-fg-subtle' },
      { token: 'fg-disabled', primitive: 'ubs-text-disabled', use: 'Disabled labels', classes: 'text-fg-disabled' },
      { token: 'fg-inverse', primitive: 'ubs-text-inverted', use: 'Text on the dark action bar and tooltips', classes: 'text-fg-inverse' },
      { token: 'link', primitive: 'ubs-focus-ring', use: 'Links and link buttons', classes: 'text-link hover:text-link-hover' },
    ],
  },
  {
    title: 'Surfaces',
    note: 'Backgrounds from lightest to darkest. Selected rows and detail panels share surface-muted, so they read as one block.',
    rows: [
      { token: 'surface', primitive: 'ubs-background-ui-10', use: 'Panels, cards, inputs, popups', classes: 'bg-surface' },
      { token: 'surface-subtle', primitive: 'ubs-background-ui-20', use: 'Row hover, table headers', classes: 'hover:bg-surface-subtle' },
      { token: 'surface-muted', primitive: 'ubs-background-ui-30', use: 'Selected rows, detail panels, button hover', classes: 'bg-surface-muted' },
      { token: 'surface-strong', primitive: 'ubs-background-ui-30-hovered', use: 'Chip hover, empty tracks of bars and sliders', classes: 'bg-surface-strong' },
      { token: 'surface-inverse', primitive: 'ubs-background-primary', use: 'Action bar, tooltips', classes: 'bg-surface-inverse' },
      { token: 'page', primitive: 'ubs-background-ui-30', use: 'App background behind the panel', classes: 'bg-page' },
    ],
  },
  {
    title: 'Lines',
    note: 'Three strengths: dividers inside a panel, borders around a panel or card, borders of controls.',
    rows: [
      { token: 'line', primitive: 'ubs-background-tags-22', use: 'Dividers between rows and sections', classes: 'border-line' },
      { token: 'line-strong', primitive: 'ubs-border-illustrative', use: 'Panel and card borders, popup borders', classes: 'border-line-strong' },
      { token: 'control', primitive: 'ubs-border-light', use: 'Input, select and button borders', classes: 'border-control' },
      { token: 'control-active', primitive: 'ubs-border-light-hovered', use: 'Border of the focused / open control', classes: 'focus:border-control-active' },
      { token: 'focus', primitive: 'ubs-focus-ring', use: 'Keyboard focus ring (2px, 1px offset)', classes: 'focus-visible:outline-2 focus-visible:outline-focus' },
    ],
  },
  {
    title: 'Brand & status',
    note: 'Red is for choices and the one main action. Error red is only for things that block (over 100%, failed checks).',
    rows: [
      { token: 'accent', primitive: 'ubs-background-brand', use: 'Checked controls, selected tab line, primary button, chosen cards', classes: 'bg-accent data-checked:bg-accent border-accent' },
      { token: 'on-accent', primitive: 'white (Tailwind)', use: 'Text and ticks on the accent red', classes: 'text-on-accent' },
      { token: 'accent-hover', primitive: 'ubs-background-brand-hovered', use: 'Primary button hover', classes: 'hover:bg-accent-hover' },
      { token: 'error', primitive: 'ubs-icon-error', use: 'Over-allocation, failed checks', classes: 'text-error' },
      { token: 'conflict', primitive: 'ubs-background-highlight-01', use: 'Text of conflict tags and notes', classes: 'text-conflict' },
    ],
  },
  {
    title: 'Exclusions & suggestions',
    note: 'Domain tokens: they name the meaning, so a future re-colour of “excluded” is one line.',
    rows: [
      { token: 'excluded', primitive: 'ubs-background-tags-21', use: 'Excluded chips, excluded scale segments', classes: 'bg-excluded' },
      { token: 'excluded-border', primitive: 'ubs-background-tags-07', use: 'Their border; hover of their ×', classes: 'border-excluded-border' },
      { token: 'excluded-subtle', primitive: 'red-50 (Tailwind — edge case)', use: 'Conflict tags, conflict rows, chosen options in a list', classes: 'bg-excluded-subtle' },
      { token: 'suggested', primitive: 'ubs-background-tags-01', use: 'Suggestion chips', classes: 'bg-suggested' },
      { token: 'suggested-border', primitive: 'ubs-border-illustrative', use: 'Their border', classes: 'border-suggested-border' },
      { token: 'status-published', primitive: 'ubs-background-tags-06', use: 'Published tag in the Model portfolio book', classes: 'bg-status-published' },
      { token: 'status-draft', primitive: 'ubs-background-tags-10', use: 'Draft tag in the Model portfolio book', classes: 'bg-status-draft' },
    ],
  },
  {
    title: 'Charts',
    note: 'Fixed order, one per asset class, validated for colour-blind separation. Legends always print the value next to the colour.',
    rows: [
      { token: 'chart-1', primitive: 'ubs-chart-02', use: 'Equity', classes: 'bg-chart-1 stroke-chart-1' },
      { token: 'chart-2', primitive: 'ubs-chart-01', use: 'Bonds', classes: 'bg-chart-2' },
      { token: 'chart-3', primitive: 'ubs-chart-12', use: 'Alternatives', classes: 'bg-chart-3' },
      { token: 'chart-4', primitive: 'ubs-chart-07', use: 'Liquidity', classes: 'bg-chart-4' },
      { token: 'chart-neutral', primitive: 'ubs-graph-chart-02', use: 'Single-series bars (benchmark composition)', classes: 'bg-chart-neutral' },
    ],
  },
]


/** Tailwind's built-in type scale, as used in this app. */
export const TYPE_SCALE = [
  { cls: 'text-xs', size: '12 / 16', use: 'Meta lines, counts, chips’ secondary text, tables, tags' },
  { cls: 'text-sm', size: '14 / 20', use: 'Body — the default (set on <body>), inputs, buttons, tabs' },
  { cls: 'text-base', size: '16 / 24', use: 'Sidebar titles, Current / New tabs, header links' },
  { cls: 'text-lg', size: '18 / 28', use: 'Detail panel titles, totals' },
  { cls: 'text-xl', size: '20 / 28', use: 'Section and modal titles' },
  { cls: 'text-2xl', size: '24 / 32', use: 'Key figures (stats)' },
]

/** The Tailwind spacing steps this UI uses (1 step = 4px = --spacing). */
export const SPACING = [
  { step: '0.5', px: 2, use: 'Gap between stacked bar segments' },
  { step: '1', px: 4, use: 'Label → control' },
  { step: '1.5', px: 6, use: 'Icon → text, label → line in tabs' },
  { step: '2', px: 8, use: 'Chip gaps, small groups' },
  { step: '2.5', px: 10, use: 'Checkbox → label, control padding' },
  { step: '3', px: 12, use: 'Card grid gap, row padding' },
  { step: '3.5', px: 14, use: 'Field rows vertical padding' },
  { step: '4', px: 16, use: 'Card padding, between field groups' },
  { step: '5', px: 20, use: 'Section top padding, detail panel padding' },
  { step: '6', px: 24, use: 'Section side padding, gap between tabs' },
  { step: '7', px: 28, use: 'Between main and side column' },
  { step: '10', px: 40, use: 'Between inline fields' },
  { step: '12', px: 48, use: 'Between stats' },
]
