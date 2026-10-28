import { type FormEvent, useState } from 'react';
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
  getPreviousMonth,
  isValidMonth,
} from '../../../../features/esgIndicators/esgIndicatorsValidation';
import type { MonthlyIndicator } from '../../../../features/esgIndicators/types';
import { ApiError } from '../../../../services/api/apiError';
import { getEsgIndicators } from '../../../../services/api/esgIndicatorsApi';

const GENERIC_LOAD_ERROR =
  'Não foi possível carregar os indicadores deste mês. Tente novamente mais tarde.';

type GenerateReportModalProps = {
  companyId: string;
  initialMonth?: string;
  onGenerated: (month: string, data: MonthlyIndicator[]) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

export function GenerateReportModal({
  companyId,
  initialMonth,
  onGenerated,
  onOpenChange,
  open,
}: GenerateReportModalProps) {
  const [month, setMonth] = useState(() => initialMonth || getPreviousMonth());
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!isValidMonth(month)) {
      setError('Selecione um mês de referência válido.');
      return;
    }

    setIsLoading(true);
    try {
      const data = await getEsgIndicators(companyId, month);
      onGenerated(month, data);
      onOpenChange(false);
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught.message : GENERIC_LOAD_ERROR
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[92vh] overflow-y-auto border-border bg-surface p-8 sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-text-primary">
            Gerar Relatório de Indicadores
          </DialogTitle>
          <DialogDescription className="text-sm text-text-secondary">
            Selecione o mês de referência para consolidar e carregar os dados no
            painel.
          </DialogDescription>
        </DialogHeader>

        <form
          aria-label="Formulário para gerar relatório"
          className="mt-4 flex flex-col gap-6"
          noValidate
          onSubmit={(event) => void handleSubmit(event)}
        >
          <div className="flex flex-col gap-2">
            <Label
              className="text-sm font-bold text-text-primary"
              htmlFor="report-month"
            >
              Mês de Referência
            </Label>
            <InputGroup variant="field">
              <Input
                id="report-month"
                onChange={(e) => setMonth(e.target.value)}
                type="month"
                value={month}
              />
            </InputGroup>
          </div>

          {error && (
            <p
              className="m-0 rounded-sm border border-red-200 bg-red-50 p-3 text-sm font-semibold text-destructive"
              role="alert"
            >
              {error}
            </p>
          )}

          <DialogFooter className="mt-6 flex justify-end gap-3">
            <Button
              onClick={() => onOpenChange(false)}
              type="button"
              variant="subtle"
            >
              Cancelar
            </Button>
            <Button disabled={isLoading} type="submit" variant="dialogPrimary">
              {isLoading ? 'Carregando...' : 'Gerar Relatório'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
