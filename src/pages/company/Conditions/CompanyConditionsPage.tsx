import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import { SuccessToast } from '../../../components/feedback/SuccessToast';
import { PageScaffold } from '../../../components/layout/PageScaffold';
import type { LicenseConditionStatusFilter } from '../../../features/licenseConditions/types';
import { useConditions } from '../../../features/licenseConditions/useConditions';
import { useConditionsCompliance } from '../../../features/licenseConditions/useConditionsCompliance';
import { useCompanyBreadcrumbs } from '../useCompanyBreadcrumbs';
import { ComplianceProgressBar } from './components/ComplianceProgressBar';
import { ConditionCard } from './components/ConditionCard';
import { ConditionsToolbar } from './components/ConditionsToolbar';
import { NewConditionModal } from './components/NewConditionModal';

export function CompanyConditionsPage() {
  const breadcrumbs = useCompanyBreadcrumbs('Condicionantes');
  const { companyId } = useParams<{ companyId: string }>();
  const [statusFilter, setStatusFilter] =
    useState<LicenseConditionStatusFilter>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const { conditions, error, refetch, status, total } = useConditions(
    companyId,
    statusFilter
  );
  const {
    compliance,
    error: complianceError,
    refetch: refetchCompliance,
  } = useConditionsCompliance(companyId);

  const dismissToast = useCallback(() => setToastMessage(null), []);

  function handleCreated(conditionName: string) {
    setToastMessage(`Condicionante "${conditionName}" cadastrada com sucesso.`);
    refetch();
    refetchCompliance();
  }

  return (
    <PageScaffold
      actions={[
        {
          label: 'Novo Condicionante',
          onClick: () => setIsModalOpen(true),
        },
      ]}
      breadcrumbs={breadcrumbs}
      subtitle="Acompanhamento de condicionantes e prazos regulatórios."
      title="Monitor de Gestão Ambiental"
    >
      {compliance ? <ComplianceProgressBar compliance={compliance} /> : null}

      {complianceError ? (
        <p
          className="rounded-panel mb-6 border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700"
          role="alert"
        >
          {complianceError}
        </p>
      ) : null}

      <ConditionsToolbar
        disabled={status === 'loading' || status === 'idle'}
        onStatusChange={setStatusFilter}
        status={statusFilter}
        total={total}
      />

      {status === 'loading' || status === 'idle' ? (
        <p className="rounded-panel border border-border bg-surface p-6 text-sm font-semibold text-text-secondary">
          Carregando condicionantes...
        </p>
      ) : null}

      {status === 'error' ? (
        <p
          className="rounded-panel border border-rose-200 bg-rose-50 p-6 text-sm font-semibold text-rose-700"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {status === 'success' && conditions.length === 0 ? (
        <p className="rounded-panel border border-border bg-surface p-6 text-sm font-semibold text-text-secondary">
          {statusFilter === 'all'
            ? 'Nenhuma condicionante cadastrada para esta empresa.'
            : 'Nenhuma condicionante encontrada para o status selecionado.'}
        </p>
      ) : null}

      {status === 'success' && conditions.length > 0 ? (
        <section
          aria-label="Lista de condicionantes"
          className="flex flex-col gap-4"
        >
          {conditions.map((condition) => (
            <ConditionCard condition={condition} key={condition.id} />
          ))}
        </section>
      ) : null}

      {companyId ? (
        <NewConditionModal
          companyId={companyId}
          onCreated={handleCreated}
          onOpenChange={setIsModalOpen}
          open={isModalOpen}
        />
      ) : null}

      {toastMessage ? (
        <SuccessToast message={toastMessage} onDismiss={dismissToast} />
      ) : null}
    </PageScaffold>
  );
}
