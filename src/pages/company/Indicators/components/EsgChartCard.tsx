type EsgChartCardProps = {
  data: number[];
  labels: string[];
  legend: string;
  title: string;
};

export function EsgChartCard({
  data,
  labels,
  legend,
  title,
}: EsgChartCardProps) {
  const width = 500;
  const height = 180;
  const paddingLeft = 30;
  const paddingRight = 30;
  const paddingTop = 25;
  const paddingBottom = 35;

  const validData = data.length > 0 ? data : [0];
  const minVal = Math.min(...validData);
  const maxVal = Math.max(...validData);
  const range = maxVal - minVal || 1;

  // Add 15% breathing room top and bottom
  const plotMin = minVal - range * 0.15;
  const plotMax = maxVal + range * 0.15;
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

  const gridYLevels = [0.2, 0.5, 0.8].map(
    (frac) => paddingTop + frac * plotHeight
  );

  return (
    <div
      aria-label={title}
      className="flex flex-col justify-between rounded-xl border border-border bg-surface p-6 shadow-control"
      data-testid={`esg-chart-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
      role="region"
    >
      <h2 className="m-0 text-base font-bold text-text-primary">{title}</h2>

      <div className="relative my-2 w-full">
        <svg
          aria-hidden="true"
          className="h-44 w-full overflow-visible"
          preserveAspectRatio="none"
          viewBox={`0 0 ${width} ${height}`}
        >
          {/* Dashed horizontal grid lines */}
          {gridYLevels.map((gy, i) => (
            <line
              key={i}
              stroke="#e2e8f0"
              strokeDasharray="4 4"
              strokeWidth="1"
              x1={paddingLeft - 10}
              x2={width - paddingRight + 10}
              y1={gy}
              y2={gy}
            />
          ))}

          {/* Connected trend line */}
          <polyline
            fill="none"
            points={polylinePoints}
            stroke="#10b981"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
          />

          {/* Data point markers */}
          {points.map((p, idx) => (
            <circle
              cx={p.x}
              cy={p.y}
              fill="#ffffff"
              key={idx}
              r="4.5"
              stroke="#10b981"
              strokeWidth="2.5"
            />
          ))}

          {/* Month labels on X axis */}
          {labels.map((label, idx) => {
            const x =
              labels.length > 1
                ? paddingLeft + (idx / (labels.length - 1)) * plotWidth
                : paddingLeft + plotWidth / 2;
            return (
              <text
                className="fill-text-secondary text-[11px] font-semibold"
                key={idx}
                textAnchor="middle"
                x={x}
                y={height - 8}
              >
                {label}
              </text>
            );
          })}
        </svg>
      </div>

      <div className="mt-2 flex items-center justify-center gap-2 pt-2 text-xs font-medium text-text-secondary">
        <span
          aria-hidden="true"
          className="h-[3px] w-4 rounded-full bg-primary"
        />
        <span>{legend}</span>
      </div>
    </div>
  );
}
