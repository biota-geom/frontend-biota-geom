interface LicenseSummaryCardProps {
  label: string;
  value: string;
  accent: string;
}

export function LicenseSummaryCard({
  label,
  value,
  accent,
}: LicenseSummaryCardProps) {
  return (
    <article
      className={`rounded-panel border-l-[3px] border-border bg-surface p-5 shadow-control ${accent}`}
    >
      <h2 className="m-0 text-xs font-medium text-text-secondary">{label}</h2>
      <p className="mt-2 mb-0 text-lg leading-tight font-bold text-text-primary">
        {value}
      </p>
    </article>
  );
}
