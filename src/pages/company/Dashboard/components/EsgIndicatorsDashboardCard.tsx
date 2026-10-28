import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/shadcn/button';
import {
  Card,
  CardAction,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import { buildCompanyRoutes } from '../../../../app/router/routes';
import { EsgKpiGrid } from '../../../../components/esg/EsgKpiGrid';
import { useEsgIndicatorsSummary } from '../../../../features/esgIndicators/useEsgIndicatorsSummary';

type EsgIndicatorsDashboardCardProps = {
  companyId: string;
};

/*
 * Reads the same summary as the Indicators page opens with (no month: the
 * latest one with a record), so both screens always show the same values.
 */
export function EsgIndicatorsDashboardCard({
  companyId,
}: EsgIndicatorsDashboardCardProps) {
  const { error, reload, status, summary } = useEsgIndicatorsSummary(companyId);
  const hasRecords =
    summary !== null &&
    summary.reference_month !== null &&
    summary.indicators.length > 0;

  return (
    <Card aria-label="Indicadores ESG" variant="dashboard">
      <CardHeader variant="dashboard">
        <CardTitle variant="dashboard">Indicadores ESG</CardTitle>
        <CardAction variant="dashboard">
          <Link
            className="inline-flex items-center gap-1 text-xs font-bold text-primary-strong no-underline hover:underline"
            to={buildCompanyRoutes.indicators(companyId)}
          >
            Registrar indicadores <span aria-hidden="true">→</span>
          </Link>
        </CardAction>
      </CardHeader>

      {status === 'loading' ? (
        <p className="m-0 text-sm text-text-secondary" role="status">
          Carregando indicadores ESG...
        </p>
      ) : null}

      {status === 'error' ? (
        <div
          className="rounded-panel flex flex-wrap items-center justify-between gap-4 border border-red-200 bg-red-50 p-4 text-sm text-red-600"
          role="alert"
        >
          <p className="m-0">{error}</p>
          <Button onClick={reload} type="button" variant="action">
            Tentar novamente
          </Button>
        </div>
      ) : null}

      {status === 'success' && !hasRecords ? (
        <p className="m-0 text-sm text-text-secondary">
          Nenhum indicador registrado.
        </p>
      ) : null}

      {status === 'success' && hasRecords ? (
        <EsgKpiGrid summary={summary} variant="dashboard" />
      ) : null}
    </Card>
  );
}
