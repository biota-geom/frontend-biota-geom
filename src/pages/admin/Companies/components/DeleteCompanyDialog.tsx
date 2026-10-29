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
import type { CompanyListItem } from '../../../../features/companies/types';
import { ApiError } from '../../../../services/api/apiError';
import { deleteCompany } from '../../../../services/api/customersApi';

type DeleteCompanyDialogProps = {
  company: CompanyListItem | null;
  onDeleted: () => void;
  onOpenChange: (open: boolean) => void;
};

const DELETE_ERROR = 'Não foi possível excluir a empresa.';

export function DeleteCompanyDialog({
  company,
  onDeleted,
  onOpenChange,
}: DeleteCompanyDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!company) return null;
  const selectedCompany = company;

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) setError(null);
    onOpenChange(nextOpen);
  }

  async function handleConfirm() {
    setError(null);
    setIsSubmitting(true);

    try {
      await deleteCompany(selectedCompany.id);
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
    <Dialog onOpenChange={handleOpenChange} open>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir empresa</DialogTitle>
          <DialogDescription>
            A empresa será removida da sua lista. Esta ação não poderá ser
            desfeita pela plataforma.
          </DialogDescription>
        </DialogHeader>

        <p className="m-0 font-semibold text-text-primary">
          {selectedCompany.name}
        </p>

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
            {isSubmitting ? 'Excluindo...' : 'Excluir empresa'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
