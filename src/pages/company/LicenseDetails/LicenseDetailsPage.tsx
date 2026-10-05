import { Search } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import { SuccessToast } from '../../../components/feedback/SuccessToast';
import { PageScaffold } from '../../../components/layout/PageScaffold';
import { buildCompanyRoutes } from '../../../app/router/routes';
import {
  formatConditionPeriodicity,
  formatConditionStatus,
  formatConditionType,
  formatLicenseStatus,
} from '../../../features/licenses/licenseDetailsFormatting';
import { useLicenseDetails } from '../../../features/licenses/useLicenseDetails';
import type { LicenseConditionDetail } from '../../../features/licenses/types';
import { useCompanyBreadcrumbs } from '../useCompanyBreadcrumbs';
import { AddLicenseConditionsModal } from './components/AddLicenseConditionsModal';
import { ConditionStatusBadge } from './components/ConditionStatusBadge';
import { LicenseSummaryCard } from './components/LicenseSummaryCard';

function formatDate(value: string | null): string {
  if (!value) return '—';

  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(
    new Date(value)
  );
}

function LoadingDetails() {
  return (
    <div
      aria-label="Carregando detalhes da licença"
      className="animate-pulse"
      role="status"
    >
      <div className="grid grid-cols-4 gap-4 max-[900px]:grid-cols-2 max-[520px]:grid-cols-1">
        {Array.from({ length: 4 }, (_, index) => (
          <div className="h-20 rounded-panel bg-surface-muted" key={index} />
        ))}
      </div>
      <div className="mt-5 h-72 rounded-panel bg-surface-muted" />
    </div>
  );
}

function ConditionRow({ condition }: { condition: LicenseConditionDetail }) {
  const itemNumber = condition.itemNumber ?? '—';
  const isGroup = itemNumber !== '—' && !itemNumber.includes('.');

  return (
    <tr
      className={
        isGroup
          ? 'bg-surface-muted font-bold text-text-primary'
          : 'bg-surface text-text-secondary'
      }
    >
      <td className="px-3 py-3 align-top">{itemNumber}</td>
      <td className="min-w-64 px-3 py-3 align-top">
        <span className={isGroup ? 'text-text-primary' : ''}>
          {condition.description || '—'}
        </span>
        {isGroup ? (
          <span className="sr-only">, grupo de condicionantes</span>
        ) : null}
      </td>
      <td className="px-3 py-3 align-top">
        {formatConditionType(condition.conditionType)}
      </td>
      <td className="px-3 py-3 align-top">
        {formatConditionPeriodicity(condition.periodicity)}
      </td>
      <td className="px-3 py-3 align-top">—</td>
      <td className="px-3 py-3 align-top font-semibold">
        {formatDate(condition.deadline)}
      </td>
      <td className="px-3 py-3 align-top">
        {condition.isViolated ? (
          <span className="rounded-control bg-rose-100 px-2 py-1 text-[11px] font-bold text-rose-800">
            Ativo
          </span>
        ) : (
          '—'
        )}
      </td>
      <td className="px-3 py-3 align-top">
        <ConditionStatusBadge status={condition.status} />
      </td>
      <td className="px-3 py-3 align-top">
        {formatDate(condition.completionDate)}
      </td>
      <td className="px-3 py-3 align-top">
        {isGroup ? 'Grupo de Condicionante' : condition.responsibleName || '—'}
      </td>
    </tr>
  );
}

export function LicenseDetailsPage() {
  const { companyId, licenseId } = useParams<{
    companyId: string;
    licenseId: string;
  }>();
  const [filter, setFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const { details, error, refetch, status } = useLicenseDetails(
    companyId,
    licenseId
  );
  const breadcrumbs = useCompanyBreadcrumbs('Detalhes da licença', {
    parent: { label: 'Licenças', to: buildCompanyRoutes.licenses },
  });

  const conditions = details?.conditions ?? [];
  const filteredConditions = conditions.filter((condition) =>
    `${condition.itemNumber} ${condition.description}`
      .toLocaleLowerCase('pt-BR')
      .includes(filter.trim().toLocaleLowerCase('pt-BR'))
  );
  const fulfilledCount = conditions.filter(
    (condition) => formatConditionStatus(condition.status) === 'Atendida'
  ).length;

  const dismissToast = useCallback(() => setToastMessage(null), []);

  function handleConditionsCreated(count: number) {
    setToastMessage(
      count === 1
        ? 'Condicionante cadastrada com sucesso.'
        : `${count} condicionantes cadastradas com sucesso.`
    );
    refetch();
  }

  return (
    <PageScaffold
      actions={
        status === 'success'
          ? [
              {
                label: 'Adicionar Condicionante',
                onClick: () => setIsModalOpen(true),
              },
            ]
          : []
      }
      breadcrumbs={breadcrumbs}
      subtitle={
        details?.processNumber ?? 'Consulta da licença e suas condicionantes.'
      }
      title="Detalhes da licença"
    >
      {status === 'loading' || status === 'idle' ? <LoadingDetails /> : null}

      {status === 'error' ? (
        <div
          className="rounded-panel border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800"
          role="alert"
        >
          <p className="m-0 font-semibold">{error}</p>
          <button
            className="mt-3 font-bold underline"
            onClick={refetch}
            type="button"
          >
            Tentar novamente
          </button>
        </div>
      ) : null}

      {status === 'success' && details ? (
        <>
          <section
            aria-label="Resumo da licença"
            className="grid grid-cols-4 gap-4 max-[900px]:grid-cols-2 max-[520px]:grid-cols-1"
          >
            <LicenseSummaryCard
              accent="border-l-blue-500"
              label="Data de Emissão"
              value={formatDate(details.issueDate)}
            />
            <LicenseSummaryCard
              accent="border-l-amber-500"
              label="Data de Validade"
              value={formatDate(details.expirationDate)}
            />
            <LicenseSummaryCard
              accent="border-l-emerald-500"
              label="Status Atual"
              value={formatLicenseStatus(details.status)}
            />
            <LicenseSummaryCard
              accent="border-l-blue-500"
              label="Condicionantes"
              value={`${fulfilledCount} de ${conditions.length} atendidas`}
            />
          </section>

          <section
            aria-label="Detalhamento das condicionantes"
            className="mt-5 overflow-hidden rounded-panel border border-border bg-surface"
          >
            <div className="flex items-center justify-between gap-4 border-b border-border p-3 max-[640px]:items-stretch max-[640px]:flex-col">
              <h2 className="m-0 text-sm font-bold text-text-primary">
                Detalhamento das Condicionantes
              </h2>
              <label className="flex h-9 w-full max-w-64 items-center gap-2 rounded-control bg-surface-muted px-3 text-text-secondary">
                <Search aria-hidden="true" size={15} />
                <span className="sr-only">
                  Filtrar condicionantes por termo
                </span>
                <input
                  className="min-w-0 flex-1 border-0 bg-transparent text-xs outline-none placeholder:text-text-muted"
                  onChange={(event) => setFilter(event.target.value)}
                  placeholder="Filtrar condicionantes por termo..."
                  type="search"
                  value={filter}
                />
              </label>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-270 border-collapse text-left text-xs">
                <thead className="bg-surface-muted text-[11px] font-semibold text-text-secondary">
                  <tr>
                    {[
                      'Item',
                      'Descrição',
                      'Tipo Cond.',
                      'Periodicidade',
                      'Prazo',
                      'Dia Limite',
                      'Alerta',
                      'Status',
                      'Data Cumpr.',
                      'Responsável',
                    ].map((heading) => (
                      <th className="px-3 py-3" key={heading} scope="col">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredConditions.map((condition) => (
                    <ConditionRow condition={condition} key={condition.id} />
                  ))}
                  {filteredConditions.length === 0 ? (
                    <tr>
                      <td
                        className="px-4 py-8 text-center text-sm text-text-secondary"
                        colSpan={10}
                      >
                        {conditions.length === 0
                          ? 'Nenhuma condicionante cadastrada para esta licença.'
                          : 'Nenhuma condicionante encontrada para esse termo.'}
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}

      {companyId && licenseId ? (
        <AddLicenseConditionsModal
          companyId={companyId}
          licenseId={licenseId}
          onCreated={handleConditionsCreated}
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
