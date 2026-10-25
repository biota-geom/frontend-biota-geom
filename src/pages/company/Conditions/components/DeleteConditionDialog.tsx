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
import type { LicenseCondition } from '../../../../features/licenseConditions/types';
import { ApiError } from '../../../../services/api/apiError';
import { deleteLicenseCondition } from '../../../../services/api/licenseConditionsApi';

type DeleteConditionDialogProps = {
  companyId: string;
  condition: LicenseCondition | null;
  onDeleted: (conditionName: string) => void;
  onOpenChange: (open: boolean) => void;
};

const DELETE_ERROR = 'Não foi possível remover a condicionante.';

export function DeleteConditionDialog({
  companyId,
  condition,
  onDeleted,
  onOpenChange,
}: DeleteConditionDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) setError(null);
    onOpenChange(nextOpen);
  }

  async function handleConfirm() {
    if (!condition) return;

    setError(null);
    setIsSubmitting(true);

    try {
      await deleteLicenseCondition(
        companyId,
        condition.licenseId,
        condition.id
      );
      onDeleted(condition.name);
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
    <Dialog onOpenChange={handleOpenChange} open={condition !== null}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remover condicionante</DialogTitle>
          <DialogDescription>
            Deseja remover esta condicionante? Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>

        {condition ? (
          <p className="m-0 text-sm font-semibold text-text-primary">
            {condition.name}
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
            {isSubmitting ? 'Removendo...' : 'Remover'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
