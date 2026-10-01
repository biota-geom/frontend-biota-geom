import type { LicenseConditionsCompliance } from '../../../../features/licenseConditions/types';

interface ComplianceProgressBarProps {
  compliance: LicenseConditionsCompliance;
}

function clampPercentage(value: number) {
  return Math.min(100, Math.max(0, value));
}

export function ComplianceProgressBar({
  compliance,
}: ComplianceProgressBarProps) {
  const percentage = clampPercentage(compliance.compliancePercentage);

  return (
    <section
      aria-label="Conformidade Geral"
      className="rounded-panel mb-6 flex items-center justify-between gap-6 border border-border bg-surface p-6 shadow-control max-[640px]:flex-col max-[640px]:items-start"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h2 className="text-base font-bold text-text-primary">
          Conformidade Geral
        </h2>
        <p className="text-sm text-text-secondary">
          {compliance.inCompliance} de {compliance.totalActive} condicionantes
          em dia
        </p>
        <div
          aria-label="Percentual de conformidade geral"
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={percentage}
          className="mt-2 h-2 w-full max-w-sm overflow-hidden rounded-full bg-slate-100"
          role="progressbar"
        >
          <div
            className="h-full rounded-full bg-emerald-500 transition-[width] duration-500"
            data-testid="compliance-progress-fill"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
      <p className="shrink-0 text-5xl font-bold text-text-primary">
        {percentage}%
      </p>
    </section>
  );
}
