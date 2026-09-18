import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { RoutePlaceholder } from '../../../components/feedback/RoutePlaceholder';
import { PageScaffold } from '../../../components/layout/PageScaffold';
import type { License } from '../../../features/licenses/types';
import { useCompanyBreadcrumbs } from '../useCompanyBreadcrumbs';
import { NewLicenseModal } from './components/NewLicenseModal';

export function CompanyLicensesPage() {
  const breadcrumbs = useCompanyBreadcrumbs('Licenças');
  const { companyId } = useParams<{ companyId: string }>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [createdLicense, setCreatedLicense] = useState<License | null>(null);

  function handleCreated(license: License) {
    setCreatedLicense(license);
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

      <RoutePlaceholder description="A listagem de licenças ambientais será implementada em uma etapa futura." />

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
