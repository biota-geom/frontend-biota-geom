import { useParams } from 'react-router-dom';
import { PageScaffold } from '../../../components/layout/PageScaffold';
import { useConditions } from '../../../features/licenseConditions/useConditions';
import { useCompanyBreadcrumbs } from '../useCompanyBreadcrumbs';
import { ConditionCard } from './components/ConditionCard';

export function CompanyConditionsPage() {
  const breadcrumbs = useCompanyBreadcrumbs('Condicionantes');
  const { companyId } = useParams<{ companyId: string }>();
  const { conditions, error, status } = useConditions(companyId);

  return (
    <PageScaffold
      breadcrumbs={breadcrumbs}
      subtitle="Acompanhamento de condicionantes e prazos regulatórios."
      title="Monitor de Condicionantes Ambientais"
    >
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
          Nenhuma condicionante cadastrada para esta empresa.
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
    </PageScaffold>
  );
}
