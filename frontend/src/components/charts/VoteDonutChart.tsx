"use client";

interface Slice {
  label: string;
  value: number;
  color: string;
}

interface Props {
  yesCount: number;
  noCount: number;
  size?: number;
  strokeWidth?: number;
  showLegend?: boolean;
  className?: string;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

function DonutSlice({
  cx,
  cy,
  r,
  strokeWidth,
  startAngle,
  endAngle,
  color,
}: {
  cx: number;
  cy: number;
  r: number;
  strokeWidth: number;
  startAngle: number;
  endAngle: number;
  color: string;
}) {
  if (endAngle - startAngle >= 359.99) {
    return (
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    );
  }
  return (
    <path
      d={describeArc(cx, cy, r, startAngle, endAngle)}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
  );
}

export default function VoteDonutChart({
  yesCount,
  noCount,
  size = 160,
  strokeWidth = 18,
  showLegend = true,
  className = "",
}: Props) {
  const total = yesCount + noCount;
  const yesPct = total > 0 ? Math.round((yesCount / total) * 100) : 0;
  const noPct = total > 0 ? 100 - yesPct : 0;

  const cx = size / 2;
  const cy = size / 2;
  const r = (size - strokeWidth) / 2 - 2;

  const slices: Slice[] =
    total === 0
      ? [{ label: "No votes", value: 100, color: "var(--color-stellar-muted)" }]
      : [
          { label: "Yes", value: yesPct, color: "var(--color-stellar-yes)" },
          { label: "No", value: noPct, color: "var(--color-stellar-no)" },
        ];

  let cursor = 0;
  const arcs = slices.map((s) => {
    const sweep = (s.value / 100) * 360;
    const start = cursor;
    const end = cursor + sweep;
    cursor = end;
    return { ...s, start, end };
  });

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="var(--color-stellar-border)"
            strokeWidth={strokeWidth}
          />
          {arcs.map((a) => (
            <DonutSlice
              key={a.label}
              cx={cx}
              cy={cy}
              r={r}
              strokeWidth={strokeWidth}
              startAngle={a.start}
              endAngle={a.end}
              color={a.color}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span
            className={`font-bold text-white tabular-nums ${size < 56 ? "text-sm" : "text-2xl"}`}
          >
            {total}
          </span>
          {size >= 56 && (
            <span className="text-[10px] uppercase tracking-widest text-stellar-muted">
              votes
            </span>
          )}
        </div>
      </div>

      {showLegend && (
        <div className="flex items-center gap-5 text-xs">
          {total > 0 ? (
            <>
              <LegendDot color="var(--color-stellar-yes)" label="Yes" pct={yesPct} />
              <LegendDot color="var(--color-stellar-no)" label="No" pct={noPct} />
            </>
          ) : (
            <span className="text-stellar-muted">Awaiting first vote</span>
          )}
        </div>
      )}
    </div>
  );
}

function LegendDot({
  color,
  label,
  pct,
}: {
  color: string;
  label: string;
  pct: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="w-2.5 h-2.5 rounded-full shrink-0"
        style={{ backgroundColor: color }}
      />
      <span className="text-stellar-muted">
        {label}{" "}
        <span className="text-white font-semibold tabular-nums">{pct}%</span>
      </span>
    </div>
  );
}

/** Compact inline donut for table rows */
export function VoteDonutMini({ yesCount, noCount }: { yesCount: number; noCount: number }) {
  return (
    <VoteDonutChart
      yesCount={yesCount}
      noCount={noCount}
      size={44}
      strokeWidth={6}
      showLegend={false}
    />
  );
}
