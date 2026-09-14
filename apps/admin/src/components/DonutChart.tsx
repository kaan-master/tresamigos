interface Segment {
  id?: string;
  label: string;
  value: number;
  color: string;
}

export interface ChartDatum {
  id?: string;
  label: string;
  value: number;
  color?: string;
}

const CHART_COLORS = ["#fcb92a", "#0056d7", "#1f7a45", "#c0392b", "#8e44ad", "#e67e22", "#16a085", "#2c3e50"];

export function chartColors(count: number) {
  return Array.from({ length: count }, (_, index) => CHART_COLORS[index % CHART_COLORS.length]);
}

function formatChartValue(value: number) {
  if (Number.isInteger(value)) return String(value);
  return String(Math.round(value * 100) / 100).replace(".", ",");
}

export function DonutChart({
  segments,
  size = 180,
  centerLabel = "TOTAAL",
  onSelect
}: {
  segments: Segment[];
  size?: number;
  centerLabel?: string;
  onSelect?: (segment: Segment) => void;
}) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0) || 1;
  const radius = 54;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const clickable = Boolean(onSelect);

  return (
    <div className="ta-donut">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={center} cy={center} r={radius} fill="none" stroke="rgba(31,22,11,0.08)" strokeWidth={18} />
        {segments.map((segment, index) => {
          if (!segment.value) return null;
          const portion = segment.value / total;
          const dash = portion * circumference;
          const gap = circumference - dash;
          const rotation =
            segments.slice(0, index).reduce((sum, current) => sum + current.value / total, 0) * 360 - 90;

          return (
            <circle
              key={segment.id || segment.label}
              className={clickable ? "ta-donut-slice is-clickable" : "ta-donut-slice"}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth={18}
              strokeDasharray={`${dash} ${gap}`}
              transform={`rotate(${rotation} ${center} ${center})`}
              onClick={clickable ? () => onSelect?.(segment) : undefined}
            >
              <title>{segment.label}</title>
            </circle>
          );
        })}
        <text x={center} y={center - 4} textAnchor="middle" fontSize={24} fontWeight={800} fill="#1f160b">
          {formatChartValue(segments.reduce((sum, segment) => sum + segment.value, 0))}
        </text>
        <text x={center} y={center + 14} textAnchor="middle" fontSize={9} fontWeight={700} fill="rgba(31,22,11,0.45)" letterSpacing="1.2">
          {centerLabel}
        </text>
      </svg>

      <div className="ta-donut-legend">
        {segments.map((segment) => {
          const row = (
            <>
              <span className="ta-donut-swatch" style={{ background: segment.color }} />
              <span className="ta-donut-label">{segment.label}</span>
              <strong>{formatChartValue(segment.value)}</strong>
            </>
          );
          return clickable ? (
            <button
              type="button"
              className="ta-donut-legend-row is-clickable"
              key={segment.id || segment.label}
              onClick={() => onSelect?.(segment)}
            >
              {row}
            </button>
          ) : (
            <div className="ta-donut-legend-row" key={segment.id || segment.label}>
              {row}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function BarChart({
  data,
  color = "#fcb92a",
  onSelect
}: {
  data: ChartDatum[];
  color?: string;
  onSelect?: (item: ChartDatum) => void;
}) {
  const max = Math.max(...data.map((item) => item.value), 1);
  const clickable = Boolean(onSelect);

  return (
    <div className="ta-bar-chart">
      {data.map((item) => {
        const inner = (
          <>
            <span className="ta-bar-chart-value">{item.value > 0 ? formatChartValue(item.value) : ""}</span>
            <div className="ta-bar-chart-track">
              <div
                className="ta-bar-chart-fill"
                style={{
                  height: `${Math.max((item.value / max) * 100, item.value > 0 ? 8 : 2)}%`,
                  background: item.value > 0 ? item.color || color : "rgba(31,22,11,0.08)"
                }}
              />
            </div>
            <span className="ta-bar-chart-label">{item.label}</span>
          </>
        );
        return clickable ? (
          <button
            type="button"
            className="ta-bar-chart-item is-clickable"
            key={item.id || item.label}
            title={item.id || item.label}
            onClick={() => onSelect?.(item)}
          >
            {inner}
          </button>
        ) : (
          <div className="ta-bar-chart-item" key={item.id || item.label}>
            {inner}
          </div>
        );
      })}
    </div>
  );
}

export function HBarChart({
  data,
  color = "#fcb92a",
  onSelect
}: {
  data: ChartDatum[];
  color?: string;
  onSelect?: (item: ChartDatum) => void;
}) {
  const max = Math.max(...data.map((item) => item.value), 1);
  const clickable = Boolean(onSelect);

  if (!data.length) return <p className="entra-empty">Nog geen aantallen.</p>;

  return (
    <div className="ta-hbar-chart">
      {data.map((item) => {
        const inner = (
          <>
            <span className="ta-hbar-label">{item.label}</span>
            <div className="ta-hbar-track">
              <div
                className="ta-hbar-fill"
                style={{
                  width: `${Math.max((item.value / max) * 100, item.value > 0 ? 6 : 0)}%`,
                  background: item.color || color
                }}
              />
            </div>
            <strong>{formatChartValue(item.value)}</strong>
          </>
        );
        return clickable ? (
          <button type="button" className="ta-hbar-row is-clickable" key={item.id || item.label} onClick={() => onSelect?.(item)}>
            {inner}
          </button>
        ) : (
          <div className="ta-hbar-row" key={item.id || item.label}>
            {inner}
          </div>
        );
      })}
    </div>
  );
}
