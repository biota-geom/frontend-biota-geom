import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import { SuccessToast } from '../../../components/feedback/SuccessToast';
import { PageScaffold } from '../../../components/layout/PageScaffold';
import {
  formatMonthLabel,
  getPreviousMonth,
} from '../../../features/esgIndicators/esgIndicatorsValidation';
import { useEsgIndicators } from '../../../features/esgIndicators/useEsgIndicators';
import { useCompanyBreadcrumbs } from '../useCompanyBreadcrumbs';
import { EsgChartsGrid } from './components/EsgChartsGrid';
import { EsgSummaryCards } from './components/EsgSummaryCards';
import { GenerateReportModal } from './components/GenerateReportModal';
import { NewEsgIndicatorModal } from './components/NewEsgIndicatorModal';

export function CompanyIndicatorsPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const breadcrumbs = useCompanyBreadcrumbs('Indicadores ESG');
  const [month, setMonth] = useState(() => getPreviousMonth());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [isNewRecordOpen, setIsNewRecordOpen] = useState(false);
  const [isGenerateReportOpen, setIsGenerateReportOpen] = useState(false);

  // Indicators loaded from the backend
  const { error, indicators, reload, status } = useEsgIndicators(
    companyId,
    month
  );

  const dismissToast = useCallback(() => setToastMessage(null), []);

  const handleSaved = useCallback(
    (savedMonth: string) => {
      setMonth(savedMonth);
      reload();
      setToastMessage(
        `Indicadores de ${formatMonthLabel(savedMonth)} salvos com sucesso.`
      );
    },
    [reload]
  );

  const handleReportGenerated = useCallback(
    (reportMonth: string) => {
      setMonth(reportMonth);
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

      {/* Summary KPI Cards */}
      <EsgSummaryCards indicators={indicators} />

      {/* 2x2 Line Charts Grid */}
      <EsgChartsGrid indicators={indicators} />

      {/* New Indicator Record Modal (PUT upsert) */}
      {companyId && (
        <NewEsgIndicatorModal
          companyId={companyId}
          initialMonth={month}
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
