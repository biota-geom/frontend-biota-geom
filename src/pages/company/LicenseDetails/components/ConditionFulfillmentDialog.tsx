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
import type { LicenseConditionDetail } from '../../../../features/licenses/types';
import { ApiError } from '../../../../services/api/apiError';
import { saveConditionsFulfillment } from '../../../../services/api/licensesApi';

export type FulfillmentIntent = {
  condition: LicenseConditionDetail;
  fulfilled: boolean;
};

type ConditionFulfillmentDialogProps = {
  companyId: string;
  licenseId: string;
  intent: FulfillmentIntent | null;
  onSaved: (intent: FulfillmentIntent) => void;
  onOpenChange: (open: boolean) => void;
};

const SAVE_ERROR = 'Não foi possível atualizar o cumprimento.';

export function ConditionFulfillmentDialog({
  companyId,
  licenseId,
  intent,
  onSaved,
  onOpenChange,
}: ConditionFulfillmentDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) setError(null);
    onOpenChange(nextOpen);
  }

  async function handleConfirm() {
    if (!intent?.condition.id) return;

    setError(null);
    setIsSubmitting(true);

    try {
      await saveConditionsFulfillment(companyId, licenseId, [
        { conditionId: intent.condition.id, fulfilled: intent.fulfilled },
      ]);
      onSaved(intent);
      handleOpenChange(false);
    } catch (caughtError) {
      setError(
        caughtError instanceof ApiError ? caughtError.message : SAVE_ERROR
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const isMarking = intent?.fulfilled ?? false;

  return (
    <Dialog onOpenChange={handleOpenChange} open={intent !== null}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isMarking ? 'Marcar como cumprida' : 'Desfazer cumprimento'}
          </DialogTitle>
          <DialogDescription>
            {isMarking
              ? 'A condicionante passa a contar como cumprida e entra na conformidade da empresa.'
              : 'A condicionante volta a ser cobrada. Se o prazo já passou, ela fica como vencida.'}
          </DialogDescription>
        </DialogHeader>

        {intent ? (
          <p className="m-0 text-sm font-semibold text-text-primary">
            {intent.condition.name ?? intent.condition.environmentalDescriptor}
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
            variant="dialogPrimary"
          >
            {isSubmitting
              ? 'Salvando...'
              : isMarking
                ? 'Marcar como cumprida'
                : 'Desfazer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
