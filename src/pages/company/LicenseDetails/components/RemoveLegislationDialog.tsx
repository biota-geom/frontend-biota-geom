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
import {
  formatLegislationNumber,
  formatLegislationType,
} from '../../../../features/legislation/legislationFormatting';
import type { LicenseLegislation } from '../../../../features/legislation/types';
import { ApiError } from '../../../../services/api/apiError';
import { removeLicenseLegislation } from '../../../../services/api/legislationsApi';

const REMOVE_ERROR =
  'Não foi possível remover a legislação. Tente novamente mais tarde.';

interface RemoveLegislationDialogProps {
  licenseId: string;
  /** The radar entry to remove; `null` keeps the dialog closed. */
  item: LicenseLegislation | null;
  onOpenChange: (open: boolean) => void;
  onRemoved: (item: LicenseLegislation) => void;
}

export function RemoveLegislationDialog({
  item,
  licenseId,
  onOpenChange,
  onRemoved,
}: RemoveLegislationDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!item) return null;
  const selectedItem = item;

  function handleOpenChange(nextOpen: boolean) {
    if (isSubmitting) return;
    if (!nextOpen) setError(null);
    onOpenChange(nextOpen);
  }

  async function handleConfirm() {
    setError(null);
    setIsSubmitting(true);

    try {
      await removeLicenseLegislation(licenseId, selectedItem.id);
      setIsSubmitting(false);
      onRemoved(selectedItem);
      onOpenChange(false);
    } catch (caughtError) {
      setIsSubmitting(false);
      setError(
        caughtError instanceof ApiError ? caughtError.message : REMOVE_ERROR
      );
    }
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remover legislação</DialogTitle>
          <DialogDescription>
            A legislação deixará o radar desta licença, mas continuará vinculada
            às outras licenças que a citam.
          </DialogDescription>
        </DialogHeader>

        <p className="m-0 font-semibold text-text-primary">
          {formatLegislationType(selectedItem.legislation.type)}{' '}
          {formatLegislationNumber(selectedItem.legislation)}
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
            {isSubmitting ? 'Removendo...' : 'Remover legislação'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
