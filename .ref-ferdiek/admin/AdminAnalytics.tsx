import { useEffect, useMemo, useState } from 'react'
import { FiEye, FiClock, FiShoppingBag, FiTrendingUp, FiUsers, FiPackage } from 'react-icons/fi'
import {
  apiAdminAnalytics,
  type ApiAdminAnalytics as ApiAdminAnalyticsPayload,
  type ApiAdminAnalyticsSegment,
} from '../api'
import { formatPrice } from '../catalog'

// ── Donut chart ───────────────────────────────────────────────────────────────
export function DonutChart({
  segments,
  size = 160,
  compact = false,
}: {
  segments: { label: string; value: number; color: string }[]
  size?: number
  compact?: boolean
}) {
  const total = segments.reduce((s, d) => s + d.value, 0) || 1
  const r = compact ? 46 : 52
  const cx = size / 2
  const cy = size / 2
  const circ = 2 * Math.PI * r

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: compact ? 18 : 28, flexWrap: 'wrap' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
        {/* background ring */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(90,70,58,0.1)" strokeWidth={compact ? 14 : 18} />
        {segments.map((seg, index) => {
          const pct = seg.value / total
          const dash = pct * circ
          const gap = circ - dash
          const cumulative = segments.slice(0, index).reduce((sum, current) => sum + current.value / total, 0)
          const rotation = cumulative * 360 - 90
          if (seg.value === 0) return null
          return (
            <circle
              key={seg.label}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={compact ? 14 : 18}
              strokeDasharray={`${dash} ${gap}`}
              strokeLinecap="butt"
              transform={`rotate(${rotation} ${cx} ${cy})`}
              style={{ transition: 'stroke-dasharray 800ms cubic-bezier(0.22,1,0.36,1)' }}
            />
          )
        })}
        {/* center text */}
        <text x={cx} y={cy - (compact ? 5 : 6)} textAnchor="middle" fontSize={compact ? 18 : 22} fontWeight={600} fill="#2b1f1a">{total}</text>
        <text x={cx} y={cy + (compact ? 10 : 12)} textAnchor="middle" fontSize={compact ? 8 : 9} fill="rgba(43,31,26,0.5)" letterSpacing="1">TOTAAL</text>
      </svg>
      <div style={{ display: 'grid', gap: compact ? 6 : 10 }}>
        {segments.map((seg) => (
          <div key={seg.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: seg.color, flexShrink: 0, display: 'block' }} />
            <span style={{ fontSize: compact ? 12 : 13, color: 'rgba(43,31,26,0.65)' }}>{seg.label}</span>
            <strong style={{ fontSize: compact ? 12 : 13, color: '#2b1f1a', marginLeft: 'auto', paddingLeft: 16 }}>{seg.value}</strong>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Bar chart ─────────────────────────────────────────────────────────────────
export function BarChart({
  data,
  color = '#c6a77a',
  height = 120,
  valueLabel,
}: {
  data: { label: string; value: number }[]
  color?: string
  height?: number
  valueLabel?: (value: number) => string
}) {
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: height + 40, paddingTop: 8 }}>
      {data.map((d) => (
        <div key={d.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
          <span style={{ fontSize: 11, color: 'rgba(43,31,26,0.5)', fontWeight: 600, minHeight: 16 }}>{d.value > 0 ? valueLabel?.(d.value) ?? d.value : ''}</span>
          <div style={{ width: '100%', position: 'relative' }}>
            <div
              style={{
                width: '100%',
                height: `${Math.max((d.value / max) * height, d.value > 0 ? 6 : 2)}px`,
                background: d.value > 0 ? color : 'rgba(90,70,58,0.1)',
                borderRadius: '3px 3px 0 0',
                transition: 'height 700ms cubic-bezier(0.22,1,0.36,1)',
              }}
            />
          </div>
          <span style={{ fontSize: 11, color: 'rgba(43,31,26,0.45)', whiteSpace: 'nowrap' }}>{d.label}</span>
        </div>
      ))}
    </div>
  )
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
export function KpiCard({
  icon,
  label,
  value,
  sub,
  accent = false,
  compact = false,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  sub?: string
  accent?: boolean
  compact?: boolean
}) {
  return (
    <div style={{
      background: accent ? '#2b1f1a' : '#FEF6EB',
      border: `1px solid ${accent ? '#5A463A' : 'rgba(90,70,58,0.14)'}`,
      borderRadius: 4,
      padding: compact ? '14px 16px' : '22px 24px',
      display: 'grid',
      gap: compact ? 8 : 14,
      minWidth: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: compact ? 10 : 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: accent ? 'rgba(254,246,235,0.55)' : 'rgba(43,31,26,0.45)' }}>{label}</span>
        <span style={{ color: accent ? '#c6a77a' : 'rgba(43,31,26,0.3)', fontSize: compact ? 16 : 18 }}>{icon}</span>
      </div>
      <strong style={{ fontSize: compact ? 28 : 38, fontWeight: 600, color: accent ? '#FEF6EB' : '#2b1f1a', lineHeight: 1, fontFamily: "'Iowan Old Style','Times New Roman',Georgia,serif" }}>
        {value}
      </strong>
      {sub && <span style={{ fontSize: compact ? 12 : 13, color: accent ? 'rgba(254,246,235,0.5)' : 'rgba(43,31,26,0.5)' }}>{sub}</span>}
    </div>
  )
}

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({ children, style, noPad, compact }: { children: React.ReactNode; style?: React.CSSProperties; noPad?: boolean; compact?: boolean }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid rgba(90,70,58,0.12)',
      borderRadius: 4,
      padding: noPad ? 0 : compact ? 14 : 24,
      overflow: noPad ? 'hidden' : undefined,
      ...style,
    }}>
      {children}
    </div>
  )
}

// ── Section heading ───────────────────────────────────────────────────────────
function Section({ title, children, compact }: { title: string; children: React.ReactNode; compact?: boolean }) {
  return (
    <div style={{ display: 'grid', gap: compact ? 8 : 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ display: 'block', width: 3, height: compact ? 14 : 16, background: '#c6a77a', borderRadius: 1, flexShrink: 0 }} />
        <h2 style={{ margin: 0, fontSize: compact ? 10 : 11, fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(43,31,26,0.5)' }}>
          {title}
        </h2>
      </div>
      {children}
    </div>
  )
}

// ── Table ─────────────────────────────────────────────────────────────────────
function DataTable({
  headers,
  rows,
  empty = 'Geen data beschikbaar',
  maxRows = 8,
}: {
  headers: string[]
  rows: React.ReactNode[][]
  empty?: string
  maxRows?: number
}) {
  const [showAll, setShowAll] = useState(false)
  const visible = showAll ? rows : rows.slice(0, maxRows)
  return (
    <Card noPad>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f8f3ec' }}>
            {headers.map((h) => (
              <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(43,31,26,0.45)', borderBottom: '1px solid rgba(90,70,58,0.1)', fontWeight: 500 }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={headers.length} style={{ padding: 28, textAlign: 'center', color: 'rgba(43,31,26,0.4)', fontSize: 14 }}>
                {empty}
              </td>
            </tr>
          ) : (
            visible.map((row, i) => (
              <tr key={i} style={{ borderBottom: i < visible.length - 1 ? '1px solid rgba(90,70,58,0.07)' : 'none' }}>
                {row.map((cell, j) => (
                  <td key={j} style={{ padding: '12px 16px', fontSize: 14, color: '#2b1f1a', verticalAlign: 'middle' }}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
        {rows.length > maxRows ? (
          <tfoot>
            <tr>
              <td
                colSpan={headers.length}
                style={{ padding: '12px 16px', textAlign: 'center', borderTop: '1px solid rgba(90,70,58,0.07)' }}
              >
                <button
                  type="button"
                  onClick={() => setShowAll((v) => !v)}
                  style={{
                    border: '1px solid rgba(90,70,58,0.2)',
                    background: '#fff',
                    color: '#5A463A',
                    padding: '8px 16px',
                    borderRadius: 3,
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                  }}
                >
                  {showAll ? 'Minder tonen' : `Toon alle ${rows.length} rijen`}
                </button>
              </td>
            </tr>
          </tfoot>
        ) : null}
      </table>
    </Card>
  )
}

// ── Badge ─────────────────────────────────────────────────────────────────────
function Badge({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'green' | 'gold' | 'neutral' | 'red' }) {
  const colors = {
    green: { bg: 'rgba(90,70,58,0.1)', color: '#5A463A' },
    gold: { bg: 'rgba(198,167,122,0.15)', color: '#a07840' },
    neutral: { bg: 'rgba(90,70,58,0.07)', color: 'rgba(43,31,26,0.6)' },
    red: { bg: 'rgba(180,50,40,0.08)', color: '#b43228' },
  }
  const { bg, color } = colors[tone]
  return (
    <span style={{ display: 'inline-block', padding: '3px 9px', borderRadius: 3, background: bg, color, fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
      {children}
    </span>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDuration(s: number) {
  if (s < 60) return `${s}s`
  return `${Math.floor(s / 60)}m ${s % 60}s`
}

type RangePreset = 'today' | '7d' | '30d' | 'thisMonth' | 'lastMonth'
type AnalyticsTab = 'overview' | 'duration' | 'products'

function toDateInput(date: Date) {
  return date.toISOString().slice(0, 10)
}

function getRangePreset(preset: RangePreset) {
  const today = new Date()
  const from = new Date(today)
  const to = new Date(today)

  if (preset === '7d') {
    from.setDate(today.getDate() - 6)
  }

  if (preset === '30d') {
    from.setDate(today.getDate() - 29)
  }

  if (preset === 'thisMonth') {
    from.setDate(1)
  }

  if (preset === 'lastMonth') {
    from.setMonth(today.getMonth() - 1, 1)
    to.setDate(0)
  }

  return { from: toDateInput(from), to: toDateInput(to) }
}

function labelStatus(status: string) {
  const labels: Record<string, string> = {
    PENDING_PAYMENT: 'Wacht op betaling',
    PAID: 'Betaald',
    PROCESSING: 'Verwerking',
    SHIPPED: 'Verzonden',
    DELIVERED: 'Geleverd',
    CANCELLED: 'Geannuleerd',
    PENDING: 'Open',
    FAILED: 'Mislukt',
    REFUNDED: 'Terugbetaald',
  }

  return labels[status] ?? status
}

function withSegmentLabels(segments: ApiAdminAnalyticsSegment[], colors: string[]) {
  return segments
    .filter((segment) => segment.value > 0)
    .map((segment, index) => ({
      label: labelStatus(segment.label),
      value: segment.value,
      color: colors[index % colors.length],
    }))
}

function DateRangeControl({
  range,
  onChange,
}: {
  range: { from: string; to: string }
  onChange: (range: { from: string; to: string }) => void
}) {
  const presets: Array<{ key: RangePreset; label: string }> = [
    { key: 'today', label: 'Vandaag' },
    { key: '7d', label: '7 dagen' },
    { key: '30d', label: '30 dagen' },
    { key: 'thisMonth', label: 'Deze maand' },
    { key: 'lastMonth', label: 'Vorige maand' },
  ]

  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {presets.map((preset) => (
          <button
            key={preset.key}
            type="button"
            className="btn btn-secondary"
            style={{ minHeight: 36, paddingInline: 14 }}
            onClick={() => onChange(getRangePreset(preset.key))}
          >
            {preset.label}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="date"
          value={range.from}
          onChange={(event) => onChange({ ...range, from: event.target.value })}
          style={{ minHeight: 36, border: '1px solid rgba(90,70,58,0.18)', borderRadius: 3, paddingInline: 12, background: '#fff' }}
        />
        <span style={{ color: 'rgba(43,31,26,0.45)', fontSize: 13 }}>tot</span>
        <input
          type="date"
          value={range.to}
          onChange={(event) => onChange({ ...range, to: event.target.value })}
          style={{ minHeight: 36, border: '1px solid rgba(90,70,58,0.18)', borderRadius: 3, paddingInline: 12, background: '#fff' }}
        />
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AdminAnalytics({ token }: { token: string }) {
  const [range, setRange] = useState(() => getRangePreset('30d'))
  const [tab, setTab] = useState<AnalyticsTab>('overview')
  const [analytics, setAnalytics] = useState<ApiAdminAnalyticsPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) return
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      try {
        const result = await apiAdminAnalytics(token, range)
        if (!cancelled) {
          setAnalytics(result)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Analytics konden niet worden geladen.')
          setAnalytics(null)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [range, token])

  const tabButtons: Array<{ key: AnalyticsTab; label: string }> = [
    { key: 'overview', label: 'Overzicht' },
    { key: 'duration', label: 'Activiteitenduur' },
    { key: 'products', label: 'Producten' },
  ]

  const chartData = useMemo(() => {
    if (!analytics) {
      return {
        orderStatus: [],
        paymentStatus: [],
        ordersPerDay: [],
        revenuePerDay: [],
        visitsPerDay: [],
        durationPerDay: [],
      }
    }

    return {
      orderStatus: withSegmentLabels(analytics.orderStatusSegments, ['#5A463A', '#c6a77a', '#2b1f1a', '#8f6f52', 'rgba(43,31,26,0.25)', '#b43228']),
      paymentStatus: withSegmentLabels(analytics.paymentStatusSegments, ['#5A463A', '#c6a77a', '#b43228', 'rgba(43,31,26,0.25)']),
      ordersPerDay: analytics.series.map((point) => ({ label: point.label, value: point.orders })),
      revenuePerDay: analytics.series.map((point) => ({ label: point.label, value: point.revenue })),
      visitsPerDay: analytics.series.map((point) => ({ label: point.label, value: point.pageVisits })),
      durationPerDay: analytics.series.map((point) => ({ label: point.label, value: Math.round(point.durationSeconds / 60) })),
    }
  }, [analytics])

  if (loading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: 320, color: 'rgba(43,31,26,0.45)', fontSize: 14, letterSpacing: '0.06em' }}>
        Analytics laden...
      </div>
    )
  }

  if (error || !analytics) {
    return (
      <div style={{ display: 'grid', gap: 18 }}>
        <DateRangeControl range={range} onChange={setRange} />
        <Card>
          <p style={{ margin: 0, color: '#b43228' }}>{error || 'Geen analytics beschikbaar.'}</p>
        </Card>
      </div>
    )
  }

  const maxPageViews = analytics.topPages[0]?.views || 1
  const maxPageDuration = Math.max(...analytics.topPages.map((page) => page.avgDurationSeconds), 1)

  const compactLayout = tab !== 'products'
  const chartH = compactLayout ? 92 : 130
  const donutSize = compactLayout ? 132 : 170

  return (
    <div style={{ display: 'grid', gap: compactLayout ? 16 : 36 }}>
      <DateRangeControl range={range} onChange={setRange} />

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {tabButtons.map((entry) => (
          <button
            key={entry.key}
            type="button"
            className={`btn ${tab === entry.key ? 'btn-primary' : 'btn-secondary'}`}
            style={{ minHeight: 38, paddingInline: 18 }}
            onClick={() => setTab(entry.key)}
          >
            {entry.label}
          </button>
        ))}
      </div>

      {/* KPI's */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: compactLayout ? 10 : 16 }}>
        <KpiCard compact={compactLayout} icon={<FiTrendingUp />} label="Totale omzet" value={formatPrice(analytics.summary.revenueCents / 100)} sub={`${analytics.summary.paidOrders} betaalde orders`} accent />
        <KpiCard compact={compactLayout} icon={<FiShoppingBag />} label="Alle orders" value={analytics.summary.orders} sub={`Ø ${formatPrice(analytics.summary.avgOrderCents / 100)}`} />
        <KpiCard compact={compactLayout} icon={<FiUsers />} label="Klanten" value={analytics.summary.totalUsers} sub={`${analytics.summary.newUsers} nieuw in selectie`} />
        <KpiCard compact={compactLayout} icon={<FiEye />} label="Paginabezoeken" value={analytics.summary.pageVisits} sub={`Ø ${fmtDuration(analytics.summary.avgDurationSeconds)}`} />
      </div>

      {tab === 'overview' ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: compactLayout ? 12 : 20 }}>
            <Section title="Orders per dag" compact={compactLayout}>
              <Card compact={compactLayout}>
                <BarChart data={chartData.ordersPerDay} color="#c6a77a" height={chartH} />
              </Card>
            </Section>
            <Section title="Omzet per dag (€)" compact={compactLayout}>
              <Card compact={compactLayout}>
                <BarChart data={chartData.revenuePerDay} color="#5A463A" height={chartH} valueLabel={(value) => `€${value}`} />
              </Card>
            </Section>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: compactLayout ? 12 : 20 }}>
            <Section title="Orderstatus" compact={compactLayout}>
              <Card compact={compactLayout}>
                <DonutChart compact={compactLayout} size={donutSize} segments={chartData.orderStatus.length ? chartData.orderStatus : [{ label: 'Geen orders', value: 1, color: 'rgba(90,70,58,0.12)' }]} />
              </Card>
            </Section>
            <Section title="Betaalstatus" compact={compactLayout}>
              <Card compact={compactLayout}>
                <DonutChart compact={compactLayout} size={donutSize} segments={chartData.paymentStatus.length ? chartData.paymentStatus : [{ label: 'Geen betalingen', value: 1, color: 'rgba(90,70,58,0.12)' }]} />
              </Card>
            </Section>
          </div>

          <Section title="Meest bezochte pagina's" compact={compactLayout}>
            <DataTable
              headers={['Pagina', 'Bezoeken', 'Gem. tijd', 'Populariteit']}
              rows={analytics.topPages.slice(0, 8).map((page) => [
                <span style={{ fontFamily: 'monospace', fontSize: 13, color: 'rgba(43,31,26,0.7)' }}>{page.path}</span>,
                <strong>{page.views}</strong>,
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(43,31,26,0.55)' }}><FiClock size={12} /> {fmtDuration(page.avgDurationSeconds)}</span>,
                <div style={{ width: 140, height: 6, borderRadius: 3, background: 'rgba(90,70,58,0.1)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(page.views / maxPageViews) * 100}%`, background: '#c6a77a', borderRadius: 3, transition: 'width 700ms ease' }} />
                </div>,
              ])}
              empty="Nog geen bezoekdata in deze periode"
              maxRows={compactLayout ? 5 : 8}
            />
          </Section>
        </>
      ) : null}

      {tab === 'duration' ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: compactLayout ? 12 : 20 }}>
            <Section title="Bezoeken per dag" compact={compactLayout}>
              <Card compact={compactLayout}>
                <BarChart data={chartData.visitsPerDay} color="#c6a77a" height={chartH} />
              </Card>
            </Section>
            <Section title="Activiteitenduur per dag (min)" compact={compactLayout}>
              <Card compact={compactLayout}>
                <BarChart data={chartData.durationPerDay} color="#5A463A" height={chartH} valueLabel={(value) => `${value}m`} />
              </Card>
            </Section>
          </div>

          <Section title="Activiteitenduur per pagina" compact={compactLayout}>
            <DataTable
              headers={['Pagina', 'Bezoeken', 'Unieke klanten', 'Gem. duur', 'Totale duur']}
              rows={analytics.topPages.map((page) => [
                <div style={{ display: 'grid', gap: 3 }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 13, color: '#2b1f1a' }}>{page.path}</span>
                  {page.pageTitle ? <span style={{ fontSize: 12, color: 'rgba(43,31,26,0.45)' }}>{page.pageTitle}</span> : null}
                </div>,
                <strong>{page.views}</strong>,
                <span>{page.uniqueVisitors}</span>,
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FiClock size={13} /> {fmtDuration(page.avgDurationSeconds)}
                  <span style={{ width: 110, height: 6, borderRadius: 3, background: 'rgba(90,70,58,0.1)', overflow: 'hidden' }}>
                    <span style={{ display: 'block', height: '100%', width: `${(page.avgDurationSeconds / maxPageDuration) * 100}%`, background: '#5A463A' }} />
                  </span>
                </span>,
                <strong>{fmtDuration(page.totalDurationSeconds)}</strong>,
              ])}
              empty="Nog geen activiteitenduur in deze periode"
              maxRows={compactLayout ? 5 : 8}
            />
          </Section>
        </>
      ) : null}

      {tab === 'products' ? (
        <Section title="Producten — bekeken, tijd & verkoop">
          <DataTable
            headers={['Product', 'Bekeken', 'Gem. tijd', 'Verkocht', 'Conversie']}
            rows={analytics.topProducts.map((product) => [
              <strong style={{ color: '#2b1f1a', fontWeight: 500 }}>{product.name}</strong>,
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(43,31,26,0.6)' }}><FiEye size={13} /> {product.views}</span>,
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(43,31,26,0.6)' }}><FiClock size={13} /> {product.avgDurationSeconds ? fmtDuration(product.avgDurationSeconds) : '—'}</span>,
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(43,31,26,0.6)' }}><FiPackage size={13} /> {product.sales}</span>,
              product.conversionPercent ? <Badge tone="green">{product.conversionPercent}%</Badge> : <Badge tone="neutral">—</Badge>,
            ])}
            empty="Nog geen productdata in deze periode"
          />
        </Section>
      ) : null}

    </div>
  )
}
