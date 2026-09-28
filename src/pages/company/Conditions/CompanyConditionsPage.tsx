import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { PageScaffold } from '../../../components/layout/PageScaffold';
import { useConditions } from '../../../features/licenseConditions/useConditions';
import type { LicenseCondition } from '../../../features/licenseConditions/types';
import { ApiError } from '../../../services/api/apiError';
import { deleteLicenseCondition } from '../../../services/api/licenseConditionsApi';
import { useCompanyBreadcrumbs } from '../useCompanyBreadcrumbs';
import { ConditionCard } from './components/ConditionCard';
import { DeleteConditionDialog } from './components/DeleteConditionDialog';
import { EditConditionModal } from './components/EditConditionModal';

const DELETE_ERROR_MESSAGE =
  'Não foi possível remover a condicionante. Tente novamente mais tarde.';

function toCounterLabel(total: number): string {
  return total === 1
    ? '1 condicionante registrada'
    : `${total} condicionantes registradas`;
}

export function CompanyConditionsPage() {
  const breadcrumbs = useCompanyBreadcrumbs('Condicionantes');
  const { companyId } = useParams<{ companyId: string }>();
  const {
    conditions,
    error,
    status,
    replaceCondition,
    removeCondition,
    restoreConditions,
  } = useConditions(companyId);

  const [conditionToEdit, setConditionToEdit] =
    useState<LicenseCondition | null>(null);
  const [conditionToDelete, setConditionToDelete] =
    useState<LicenseCondition | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const categories = conditions.map((condition) => condition.category);

  async function handleConfirmDelete() {
    if (!companyId || !conditionToDelete) return;

    const target = conditionToDelete;
    /*
     * Optimistic: the card leaves the list (and the counter drops) before the
     * request answers. The snapshot is what puts it back — in its original
     * position — if the API refuses.
     */
    const previousConditions = conditions;

    setIsDeleting(true);
    setDeleteError(null);
    removeCondition(target.id);
    setConditionToDelete(null);

    try {
      await deleteLicenseCondition(companyId, target.id);
    } catch (caught) {
      restoreConditions(previousConditions);
      setDeleteError(
        caught instanceof ApiError ? caught.message : DELETE_ERROR_MESSAGE
      );
    } finally {
      setIsDeleting(false);
    }
  }

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

      {deleteError ? (
        <p
          className="rounded-panel border border-rose-200 bg-rose-50 p-6 text-sm font-semibold text-rose-700"
          role="alert"
        >
          {deleteError}
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
          <p className="m-0 text-sm font-semibold text-text-secondary">
            {toCounterLabel(conditions.length)}
          </p>

          {conditions.map((condition) => (
            <ConditionCard
              condition={condition}
              key={condition.id}
              onDelete={setConditionToDelete}
              onEdit={setConditionToEdit}
            />
          ))}
        </section>
      ) : null}

      {companyId ? (
        <EditConditionModal
          categories={categories}
          companyId={companyId}
          condition={conditionToEdit}
          onOpenChange={(open) => {
            if (!open) setConditionToEdit(null);
          }}
          onUpdated={replaceCondition}
          open={conditionToEdit !== null}
        />
      ) : null}

      <DeleteConditionDialog
        condition={conditionToDelete}
        isDeleting={isDeleting}
        onConfirm={() => void handleConfirmDelete()}
        onOpenChange={(open) => {
          if (!open) setConditionToDelete(null);
        }}
        open={conditionToDelete !== null}
      />
    </PageScaffold>
  );
}
