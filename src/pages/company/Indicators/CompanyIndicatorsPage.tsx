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
import { EsgIndicatorsForm } from './components/EsgIndicatorsForm';

export function CompanyIndicatorsPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const breadcrumbs = useCompanyBreadcrumbs('Indicadores ESG');
  const [month, setMonth] = useState(() => getPreviousMonth());
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const { error, indicators, reload, status } = useEsgIndicators(
    companyId,
    month
  );

  const dismissToast = useCallback(() => setToastMessage(null), []);

  return (
    <PageScaffold
      breadcrumbs={breadcrumbs}
      subtitle="Informe mensalmente os indicadores de desempenho ambiental e social da empresa."
      title="Indicadores ESG"
    >
      {companyId ? (
        <EsgIndicatorsForm
          companyId={companyId}
          loadError={error}
          loadStatus={status}
          month={month}
          onMonthChange={setMonth}
          onReload={reload}
          onSaved={(savedMonth) =>
            setToastMessage(
              `Indicadores de ${formatMonthLabel(savedMonth)} salvos com sucesso.`
            )
          }
          savedIndicators={indicators}
        />
      ) : null}

      {toastMessage ? (
        <SuccessToast message={toastMessage} onDismiss={dismissToast} />
      ) : null}
    </PageScaffold>
  );
}
