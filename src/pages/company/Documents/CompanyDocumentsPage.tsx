import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { SuccessToast } from '../../../components/feedback/SuccessToast';
import { PageScaffold } from '../../../components/layout/PageScaffold';
import { Button } from '../../../components/ui/shadcn/button';
import { useDocuments } from '../../../features/documents/useDocuments';
import { useCompanyBreadcrumbs } from '../useCompanyBreadcrumbs';
import {
  DocumentsTable,
  DocumentsTableSkeleton,
} from './components/DocumentsTable';
import { NewDocumentsModal } from './components/NewDocumentsModal';

export function CompanyDocumentsPage() {
  const breadcrumbs = useCompanyBreadcrumbs('Documentos');
  const { companyId } = useParams<{ companyId: string }>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const { documents, error, loadDocuments, status } = useDocuments();

  useEffect(() => {
    if (companyId) void loadDocuments(companyId);
  }, [companyId, loadDocuments]);

  const dismissToast = useCallback(() => setToastMessage(null), []);

  function handleUploaded(count: number) {
    setToastMessage(
      count === 1
        ? 'Documento enviado com sucesso.'
        : `${count} documentos enviados com sucesso.`
    );
    if (companyId) void loadDocuments(companyId);
  }

  return (
    <PageScaffold
      actions={[
        {
          label: 'Enviar documentos',
          onClick: () => setIsModalOpen(true),
        },
      ]}
      breadcrumbs={breadcrumbs}
      subtitle="Gerencie e organize os arquivos e documentos da empresa."
      title="Repositório de Documentos"
    >
      {status === 'idle' || status === 'loading' ? (
        <DocumentsTableSkeleton />
      ) : null}

      {status === 'error' ? (
        <div
          className="rounded-panel flex flex-wrap items-center justify-between gap-4 border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          role="alert"
        >
          <p className="m-0">{error}</p>
          <Button
            onClick={() => companyId && void loadDocuments(companyId)}
            type="button"
            variant="action"
          >
            Tentar novamente
          </Button>
        </div>
      ) : null}

      {status === 'success' && documents.length === 0 ? (
        <section className="rounded-panel flex flex-col items-center gap-4 border border-dashed border-border bg-surface px-6 py-14 text-center">
          <div className="grid size-12 place-items-center rounded-full bg-emerald-50 text-xl text-primary-strong">
            +
          </div>
          <div>
            <h2 className="m-0 text-base font-bold text-text-primary">
              Nenhum documento enviado
            </h2>
            <p className="mt-1.5 mb-0 text-sm text-text-secondary">
              Envie contratos, laudos, certidões e outros documentos da empresa.
            </p>
          </div>
          <Button
            onClick={() => setIsModalOpen(true)}
            type="button"
            variant="action"
          >
            + Enviar documentos
          </Button>
        </section>
      ) : null}

      {status === 'success' && documents.length > 0 ? (
        <DocumentsTable documents={documents} />
      ) : null}

      {companyId ? (
        <NewDocumentsModal
          companyId={companyId}
          onOpenChange={setIsModalOpen}
          onUploaded={handleUploaded}
          open={isModalOpen}
        />
      ) : null}

      {toastMessage ? (
        <SuccessToast message={toastMessage} onDismiss={dismissToast} />
      ) : null}
    </PageScaffold>
  );
}
