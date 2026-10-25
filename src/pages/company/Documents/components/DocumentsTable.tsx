import { useState } from 'react';
import { Download, Eye, FileText, Trash2 } from 'lucide-react';
import type { CompanyDocument } from '../../../../features/documents/types';
import { ApiError } from '../../../../services/api/apiError';
import { getDocumentAccessUrl } from '../../../../services/api/documentsApi';
import { openProtectedFile } from '../../../../utils/openProtectedFile';

const DATE_FORMATTER = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' });
const DATE_TIME_FORMATTER = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
});

const COLUMNS = ['Título', 'Data do documento', 'Enviado em', 'Ações'] as const;

const OPEN_ERROR = 'Não foi possível abrir o documento.';
const POPUP_BLOCKED_ERROR =
  'Permita a abertura de pop-ups para visualizar o documento.';
const DOWNLOAD_ERROR = 'Não foi possível baixar o documento.';

const ACTION_BUTTON_CLASS =
  'rounded-control grid size-7 place-items-center border-0 bg-surface-muted p-0 text-text-secondary transition-colors hover:text-primary-strong disabled:cursor-wait disabled:opacity-60';

function formatDate(dateOnly: string): string {
  const date = new Date(`${dateOnly.slice(0, 10)}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? '—' : DATE_FORMATTER.format(date);
}

function formatDateTime(isoDate: string): string {
  const date = new Date(isoDate);
  return Number.isNaN(date.getTime()) ? '—' : DATE_TIME_FORMATTER.format(date);
}

function TableHeader() {
  return (
    <thead>
      <tr className="border-b border-border bg-surface-muted">
        {COLUMNS.map((column, index) => (
          <th
            className={`px-5 py-3 text-left text-xs font-semibold text-text-muted ${
              index === COLUMNS.length - 1 ? 'w-48' : ''
            }`}
            key={column}
            scope="col"
          >
            {column}
          </th>
        ))}
      </tr>
    </thead>
  );
}

export function DocumentsTableSkeleton() {
  return (
    <div className="rounded-panel overflow-x-auto border border-border bg-surface shadow-control">
      <table className="w-full min-w-[760px] border-collapse text-left text-sm">
        <TableHeader />
        <tbody>
          {Array.from({ length: 5 }).map((_, rowIndex) => (
            <tr className="border-b border-border last:border-0" key={rowIndex}>
              {COLUMNS.map((column) => (
                <td className="px-5 py-4" key={column}>
                  <span className="block h-4 w-3/4 animate-pulse rounded bg-surface-muted" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DocumentsTable({
  companyId,
  documents,
  onRequestDelete,
}: {
  companyId: string;
  documents: CompanyDocument[];
  onRequestDelete: (document: CompanyDocument) => void;
}) {
  const [openingDocumentId, setOpeningDocumentId] = useState<string | null>(
    null
  );
  const [downloadingDocumentId, setDownloadingDocumentId] = useState<
    string | null
  >(null);
  const [openError, setOpenError] = useState<string | null>(null);

  async function handleOpen(documentId: string) {
    setOpeningDocumentId(documentId);
    setOpenError(null);

    try {
      const result = await openProtectedFile(() =>
        getDocumentAccessUrl(companyId, documentId)
      );
      if (result === 'popup-blocked') setOpenError(POPUP_BLOCKED_ERROR);
    } catch (error) {
      setOpenError(error instanceof ApiError ? error.message : OPEN_ERROR);
    } finally {
      setOpeningDocumentId(null);
    }
  }

  async function handleDownload(document: CompanyDocument) {
    setDownloadingDocumentId(document.id);
    setOpenError(null);

    try {
      const url = await getDocumentAccessUrl(companyId, document.id);
      /*
       * The access URL points at the storage backend, so `download` alone is
       * ignored cross-origin. Fetching the bytes first and handing the anchor
       * a blob URL is what makes the browser save the file under its real
       * name instead of navigating to it.
       */
      const response = await fetch(url);
      if (!response.ok) throw new Error(DOWNLOAD_ERROR);

      const blobUrl = URL.createObjectURL(await response.blob());
      const anchor = window.document.createElement('a');
      anchor.href = blobUrl;
      anchor.download = document.fileName;
      anchor.click();
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      setOpenError(error instanceof ApiError ? error.message : DOWNLOAD_ERROR);
    } finally {
      setDownloadingDocumentId(null);
    }
  }

  return (
    <section
      aria-label="Documentos da empresa"
      className="rounded-panel overflow-hidden border border-border bg-surface shadow-control"
    >
      <div className="border-b border-border px-5 py-4">
        <h2 className="m-0 text-base font-bold text-text-primary">
          Documentos
        </h2>
        <p className="mt-1 mb-0 text-xs text-text-muted">
          {documents.length} {documents.length === 1 ? 'arquivo' : 'arquivos'}
        </p>
        {openError ? (
          <p className="mt-2 mb-0 text-xs text-red-600" role="alert">
            {openError}
          </p>
        ) : null}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <TableHeader />
          <tbody>
            {documents.map((document) => (
              <tr
                className="border-b border-border last:border-0 hover:bg-surface-muted"
                key={document.id}
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="grid size-8 shrink-0 place-items-center rounded-control bg-emerald-50 text-primary-strong">
                      <FileText aria-hidden="true" size={17} />
                    </span>
                    <div className="min-w-0">
                      <p className="m-0 font-semibold text-text-primary">
                        {document.title}
                      </p>
                      <p className="mt-0.5 mb-0 max-w-72 truncate text-xs text-text-muted">
                        {document.fileName}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 whitespace-nowrap text-text-secondary">
                  {formatDate(document.documentDate)}
                </td>
                <td className="px-5 py-4 whitespace-nowrap text-text-secondary">
                  {formatDateTime(document.createdAt)}
                </td>
                <td className="w-48 px-5 py-4 text-left">
                  <div className="flex items-center gap-2">
                    <button
                      aria-label={`Visualizar ${document.title}`}
                      className={ACTION_BUTTON_CLASS}
                      disabled={openingDocumentId === document.id}
                      onClick={() => void handleOpen(document.id)}
                      title="Visualizar"
                      type="button"
                    >
                      <Eye aria-hidden="true" size={16} />
                    </button>
                    <button
                      aria-label={`Baixar ${document.title}`}
                      className={ACTION_BUTTON_CLASS}
                      disabled={downloadingDocumentId === document.id}
                      onClick={() => void handleDownload(document)}
                      title="Baixar"
                      type="button"
                    >
                      <Download aria-hidden="true" size={16} />
                    </button>
                    <button
                      aria-label={`Excluir ${document.title}`}
                      className="rounded-control grid size-7 place-items-center border-0 bg-red-100 p-0 text-red-500 transition-colors hover:text-red-700"
                      onClick={() => onRequestDelete(document)}
                      title="Excluir"
                      type="button"
                    >
                      <Trash2 aria-hidden="true" size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
