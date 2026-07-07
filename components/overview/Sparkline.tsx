/*
 * A tiny inline sparkline: one path, no axes, no labels. Used on the home
 * cards to show the shape of each agent's learning curve at a glance. The full
 * plotted chart lives in the Learning view; this is deliberately minimal.
 */

export function Sparkline({
  points,
  width = 132,
  height = 34,
  token = "--blue",
}: {
  points: number[];
  width?: number;
  height?: number;
  token?: string;
}) {
  if (points.length < 2) {
    return null;
  }
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const dx = width / (points.length - 1);
  const d = points
    .map((p, i) => {
      const x = i * dx;
      const y = height - ((p - min) / span) * (height - 2) - 1;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      className="sparkline"
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      role="img"
      aria-label="learning curve trend"
      preserveAspectRatio="none"
    >
      <path d={d} fill="none" stroke={`var(${token})`} strokeWidth={1.5} strokeLinejoin="round" />
    </svg>
  );
}
