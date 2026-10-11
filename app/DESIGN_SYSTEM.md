# How this design system works (Tailwind 4 + Base UI)

A guide for developers who are not designers. It explains the ideas, how they map to code in this project, and how to carry them into the real app at work.

The live version, with every token and component demoed, is the **Design system** page in the app (`#design`).

---

## 1. The one idea: tokens become classes

A design system is a short list of decisions:
- the colours;
- the sizes (spacing, type, line widths);
- how each component looks in each state.

Each decision is called a **token**.

In Tailwind 4, tokens are CSS variables declared inside `@theme`, and **every token automatically becomes utility classes**:

```css
@theme {
  --color-fg-muted: #5A5D5C;
}
```
```html
<p class="text-fg-muted">…</p>
<div class="border-fg-muted bg-fg-muted/10">…</div>
```

So the design system *is* the class list. If a value isn't a token, there's no class for it, and using it stands out in review as `p-[13px]` or `#5a5d5c`.

Which tokens produce which classes (the "namespaces"):

| Token | Classes |
|---|---|
| `--color-*` | `bg-* text-* border-* ring-* outline-* fill-* stroke-*` … |
| `--spacing` (one base value) | `p-* m-* gap-* w-* h-* inset-*` … (multiplied) |
| `--text-*` | `text-xs text-sm …` (font size + its line height) |
| `--font-*`, `--font-weight-*` | `font-sans`, `font-semibold` |
| `--radius-*`, `--shadow-*` | `rounded-*`, `shadow-*` |
| `--breakpoint-*` | `sm: md: lg:` |

## 2. Three layers

```
Tailwind defaults ─► UBS colour tokens ─► Semantic tokens ─► Components ─► Screens
 (spacing, type…)    (ubs-text-subtle…)    (text-fg-muted…)    (Base UI + classes)
```

1. **Tailwind defaults.** These are kept as they ship:
   - spacing: 1 step = 4px, so `p-4` = 16px; halves and quarters are allowed, so `p-2.5` = 10px;
   - type sizes `text-xs` … `text-2xl`;
   - `font-normal` / `font-semibold`, `rounded-full`, the breakpoints.

   Using the built-in scales means anyone who knows Tailwind already knows our sizes.
2. **UBS colour tokens.** These are the colours ubs.com publishes as `--col-*` (light theme). The theme keeps only the 33 the app uses; the full list of 108 is in [docs/ubs-colour-tokens.md](docs/ubs-colour-tokens.md).
   - They keep their UBS names with a `ubs-` prefix: `--col-text-subtle` becomes `--color-ubs-text-subtle`.
   - Values are copied from ubs.com, so they match UBS exactly; don't change them. To use another UBS colour, copy its line from the reference list.
   - **Edge cases only:** where UBS has no fitting colour, a Tailwind default colour is added back explicitly and marked in the file. Today there are two:
     - `red-50`, the palest red behind conflict tags (UBS's lightest red tag is too strong behind text);
     - `white`, for text on the red.
3. **Semantic tokens.** These name *what a colour is for*: `fg`, `fg-muted`, `surface`, `surface-muted`, `line`, `line-strong`, `control`, `accent`, `error`, `excluded`, `suggested`, `chart-1…4`.
   - Each one points at a UBS token: `--color-fg-muted: var(--color-ubs-text-subtle)`.
   - **Components use only these.** Changing what "muted text" looks like everywhere is then a one-line change.

Tailwind's own palette (`blue-500`, `red-300`, …) is switched off with `--color-*: initial`. Off-brand colours aren't just discouraged, they don't exist; the edge-case colours above are the only exceptions, and each is named in the file.

All of it is in one file: [`src/styles/theme.css`](src/styles/theme.css).

### Why `@theme static`
By default Tailwind only outputs the CSS variables that some class actually uses. `static` outputs all of them, so JavaScript can always read them; the Design system page reads live values this way, and charts could too. The cost is a few hundred bytes.

### `@theme` vs `@theme inline` (you'll see both online)
- **shadcn/ui** keeps raw values in `:root { --primary: … }` and maps them with `@theme inline { --color-primary: var(--primary) }`. This is handy when you swap themes (dark mode) by changing `:root` variables.
- **We** put semantic tokens straight into `@theme`. That gives one name per token and is simpler, since we have one theme.
- If dark mode or multi-brand ever comes, the shadcn layout is the one to switch to.

## 3. Base UI: behaviour without looks

[Base UI](https://base-ui.com) (`@base-ui/react`) components are **unstyled**. They handle the hard parts: keyboard, focus, ARIA, positioning, portals, typeahead, form integration. We add all the looks with Tailwind classes.

Every component is a set of **parts**:
```
Checkbox.Root > Checkbox.Indicator
Tabs.Root > Tabs.List > Tabs.Tab…, Tabs.Indicator
Select.Root > Select.Trigger, Select.Portal > Select.Positioner > Select.Popup > Select.Item…
```

State is exposed as **data attributes** on the parts, and Tailwind styles them with variants:

| Base UI sets | You write |
|---|---|
| `data-checked` / `data-unchecked` | `data-checked:bg-accent`, `data-unchecked:hidden` |
| `data-active` (tabs) | `data-active:text-fg` |
| `data-highlighted` (list items) | `data-highlighted:bg-surface-muted` |
| `data-selected` (list items) | `data-selected:bg-excluded-subtle` |
| `data-open`, `data-popup-open` | `data-popup-open:border-control-active` |
| `data-disabled`, `data-pressed` | `data-disabled:opacity-50`, `data-pressed:bg-excluded` |
| `data-starting-style` / `data-ending-style` | `data-starting-style:opacity-0` (enter/exit animation) |
| `data-overflow-y-start` / `-end` (scroll area) | `group-data-overflow-y-end/scroll:opacity-100` |

Notes:
- Base UI does **not** use Radix's `data-state="open"`. Snippets that use `data-[state=open]:` won't work.
- Some parts expose **CSS variables** you can use in classes:
  - Tabs: `--active-tab-left` / `--active-tab-width`, used as `w-(--active-tab-width) translate-x-(--active-tab-left)` for the sliding line;
  - Select / Combobox: `--anchor-width`, `--available-height`.
- **`render` prop:** puts Base UI behaviour on your own component, e.g. `<Menu.Trigger render={<Button variant="ghost" />} />`.
- **Portals:** popups render at the end of `<body>`. The app root has `isolation: isolate` (in `index.css`) so they always sit on top.

## 4. The component recipe

Each file in `src/components/ui/` wraps Base UI parts once, with our classes, and exposes a small API:

```tsx
// src/components/ui/selection.tsx (simplified)
export function Checkbox({ className, ...props }) {
  return (
    <BaseCheckbox.Root
      className={cn(
        'flex size-4 items-center justify-center border border-control bg-surface text-white',
        'data-checked:border-accent data-checked:bg-accent',
        className,                      // callers can still override
      )}
      {...props}
    >
      <BaseCheckbox.Indicator className="flex data-unchecked:hidden"><Check /></BaseCheckbox.Indicator>
    </BaseCheckbox.Root>
  )
}
```

- **`cn()`** (clsx + tailwind-merge) joins classes and lets a later class win (`cn('h-8', 'h-7')` → `h-7`), so a `className` prop can safely adjust a default.
- **Variants** (primary / secondary, sizes …) are declared once with [`cva`](https://cva.style) in the component file, e.g. `button.tsx`. Screens choose a variant; they never rebuild the look.
- **Screens** (`src/views/`) only add layout classes: grid, flex, gap, padding, width.

## 5. Motion: View Transitions

Animations between two states of the page are done by the browser's **View Transitions API** and triggered by React 19's `<ViewTransition>`.

1. Wrap what may animate in `<ViewTransition>` and give it class names per case:
   - `enter`: the element appeared;
   - `exit`: it was removed;
   - `update`: it changed or moved;
   - `share`: the same `name` moved from one element to another.
2. Run the change inside `startTransition()`; the store's `animate(recipe)` does this for you.
   - Optionally tag the transition with `addTransitionType('forward')`. A boundary can then use a different class per type: `update={{ forward: 'step-forward', back: 'step-back', default: 'none' }}`.
3. The browser snapshots the boundaries before and after the update and animates between the two pictures.
   - You style the pictures in CSS: `::view-transition-old(.step-forward)` (leaving) and `::view-transition-new(.step-forward)` (arriving).
   - All of it lives in [`src/styles/motion.css`](src/styles/motion.css).

Used here for:
- changing step (slides by direction);
- rows and chips appearing and disappearing;
- the benchmark details cross-fade;
- a catalogue card expanding into its Learn more panel and back (a shared element).
  - The card and the expanded card ([`src/components/ui/expanded-card.tsx`](src/components/ui/expanded-card.tsx)) use the same view-transition `name`, and only one of them is rendered at a time.
  - The expanded card uses React's `createPortal`, which mounts in the same update. A dialog library's portal that mounts a pass later would miss the transition's "after" picture.

Rules:
- Only animate structure changes, never typing or dragging.
- Keep animations 150–250ms.
- `prefers-reduced-motion` turns them all off.
- Browsers without View Transitions just update instantly.

## 6. Decisions made in this port

- **13px became 12px.** The HTML prototype used 13px for meta text. Tailwind has 12 (`text-xs`) and 14 (`text-sm`), so meta, counts and table text are now 12px. That keeps the system on built-in sizes. If 12 is too small at work, override `--text-xs` once in the theme; don't add one-off sizes.
- **Odd spacings became scale steps:**

  | Before | After |
  |---|---|
  | 14px | `3.5` |
  | 22px | `5.5` |
  | 28px | `7` |
  | 34px buttons | `h-9` (36) in the action bar |

- **Shadow:** one token, `shadow-pop`, built on UBS's shadow colour (`--col-opacity-shadow`). Popups, menus and the modal use it; nothing else floats.
- **Arbitrary values that remain are deliberate:**
  - layout grid templates such as `grid-cols-[22.5rem_minmax(0,1fr)]`;
  - a few `has-[…]` / `min(…)` expressions.

  These are layout, not design tokens.

## 7. Taking this to work

1. **Ask what exists first.** If the work app already has a Tailwind theme (shadcn-style `--primary`, `--muted` …), map our semantic tokens onto its names rather than adding a second set. The *layers* are what matter, not our exact names.
2. **Copy:**
   - `src/styles/theme.css` (tokens);
   - `src/index.css` (base layer);
   - `src/lib/cn.ts`;
   - the components in `src/components/ui/` you need.
3. **Dependencies:**
   ```
   tailwindcss @tailwindcss/vite @base-ui/react
   clsx tailwind-merge class-variance-authority lucide-react
   ```
4. **UBS tokens.** If the work app already ships the UBS `--col-*` variables, point the `--color-ubs-*` tokens at them (`--color-ubs-text-subtle: var(--col-text-subtle)`) instead of copying the hex values. Then UBS updates, including dark mode (`light-dark()`), flow through automatically.
5. **Font.** Frutiger is licensed by UBS. Use the font files and `@font-face` the work app already has; keep `--font-sans` pointing at the same family names. Source Sans 3 is only the open fallback for this prototype.
6. **Keep the Design system page next to the code.** Because it renders the real components, it can't drift out of date.

## 8. Quick reference

```text
text   fg · fg-secondary · fg-muted · fg-subtle · fg-disabled · fg-inverse · link
bg     page · surface · surface-subtle · surface-muted · surface-strong · surface-inverse
lines  line · line-strong · control · control-active · focus
brand  accent · accent-hover · error · conflict
domain excluded · excluded-border · excluded-subtle · suggested · suggested-border · status-published · status-draft · type-multi · task
charts chart-1 (Equity) · chart-2 (Bonds) · chart-3 (Alternatives) · chart-4 (Liquidity) · chart-neutral
ubs    ubs-<UBS token name>, e.g. ubs-text-subtle, ubs-background-tags-21 (only to define semantic tokens)
type   text-xs 12 · text-sm 14 (body) · text-base 16 · text-lg 18 · text-xl 20 · text-2xl 24
space  1 = 4px · common: 1.5 2 2.5 3 3.5 4 5 6 7
```
