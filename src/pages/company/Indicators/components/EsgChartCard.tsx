type EsgChartCardProps = {
  data: number[];
  labels: string[];
  legend: string;
  title: string;
  unit?: string;
};

export function EsgChartCard({
  data,
  labels,
  legend,
  title,
  unit = '',
}: EsgChartCardProps) {
  // Nothing recorded in the window: say so instead of drawing a fake point.
  if (data.length === 0) {
    return (
      <div
        aria-label={title}
        className="flex flex-col justify-between rounded-xl border border-border bg-surface p-6 shadow-control sm:p-7"
        role="region"
      >
        <h2 className="m-0 text-base font-bold text-text-primary">{title}</h2>
        <p className="my-16 text-center text-sm text-text-secondary">
          Sem registros nos últimos 6 meses.
        </p>
        <div className="mt-3 flex items-center justify-center gap-2 pt-1 text-xs font-semibold text-text-secondary">
          <span
            aria-hidden="true"
            className="h-[3px] w-5 rounded-full bg-primary"
          />
          <span>{legend}</span>
        </div>
      </div>
    );
  }

  // High-definition coordinate space
  const width = 800;
  const height = 240;
  const paddingLeft = 40;
  const paddingRight = 40;
  const paddingTop = 30;
  const paddingBottom = 45;

  const validData = data.length > 0 ? data : [0];
  const minVal = Math.min(...validData);
  const maxVal = Math.max(...validData);
  const range = maxVal - minVal || 1;

  // Add 18% breathing room top and bottom for smooth visual balance
  const plotMin = minVal - range * 0.18;
  const plotMax = maxVal + range * 0.18;
  const plotRange = plotMax - plotMin || 1;

  const plotWidth = width - paddingLeft - paddingRight;
  const plotHeight = height - paddingTop - paddingBottom;

  const points = validData.map((val, idx) => {
    const x =
      labels.length > 1
        ? paddingLeft + (idx / (labels.length - 1)) * plotWidth
        : paddingLeft + plotWidth / 2;
    const y = paddingTop + (1 - (val - plotMin) / plotRange) * plotHeight;
    return { x, y, val };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');

  // 4 evenly spaced horizontal dashed reference lines
  const gridYLevels = [0.15, 0.42, 0.69, 0.95].map(
    (frac) => paddingTop + frac * plotHeight
  );

  return (
    <div
      aria-label={title}
      className="flex flex-col justify-between rounded-xl border border-border bg-surface p-6 shadow-control sm:p-7"
      data-testid={`esg-chart-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
      role="region"
    >
      <h2 className="m-0 text-base font-bold text-text-primary">{title}</h2>

      <div className="relative my-3 w-full">
        <svg
          aria-hidden="true"
          className="h-52 w-full sm:h-60"
          preserveAspectRatio="xMidYMid meet"
          shapeRendering="geometricPrecision"
          textRendering="geometricPrecision"
          viewBox={`0 0 ${width} ${height}`}
        >
          {/* Subtle dashed horizontal grid lines */}
          {gridYLevels.map((gy, i) => (
            <line
              key={i}
              stroke="#e5e7eb"
              strokeDasharray="4 4"
              strokeWidth="1.2"
              x1={paddingLeft - 10}
              x2={width - paddingRight + 10}
              y1={gy}
              y2={gy}
            />
          ))}

          {/* Connected trend line with anti-aliased rounded joins */}
          <polyline
            fill="none"
            points={polylinePoints}
            stroke="#10b981"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3"
          />

          {/* High-resolution circular data point markers */}
          {points.map((p, idx) => (
            <circle
              cx={p.x}
              cy={p.y}
              fill="#ffffff"
              key={idx}
              r="5.5"
              stroke="#10b981"
              strokeWidth="3"
            >
              <title>{`${labels[idx]}: ${p.val.toLocaleString('pt-BR')} ${unit}`}</title>
            </circle>
          ))}

          {/* Month labels on X axis */}
          {labels.map((label, idx) => {
            const x =
              labels.length > 1
                ? paddingLeft + (idx / (labels.length - 1)) * plotWidth
                : paddingLeft + plotWidth / 2;
            return (
              <text
                className="select-none fill-text-secondary text-[13px] font-semibold"
                key={idx}
                textAnchor="middle"
                x={x}
                y={height - 12}
              >
                {label}
              </text>
            );
          })}
        </svg>
      </div>

      <div className="mt-3 flex items-center justify-center gap-2 pt-1 text-xs font-semibold text-text-secondary">
        <span
          aria-hidden="true"
          className="h-[3px] w-5 rounded-full bg-primary"
        />
        <span>{legend}</span>
      </div>
    </div>
  );
}
