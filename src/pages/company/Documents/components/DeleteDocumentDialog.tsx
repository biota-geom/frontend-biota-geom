import { useState } from 'react';
import { Button } from '@/components/ui/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/shadcn/dialog';
import type { CompanyDocument } from '../../../../features/documents/types';
import { ApiError } from '../../../../services/api/apiError';
import { deleteDocument } from '../../../../services/api/documentsApi';

type DeleteDocumentDialogProps = {
  companyId: string;
  document: CompanyDocument | null;
  onDeleted: () => void;
  onOpenChange: (open: boolean) => void;
};

const DELETE_ERROR = 'Não foi possível excluir o documento.';

export function DeleteDocumentDialog({
  companyId,
  document,
  onDeleted,
  onOpenChange,
}: DeleteDocumentDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) setError(null);
    onOpenChange(nextOpen);
  }

  async function handleConfirm() {
    if (!document) return;

    setError(null);
    setIsSubmitting(true);

    try {
      await deleteDocument(companyId, document.id);
      onDeleted();
      handleOpenChange(false);
    } catch (caughtError) {
      setError(
        caughtError instanceof ApiError ? caughtError.message : DELETE_ERROR
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={document !== null}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir documento</DialogTitle>
          <DialogDescription>
            Excluir este documento? Ele deixará de aparecer na lista.
          </DialogDescription>
        </DialogHeader>

        {document ? (
          <p className="m-0 text-sm font-semibold text-text-primary">
            {document.title}
          </p>
        ) : null}

        {error ? (
          <p className="m-0 text-sm text-red-600" role="alert">
            {error}
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
            disabled={isSubmitting}
            onClick={() => void handleConfirm()}
            type="button"
            variant="dialogDanger"
          >
            {isSubmitting ? 'Excluindo...' : 'Excluir'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
