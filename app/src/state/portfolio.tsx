import { createContext, startTransition, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import {
  AREA_CLASS, BENCHMARKS, CATEGORIES, COMPONENTS, COMPONENT_INSTRUMENTS, EXCLUDABLE_INSTRUMENTS, POSITIONS, RATINGS, ESG_SCORES,
  type AssetClass, type BookTask, type CategoryId, type Component, type Position,
} from '../data/data'

export type SimRow = Position & { nw: number; removed: boolean; kept: boolean }
export type CashEntry = { ccy: string; w: number }

export type PortfolioState = {
  data: { code: string; name: string; ccy: string; benchmark: string }
  prefs: {
    minPos: string; maxInst: string
    sel: Record<CategoryId, string[]>
    /** Index of the first excluded rating; RATINGS.length = nothing excluded. */
    rating: number
    unrated: boolean
    /** Number of excluded ESG scores from the bottom (0 = none). */
    esg: number
    inst: string[]
  }
  comps: { added: string[]; inst: string[]; cash: CashEntry[] }
  /** Weights per allocation key ('c:<component id>', 'i:<isin>'); cash weights live on the cash entries. */
  weights: Record<string, number>
  sim: { rows: SimRow[] }
  /** Which book entry is open in the flow, and its open position task (shown at the top of Simulation). */
  book: { id: string; task: BookTask | null }
}

const INITIAL: PortfolioState = {
  data: { code: 'MP_STD_0001', name: 'SMA - Global - Equities', ccy: 'EUR', benchmark: 'glob-eq' },
  prefs: {
    minPos: '0.5', maxInst: '150',
    sel: { geography: ['em'], sector: ['energy', 'ind'], currency: ['EUR', 'JPY', 'SGD', 'SEK', 'DKK', 'NOK'], category: ['deriv'] },
    rating: 4, unrated: true, esg: 2,
    inst: ['US0378331005', 'FR0000120271'],
  },
  comps: {
    added: ['keyeq', 'gem', 'gbond', 'defender', 'holt-world', 'holt-spx', 'ch-eq', 'jp-eq', 'hybond', 'gold', 'mp-balanced', 'mp-income'],
    inst: ['US02079K1079'],
    cash: [{ ccy: 'EUR', w: 2 }],
  },
  weights: {
    'c:keyeq': 18, 'c:gem': 6, 'c:gbond': 16, 'c:defender': 8, 'c:holt-world': 10, 'c:holt-spx': 9, 'c:ch-eq': 6, 'c:jp-eq': 4,
    'c:hybond': 7, 'c:gold': 3, 'c:mp-balanced': 6, 'c:mp-income': 2, 'i:US02079K1079': 3,
  },
  sim: { rows: POSITIONS.map((p) => ({ ...p, nw: p.w, removed: false, kept: false })) },
  book: { id: '', task: null },
}

type Recipe = (draft: PortfolioState) => void
/**
 * update   — plain state change (typing, dragging: must feel instant).
 * animate  — the same, inside startTransition, so <ViewTransition> boundaries it touches animate
 *            (adding/removing items, picking an option). Never use it for text input.
 */
type Ctx = { state: PortfolioState; update: (recipe: Recipe) => void; animate: (recipe: Recipe) => void }
const PortfolioContext = createContext<Ctx | null>(null)

/** Holds the whole flow; `update` takes a recipe that edits a copy of the state (small state, so copying is cheap). */
export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(INITIAL)
  const update = useCallback((recipe: (draft: PortfolioState) => void) => {
    setState((s) => {
      const draft = structuredClone(s)
      recipe(draft)
      return draft
    })
  }, [])
  const animate = useCallback((recipe: Recipe) => startTransition(() => update(recipe)), [update])
  const value = useMemo(() => ({ state, update, animate }), [state, update, animate])
  return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>
}

export function usePortfolio() {
  const ctx = useContext(PortfolioContext)
  if (!ctx) throw new Error('usePortfolio must be used inside <PortfolioProvider>')
  return ctx
}

// ---- Derived data -------------------------------------------------------------

export const componentById = (id: string) => COMPONENTS.find((c) => c.id === id)!
export const instrumentByIsin = (isin: string) => COMPONENT_INSTRUMENTS.find((x) => x.isin === isin) ?? EXCLUDABLE_INSTRUMENTS.find((x) => x.isin === isin)!
export const benchmarkById = (id: string) => BENCHMARKS.find((b) => b.id === id)
export const optionLabel = (cat: CategoryId, id: string) => CATEGORIES.find((c) => c.id === cat)!.options.find((o) => o.id === id)!.label

/** Exclusions a component conflicts with (geography and sector), as labels. */
export function conflictsOf(c: Component, prefs: PortfolioState['prefs']) {
  const out: string[] = []
  ;([['geography', c.geo], ['sector', c.sector]] as const).forEach(([cat, ids]) => {
    ;(ids ?? []).forEach((id) => { if (prefs.sel[cat].includes(id)) out.push(optionLabel(cat, id)) })
  })
  return out
}

export type AllocItem = {
  key: string; kind: 'bb' | 'mp' | 'inst' | 'cash'; name: string; meta: string; cls: AssetClass
  comp?: Component; cashCcy?: string
}
/** Everything picked on Component selection, as rows for Component allocation. */
export function allocItems(s: PortfolioState): AllocItem[] {
  return [
    ...s.comps.added.map((id) => {
      const c = componentById(id)
      return { key: 'c:' + id, kind: c.kind, name: c.name, meta: `${c.area} · ${c.region} · ${c.provider}`, cls: AREA_CLASS[c.area] ?? 'Equity', comp: c } as AllocItem
    }),
    ...s.comps.inst.map((isin) => ({ key: 'i:' + isin, kind: 'inst', name: instrumentByIsin(isin).name, meta: 'Instrument · ' + isin, cls: 'Equity' }) as AllocItem),
    ...s.comps.cash.map((c) => ({ key: 'k:' + c.ccy, kind: 'cash', name: 'Cash position', meta: c.ccy, cls: 'Liquidity', cashCcy: c.ccy }) as AllocItem),
  ]
}
export function weightOf(s: PortfolioState, it: AllocItem) {
  return it.kind === 'cash' ? (s.comps.cash.find((c) => c.ccy === it.cashCcy)?.w ?? 0) : (s.weights[it.key] ?? 0)
}
export function setWeight(draft: PortfolioState, it: AllocItem, v: number) {
  if (it.kind === 'cash') { const c = draft.comps.cash.find((x) => x.ccy === it.cashCcy); if (c) c.w = v }
  else draft.weights[it.key] = v
}
export function removeItem(draft: PortfolioState, key: string) {
  const id = key.slice(2)
  if (key[0] === 'c') draft.comps.added = draft.comps.added.filter((x) => x !== id)
  else if (key[0] === 'i') draft.comps.inst = draft.comps.inst.filter((x) => x !== id)
  else draft.comps.cash = draft.comps.cash.filter((c) => c.ccy !== id)
  delete draft.weights[key]
}

export type Alloc = Record<AssetClass, number>
const emptyAlloc = (): Alloc => ({ Equity: 0, Bonds: 0, Alternatives: 0, Liquidity: 0 })
export function portfolioAlloc(s: PortfolioState): Alloc {
  const a = emptyAlloc()
  allocItems(s).forEach((it) => { a[it.cls] += weightOf(s, it) })
  return a
}
/** The benchmark picked on Model portfolio data, mapped to asset classes. */
export function benchmarkAlloc(s: PortfolioState): Alloc {
  const a = emptyAlloc()
  benchmarkById(s.data.benchmark)?.parts.forEach(([name, w]) => {
    const cls: AssetClass = /cash/i.test(name) ? 'Liquidity' : /bloomberg|bond|treasury|aggregate/i.test(name) ? 'Bonds' : 'Equity'
    a[cls] += w
  })
  return a
}
export function simAlloc(s: PortfolioState, mode: 'current' | 'new'): Alloc {
  const a = emptyAlloc()
  s.sim.rows.forEach((r) => { if (mode === 'current') a[r.cls] += r.w; else if (!r.removed) a[r.cls] += r.nw })
  return a
}

/** Exclusions as one short line; long lists become counts ("6 currencies"). */
export function exclusionSummary(p: PortfolioState['prefs']) {
  const parts: string[] = []
  const add = (cat: CategoryId, noun: string) => {
    const l = p.sel[cat].map((id) => optionLabel(cat, id))
    if (l.length) parts.push(l.length > 3 ? `${l.length} ${noun}` : l.join(', '))
  }
  add('geography', 'regions'); add('sector', 'sectors'); add('currency', 'currencies'); add('category', 'categories')
  const rating: string[] = []
  if (p.rating < RATINGS.length) rating.push(RATINGS[p.rating] + ' and below')
  if (p.unrated) rating.push('not rated')
  if (rating.length) parts.push('rating ' + rating.join(', '))
  if (p.esg > 0) parts.push('ESG score ' + ESG_SCORES[p.esg - 1] + ' and below')
  if (p.inst.length) parts.push(p.inst.length === 1 ? instrumentByIsin(p.inst[0]).name : p.inst.length + ' instruments')
  return parts
}

// ---- Number helpers ----
export const f2 = (n: number) => (Math.round(n * 100) / 100).toFixed(2)
export const pct = (n: number) => Math.round(n * 10) / 10 + '%'
export const round2 = (n: number) => Math.round(n * 100) / 100
export const near100 = (t: number) => Math.abs(t - 100) < 0.005
