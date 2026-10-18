import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ChevronDown, FileText, Folder, Search } from 'lucide-react';
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
import {
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_TYPES,
  type DocumentType,
} from '../../../features/documents/types';

type DocumentTypeFilter = DocumentType | 'ALL';
type SortOrder = 'recent' | 'oldest';

export function CompanyDocumentsPage() {
  const breadcrumbs = useCompanyBreadcrumbs('Documentos');
  const { companyId } = useParams<{ companyId: string }>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<DocumentTypeFilter>('ALL');
  const [sortOrder, setSortOrder] = useState<SortOrder>('recent');
  const [openMenu, setOpenMenu] = useState<'type' | 'sort' | null>(null);
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

  const visibleDocuments = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase('pt-BR');
    return documents
      .filter((document) => {
        const matchesType =
          typeFilter === 'ALL' || document.type === typeFilter;
        const matchesSearch =
          !normalizedSearch ||
          `${document.title} ${document.fileName}`
            .toLocaleLowerCase('pt-BR')
            .includes(normalizedSearch);
        return matchesType && matchesSearch;
      })
      .sort((left, right) => {
        const leftDate = new Date(left.createdAt).getTime();
        const rightDate = new Date(right.createdAt).getTime();
        return sortOrder === 'recent'
          ? rightDate - leftDate
          : leftDate - rightDate;
      });
  }, [documents, search, sortOrder, typeFilter]);

  const typeLabel =
    typeFilter === 'ALL' ? 'Tipo: Todos' : DOCUMENT_TYPE_LABELS[typeFilter];

  return (
    <PageScaffold
      breadcrumbs={breadcrumbs}
      subtitle="Gerencie e organize os arquivos e documentos da empresa."
      title="Repositório de Documentos"
    >
      <section
        aria-label="Ferramentas do repositório"
        className="mb-6 flex flex-wrap items-center gap-2 rounded-panel border border-border bg-surface p-2 shadow-control"
      >
        <label className="flex min-h-10 min-w-[260px] flex-1 items-center gap-2 rounded-control bg-surface-muted px-3 text-text-muted max-[720px]:min-w-full">
          <Search aria-hidden="true" size={17} />
          <span className="sr-only">Buscar arquivo ou documento</span>
          <input
            className="w-full border-0 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar arquivo ou documento..."
            value={search}
          />
        </label>

        <div className="relative">
          <button
            aria-expanded={openMenu === 'type'}
            aria-haspopup="menu"
            className="inline-flex min-h-10 items-center gap-2 rounded-control border border-border bg-surface px-3 text-sm text-text-secondary hover:bg-surface-muted"
            onClick={() => setOpenMenu(openMenu === 'type' ? null : 'type')}
            type="button"
          >
            {typeLabel}
            <ChevronDown aria-hidden="true" size={15} />
          </button>
          {openMenu === 'type' ? (
            <div
              className="absolute right-0 z-10 mt-1 min-w-44 rounded-control border border-border bg-surface p-1 shadow-card"
              role="menu"
            >
              <button
                className="block w-full rounded px-3 py-2 text-left text-sm text-text-secondary hover:bg-surface-muted"
                onClick={() => {
                  setTypeFilter('ALL');
                  setOpenMenu(null);
                }}
                role="menuitem"
                type="button"
              >
                Tipo: Todos
              </button>
              {DOCUMENT_TYPES.map((type) => (
                <button
                  className="block w-full rounded px-3 py-2 text-left text-sm text-text-secondary hover:bg-surface-muted"
                  key={type}
                  onClick={() => {
                    setTypeFilter(type);
                    setOpenMenu(null);
                  }}
                  role="menuitem"
                  type="button"
                >
                  {DOCUMENT_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          type="button"
          variant="action"
        >
          + Enviar documentos
        </Button>
      </section>

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
        <div className="grid grid-cols-[220px_minmax(0,1fr)] items-start gap-4 max-[900px]:grid-cols-1">
          <aside className="rounded-panel border border-border bg-surface p-3 shadow-control">
            <h2 className="px-3 pb-3 text-[11px] font-bold uppercase tracking-wide text-text-muted">
              Diretórios
            </h2>
            <button
              className="flex w-full items-center gap-2 rounded-control border-l-2 border-primary bg-emerald-50 px-3 py-2 text-left text-sm font-bold text-primary-strong"
              onClick={() => setTypeFilter('ALL')}
              type="button"
            >
              <Folder aria-hidden="true" size={16} />
              Todos os documentos
              <span className="ml-auto text-xs font-medium">
                {documents.length}
              </span>
            </button>
            {DOCUMENT_TYPES.map((type) => {
              const count = documents.filter(
                (document) => document.type === type
              ).length;
              return (
                <button
                  className="flex w-full items-center gap-2 rounded-control px-3 py-2 text-left text-sm text-text-secondary hover:bg-surface-muted"
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  type="button"
                >
                  <FileText aria-hidden="true" size={15} />
                  {DOCUMENT_TYPE_LABELS[type]}
                  <span className="ml-auto text-xs text-text-muted">
                    {count}
                  </span>
                </button>
              );
            })}
          </aside>
          <div className="min-w-0">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="m-0 text-base font-bold text-text-primary">
                  Documentos da empresa
                </h2>
                <p className="mt-1 mb-0 text-xs text-text-muted">
                  {visibleDocuments.length} de {documents.length} arquivos
                </p>
              </div>
              <div className="relative">
                <button
                  aria-expanded={openMenu === 'sort'}
                  aria-haspopup="menu"
                  className="inline-flex min-h-9 items-center gap-2 rounded-control border border-border bg-surface px-3 text-xs text-text-secondary hover:bg-surface-muted"
                  onClick={() =>
                    setOpenMenu(openMenu === 'sort' ? null : 'sort')
                  }
                  type="button"
                >
                  Ordenar:{' '}
                  {sortOrder === 'recent' ? 'Mais recente' : 'Mais antigo'}
                  <ChevronDown aria-hidden="true" size={14} />
                </button>
                {openMenu === 'sort' ? (
                  <div
                    className="absolute right-0 z-10 mt-1 min-w-36 rounded-control border border-border bg-surface p-1 shadow-card"
                    role="menu"
                  >
                    <button
                      className="block w-full rounded px-3 py-2 text-left text-xs text-text-secondary hover:bg-surface-muted"
                      onClick={() => {
                        setSortOrder('recent');
                        setOpenMenu(null);
                      }}
                      role="menuitem"
                      type="button"
                    >
                      Mais recente
                    </button>
                    <button
                      className="block w-full rounded px-3 py-2 text-left text-xs text-text-secondary hover:bg-surface-muted"
                      onClick={() => {
                        setSortOrder('oldest');
                        setOpenMenu(null);
                      }}
                      role="menuitem"
                      type="button"
                    >
                      Mais antigo
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
            {visibleDocuments.length > 0 ? (
              <DocumentsTable documents={visibleDocuments} />
            ) : (
              <div className="rounded-panel border border-dashed border-border bg-surface px-6 py-12 text-center text-sm text-text-secondary">
                Nenhum documento corresponde à busca ou ao filtro selecionado.
              </div>
            )}
          </div>
        </div>
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
