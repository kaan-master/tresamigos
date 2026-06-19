interface Segment {
  label: string;
  value: number;
  color: string;
}

const CHART_COLORS = ["#fcb92a", "#0056d7", "#1f7a45", "#c0392b", "#8e44ad", "#e67e22", "#16a085", "#2c3e50"];

export function chartColors(count: number) {
  return Array.from({ length: count }, (_, index) => CHART_COLORS[index % CHART_COLORS.length]);
}

export function DonutChart({
  segments,
  size = 180,
  centerLabel = "TOTAAL"
}: {
  segments: Segment[];
  size?: number;
  centerLabel?: string;
}) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0) || 1;
  const radius = 54;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

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
              key={segment.label}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth={18}
              strokeDasharray={`${dash} ${gap}`}
              transform={`rotate(${rotation} ${center} ${center})`}
            />
          );
        })}
        <text x={center} y={center - 4} textAnchor="middle" fontSize={24} fontWeight={800} fill="#1f160b">
          {total}
        </text>
        <text x={center} y={center + 14} textAnchor="middle" fontSize={9} fontWeight={700} fill="rgba(31,22,11,0.45)" letterSpacing="1.2">
          {centerLabel}
        </text>
      </svg>

      <div className="ta-donut-legend">
        {segments.map((segment) => (
          <div className="ta-donut-legend-row" key={segment.label}>
            <span className="ta-donut-swatch" style={{ background: segment.color }} />
            <span className="ta-donut-label">{segment.label}</span>
            <strong>{segment.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BarChart({
  data,
  color = "#fcb92a"
}: {
  data: { label: string; value: number }[];
  color?: string;
}) {
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="ta-bar-chart">
      {data.map((item) => (
        <div className="ta-bar-chart-item" key={item.label}>
          <span className="ta-bar-chart-value">{item.value > 0 ? item.value : ""}</span>
          <div className="ta-bar-chart-track">
            <div
              className="ta-bar-chart-fill"
              style={{
                height: `${Math.max((item.value / max) * 100, item.value > 0 ? 8 : 2)}%`,
                background: item.value > 0 ? color : "rgba(31,22,11,0.08)"
              }}
            />
          </div>
          <span className="ta-bar-chart-label">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
