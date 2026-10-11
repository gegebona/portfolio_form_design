// Illustrative data, same as the HTML prototype.

export type Option = { id: string; label: string; sub?: string }
export type ExclusionCategory = { id: CategoryId; label: string; placeholder: string; options: Option[]; suggested: string[] }
export type CategoryId = 'geography' | 'sector' | 'currency' | 'category'

export const CATEGORIES: ExclusionCategory[] = [
  {
    id: 'geography', label: 'Geography exclusions', placeholder: 'Add region…',
    options: [
      { id: 'em', label: 'Emerging markets' }, { id: 'apac', label: 'APAC' }, { id: 'uk', label: 'United Kingdom' },
      { id: 'na', label: 'North America' }, { id: 'ez', label: 'Eurozone' }, { id: 'latam', label: 'Latin America' },
      { id: 'mea', label: 'Middle East & Africa' }, { id: 'ch', label: 'Switzerland' }, { id: 'jp', label: 'Japan' },
    ],
    suggested: ['apac', 'uk', 'na', 'ez'],
  },
  {
    id: 'sector', label: 'Sector exclusions', placeholder: 'Add sector…',
    options: [
      { id: 'comm', label: 'Communications' }, { id: 'cons', label: 'Consumers' }, { id: 'energy', label: 'Energy' },
      { id: 'fin', label: 'Financials' }, { id: 'health', label: 'Health care' }, { id: 'ind', label: 'Industrials' },
      { id: 'it', label: 'Technology' }, { id: 'mat', label: 'Materials' }, { id: 're', label: 'Real estate' },
      { id: 'util', label: 'Utilities' },
    ],
    suggested: ['comm', 'cons', 'fin'],
  },
  {
    id: 'currency', label: 'Currency exclusions', placeholder: 'Add currency…',
    options: [
      { id: 'EUR', label: 'EUR', sub: 'Euro' }, { id: 'USD', label: 'USD', sub: 'US dollar' }, { id: 'GBP', label: 'GBP', sub: 'Pound sterling' },
      { id: 'JPY', label: 'JPY', sub: 'Japanese yen' }, { id: 'CHF', label: 'CHF', sub: 'Swiss franc' }, { id: 'AUD', label: 'AUD', sub: 'Australian dollar' },
      { id: 'CAD', label: 'CAD', sub: 'Canadian dollar' }, { id: 'HKD', label: 'HKD', sub: 'Hong Kong dollar' }, { id: 'SGD', label: 'SGD', sub: 'Singapore dollar' },
      { id: 'SEK', label: 'SEK', sub: 'Swedish krona' }, { id: 'NOK', label: 'NOK', sub: 'Norwegian krone' }, { id: 'DKK', label: 'DKK', sub: 'Danish krone' },
    ],
    suggested: ['USD', 'JPY', 'GBP', 'AUD', 'CAD', 'CHF', 'HKD', 'SGD'],
  },
  {
    id: 'category', label: 'Instrument category exclusions', placeholder: 'Add category…',
    options: [
      { id: 'eq', label: 'Equities' }, { id: 'bond', label: 'Bonds' }, { id: 'fund', label: 'Investment funds' },
      { id: 'etf', label: 'ETFs' }, { id: 'struct', label: 'Structured products' }, { id: 'deriv', label: 'Derivatives' },
      { id: 'comdty', label: 'Commodities' }, { id: 'hedge', label: 'Hedge funds' }, { id: 'pm', label: 'Private markets' },
    ],
    suggested: ['struct', 'hedge', 'pm'],
  },
]

export const RATINGS = ['Aaa', 'Aa', 'A', 'Baa', 'Ba', 'B', 'Caa', 'Ca–C']
export const ESG_SCORES = ['1', '2', '3', '4', '5']

export type Instrument = { isin: string; name: string }
/** Instruments that can be excluded on Preferences. */
export const EXCLUDABLE_INSTRUMENTS: Instrument[] = [
  { isin: 'US0378331005', name: 'Apple Inc.' },
  { isin: 'FR0000120271', name: 'TotalEnergies SE' },
  { isin: 'GB00BP6MXD84', name: 'Shell plc' },
  { isin: 'US30231G1022', name: 'Exxon Mobil Corp.' },
  { isin: 'CH0038863350', name: 'Nestlé SA' },
  { isin: 'US5949181045', name: 'Microsoft Corp.' },
]
/** Instruments that can be added as components. */
export const COMPONENT_INSTRUMENTS: Instrument[] = [
  { isin: 'US02079K1079', name: 'Alphabet Inc. Class C' },
  { isin: 'US0378331005', name: 'Apple Inc.' },
  { isin: 'US5949181045', name: 'Microsoft Corp.' },
  { isin: 'CH0038863350', name: 'Nestlé SA' },
  { isin: 'CH0012032048', name: 'Roche Holding AG' },
  { isin: 'NL0010273215', name: 'ASML Holding NV' },
]

export type Benchmark = { id: string; name: string; ccy: string; parts: [string, number][] }
export const BENCHMARKS: Benchmark[] = [
  { id: 'glob-eq', name: 'SMA - Global Equity Benchmark', ccy: 'EUR', parts: [['MSCI World', 90], ['EUR Cash', 10]] },
  { id: 'acwi', name: 'SMA - Global Equity ACWI Benchmark', ccy: 'EUR', parts: [['MSCI ACWI', 95], ['EUR Cash', 5]] },
  { id: 'eu-eq', name: 'SMA - Europe Equity Benchmark', ccy: 'EUR', parts: [['MSCI Europe', 95], ['EUR Cash', 5]] },
  { id: 'us-eq', name: 'SMA - US Equity Benchmark', ccy: 'USD', parts: [['S&P 500', 95], ['USD Cash', 5]] },
  { id: 'em-eq', name: 'SMA - Emerging Markets Equity Benchmark', ccy: 'USD', parts: [['MSCI Emerging Markets', 100]] },
  { id: 'ch-eq', name: 'SMA - Swiss Equity Benchmark', ccy: 'CHF', parts: [['Swiss Performance Index', 95], ['CHF Cash', 5]] },
  { id: 'growth', name: 'SMA - Growth EUR Benchmark', ccy: 'EUR', parts: [['MSCI ACWI', 75], ['Bloomberg Global Aggregate (EUR hedged)', 20], ['EUR Cash', 5]] },
  { id: 'balanced', name: 'SMA - Balanced EUR Benchmark', ccy: 'EUR', parts: [['MSCI World', 50], ['Bloomberg Euro Aggregate', 45], ['EUR Cash', 5]] },
  { id: 'conservative', name: 'SMA - Conservative EUR Benchmark', ccy: 'EUR', parts: [['Bloomberg Euro Aggregate', 70], ['MSCI World', 25], ['EUR Cash', 5]] },
  { id: 'income', name: 'SMA - Income EUR Benchmark', ccy: 'EUR', parts: [['Bloomberg Euro Corporate', 60], ['Bloomberg Euro Treasury', 30], ['EUR Cash', 10]] },
  { id: 'glob-bond', name: 'SMA - Global Bonds EUR Hedged Benchmark', ccy: 'EUR', parts: [['Bloomberg Global Aggregate (EUR hedged)', 100]] },
]
export const PORTFOLIO_CURRENCIES = ['EUR', 'USD', 'CHF', 'GBP']

export type Component = {
  id: string; kind: 'bb' | 'mp'; name: string; area: string; region: string; provider: string
  geo?: string[]; sector?: string[]; desc: string
}
// geo / sector ids match the Preferences exclusion options, for conflict tags.
export const COMPONENTS: Component[] = [
  { id: 'keyeq', kind: 'bb', name: 'LUX KEY – EUR Equity Value', area: 'Equity', region: 'Europe', provider: 'LUX Funds', geo: ['ez'], sector: ['energy', 'fin'], desc: 'Actively managed European equity fund focusing on value and large-cap opportunities.' },
  { id: 'holt-eu', kind: 'bb', name: 'HOLT – MSCI Europe Proxy', area: 'Equity', region: 'Europe', provider: 'HOLT', geo: ['ez', 'uk'], desc: 'Quantitative proxy tracking the MSCI Europe index using HOLT valuation metrics.' },
  { id: 'holt-world', kind: 'bb', name: 'HOLT – MSCI World Proxy', area: 'Equity', region: 'Global', provider: 'HOLT', desc: 'Quantitative proxy tracking the MSCI World index using HOLT valuation metrics.' },
  { id: 'holt-spx', kind: 'bb', name: 'HOLT – S&P 500 Proxy', area: 'Equity', region: 'USA', provider: 'HOLT', geo: ['na'], desc: 'Quantitative proxy tracking the S&P 500 index using HOLT valuation metrics.' },
  { id: 'gec', kind: 'bb', name: 'LUX IM – Global Equity Change', area: 'Equity', region: 'Global', provider: 'LUX IM', desc: 'Global equity fund investing in companies driving structural change and innovation.' },
  { id: 'defender', kind: 'bb', name: 'LUX IM – Active Defender', area: 'Flexible', region: 'Global', provider: 'LUX IM', desc: 'Multi-asset strategy aiming to preserve capital with dynamic risk management.' },
  { id: 'gbond', kind: 'bb', name: 'LUX IM – Global Bond', area: 'Fixed income', region: 'Global', provider: 'LUX IM', desc: 'Actively managed global bond fund investing across developed and emerging markets.' },
  { id: 'gem', kind: 'bb', name: 'HOLT GEM Benchmark – ADR only', area: 'Equity', region: 'Emerging markets', provider: 'HOLT', geo: ['em'], desc: 'Proxy for global emerging markets using only ADR-listed securities.' },
  { id: 'usgr', kind: 'bb', name: 'LUX EQ – USA Growth USD', area: 'Equity', region: 'USA', provider: 'LUX Funds', geo: ['na'], desc: 'US large-cap growth equity fund denominated in USD.' },
  { id: 'ch-eq', kind: 'bb', name: 'LUX KEY – Swiss Equity Quality', area: 'Equity', region: 'Switzerland', provider: 'LUX Funds', geo: ['ch'], desc: 'Swiss large- and mid-cap companies with strong balance sheets and stable earnings.' },
  { id: 'jp-eq', kind: 'bb', name: 'HOLT – MSCI Japan Proxy', area: 'Equity', region: 'Japan', provider: 'HOLT', geo: ['jp'], desc: 'Quantitative proxy tracking the MSCI Japan index using HOLT valuation metrics.' },
  { id: 'apac-eq', kind: 'bb', name: 'HOLT – Asia Pacific ex Japan Proxy', area: 'Equity', region: 'APAC', provider: 'HOLT', geo: ['apac'], desc: 'Quantitative proxy for developed and emerging Asia Pacific, excluding Japan.' },
  { id: 'health', kind: 'bb', name: 'LUX EQ – Global Health Care', area: 'Equity', region: 'Global', provider: 'LUX Funds', sector: ['health'], desc: 'Global pharmaceutical, biotech and medical technology companies.' },
  { id: 'hybond', kind: 'bb', name: 'LUX IM – Global High Yield', area: 'Fixed income', region: 'Global', provider: 'LUX IM', desc: 'Sub-investment-grade corporate bonds with active credit selection.' },
  { id: 'eubond', kind: 'bb', name: 'LUX IM – EUR Corporate Bond', area: 'Fixed income', region: 'Europe', provider: 'LUX IM', geo: ['ez'], desc: 'Investment-grade corporate bonds denominated in euro.' },
  { id: 'gold', kind: 'bb', name: 'LUX FS – Physical Gold', area: 'Commodities', region: 'Global', provider: 'LUX Funds', desc: 'Physically backed gold exposure held in Swiss vaults.' },
  { id: 'mp-growth', kind: 'mp', name: 'Growth Focus Portfolio', area: 'Equity', region: 'Global', provider: 'In-house', desc: 'Diversified portfolio with a primary focus on capital growth through equities.' },
  { id: 'mp-balanced', kind: 'mp', name: 'Balanced Allocation Portfolio', area: 'Multi-asset', region: 'Global', provider: 'In-house', desc: 'Multi-asset portfolio balancing equities and fixed income for moderate risk and return.' },
  { id: 'mp-income', kind: 'mp', name: 'Conservative Income Portfolio', area: 'Fixed income', region: 'Global', provider: 'In-house', desc: 'Portfolio focused on income generation and capital preservation via fixed income.' },
  { id: 'mp-gequity', kind: 'mp', name: 'Growth Equity Portfolio', area: 'Equity', region: 'Developed markets', provider: 'In-house', desc: 'Equity-only portfolio targeting long-term growth across developed markets.' },
  { id: 'mp-sustain', kind: 'mp', name: 'Sustainable Future Portfolio', area: 'Multi-asset', region: 'Global', provider: 'In-house', desc: 'Multi-asset portfolio investing in companies with strong sustainability profiles.' },
  { id: 'mp-dynamic', kind: 'mp', name: 'Dynamic Opportunities Portfolio', area: 'Flexible', region: 'Global', provider: 'In-house', desc: 'Flexible allocation that adapts to changing market opportunities.' },
  { id: 'mp-yield', kind: 'mp', name: 'Global Yield Portfolio', area: 'Fixed income', region: 'Global', provider: 'In-house', desc: 'Income-oriented mix of government, corporate and high-yield bonds.' },
  { id: 'mp-esg', kind: 'mp', name: 'ESG Leaders Equity Portfolio', area: 'Equity', region: 'Developed markets', provider: 'In-house', desc: 'Developed-market equities with the best ESG scores in each sector.' },
  { id: 'mp-cap', kind: 'mp', name: 'Capital Preservation Portfolio', area: 'Fixed income', region: 'Global', provider: 'In-house', desc: 'Short-duration, high-quality bonds for investors who put stability first.' },
  { id: 'mp-real', kind: 'mp', name: 'Real Assets Portfolio', area: 'Multi-asset', region: 'Global', provider: 'In-house', desc: 'Infrastructure, real estate and commodities to protect against inflation.' },
]
export const AREAS = ['Equity', 'Fixed income', 'Multi-asset', 'Flexible', 'Commodities']
export const PROVIDERS = ['HOLT', 'LUX IM', 'LUX Funds', 'In-house']
export const CASH_CURRENCIES = ['EUR', 'USD', 'CHF', 'GBP', 'JPY']

export type AssetClass = 'Equity' | 'Bonds' | 'Alternatives' | 'Liquidity'
export const ASSET_CLASSES: AssetClass[] = ['Equity', 'Bonds', 'Alternatives', 'Liquidity']
/** Chart colour per asset class: semantic chart tokens, used as bg-chart-1 etc. */
export const CLASS_COLOR: Record<AssetClass, string> = {
  Equity: 'var(--color-chart-1)', Bonds: 'var(--color-chart-2)', Alternatives: 'var(--color-chart-3)', Liquidity: 'var(--color-chart-4)',
}
export const AREA_CLASS: Record<string, AssetClass> = {
  Equity: 'Equity', 'Fixed income': 'Bonds', 'Multi-asset': 'Alternatives', Flexible: 'Alternatives', Commodities: 'Alternatives',
}

export const QUALITY_CHECKS: [string, number][] = [
  ['Asset allocation', 5], ['Portfolio risk', 5], ['Bulk risk', 5], ['Issuer risk', 5], ['Bond rating', 5], ['Maturity date', 5], ['ESG overall', 5],
]
export const PASS_SCORE = 4

// ---- Illustrative component figures, stable per component ----
function hash(s: string) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h }
export function figures(c: Component) {
  const h = hash(c.id)
  const r = (k: number, lo: number, hi: number) => lo + ((h >>> (k * 3)) % 997) / 997 * (hi - lo)
  return { r1: r(1, 9, 20), r3: r(2, 11, 23), r5: r(3, 12, 24), ytd: r(4, -4, 14), y1: r(5, -6, 28), y3: r(6, 2, 24), y5: r(7, 12, 55), n: 20 + (h % 40) }
}
export function benchFor(c: Component): [string, number][] {
  if (c.area === 'Fixed income') return [['Bloomberg Global Aggregate', 100]]
  if (c.area === 'Multi-asset' || c.area === 'Flexible') return [['MSCI World', 60], ['Bloomberg Global Aggregate', 40]]
  if (c.region === 'Europe') return [['MSCI Europe', 100]]
  if (c.region === 'USA') return [['S&P 500', 100]]
  if (c.region === 'Emerging markets') return [['MSCI Emerging Markets', 100]]
  if (c.area === 'Commodities') return [['LBMA Gold Price', 100]]
  if (c.region === 'Switzerland') return [['Swiss Performance Index', 100]]
  if (c.region === 'Japan') return [['MSCI Japan', 100]]
  if (c.region === 'APAC') return [['MSCI AC Asia Pacific ex Japan', 100]]
  return [['MSCI World', 100]]
}
const POOLS: Record<string, [string, string][]> = {
  europe: [['ASML Holding', 'NL0010273215'], ['Novo Nordisk', 'DK0062498333'], ['SAP', 'DE0007164600'], ['Nestlé', 'CH0038863350'], ['LVMH', 'FR0000121014'],
    ['Roche Holding', 'CH0012032048'], ['Siemens', 'DE0007236101'], ['Schneider Electric', 'FR0000121972'], ['Allianz', 'DE0008404005'], ['Sanofi', 'FR0000120578']],
  em: [['Credicorp', 'BMG2519Y1084'], ['BYD Company', 'CNE100000296'], ['PetroChina', 'CNE1000003W8'], ['Antofagasta', 'GB0000456144'], ['Fresnillo', 'GB00B2QPKJ12'],
    ['ReNew Energy Global', 'GB00BNQMPN80'], ['AngloGold Ashanti', 'GB00BRXH2664'], ['Lenovo Group', 'HK0992009065'], ['FIH Mobile', 'KYG3472Y1199'], ['Meituan', 'KYG596691041']],
  global: [['Microsoft', 'US5949181045'], ['Apple', 'US0378331005'], ['NVIDIA', 'US67066G1040'], ['Amazon', 'US0231351067'], ['Meta Platforms', 'US30303M1027'],
    ['Alphabet Class C', 'US02079K1079'], ['Broadcom', 'US11135F1012'], ['Tesla', 'US88160R1014'], ['JPMorgan Chase', 'US46625H1005'], ['Eli Lilly', 'US5324571083']],
}
export const TOP_WEIGHTS = [8.4, 7.9, 7.1, 6.6, 6.2, 5.4, 5.1, 4.7, 4.2, 3.6]
export function poolFor(c: Component) { return c.region === 'Europe' ? POOLS.europe : c.region === 'Emerging markets' ? POOLS.em : POOLS.global }

// ---- Simulation positions (existing portfolio, weights add up to 100%) ----
export type Position = { id: string; cls: AssetClass; name: string; isin: string; bb: string; ccy: string; fx: number; price: number; w: number; esg: string }
export const POSITIONS: Position[] = [
  { id: 'eur', cls: 'Liquidity', name: 'EUR account', isin: '', bb: '—', ccy: 'EUR', fx: 1, price: 1, w: 2, esg: '0.0' },
  { id: 'gbond', cls: 'Bonds', name: 'LUX IM – Global Bond', isin: '', bb: 'LUX IM – Global Bond', ccy: 'EUR', fx: 1, price: 102.4, w: 25, esg: '—' },
  { id: 'defender', cls: 'Alternatives', name: 'LUX IM – Active Defender', isin: '', bb: 'LUX IM – Active Defender', ccy: 'EUR', fx: 1, price: 98.1, w: 12, esg: '—' },
  { id: 'aapl', cls: 'Equity', name: 'Apple Inc.', isin: 'US0378331005', bb: 'LUX KEY – EUR Equity Value', ccy: 'USD', fx: 0.85, price: 227.45, w: 1.5, esg: '—' },
  { id: 'asml', cls: 'Equity', name: 'ASML Holding NV', isin: 'NL0010273215', bb: 'LUX KEY – EUR Equity Value', ccy: 'EUR', fx: 1, price: 642.3, w: 5.8, esg: '—' },
  { id: 'novo', cls: 'Equity', name: 'Novo Nordisk A/S', isin: 'DK0062498333', bb: 'LUX KEY – EUR Equity Value', ccy: 'DKK', fx: 0.13, price: 712.4, w: 5.6, esg: '—' },
  { id: 'sap', cls: 'Equity', name: 'SAP SE', isin: 'DE0007164600', bb: 'LUX KEY – EUR Equity Value', ccy: 'EUR', fx: 1, price: 228.15, w: 5.5, esg: '—' },
  { id: 'nesn', cls: 'Equity', name: 'Nestlé SA', isin: 'CH0038863350', bb: 'LUX KEY – EUR Equity Value', ccy: 'CHF', fx: 1.07, price: 86.2, w: 5.4, esg: '—' },
  { id: 'lvmh', cls: 'Equity', name: 'LVMH', isin: 'FR0000121014', bb: 'LUX KEY – EUR Equity Value', ccy: 'EUR', fx: 1, price: 612.7, w: 5.3, esg: '—' },
  { id: 'rog', cls: 'Equity', name: 'Roche Holding AG', isin: 'CH0012032048', bb: 'LUX KEY – EUR Equity Value', ccy: 'CHF', fx: 1.07, price: 262.4, w: 5.2, esg: '—' },
  { id: 'sie', cls: 'Equity', name: 'Siemens AG', isin: 'DE0007236101', bb: 'LUX KEY – EUR Equity Value', ccy: 'EUR', fx: 1, price: 186.9, w: 5, esg: '—' },
  { id: 'su', cls: 'Equity', name: 'Schneider Electric SE', isin: 'FR0000121972', bb: 'LUX KEY – EUR Equity Value', ccy: 'EUR', fx: 1, price: 238.6, w: 4.9, esg: '—' },
  { id: 'alv', cls: 'Equity', name: 'Allianz SE', isin: 'DE0008404005', bb: 'LUX KEY – EUR Equity Value', ccy: 'EUR', fx: 1, price: 302.1, w: 4.7, esg: '—' },
  { id: 'san', cls: 'Equity', name: 'Sanofi', isin: 'FR0000120578', bb: 'LUX KEY – EUR Equity Value', ccy: 'EUR', fx: 1, price: 96.85, w: 4.57, esg: '—' },
  { id: 'bap', cls: 'Equity', name: 'Credicorp Ltd', isin: 'BMG2519Y1084', bb: 'HOLT GEM Benchmark – ADR only', ccy: 'USD', fx: 0.85, price: 355.48, w: 1.7, esg: '—' },
  { id: 'byd', cls: 'Equity', name: 'BYD Company Ltd', isin: 'CNE100000296', bb: 'HOLT GEM Benchmark – ADR only', ccy: 'HKD', fx: 0.11, price: 10.25, w: 0.91, esg: '—' },
  { id: 'ptr', cls: 'Equity', name: 'PetroChina Co', isin: 'CNE1000003W8', bb: 'HOLT GEM Benchmark – ADR only', ccy: 'HKD', fx: 0.11, price: 1.02, w: 0.72, esg: '—' },
  { id: 'anto', cls: 'Equity', name: 'Antofagasta plc', isin: 'GB0000456144', bb: 'HOLT GEM Benchmark – ADR only', ccy: 'GBP', fx: 1.14, price: 42.6, w: 0.51, esg: '—' },
  { id: 'fres', cls: 'Equity', name: 'Fresnillo plc', isin: 'GB00B2QPKJ12', bb: 'HOLT GEM Benchmark – ADR only', ccy: 'GBP', fx: 1.14, price: 41.04, w: 0.42, esg: '—' },
  { id: 'rnw', cls: 'Equity', name: 'ReNew Energy Global plc', isin: 'GB00BNQMPN80', bb: 'Multiple building blocks', ccy: 'USD', fx: 0.85, price: 5.2, w: 0.63, esg: '—' },
  { id: 'au', cls: 'Equity', name: 'AngloGold Ashanti plc', isin: 'GB00BRXH2664', bb: 'HOLT GEM Benchmark – ADR only', ccy: 'USD', fx: 0.85, price: 104.65, w: 0.85, esg: '—' },
  { id: 'lnv', cls: 'Equity', name: 'Lenovo Group Ltd', isin: 'HK0992009065', bb: 'Multiple building blocks', ccy: 'HKD', fx: 0.11, price: 1.04, w: 0.72, esg: '—' },
  { id: 'fih', cls: 'Equity', name: 'FIH Mobile Ltd', isin: 'KYG3472Y1199', bb: 'HOLT GEM Benchmark – ADR only', ccy: 'HKD', fx: 0.11, price: 21.98, w: 0.37, esg: '—' },
  { id: 'mtn', cls: 'Equity', name: 'Meituan', isin: 'KYG596691041', bb: 'HOLT GEM Benchmark – ADR only', ccy: 'HKD', fx: 0.11, price: 8.74, w: 0.7, esg: '—' },
  { id: 'goog', cls: 'Equity', name: 'Alphabet Inc. Class C', isin: 'US02079K1079', bb: '—', ccy: 'USD', fx: 0.85, price: 167.2, w: 0, esg: '—' },
]

// ---- Model portfolio book (illustrative list; names, people and figures are invented) ----
export type BookStatus = 'Draft' | 'Published' | 'Archived'
/** Lifecycle: Draft → Published → Archived. No approval step for now. */
export const BOOK_STATUSES: BookStatus[] = ['Draft', 'Published', 'Archived']
/** Position task: an underlying component changed the weight of one of its instruments; the manager accepts, rejects or defers it in Simulation. */
export type BookTask = { rowId: string; instrument: string; isin: string; component: string; current: number; next: number }
/** The signed-in user of the prototype (drives “My portfolios” and who edits a row). */
export const BOOK_USER = 'Wayne, B.'
/** Date the 1Y performance figures refer to. */
export const BOOK_AS_OF = '30/09/2026'
export type BookEntry = {
  id: string; name: string; type: 'Standard' | 'Multi' | 'Customized'; benchmark: string
  /** Asset allocation in % per asset class; most portfolios hold several. */
  alloc: Partial<Record<AssetClass, number>>
  /** 1Y performance in %; not every portfolio has one yet (new or unpublished ones). */
  perf1y?: number
  creator: string; status: BookStatus; editedBy: string; modified: string; tasks?: BookTask[]
  /** Customized versions point at the model portfolio they derive from and are listed under it. */
  parent?: string
}
export const MODEL_PORTFOLIOS: BookEntry[] = [
  { id: '001', name: 'Growth Focus Portfolio', type: 'Standard', alloc: { Equity: 90, Liquidity: 10 }, benchmark: 'S&P 500 (USA)', perf1y: 8.56, creator: 'Hobbs, L.', status: 'Published', editedBy: 'Hobbs, L.', modified: '11/10/2025' },
  { id: '002', name: 'Balanced Allocation Portfolio', type: 'Standard', alloc: { Equity: 50, Bonds: 35, Alternatives: 10, Liquidity: 5 }, benchmark: 'Dow Jones Industrial Average (USA)', creator: 'Wayne, B.', status: 'Draft', editedBy: 'Wayne, B.', modified: '06/03/2026' },
  { id: '003', name: 'Conservative Income Portfolio', type: 'Standard', alloc: { Bonds: 70, Equity: 20, Liquidity: 10 }, benchmark: 'NASDAQ Composite (USA)', perf1y: 11.1, creator: 'Jones, I.', status: 'Published', editedBy: 'Jones, I.', modified: '16/09/2025', tasks: [{ rowId: 'anto', instrument: 'Antofagasta plc', isin: 'GB0000456144', component: 'Systematic Allocation Portfolio Equity', current: 0.51, next: 1 }] },
  { id: '011', name: 'Conservative Income Portfolio A', type: 'Customized', alloc: { Bonds: 75, Equity: 15, Liquidity: 10 }, benchmark: 'NASDAQ Composite (USA)', perf1y: 11.1, creator: 'Jones, I.', status: 'Published', editedBy: 'Jones, I.', modified: '16/09/2025', parent: '003' },
  { id: '012', name: 'Conservative Income Portfolio B', type: 'Customized', alloc: { Bonds: 65, Equity: 25, Liquidity: 10 }, benchmark: 'NASDAQ Composite (USA)', perf1y: 11.1, creator: 'Jones, I.', status: 'Published', editedBy: 'Jones, I.', modified: '16/09/2025', parent: '003' },
  { id: '004', name: 'Global Equity Portfolio', type: 'Multi', alloc: { Equity: 95, Liquidity: 5 }, benchmark: 'FTSE 100 (UK)', perf1y: 12.42, creator: 'Wayne, B.', status: 'Draft', editedBy: 'Wayne, B.', modified: '06/03/2026' },
  { id: '005', name: 'Sustainable Future Portfolio', type: 'Multi', alloc: { Equity: 70, Bonds: 20, Alternatives: 10 }, benchmark: 'DAX (Germany)', perf1y: 12.01, creator: 'Stark, T.', status: 'Published', editedBy: 'Stark, T.', modified: '28/08/2025' },
  { id: '006', name: 'Dynamic Opportunities Portfolio', type: 'Standard', alloc: { Equity: 45, Bonds: 25, Alternatives: 25, Liquidity: 5 }, benchmark: 'CAC 40 (France)', creator: 'Jones, I.', status: 'Draft', editedBy: 'Jones, I.', modified: '06/03/2026' },
  { id: '007', name: 'Defensive Strategy Portfolio', type: 'Standard', alloc: { Bonds: 60, Liquidity: 25, Equity: 15 }, benchmark: 'MSCI World Index (Global)', perf1y: 11.34, creator: 'Smith, J.', status: 'Published', editedBy: 'Smith, J.', modified: '27/08/2025' },
  { id: '008', name: 'Emerging Markets Portfolio', type: 'Multi', alloc: { Equity: 85, Bonds: 10, Liquidity: 5 }, benchmark: 'Custom', perf1y: 8.56, creator: 'Hobbs, L.', status: 'Published', editedBy: 'Hobbs, L.', modified: '04/08/2025', tasks: [{ rowId: 'anto', instrument: 'Antofagasta plc', isin: 'GB0000456144', component: 'Systematic Allocation Portfolio Equity', current: 0.51, next: 1 }] },
  { id: '009', name: 'Dividend Yield Portfolio', type: 'Multi', alloc: { Equity: 80, Bonds: 15, Liquidity: 5 }, benchmark: 'Custom', perf1y: 15.09, creator: 'Smith, J.', status: 'Published', editedBy: 'Smith, J.', modified: '04/08/2025' },
  { id: '010', name: 'Technology Leaders Portfolio', type: 'Standard', alloc: { Equity: 100 }, benchmark: 'Custom', perf1y: 4.65, creator: 'Wayne, B.', status: 'Published', editedBy: 'Wayne, B.', modified: '04/08/2025' },
  { id: '013', name: 'Systematic Allocation Portfolio Equity', type: 'Standard', alloc: { Equity: 100 }, benchmark: 'S&P 500 (USA)', perf1y: 4.65, creator: 'Wayne, B.', status: 'Published', editedBy: 'Wayne, B.', modified: '06/03/2026' },
]
