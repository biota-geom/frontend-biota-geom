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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select';
import {
  ESG_INDICATOR_FIELDS,
  getPreviousMonth,
  INTEGER_ONLY_MESSAGE,
  INVALID_NUMBER_MESSAGE,
  isValidMonth,
  NEGATIVE_NUMBER_MESSAGE,
} from '../../../../features/esgIndicators/esgIndicatorsValidation';
import type {
  EsgIndicatorKey,
  EsgIndicatorsPayload,
  EsgMonthlyIndicators,
} from '../../../../features/esgIndicators/types';
import { ApiError } from '../../../../services/api/apiError';
import { saveEsgIndicators } from '../../../../services/api/esgIndicatorsApi';

const INDICATOR_OPTIONS: ReadonlyArray<{
  key: EsgIndicatorKey;
  label: string;
}> = [
  { key: 'water', label: 'Consumo de Água' },
  { key: 'waste', label: 'Resíduos Gerados' },
  { key: 'employees', label: 'Nº de Funcionários' },
  { key: 'energy', label: 'Consumo de Energia Elétrica' },
];

const GENERIC_SAVE_ERROR =
  'Não foi possível salvar o indicador. Tente novamente mais tarde.';

type NewEsgIndicatorFormProps = {
  companyId: string;
  initialMonth?: string;
  onClose: () => void;
  onSaved: (month: string, indicatorKey?: EsgIndicatorKey) => void;
  savedIndicators?: EsgMonthlyIndicators | null;
};

function NewEsgIndicatorForm({
  companyId,
  initialMonth,
  onClose,
  onSaved,
  savedIndicators,
}: NewEsgIndicatorFormProps) {
  const [selectedIndicator, setSelectedIndicator] = useState<
    EsgIndicatorKey | 'all'
  >('water');
  const [month, setMonth] = useState(() => initialMonth || getPreviousMonth());
  const [value, setValue] = useState(() => {
    const savedVal = savedIndicators?.water;
    return savedVal !== null && savedVal !== undefined ? String(savedVal) : '';
  });
  const [bulkValues, setBulkValues] = useState<Record<EsgIndicatorKey, string>>(
    () => ({
      water:
        savedIndicators?.water !== null && savedIndicators?.water !== undefined
          ? String(savedIndicators.water)
          : '',
      waste:
        savedIndicators?.waste !== null && savedIndicators?.waste !== undefined
          ? String(savedIndicators.waste)
          : '',
      employees:
        savedIndicators?.employees !== null &&
        savedIndicators?.employees !== undefined
          ? String(savedIndicators.employees)
          : '',
      energy:
        savedIndicators?.energy !== null &&
        savedIndicators?.energy !== undefined
          ? String(savedIndicators.energy)
          : '',
    })
  );

  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleIndicatorChange(next: string) {
    const key = next as EsgIndicatorKey | 'all';
    setSelectedIndicator(key);
    setFieldError(null);

    if (key !== 'all' && savedIndicators) {
      const savedVal = savedIndicators[key];
      setValue(
        savedVal !== null && savedVal !== undefined ? String(savedVal) : ''
      );
    } else {
      setValue('');
    }
  }

  function validateSingleValue(
    indicatorKey: EsgIndicatorKey,
    valStr: string
  ): string | null {
    if (!valStr.trim()) {
      return 'Informe o valor medido.';
    }

    const parsed = Number(valStr);
    if (!Number.isFinite(parsed)) {
      return INVALID_NUMBER_MESSAGE;
    }
    if (parsed < 0) {
      return NEGATIVE_NUMBER_MESSAGE;
    }
    if (indicatorKey === 'employees' && !Number.isInteger(parsed)) {
      return INTEGER_ONLY_MESSAGE;
    }

    return null;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFieldError(null);
    setSubmitError(null);

    if (!isValidMonth(month)) {
      setFieldError('Selecione um mês de referência válido.');
      return;
    }

    let payload: EsgIndicatorsPayload = {};

    if (selectedIndicator !== 'all') {
      const errorMsg = validateSingleValue(selectedIndicator, value);
      if (errorMsg) {
        setFieldError(errorMsg);
        return;
      }
      payload = { [selectedIndicator]: Number(value) };
    } else {
      let hasAtLeastOne = false;
      for (const field of ESG_INDICATOR_FIELDS) {
        const raw = bulkValues[field.key];
        if (raw.trim() !== '') {
          hasAtLeastOne = true;
          const errorMsg = validateSingleValue(field.key, raw);
          if (errorMsg) {
            setFieldError(`${field.label}: ${errorMsg}`);
            return;
          }
          payload[field.key] = Number(raw);
        }
      }

      if (!hasAtLeastOne) {
        setFieldError('Preencha ao menos um indicador para salvar.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await saveEsgIndicators(companyId, month, payload);
      onSaved(
        month,
        selectedIndicator !== 'all' ? selectedIndicator : undefined
      );
      onClose();
    } catch (caught) {
      setSubmitError(
        caught instanceof ApiError ? caught.message : GENERIC_SAVE_ERROR
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      aria-label="Formulário de novo registro de indicador"
      className="mt-4 flex flex-col gap-6"
      noValidate
      onSubmit={(event) => void handleSubmit(event)}
    >
      {/* Indicador Select */}
      <div className="flex flex-col gap-2">
        <Label
          className="text-sm font-bold text-text-primary"
          htmlFor="esg-indicator-select"
        >
          Indicador
        </Label>
        <Select onValueChange={handleIndicatorChange} value={selectedIndicator}>
          <SelectTrigger
            aria-label="Indicador"
            className="min-h-[42px] w-full justify-between border-border bg-surface text-sm text-text-primary focus:border-focus"
            id="esg-indicator-select"
          >
            <SelectValue placeholder="Selecione o indicador" />
          </SelectTrigger>
          <SelectContent className="border-border bg-surface">
            {INDICATOR_OPTIONS.map((opt) => (
              <SelectItem key={opt.key} value={opt.key}>
                {opt.label}
              </SelectItem>
            ))}
            <SelectItem value="all">Todos os Indicadores</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {selectedIndicator !== 'all' ? (
        /* Prototype 2-column layout */
        <div className="grid grid-cols-2 gap-5 max-[480px]:grid-cols-1">
          <div className="flex flex-col gap-2">
            <Label
              className="text-sm font-bold text-text-primary"
              htmlFor="esg-modal-month"
            >
              Mês de Referência
            </Label>
            <InputGroup variant="field">
              <Input
                id="esg-modal-month"
                onChange={(e) => setMonth(e.target.value)}
                type="month"
                value={month}
              />
            </InputGroup>
          </div>

          <div className="flex flex-col gap-2">
            <Label
              className="text-sm font-bold text-text-primary"
              htmlFor="esg-modal-value"
            >
              Valor Medido
            </Label>
            <InputGroup variant="field">
              <Input
                id="esg-modal-value"
                min={0}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Ex: 12.450"
                step={selectedIndicator === 'employees' ? 1 : 'any'}
                type="number"
                value={value}
              />
            </InputGroup>
          </div>
        </div>
      ) : (
        /* Bulk fields layout */
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label
              className="text-sm font-bold text-text-primary"
              htmlFor="esg-modal-month-bulk"
            >
              Mês de Referência
            </Label>
            <InputGroup variant="field">
              <Input
                id="esg-modal-month-bulk"
                onChange={(e) => setMonth(e.target.value)}
                type="month"
                value={month}
              />
            </InputGroup>
          </div>

          <div className="grid grid-cols-2 gap-5 max-[480px]:grid-cols-1">
            {ESG_INDICATOR_FIELDS.map((field) => (
              <div className="flex flex-col gap-2" key={field.key}>
                <Label
                  className="text-sm font-bold text-text-primary"
                  htmlFor={`esg-modal-${field.key}`}
                >
                  {field.label} ({field.unit})
                </Label>
                <InputGroup variant="field">
                  <Input
                    id={`esg-modal-${field.key}`}
                    min={0}
                    onChange={(e) =>
                      setBulkValues((prev) => ({
                        ...prev,
                        [field.key]: e.target.value,
                      }))
                    }
                    placeholder={field.placeholder}
                    step={field.key === 'employees' ? 1 : 'any'}
                    type="number"
                    value={bulkValues[field.key]}
                  />
                </InputGroup>
              </div>
            ))}
          </div>
        </div>
      )}

      {fieldError && (
        <p className="m-0 text-sm font-semibold text-destructive" role="alert">
          {fieldError}
        </p>
      )}

      {submitError && (
        <p
          className="m-0 rounded-sm border border-red-200 bg-red-50 p-3 text-sm font-semibold text-destructive"
          role="alert"
        >
          {submitError}
        </p>
      )}

      <DialogFooter className="mt-6 flex justify-end gap-3">
        <Button onClick={onClose} type="button" variant="subtle">
          Cancelar
        </Button>
        <Button disabled={isSubmitting} type="submit" variant="dialogPrimary">
          {isSubmitting ? 'Salvando...' : 'Registrar Dados'}
        </Button>
      </DialogFooter>
    </form>
  );
}

type NewEsgIndicatorModalProps = {
  companyId: string;
  initialMonth?: string;
  onOpenChange: (open: boolean) => void;
  onSaved: (month: string, indicatorKey?: EsgIndicatorKey) => void;
  open: boolean;
  savedIndicators?: EsgMonthlyIndicators | null;
};

export function NewEsgIndicatorModal({
  companyId,
  initialMonth,
  onOpenChange,
  onSaved,
  open,
  savedIndicators,
}: NewEsgIndicatorModalProps) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[92vh] overflow-y-auto border-border bg-surface p-8 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-text-primary">
            Novo Registro de Indicador
          </DialogTitle>
          <DialogDescription className="text-sm text-text-secondary">
            Insira os dados de medição do indicador ESG para o período
            selecionado.
          </DialogDescription>
        </DialogHeader>

        {open && (
          <NewEsgIndicatorForm
            companyId={companyId}
            initialMonth={initialMonth}
            key={`${initialMonth}-${savedIndicators ? 'saved' : 'empty'}`}
            onClose={() => onOpenChange(false)}
            onSaved={onSaved}
            savedIndicators={savedIndicators}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
