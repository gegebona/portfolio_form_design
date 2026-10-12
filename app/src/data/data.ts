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
  { id: 'gem', kind: 'bb', name: 'HOLT GEM Benchmark – ADR only', area: 'Equity', region: 'Emerging markets', provider: 'HOLT', geo: ['em'], sector: ['energy', 'ind', 'mat'], desc: 'Proxy for global emerging markets using only ADR-listed securities.' },
  { id: 'usgr', kind: 'bb', name: 'LUX EQ – USA Growth USD', area: 'Equity', region: 'USA', provider: 'LUX Funds', geo: ['na'], desc: 'US large-cap growth equity fund denominated in USD.' },
  { id: 'ch-eq', kind: 'bb', name: 'LUX KEY – Swiss Equity Quality', area: 'Equity', region: 'Switzerland', provider: 'LUX Funds', geo: ['ch'], desc: 'Swiss large- and mid-cap companies with strong balance sheets and stable earnings.' },
  { id: 'jp-eq', kind: 'bb', name: 'HOLT – MSCI Japan Proxy', area: 'Equity', region: 'Japan', provider: 'HOLT', geo: ['jp'], desc: 'Quantitative proxy tracking the MSCI Japan index using HOLT valuation metrics.' },
  { id: 'apac-eq', kind: 'bb', name: 'HOLT – Asia Pacific ex Japan Proxy', area: 'Equity', region: 'APAC', provider: 'HOLT', geo: ['apac'], desc: 'Quantitative proxy for developed and emerging Asia Pacific, excluding Japan.' },
  { id: 'health', kind: 'bb', name: 'LUX EQ – Global Health Care', area: 'Equity', region: 'Global', provider: 'LUX Funds', sector: ['health'], desc: 'Global pharmaceutical, biotech and medical technology companies.' },
  { id: 'hybond', kind: 'bb', name: 'LUX IM – Global High Yield', area: 'Fixed income', region: 'Global', provider: 'LUX IM', desc: 'Sub-investment-grade corporate bonds with active credit selection.' },
  { id: 'eubond', kind: 'bb', name: 'LUX IM – EUR Corporate Bond', area: 'Fixed income', region: 'Europe', provider: 'LUX IM', geo: ['ez'], desc: 'Investment-grade corporate bonds denominated in euro.' },
  { id: 'gold', kind: 'bb', name: 'LUX FS – Physical Gold', area: 'Commodities', region: 'Global', provider: 'LUX Funds', desc: 'Physically backed gold exposure held in Swiss vaults.' },
  { id: 'holt-em', kind: 'bb', name: 'HOLT – MSCI Emerging Markets Proxy', area: 'Equity', region: 'Emerging markets', provider: 'HOLT', geo: ['em'], desc: 'Quantitative proxy tracking the MSCI Emerging Markets index using HOLT valuation metrics.' },
  { id: 'holt-acwi', kind: 'bb', name: 'HOLT – MSCI ACWI Proxy', area: 'Equity', region: 'Global', provider: 'HOLT', desc: 'Quantitative proxy for developed and emerging markets combined, using HOLT valuation metrics.' },
  { id: 'holt-ndx', kind: 'bb', name: 'HOLT – NASDAQ 100 Proxy', area: 'Equity', region: 'USA', provider: 'HOLT', geo: ['na'], sector: ['it'], desc: 'Quantitative proxy tracking the NASDAQ 100 index using HOLT valuation metrics.' },
  { id: 'holt-uk', kind: 'bb', name: 'HOLT – FTSE 100 Proxy', area: 'Equity', region: 'Europe', provider: 'HOLT', geo: ['uk'], desc: 'Quantitative proxy tracking the FTSE 100 index using HOLT valuation metrics.' },
  { id: 'tech', kind: 'bb', name: 'LUX EQ – Global Technology', area: 'Equity', region: 'Global', provider: 'LUX Funds', sector: ['it'], desc: 'Global software, semiconductor and internet companies with durable growth.' },
  { id: 'eu-small', kind: 'bb', name: 'LUX EQ – European Small Caps', area: 'Equity', region: 'Europe', provider: 'LUX Funds', geo: ['ez'], desc: 'Smaller European companies selected for earnings growth and balance-sheet strength.' },
  { id: 'financials', kind: 'bb', name: 'LUX EQ – Global Financials', area: 'Equity', region: 'Global', provider: 'LUX Funds', sector: ['fin'], desc: 'Banks, insurers and diversified financial companies across developed markets.' },
  { id: 'clean', kind: 'bb', name: 'LUX EQ – Clean Energy Transition', area: 'Equity', region: 'Global', provider: 'LUX Funds', sector: ['energy', 'util'], desc: 'Companies enabling the shift to low-carbon energy generation and networks.' },
  { id: 'realestate', kind: 'bb', name: 'LUX FS – Global Listed Real Estate', area: 'Equity', region: 'Global', provider: 'LUX Funds', sector: ['re'], desc: 'Listed property companies and real estate investment trusts worldwide.' },
  { id: 'eugov', kind: 'bb', name: 'LUX IM – EUR Government Bond', area: 'Fixed income', region: 'Europe', provider: 'LUX IM', geo: ['ez'], desc: 'Euro-area government bonds across the maturity spectrum.' },
  { id: 'ustsy', kind: 'bb', name: 'LUX IM – US Treasury Bond', area: 'Fixed income', region: 'USA', provider: 'LUX IM', geo: ['na'], desc: 'US Treasury bonds with active duration management.' },
  { id: 'emdebt', kind: 'bb', name: 'LUX IM – Emerging Markets Debt', area: 'Fixed income', region: 'Emerging markets', provider: 'LUX IM', geo: ['em'], desc: 'Hard-currency sovereign and corporate bonds from emerging markets.' },
  { id: 'linker', kind: 'bb', name: 'LUX IM – Global Inflation-Linked Bond', area: 'Fixed income', region: 'Global', provider: 'LUX IM', desc: 'Government bonds whose payments rise with inflation.' },
  { id: 'convert', kind: 'bb', name: 'LUX IM – Global Convertibles', area: 'Flexible', region: 'Global', provider: 'LUX IM', desc: 'Convertible bonds combining equity upside with bond-like protection.' },
  { id: 'mai', kind: 'bb', name: 'LUX IM – Multi-Asset Income', area: 'Multi-asset', region: 'Global', provider: 'LUX IM', desc: 'Dividend equities, bonds and alternatives combined for a steady income.' },
  { id: 'commod', kind: 'bb', name: 'LUX FS – Broad Commodities', area: 'Commodities', region: 'Global', provider: 'LUX Funds', desc: 'Diversified exposure to energy, metals and agricultural commodities.' },
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

/** One instrument held inside a building block or model portfolio (illustrative look-through). */
export type Holding = { name: string; isin: string; cls: AssetClass; ccy: string; w: number; sector: string; region: string }
/** Sample sector and region of each pool instrument (by ISIN). */
const INSTRUMENT_PROFILE: Record<string, [sector: string, region: string]> = {
  NL0010273215: ['Information technology', 'Eurozone'], DK0062498333: ['Health care', 'Nordics'], DE0007164600: ['Information technology', 'Eurozone'],
  CH0038863350: ['Consumer staples', 'Switzerland'], FR0000121014: ['Consumer discretionary', 'Eurozone'], CH0012032048: ['Health care', 'Switzerland'],
  DE0007236101: ['Industrials', 'Eurozone'], FR0000121972: ['Industrials', 'Eurozone'], DE0008404005: ['Financials', 'Eurozone'], FR0000120578: ['Health care', 'Eurozone'],
  BMG2519Y1084: ['Financials', 'Latin America'], CNE100000296: ['Consumer discretionary', 'Asia'], CNE1000003W8: ['Energy', 'Asia'],
  GB0000456144: ['Materials', 'Latin America'], GB00B2QPKJ12: ['Materials', 'Latin America'], GB00BNQMPN80: ['Utilities', 'Asia'],
  GB00BRXH2664: ['Materials', 'Africa'], HK0992009065: ['Information technology', 'Asia'], KYG3472Y1199: ['Information technology', 'Asia'], KYG596691041: ['Consumer discretionary', 'Asia'],
  US5949181045: ['Information technology', 'North America'], US0378331005: ['Information technology', 'North America'], US67066G1040: ['Information technology', 'North America'],
  US0231351067: ['Consumer discretionary', 'North America'], US30303M1027: ['Communication services', 'North America'], US02079K1079: ['Communication services', 'North America'],
  US11135F1012: ['Information technology', 'North America'], US88160R1014: ['Consumer discretionary', 'North America'], US46625H1005: ['Financials', 'North America'],
  US5324571083: ['Health care', 'North America'],
}
const ISIN_CCY: Record<string, string> = { US: 'USD', BM: 'USD', CH: 'CHF', GB: 'GBP', DK: 'DKK', HK: 'HKD', KY: 'HKD', CN: 'HKD' }
/**
 * The instruments a component holds, with weights that add up to exactly 100%: its ten sample instruments on 98%
 * and a 2% cash account. Multi-asset and flexible components split their instruments between Equity and Bonds.
 */
export function componentHoldings(c: Component): Holding[] {
  const mixed = c.area === 'Multi-asset' || c.area === 'Flexible'
  const total = TOP_WEIGHTS.reduce((t, w) => t + w, 0)
  const list: Holding[] = poolFor(c).map(([name, isin], i) => ({
    name, isin, cls: mixed ? (i < 6 ? 'Equity' : 'Bonds') : AREA_CLASS[c.area], ccy: ISIN_CCY[isin.slice(0, 2)] ?? 'EUR',
    sector: INSTRUMENT_PROFILE[isin]?.[0] ?? 'Other', region: INSTRUMENT_PROFILE[isin]?.[1] ?? 'Other',
    w: Math.round((TOP_WEIGHTS[i] / total) * 9800) / 100,
  }))
  list[0].w = Math.round((98 - list.slice(1).reduce((t, h) => t + h.w, 0)) * 100) / 100
  return [...list, { name: 'EUR account', isin: '', cls: 'Liquidity', ccy: 'EUR', w: 2, sector: 'Cash', region: 'Cash' }]
}
export function poolFor(c: Component) { return c.region === 'Europe' ? POOLS.europe : c.region === 'Emerging markets' ? POOLS.em : POOLS.global }

// ---- Simulation positions (existing portfolio, weights add up to 100%) ----
/** esg: the supplied ESG score from 0 to 5 as text, or '—' when no score has been received for the instrument. */
export type Position = { id: string; cls: AssetClass; name: string; isin: string; bb: string; ccy: string; fx: number; price: number; w: number; esg: string }
export const POSITIONS: Position[] = [
  { id: 'eur', cls: 'Liquidity', name: 'EUR account', isin: '', bb: '—', ccy: 'EUR', fx: 1, price: 1, w: 2, esg: '0.0' },
  { id: 'gbond', cls: 'Bonds', name: 'LUX IM – Global Bond', isin: '', bb: 'LUX IM – Global Bond', ccy: 'EUR', fx: 1, price: 102.4, w: 25, esg: '3.6' },
  { id: 'defender', cls: 'Alternatives', name: 'LUX IM – Active Defender', isin: '', bb: 'LUX IM – Active Defender', ccy: 'EUR', fx: 1, price: 98.1, w: 12, esg: '—' },
  { id: 'aapl', cls: 'Equity', name: 'Apple Inc.', isin: 'US0378331005', bb: 'LUX KEY – EUR Equity Value', ccy: 'USD', fx: 0.85, price: 227.45, w: 1.5, esg: '3.8' },
  { id: 'asml', cls: 'Equity', name: 'ASML Holding NV', isin: 'NL0010273215', bb: 'LUX KEY – EUR Equity Value', ccy: 'EUR', fx: 1, price: 642.3, w: 5.8, esg: '4.6' },
  { id: 'novo', cls: 'Equity', name: 'Novo Nordisk A/S', isin: 'DK0062498333', bb: 'LUX KEY – EUR Equity Value', ccy: 'DKK', fx: 0.13, price: 712.4, w: 5.6, esg: '4.4' },
  { id: 'sap', cls: 'Equity', name: 'SAP SE', isin: 'DE0007164600', bb: 'LUX KEY – EUR Equity Value', ccy: 'EUR', fx: 1, price: 228.15, w: 5.5, esg: '4.2' },
  { id: 'nesn', cls: 'Equity', name: 'Nestlé SA', isin: 'CH0038863350', bb: 'LUX KEY – EUR Equity Value', ccy: 'CHF', fx: 1.07, price: 86.2, w: 5.4, esg: '3.9' },
  { id: 'lvmh', cls: 'Equity', name: 'LVMH', isin: 'FR0000121014', bb: 'LUX KEY – EUR Equity Value', ccy: 'EUR', fx: 1, price: 612.7, w: 5.3, esg: '3.1' },
  { id: 'rog', cls: 'Equity', name: 'Roche Holding AG', isin: 'CH0012032048', bb: 'LUX KEY – EUR Equity Value', ccy: 'CHF', fx: 1.07, price: 262.4, w: 5.2, esg: '4.0' },
  { id: 'sie', cls: 'Equity', name: 'Siemens AG', isin: 'DE0007236101', bb: 'LUX KEY – EUR Equity Value', ccy: 'EUR', fx: 1, price: 186.9, w: 5, esg: '3.7' },
  { id: 'su', cls: 'Equity', name: 'Schneider Electric SE', isin: 'FR0000121972', bb: 'LUX KEY – EUR Equity Value', ccy: 'EUR', fx: 1, price: 238.6, w: 4.9, esg: '4.8' },
  { id: 'alv', cls: 'Equity', name: 'Allianz SE', isin: 'DE0008404005', bb: 'LUX KEY – EUR Equity Value', ccy: 'EUR', fx: 1, price: 302.1, w: 4.7, esg: '3.5' },
  { id: 'san', cls: 'Equity', name: 'Sanofi', isin: 'FR0000120578', bb: 'LUX KEY – EUR Equity Value', ccy: 'EUR', fx: 1, price: 96.85, w: 4.57, esg: '—' },
  { id: 'bap', cls: 'Equity', name: 'Credicorp Ltd', isin: 'BMG2519Y1084', bb: 'HOLT GEM Benchmark – ADR only', ccy: 'USD', fx: 0.85, price: 355.48, w: 1.7, esg: '—' },
  { id: 'byd', cls: 'Equity', name: 'BYD Company Ltd', isin: 'CNE100000296', bb: 'HOLT GEM Benchmark – ADR only', ccy: 'HKD', fx: 0.11, price: 10.25, w: 0.91, esg: '2.9' },
  { id: 'ptr', cls: 'Equity', name: 'PetroChina Co', isin: 'CNE1000003W8', bb: 'HOLT GEM Benchmark – ADR only', ccy: 'HKD', fx: 0.11, price: 1.02, w: 0.72, esg: '1.4' },
  { id: 'anto', cls: 'Equity', name: 'Antofagasta plc', isin: 'GB0000456144', bb: 'HOLT GEM Benchmark – ADR only', ccy: 'GBP', fx: 1.14, price: 42.6, w: 0.51, esg: '2.6' },
  { id: 'fres', cls: 'Equity', name: 'Fresnillo plc', isin: 'GB00B2QPKJ12', bb: 'HOLT GEM Benchmark – ADR only', ccy: 'GBP', fx: 1.14, price: 41.04, w: 0.42, esg: '—' },
  { id: 'rnw', cls: 'Equity', name: 'ReNew Energy Global plc', isin: 'GB00BNQMPN80', bb: 'Multiple building blocks', ccy: 'USD', fx: 0.85, price: 5.2, w: 0.63, esg: '—' },
  { id: 'au', cls: 'Equity', name: 'AngloGold Ashanti plc', isin: 'GB00BRXH2664', bb: 'HOLT GEM Benchmark – ADR only', ccy: 'USD', fx: 0.85, price: 104.65, w: 0.85, esg: '2.2' },
  { id: 'lnv', cls: 'Equity', name: 'Lenovo Group Ltd', isin: 'HK0992009065', bb: 'Multiple building blocks', ccy: 'HKD', fx: 0.11, price: 1.04, w: 0.72, esg: '—' },
  { id: 'fih', cls: 'Equity', name: 'FIH Mobile Ltd', isin: 'KYG3472Y1199', bb: 'HOLT GEM Benchmark – ADR only', ccy: 'HKD', fx: 0.11, price: 21.98, w: 0.37, esg: '—' },
  { id: 'mtn', cls: 'Equity', name: 'Meituan', isin: 'KYG596691041', bb: 'HOLT GEM Benchmark – ADR only', ccy: 'HKD', fx: 0.11, price: 8.74, w: 0.7, esg: '—' },
  { id: 'goog', cls: 'Equity', name: 'Alphabet Inc. Class C', isin: 'US02079K1079', bb: '—', ccy: 'USD', fx: 0.85, price: 167.2, w: 0, esg: '—' },
]

/** Positions a customized version may add on its own (single instruments, with a weight the user sets). */
export const ADDABLE_POSITIONS: Position[] = [
  { id: 'add-msft', cls: 'Equity', name: 'Microsoft Corp.', isin: 'US5949181045', bb: '—', ccy: 'USD', fx: 0.85, price: 415.3, w: 0, esg: '4.1' },
  { id: 'add-novn', cls: 'Equity', name: 'Novartis AG', isin: 'CH0012005267', bb: '—', ccy: 'CHF', fx: 1.07, price: 92.4, w: 0, esg: '4.2' },
  { id: 'add-ulvr', cls: 'Equity', name: 'Unilever plc', isin: 'GB00B10RZP78', bb: '—', ccy: 'GBP', fx: 1.14, price: 47.9, w: 0, esg: '4.4' },
  { id: 'add-iwda', cls: 'Equity', name: 'iShares Core MSCI World ETF', isin: 'IE00B4L5Y983', bb: '—', ccy: 'USD', fx: 0.85, price: 104.2, w: 0, esg: '3.9' },
  { id: 'add-chgov', cls: 'Bonds', name: 'Swiss Confederation 1.5% 2034', isin: 'CH0224397171', bb: '—', ccy: 'CHF', fx: 1.07, price: 101.8, w: 0, esg: '4.5' },
]

// ---- Model portfolio book (illustrative list; names, people and figures are invented) ----
export type BookStatus = 'Draft' | 'Published'
/** Draft → Published. No approval step; publication happens from NEW in the flow, never from the book. */
export const BOOK_STATUSES: BookStatus[] = ['Draft', 'Published']
/** Position task: an underlying component changed the weight of one of its instruments; the manager accepts, rejects or defers it in Simulation. */
export type TaskStatus = 'Open' | 'Accepted' | 'Rejected' | 'Deferred'
/** STANDARD portfolios only. All three decisions stay selectable; the latest one wins. Only Open tasks ask for attention. */
/**
 * Position task: the underlying component changed the instrument's weight inside it (inCurrent → inNext). In this
 * portfolio that becomes current → next: the component's weight here × the instrument's new weight inside it.
 */
export type BookTask = { rowId: string; instrument: string; isin: string; component: string; inCurrent: number; inNext: number; current: number; next: number; status: TaskStatus }
/** The signed-in user of the prototype (drives “My portfolios” and who edits a row). */
export const BOOK_USER = 'Inbona, E.'
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
  /** Customized only: outcome of the latest automatic update from the parent (none when nothing is pending). */
  auto?: AutoUpdate
  /** Customized only: published version number of CURRENT. */
  version?: number
}
/**
 * Automatic update of a customized portfolio after its parent changed. Never a task and never a status of its own:
 *   ready    NEW was created or refreshed with the parent's changes and waits to be published
 *   pending  preference changes are in NEW; the parent's allocation change waits for a data load that is late
 *   invalid  no valid allocation was possible: nothing was applied, CURRENT stays, the next data load retries
 */
export type AutoUpdate = 'ready' | 'pending' | 'invalid'
/** Illustrative parent change used by every automatic-update sample. */
export const PARENT_UPDATE = {
  changed: '09/10/2026',
  /** Data load that carried the allocation change into the child (ready). */
  loaded: '10/10/2026',
  /** Last successful data load when today's load is late (pending). */
  lastLoad: '08/10/2026',
  /** Instrument the parent now requires, at the parent's target weight. */
  instrument: { id: 'msft', cls: 'Equity' as AssetClass, name: 'Microsoft Corp.', isin: 'US5949181045', bb: 'From parent model portfolio', ccy: 'USD', fx: 0.85, price: 415.3, w: 0, esg: '4.1', target: 3 },
  /** Position that may not be reduced to fund it. */
  protectedId: 'gbond',
  protectedWhy: 'Mandatory position',
}
export const MODEL_PORTFOLIOS: BookEntry[] = [
  { id: '001', name: 'Growth Focus Portfolio', type: 'Standard', alloc: { Equity: 90, Liquidity: 10 }, benchmark: 'S&P 500 (USA)', perf1y: 8.56, creator: 'Hobbs, L.', status: 'Published', editedBy: 'Hobbs, L.', modified: '11/10/2025' },
  { id: '002', name: 'Balanced Allocation Portfolio', type: 'Standard', alloc: { Equity: 50, Bonds: 35, Alternatives: 10, Liquidity: 5 }, benchmark: 'Dow Jones Industrial Average (USA)', creator: 'Inbona, E.', status: 'Draft', editedBy: 'Inbona, E.', modified: '06/03/2026' },
  { id: '003', name: 'Conservative Income Portfolio', type: 'Standard', alloc: { Bonds: 70, Equity: 20, Liquidity: 10 }, benchmark: 'NASDAQ Composite (USA)', perf1y: 11.1, creator: 'Jones, I.', status: 'Published', editedBy: 'Jones, I.', modified: '16/09/2025', tasks: [{ rowId: 'anto', instrument: 'Antofagasta plc', isin: 'GB0000456144', component: 'HOLT GEM Benchmark – ADR only', inCurrent: 8.5, inNext: 12, current: 0.51, next: 0.72, status: 'Open' }] },
  { id: '011', name: 'Conservative Income Portfolio A', type: 'Customized', alloc: { Bonds: 75, Equity: 15, Liquidity: 10 }, benchmark: 'NASDAQ Composite (USA)', perf1y: 11.1, creator: 'Jones, I.', status: 'Published', editedBy: 'Jones, I.', modified: '16/09/2025', parent: '003', auto: 'ready', version: 3 },
  { id: '012', name: 'Conservative Income Portfolio B', type: 'Customized', alloc: { Bonds: 65, Equity: 25, Liquidity: 10 }, benchmark: 'NASDAQ Composite (USA)', perf1y: 11.1, creator: 'Jones, I.', status: 'Published', editedBy: 'Jones, I.', modified: '16/09/2025', parent: '003', auto: 'pending', version: 2 },
  { id: '004', name: 'Global Equity Portfolio', type: 'Multi', alloc: { Equity: 95, Liquidity: 5 }, benchmark: 'FTSE 100 (UK)', perf1y: 12.42, creator: 'Inbona, E.', status: 'Draft', editedBy: 'Inbona, E.', modified: '06/03/2026' },
  { id: '005', name: 'Sustainable Future Portfolio', type: 'Multi', alloc: { Equity: 70, Bonds: 20, Alternatives: 10 }, benchmark: 'DAX (Germany)', perf1y: 12.01, creator: 'Stark, T.', status: 'Published', editedBy: 'Stark, T.', modified: '28/08/2025' },
  { id: '006', name: 'Dynamic Opportunities Portfolio', type: 'Standard', alloc: { Equity: 45, Bonds: 25, Alternatives: 25, Liquidity: 5 }, benchmark: 'CAC 40 (France)', creator: 'Jones, I.', status: 'Draft', editedBy: 'Jones, I.', modified: '06/03/2026' },
  { id: '007', name: 'Defensive Strategy Portfolio', type: 'Standard', alloc: { Bonds: 60, Liquidity: 25, Equity: 15 }, benchmark: 'MSCI World Index (Global)', perf1y: 11.34, creator: 'Smith, J.', status: 'Published', editedBy: 'Smith, J.', modified: '27/08/2025', tasks: [{ rowId: 'anto', instrument: 'Antofagasta plc', isin: 'GB0000456144', component: 'HOLT GEM Benchmark – ADR only', inCurrent: 8.5, inNext: 12, current: 0.51, next: 0.72, status: 'Open' }] },
  { id: '014', name: 'Defensive Strategy Portfolio CH', type: 'Customized', alloc: { Bonds: 60, Liquidity: 25, Equity: 15 }, benchmark: 'MSCI World Index (Global)', perf1y: 10.87, creator: 'Inbona, E.', status: 'Published', editedBy: 'Inbona, E.', modified: '02/09/2025', parent: '007', auto: 'invalid', version: 4 },
  { id: '008', name: 'Emerging Markets Portfolio', type: 'Multi', alloc: { Equity: 85, Bonds: 10, Liquidity: 5 }, benchmark: 'Custom', perf1y: 8.56, creator: 'Hobbs, L.', status: 'Published', editedBy: 'Hobbs, L.', modified: '04/08/2025' },
  { id: '009', name: 'Dividend Yield Portfolio', type: 'Multi', alloc: { Equity: 80, Bonds: 15, Liquidity: 5 }, benchmark: 'Custom', perf1y: 15.09, creator: 'Smith, J.', status: 'Published', editedBy: 'Smith, J.', modified: '04/08/2025' },
  { id: '010', name: 'Technology Leaders Portfolio', type: 'Standard', alloc: { Equity: 100 }, benchmark: 'Custom', perf1y: 4.65, creator: 'Inbona, E.', status: 'Published', editedBy: 'Inbona, E.', modified: '04/08/2025' },
  { id: '013', name: 'Systematic Allocation Portfolio Equity', type: 'Standard', alloc: { Equity: 100 }, benchmark: 'S&P 500 (USA)', perf1y: 4.65, creator: 'Inbona, E.', status: 'Published', editedBy: 'Inbona, E.', modified: '06/03/2026' },
]
