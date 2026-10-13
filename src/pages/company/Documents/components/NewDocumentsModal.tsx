import { type ChangeEvent, useRef, useState } from 'react';
import { CheckCircle2, FileUp, X } from 'lucide-react';
import { Button } from '@/components/ui/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/shadcn/dialog';
import { Input } from '@/components/ui/shadcn/input';
import { InputGroup } from '@/components/ui/shadcn/input-group';
import { Label } from '@/components/ui/shadcn/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select';
import {
  DOCUMENT_FILE_ACCEPT,
  type DocumentDraftErrors,
  validateDocumentDraft,
  validateDocumentFile,
} from '../../../../features/documents/documentValidation';
import {
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_TYPES,
  type DocumentType,
} from '../../../../features/documents/types';
import { ApiError } from '../../../../services/api/apiError';
import { createDocument } from '../../../../services/api/documentsApi';

type UploadStatus = 'pending' | 'uploading' | 'success' | 'error';

type DocumentDraft = {
  id: number;
  file: File;
  title: string;
  type: DocumentType | '';
  documentDate: string;
  errors: DocumentDraftErrors;
  status: UploadStatus;
  serverError: string | null;
};

type NewDocumentsModalProps = {
  companyId: string;
  onOpenChange: (open: boolean) => void;
  onUploaded: (count: number) => void;
  open: boolean;
};

const GENERIC_UPLOAD_ERROR = 'Não foi possível enviar este documento.';

function formatFileSize(sizeBytes: number): string {
  if (sizeBytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(sizeBytes / 1024))} KB`;
  }
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function NewDocumentsModal({
  companyId,
  onOpenChange,
  onUploaded,
  open,
}: NewDocumentsModalProps) {
  const [drafts, setDrafts] = useState<DocumentDraft[]>([]);
  const [selectionErrors, setSelectionErrors] = useState<string[]>([]);
  const [batchError, setBatchError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({
    current: 0,
    total: 0,
  });
  const nextDraftId = useRef(1);

  function resetModal() {
    setDrafts([]);
    setSelectionErrors([]);
    setBatchError(null);
    setUploadProgress({ current: 0, total: 0 });
  }

  function handleOpenChange(nextOpen: boolean) {
    if (isSubmitting) return;
    if (!nextOpen) resetModal();
    onOpenChange(nextOpen);
  }

  function handleFileSelection(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files ?? []);
    const validDrafts: DocumentDraft[] = [];
    const rejectedFiles: string[] = [];

    for (const file of selectedFiles) {
      const validationError = validateDocumentFile(file);
      if (validationError) {
        rejectedFiles.push(`${file.name}: ${validationError}`);
        continue;
      }

      validDrafts.push({
        id: nextDraftId.current++,
        file,
        title: '',
        type: '',
        documentDate: '',
        errors: {},
        status: 'pending',
        serverError: null,
      });
    }

    setDrafts((current) => [...current, ...validDrafts]);
    setSelectionErrors(rejectedFiles);
    setBatchError(null);
    event.target.value = '';
  }

  function updateDraft(
    id: number,
    field: 'title' | 'type' | 'documentDate',
    value: string
  ) {
    setDrafts((current) =>
      current.map((draft) =>
        draft.id === id
          ? {
              ...draft,
              [field]: value,
              errors: { ...draft.errors, [field]: undefined },
              serverError: null,
              status: draft.status === 'error' ? 'pending' : draft.status,
            }
          : draft
      )
    );
  }

  function removeDraft(id: number) {
    setDrafts((current) => current.filter((draft) => draft.id !== id));
    setBatchError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const pendingDrafts = drafts.filter((draft) => draft.status !== 'success');
    let hasValidationErrors = false;

    const validatedDrafts = drafts.map((draft) => {
      if (draft.status === 'success') return draft;
      const errors = validateDocumentDraft(draft);
      if (Object.keys(errors).length > 0) hasValidationErrors = true;
      return { ...draft, errors };
    });
    setDrafts(validatedDrafts);

    if (hasValidationErrors || pendingDrafts.length === 0) return;

    setIsSubmitting(true);
    setBatchError(null);
    setUploadProgress({ current: 0, total: pendingDrafts.length });
    let successCount = 0;
    let failureCount = 0;

    for (const [index, draft] of pendingDrafts.entries()) {
      setUploadProgress({ current: index + 1, total: pendingDrafts.length });
      setDrafts((current) =>
        current.map((item) =>
          item.id === draft.id
            ? { ...item, status: 'uploading', serverError: null }
            : item
        )
      );

      try {
        await createDocument(companyId, {
          file: draft.file,
          title: draft.title,
          type: draft.type as DocumentType,
          documentDate: draft.documentDate,
        });
        successCount += 1;
        setDrafts((current) =>
          current.map((item) =>
            item.id === draft.id ? { ...item, status: 'success' } : item
          )
        );
      } catch (error) {
        failureCount += 1;
        const message =
          error instanceof ApiError ? error.message : GENERIC_UPLOAD_ERROR;
        setDrafts((current) =>
          current.map((item) =>
            item.id === draft.id
              ? { ...item, status: 'error', serverError: message }
              : item
          )
        );
      }
    }

    setIsSubmitting(false);
    if (successCount > 0) onUploaded(successCount);

    if (failureCount === 0) {
      resetModal();
      onOpenChange(false);
      return;
    }

    setBatchError(
      `${failureCount} ${failureCount === 1 ? 'arquivo não foi enviado' : 'arquivos não foram enviados'}. Revise os erros e tente novamente.`
    );
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent
        className="max-h-[92vh] overflow-y-auto sm:max-w-4xl"
        showCloseButton={!isSubmitting}
      >
        <DialogHeader>
          <DialogTitle>Enviar documentos</DialogTitle>
          <DialogDescription>
            Selecione os arquivos e informe os dados de cada documento.
          </DialogDescription>
        </DialogHeader>

        <form noValidate onSubmit={(event) => void handleSubmit(event)}>
          <label className="rounded-panel flex cursor-pointer flex-col items-center justify-center gap-2 border border-dashed border-border-strong bg-surface-muted px-5 py-6 text-center transition-colors hover:border-primary hover:bg-emerald-50/40">
            <FileUp
              aria-hidden="true"
              className="text-primary-strong"
              size={26}
            />
            <span className="text-sm font-bold text-text-primary">
              Selecionar arquivos
            </span>
            <span className="text-xs text-text-muted">
              PDF, JPG, PNG ou DOCX · máximo de 20 MB por arquivo
            </span>
            <input
              accept={DOCUMENT_FILE_ACCEPT}
              className="sr-only"
              disabled={isSubmitting}
              multiple
              onChange={handleFileSelection}
              type="file"
            />
          </label>

          {selectionErrors.length > 0 ? (
            <div
              className="mt-3 rounded-control border border-red-200 bg-red-50 px-3 py-2 text-[13px] font-semibold text-red-700"
              role="alert"
            >
              {selectionErrors.map((message) => (
                <p className="m-0" key={message}>
                  {message}
                </p>
              ))}
            </div>
          ) : null}

          {drafts.length === 0 ? (
            <p className="my-5 text-center text-sm text-text-muted">
              Nenhum arquivo selecionado.
            </p>
          ) : (
            <div className="my-5 flex flex-col gap-4">
              {drafts.map((draft, index) => {
                const isUploaded = draft.status === 'success';
                return (
                  <fieldset
                    className="rounded-panel border border-border bg-surface p-4"
                    disabled={isSubmitting || isUploaded}
                    key={draft.id}
                  >
                    <legend className="sr-only">Documento {index + 1}</legend>
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="m-0 truncate text-sm font-bold text-text-primary">
                          {draft.file.name}
                        </p>
                        <p className="mt-1 mb-0 text-xs text-text-muted">
                          {formatFileSize(draft.file.size)}
                        </p>
                      </div>
                      {isUploaded ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-strong">
                          <CheckCircle2 aria-hidden="true" size={16} />
                          Enviado
                        </span>
                      ) : (
                        <Button
                          aria-label={`Remover ${draft.file.name}`}
                          disabled={isSubmitting}
                          onClick={() => removeDraft(draft.id)}
                          type="button"
                          variant="iconDanger"
                        >
                          <X aria-hidden="true" size={15} />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-[minmax(0,1fr)_180px_180px] gap-4 max-[720px]:grid-cols-1">
                      <div className="flex flex-col gap-2">
                        <Label htmlFor={`document-title-${draft.id}`}>
                          Título
                        </Label>
                        <InputGroup
                          aria-invalid={Boolean(draft.errors.title)}
                          variant="field"
                        >
                          <Input
                            id={`document-title-${draft.id}`}
                            onChange={(event) =>
                              updateDraft(draft.id, 'title', event.target.value)
                            }
                            placeholder="Ex: Contrato de prestação de serviços"
                            value={draft.title}
                          />
                        </InputGroup>
                        {draft.errors.title ? (
                          <p
                            className="m-0 text-xs font-semibold text-red-600"
                            role="alert"
                          >
                            {draft.errors.title}
                          </p>
                        ) : null}
                      </div>

                      <div className="flex flex-col gap-2">
                        <Label htmlFor={`document-type-${draft.id}`}>
                          Tipo
                        </Label>
                        <Select
                          disabled={isSubmitting || isUploaded}
                          onValueChange={(value) =>
                            updateDraft(draft.id, 'type', value)
                          }
                          value={draft.type}
                        >
                          <SelectTrigger
                            aria-invalid={Boolean(draft.errors.type)}
                            className="h-[42px] w-full"
                            id={`document-type-${draft.id}`}
                          >
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {DOCUMENT_TYPES.map((type) => (
                              <SelectItem key={type} value={type}>
                                {DOCUMENT_TYPE_LABELS[type]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {draft.errors.type ? (
                          <p
                            className="m-0 text-xs font-semibold text-red-600"
                            role="alert"
                          >
                            {draft.errors.type}
                          </p>
                        ) : null}
                      </div>

                      <div className="flex flex-col gap-2">
                        <Label htmlFor={`document-date-${draft.id}`}>
                          Data
                        </Label>
                        <InputGroup
                          aria-invalid={Boolean(draft.errors.documentDate)}
                          variant="field"
                        >
                          <Input
                            id={`document-date-${draft.id}`}
                            onChange={(event) =>
                              updateDraft(
                                draft.id,
                                'documentDate',
                                event.target.value
                              )
                            }
                            type="date"
                            value={draft.documentDate}
                          />
                        </InputGroup>
                        {draft.errors.documentDate ? (
                          <p
                            className="m-0 text-xs font-semibold text-red-600"
                            role="alert"
                          >
                            {draft.errors.documentDate}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    {draft.serverError ? (
                      <p
                        className="mt-3 mb-0 rounded-control border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700"
                        role="alert"
                      >
                        {draft.serverError}
                      </p>
                    ) : null}
                  </fieldset>
                );
              })}
            </div>
          )}

          {batchError ? (
            <p
              className="mb-4 rounded-control border border-red-200 bg-red-50 px-3 py-2 text-[13px] font-semibold text-red-700"
              role="alert"
            >
              {batchError}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              disabled={isSubmitting}
              onClick={() => handleOpenChange(false)}
              type="button"
              variant="subtle"
            >
              Cancelar
            </Button>
            <Button
              disabled={isSubmitting || drafts.length === 0}
              type="submit"
              variant="dialogPrimary"
            >
              {isSubmitting
                ? `Enviando ${uploadProgress.current} de ${uploadProgress.total}...`
                : drafts.some((draft) => draft.status === 'error')
                  ? 'Tentar novamente'
                  : 'Enviar documentos'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
