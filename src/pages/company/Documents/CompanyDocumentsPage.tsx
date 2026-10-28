import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  Plus,
  Search,
} from 'lucide-react';
import { SuccessToast } from '../../../components/feedback/SuccessToast';
import { PageScaffold } from '../../../components/layout/PageScaffold';
import { Button } from '../../../components/ui/shadcn/button';
import type {
  CompanyDocument,
  DocumentFolder,
} from '../../../features/documents/types';
import { useDocuments } from '../../../features/documents/useDocuments';
import { useCompanyBreadcrumbs } from '../useCompanyBreadcrumbs';
import { DeleteDocumentDialog } from './components/DeleteDocumentDialog';
import {
  DocumentsTable,
  DocumentsTableSkeleton,
} from './components/DocumentsTable';
import { NewDocumentsModal } from './components/NewDocumentsModal';
import { NewFolderDialog } from './components/NewFolderDialog';

type SortOrder = 'recent' | 'oldest';

type FolderTreeProps = {
  currentFolderId: string | null;
  documentCounts: Map<string | null, number>;
  folders: DocumentFolder[];
  onSelect: (folderId: string) => void;
  parentId: string | null;
  depth?: number;
};

function FolderTree({
  currentFolderId,
  documentCounts,
  folders,
  onSelect,
  parentId,
  depth = 0,
}: FolderTreeProps) {
  return folders
    .filter((folder) => folder.parentId === parentId)
    .map((folder) => {
      const selected = currentFolderId === folder.id;
      return (
        <div key={folder.id}>
          <button
            aria-current={selected ? 'page' : undefined}
            className={`flex w-full items-center gap-2 rounded-control border-l-2 py-2 pr-3 text-left text-sm transition-colors ${
              selected
                ? 'border-primary bg-emerald-50 font-bold text-primary-strong'
                : 'border-transparent text-text-secondary hover:bg-surface-muted'
            }`}
            onClick={() => onSelect(folder.id)}
            style={{ paddingLeft: `${12 + depth * 16}px` }}
            type="button"
          >
            {selected ? (
              <FolderOpen aria-hidden="true" size={16} />
            ) : (
              <Folder aria-hidden="true" size={16} />
            )}
            <span className="min-w-0 flex-1 truncate">{folder.name}</span>
            <span className="text-xs font-medium text-text-muted">
              {documentCounts.get(folder.id) ?? 0}
            </span>
          </button>
          <FolderTree
            currentFolderId={currentFolderId}
            depth={depth + 1}
            documentCounts={documentCounts}
            folders={folders}
            onSelect={onSelect}
            parentId={folder.id}
          />
        </div>
      );
    });
}

export function CompanyDocumentsPage() {
  const breadcrumbs = useCompanyBreadcrumbs('Documentos');
  const { companyId } = useParams<{ companyId: string }>();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadFolderId, setUploadFolderId] = useState<string | null>(null);
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('recent');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [documentToDelete, setDocumentToDelete] =
    useState<CompanyDocument | null>(null);
  const { documents, error, folders, loadDocuments, status } = useDocuments();

  useEffect(() => {
    if (companyId) void loadDocuments(companyId);
  }, [companyId, loadDocuments]);

  const selectedFolderId =
    currentFolderId && folders.some((folder) => folder.id === currentFolderId)
      ? currentFolderId
      : null;

  const dismissToast = useCallback(() => setToastMessage(null), []);

  function reload() {
    if (companyId) void loadDocuments(companyId);
  }

  function handleDocumentDeleted() {
    setToastMessage('Documento excluído com sucesso.');
    reload();
  }

  function handleUploaded(count: number) {
    setToastMessage(
      count === 1
        ? 'Documento enviado com sucesso.'
        : `${count} documentos enviados com sucesso.`
    );
    reload();
  }

  function handleFolderCreated() {
    setToastMessage('Pasta criada com sucesso.');
    reload();
  }

  const currentFolder = folders.find(
    (folder) => folder.id === selectedFolderId
  );

  const folderPath = useMemo(() => {
    const path: DocumentFolder[] = [];
    let folder = folders.find((item) => item.id === selectedFolderId);
    const visited = new Set<string>();
    while (folder && !visited.has(folder.id)) {
      visited.add(folder.id);
      path.unshift(folder);
      folder = folders.find((item) => item.id === folder?.parentId);
    }
    return path;
  }, [folders, selectedFolderId]);

  const documentCounts = useMemo(() => {
    const counts = new Map<string | null, number>();
    for (const document of documents) {
      counts.set(document.folderId, (counts.get(document.folderId) ?? 0) + 1);
    }
    return counts;
  }, [documents]);

  const isSearching = search.trim().length > 0;

  const visibleDocuments = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase('pt-BR');
    return documents
      .filter((document) => {
        const matchesFolder =
          normalizedSearch.length > 0 || document.folderId === selectedFolderId;
        const matchesSearch =
          !normalizedSearch ||
          `${document.title} ${document.fileName}`
            .toLocaleLowerCase('pt-BR')
            .includes(normalizedSearch);
        return matchesFolder && matchesSearch;
      })
      .sort((left, right) => {
        const leftDate = new Date(left.createdAt).getTime();
        const rightDate = new Date(right.createdAt).getTime();
        return sortOrder === 'recent'
          ? rightDate - leftDate
          : leftDate - rightDate;
      });
  }, [documents, search, selectedFolderId, sortOrder]);

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
          <span className="sr-only">Buscar arquivo</span>
          <input
            className="w-full border-0 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar arquivo"
            value={search}
          />
        </label>
        <Button
          onClick={() => {
            setUploadFolderId(selectedFolderId);
            setIsUploadOpen(true);
          }}
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
          <Button onClick={reload} type="button" variant="action">
            Tentar novamente
          </Button>
        </div>
      ) : null}

      {status === 'success' ? (
        <div className="grid grid-cols-[240px_minmax(0,1fr)] items-start gap-4 max-[900px]:grid-cols-1">
          <aside className="rounded-panel border border-border bg-surface p-3 shadow-control">
            <div className="flex items-center justify-between gap-2 px-3 pb-3">
              <h2 className="m-0 text-[11px] font-bold uppercase tracking-wide text-text-muted">
                Pastas
              </h2>
              <button
                aria-label="Criar pasta"
                className="grid size-7 place-items-center rounded-control text-primary-strong hover:bg-emerald-50"
                onClick={() => setIsFolderDialogOpen(true)}
                type="button"
              >
                <Plus aria-hidden="true" size={16} />
              </button>
            </div>
            <button
              aria-current={selectedFolderId === null ? 'page' : undefined}
              className={`flex w-full items-center gap-2 rounded-control border-l-2 px-3 py-2 text-left text-sm transition-colors ${
                selectedFolderId === null
                  ? 'border-primary bg-emerald-50 font-bold text-primary-strong'
                  : 'border-transparent text-text-secondary hover:bg-surface-muted'
              }`}
              onClick={() => setCurrentFolderId(null)}
              type="button"
            >
              {selectedFolderId === null ? (
                <FolderOpen aria-hidden="true" size={16} />
              ) : (
                <Folder aria-hidden="true" size={16} />
              )}
              Raiz
              <span className="ml-auto text-xs font-medium text-text-muted">
                {documentCounts.get(null) ?? 0}
              </span>
            </button>
            <FolderTree
              currentFolderId={selectedFolderId}
              documentCounts={documentCounts}
              folders={folders}
              onSelect={setCurrentFolderId}
              parentId={null}
            />
          </aside>

          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                {!isSearching ? (
                  <nav
                    aria-label="Caminho da pasta"
                    className="mb-1 flex flex-wrap items-center gap-1 text-xs text-text-muted"
                  >
                    <button
                      className="hover:text-primary-strong hover:underline"
                      onClick={() => setCurrentFolderId(null)}
                      type="button"
                    >
                      Raiz
                    </button>
                    {folderPath.map((folder) => (
                      <span className="flex items-center gap-1" key={folder.id}>
                        <ChevronRight aria-hidden="true" size={12} />
                        <button
                          className="hover:text-primary-strong hover:underline"
                          onClick={() => setCurrentFolderId(folder.id)}
                          type="button"
                        >
                          {folder.name}
                        </button>
                      </span>
                    ))}
                  </nav>
                ) : null}
                <h2 className="m-0 text-base font-bold text-text-primary">
                  {isSearching
                    ? 'Resultados da busca'
                    : (currentFolder?.name ?? 'Arquivos da raiz')}
                </h2>
                <p className="mt-1 mb-0 text-xs text-text-muted">
                  {visibleDocuments.length}{' '}
                  {visibleDocuments.length === 1 ? 'arquivo' : 'arquivos'}
                  {isSearching ? ' em todas as pastas' : ''}
                </p>
              </div>
              <div className="relative">
                <button
                  aria-expanded={isSortOpen}
                  aria-haspopup="menu"
                  className="inline-flex min-h-9 items-center gap-2 rounded-control border border-border bg-surface px-3 text-xs text-text-secondary hover:bg-surface-muted"
                  onClick={() => setIsSortOpen((open) => !open)}
                  type="button"
                >
                  Ordenar:{' '}
                  {sortOrder === 'recent' ? 'Mais recente' : 'Mais antigo'}
                  <ChevronDown aria-hidden="true" size={14} />
                </button>
                {isSortOpen ? (
                  <div
                    className="absolute right-0 z-10 mt-1 min-w-36 rounded-control border border-border bg-surface p-1 shadow-card"
                    role="menu"
                  >
                    {(['recent', 'oldest'] as const).map((order) => (
                      <button
                        className="block w-full rounded px-3 py-2 text-left text-xs text-text-secondary hover:bg-surface-muted"
                        key={order}
                        onClick={() => {
                          setSortOrder(order);
                          setIsSortOpen(false);
                        }}
                        role="menuitem"
                        type="button"
                      >
                        {order === 'recent' ? 'Mais recente' : 'Mais antigo'}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            {visibleDocuments.length > 0 && companyId ? (
              <DocumentsTable
                companyId={companyId}
                documents={visibleDocuments}
                onRequestDelete={setDocumentToDelete}
              />
            ) : (
              <div className="rounded-panel flex flex-col items-center gap-3 border border-dashed border-border bg-surface px-6 py-12 text-center">
                <FolderOpen
                  aria-hidden="true"
                  className="text-text-muted"
                  size={30}
                />
                <div>
                  <p className="m-0 text-sm font-bold text-text-primary">
                    {isSearching
                      ? 'Nenhum arquivo encontrado'
                      : 'Esta pasta está vazia'}
                  </p>
                  <p className="mt-1 mb-0 text-xs text-text-muted">
                    {isSearching
                      ? 'Tente buscar usando outro título ou nome de arquivo.'
                      : 'Envie documentos ou crie uma subpasta para começar.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {companyId ? (
        <>
          <NewDocumentsModal
            companyId={companyId}
            folderId={uploadFolderId}
            folders={folders}
            onFolderChange={setUploadFolderId}
            onOpenChange={setIsUploadOpen}
            onUploaded={handleUploaded}
            open={isUploadOpen}
          />
          <NewFolderDialog
            companyId={companyId}
            onCreated={handleFolderCreated}
            onOpenChange={setIsFolderDialogOpen}
            open={isFolderDialogOpen}
            parentId={selectedFolderId}
            parentName={currentFolder?.name ?? 'Raiz'}
          />
          <DeleteDocumentDialog
            companyId={companyId}
            document={documentToDelete}
            onDeleted={handleDocumentDeleted}
            onOpenChange={(open) => {
              if (!open) setDocumentToDelete(null);
            }}
          />
        </>
      ) : null}

      {toastMessage ? (
        <SuccessToast message={toastMessage} onDismiss={dismissToast} />
      ) : null}
    </PageScaffold>
  );
}
