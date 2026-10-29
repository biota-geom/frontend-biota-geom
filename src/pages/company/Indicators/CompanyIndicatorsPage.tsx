import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import { EsgKpiGrid } from '../../../components/esg/EsgKpiGrid';
import { SuccessToast } from '../../../components/feedback/SuccessToast';
import { PageScaffold } from '../../../components/layout/PageScaffold';
import {
  formatMonthLabel,
  getPreviousMonth,
} from '../../../features/esgIndicators/esgIndicatorsValidation';
import { useEsgHistory } from '../../../features/esgIndicators/useEsgHistory';
import { useEsgIndicators } from '../../../features/esgIndicators/useEsgIndicators';
import { useEsgIndicatorsSummary } from '../../../features/esgIndicators/useEsgIndicatorsSummary';
import { useCompanyBreadcrumbs } from '../useCompanyBreadcrumbs';
import { EsgChartsGrid } from './components/EsgChartsGrid';
import { GenerateReportModal } from './components/GenerateReportModal';
import { NewEsgIndicatorModal } from './components/NewEsgIndicatorModal';

export function CompanyIndicatorsPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const breadcrumbs = useCompanyBreadcrumbs('Indicadores ESG');
  const [month, setMonth] = useState(() => getPreviousMonth());
  // Undefined until the user picks a month: the KPIs start at the latest one.
  const [summaryMonth, setSummaryMonth] = useState<string>();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [isNewRecordOpen, setIsNewRecordOpen] = useState(false);
  const [isGenerateReportOpen, setIsGenerateReportOpen] = useState(false);

  // Indicators loaded from the backend
  const { error, indicators, reload, status } = useEsgIndicators(
    companyId,
    month
  );

  const {
    error: summaryError,
    reload: reloadSummary,
    summary,
  } = useEsgIndicatorsSummary(companyId, summaryMonth);

  // Chart lines per indicator: the selected month plus the 5 before it
  const series = useEsgHistory(companyId, month, indicators);

  const dismissToast = useCallback(() => setToastMessage(null), []);

  const handleSaved = useCallback(
    (savedMonth: string) => {
      setMonth(savedMonth);
      setSummaryMonth(savedMonth);
      reload();
      reloadSummary();
      setToastMessage(
        `Indicadores de ${formatMonthLabel(savedMonth)} salvos com sucesso.`
      );
    },
    [reload, reloadSummary]
  );

  const handleReportGenerated = useCallback(
    (reportMonth: string) => {
      setMonth(reportMonth);
      setSummaryMonth(reportMonth);
      reload();
      setToastMessage(
        `Relatório de ${formatMonthLabel(reportMonth)} gerado com sucesso.`
      );
    },
    [reload]
  );

  return (
    <PageScaffold
      actions={[
        {
          label: 'Novo Registro',
          icon: 'plus',
          onClick: () => setIsNewRecordOpen(true),
        },
        {
          label: 'Gerar Relatório',
          icon: 'none',
          onClick: () => setIsGenerateReportOpen(true),
        },
      ]}
      breadcrumbs={breadcrumbs}
      subtitle="Métricas de desempenho ambiental, social e de sustentabilidade corporativa."
      title="Indicadores ESG"
    >
      {/* Loading state indicator */}
      {status === 'loading' && (
        <div
          aria-live="polite"
          className="mb-4 text-sm text-text-secondary"
          role="status"
        >
          Carregando indicadores...
        </div>
      )}

      {/* Error state banner */}
      {status === 'error' && (
        <div
          className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-panel border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          role="alert"
        >
          <span>{error || 'Não foi possível carregar os indicadores.'}</span>
          <button
            className="cursor-pointer font-bold underline"
            onClick={reload}
            type="button"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* KPI cards with the change against the previous month */}
      {summaryError && (
        <p className="mb-3 text-sm text-red-700" role="alert">
          {summaryError}
        </p>
      )}
      <EsgKpiGrid summary={summary} />

      {/* 2x2 Line Charts Grid */}
      <EsgChartsGrid indicators={indicators} series={series} />

      {/* New Indicator Record Modal (PUT upsert + inline creation) */}
      {companyId && (
        <NewEsgIndicatorModal
          companyId={companyId}
          initialMonth={month}
          onIndicatorCreated={() => {
            reload();
            reloadSummary();
          }}
          onOpenChange={setIsNewRecordOpen}
          onSaved={handleSaved}
          open={isNewRecordOpen}
          savedIndicators={indicators}
        />
      )}

      {/* Generate Report Modal (GET monthly fetch) */}
      {companyId && (
        <GenerateReportModal
          companyId={companyId}
          initialMonth={month}
          onGenerated={handleReportGenerated}
          onOpenChange={setIsGenerateReportOpen}
          open={isGenerateReportOpen}
        />
      )}

      {/* Success feedback toast */}
      {toastMessage && (
        <SuccessToast message={toastMessage} onDismiss={dismissToast} />
      )}
    </PageScaffold>
  );
}
