import { FileText } from 'lucide-react';
import {
  DOCUMENT_TYPE_LABELS,
  type CompanyDocument,
} from '../../../../features/documents/types';

const DATE_FORMATTER = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' });
const DATE_TIME_FORMATTER = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
});

const COLUMNS = [
  'Título',
  'Tipo',
  'Data do documento',
  'Enviado por',
  'Enviado em',
] as const;

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
        {COLUMNS.map((column) => (
          <th
            className="px-5 py-3 text-xs font-semibold text-text-muted"
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
  documents,
}: {
  documents: CompanyDocument[];
}) {
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
                <td className="px-5 py-4 text-text-secondary">
                  {DOCUMENT_TYPE_LABELS[document.type]}
                </td>
                <td className="px-5 py-4 whitespace-nowrap text-text-secondary">
                  {formatDate(document.documentDate)}
                </td>
                <td className="px-5 py-4 text-text-secondary">
                  {document.uploadedBy.name}
                </td>
                <td className="px-5 py-4 whitespace-nowrap text-text-secondary">
                  {formatDateTime(document.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
