import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/shadcn/button';
import { PageScaffold } from '../../../components/layout/PageScaffold';
import {
  EMPTY_LICENSE_FILTERS,
  filterLicenses,
  listAgencyOptions,
} from '../../../features/licenses/licenseFilters';
import type { License } from '../../../features/licenses/types';
import { useLicensesPanel } from '../../../features/licenses/useLicensesPanel';
import { useCompanyBreadcrumbs } from '../useCompanyBreadcrumbs';
import { LicensesFilters } from './components/LicensesFilters';
import { LicensesSummaryCards } from './components/LicensesSummaryCards';
import { LicensesTable } from './components/LicensesTable';
import { NewLicenseModal } from './components/NewLicenseModal';

export function CompanyLicensesPage() {
  const breadcrumbs = useCompanyBreadcrumbs('Licenças');
  const { companyId } = useParams<{ companyId: string }>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filters, setFilters] = useState(EMPTY_LICENSE_FILTERS);
  const [createdLicense, setCreatedLicense] = useState<License | null>(null);

  const { summary, licenses, status, error, loadLicenses } = useLicensesPanel();

  useEffect(() => {
    if (companyId) void loadLicenses(companyId);
  }, [companyId, loadLicenses]);

  const agencyOptions = useMemo(() => listAgencyOptions(licenses), [licenses]);
  const visibleLicenses = useMemo(
    () => filterLicenses(licenses, filters),
    [licenses, filters]
  );

  function handleCreated(license: License) {
    setCreatedLicense(license);
    if (companyId) void loadLicenses(companyId);
  }

  return (
    <PageScaffold
      actions={[{ label: 'Nova Licença', onClick: () => setIsModalOpen(true) }]}
      breadcrumbs={breadcrumbs}
      subtitle="Controle e monitoramento das licenças ambientais da empresa."
      title="Painel de licenças ambientais"
    >
      {createdLicense ? (
        <p
          aria-live="polite"
          className="rounded-panel mb-6 border border-[#a6e9c9] bg-[#d8f8ea] px-4 py-3 text-[13px] font-semibold text-primary-strong"
          role="status"
        >
          Licença "{createdLicense.processNumber}" cadastrada com status{' '}
          {createdLicense.status}.
        </p>
      ) : null}

      {status === 'loading' ? (
        <p className="text-sm font-semibold text-text-muted" role="status">
          Carregando licenças...
        </p>
      ) : null}

      {status === 'error' ? (
        <div className="rounded-panel mb-6 flex flex-wrap items-center justify-between gap-4 border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          <p className="m-0">{error}</p>
          <Button
            onClick={() => companyId && void loadLicenses(companyId)}
            type="button"
            variant="action"
          >
            Tentar novamente
          </Button>
        </div>
      ) : null}

      {status === 'success' && summary ? (
        <>
          <LicensesSummaryCards summary={summary} />

          <LicensesFilters
            agencyOptions={agencyOptions}
            onChange={setFilters}
            values={filters}
          />

          {licenses.length === 0 ? (
            <p className="text-sm text-text-secondary">
              Nenhuma licença cadastrada até o momento.
            </p>
          ) : null}

          {licenses.length > 0 && visibleLicenses.length === 0 ? (
            <div className="flex flex-wrap items-center gap-4">
              <p className="m-0 text-sm text-text-secondary">
                Nenhuma licença encontrada para os filtros aplicados.
              </p>
              <Button
                onClick={() => setFilters(EMPTY_LICENSE_FILTERS)}
                type="button"
                variant="action"
              >
                Limpar filtros
              </Button>
            </div>
          ) : null}

          {visibleLicenses.length > 0 && companyId ? (
            <LicensesTable companyId={companyId} licenses={visibleLicenses} />
          ) : null}
        </>
      ) : null}

      {companyId ? (
        <NewLicenseModal
          companyId={companyId}
          onCreated={handleCreated}
          onOpenChange={setIsModalOpen}
          open={isModalOpen}
        />
      ) : null}
    </PageScaffold>
  );
}
