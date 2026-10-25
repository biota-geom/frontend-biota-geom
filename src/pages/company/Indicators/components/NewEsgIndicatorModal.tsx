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
import {
  InputGroup,
  InputGroupAddon,
} from '@/components/ui/shadcn/input-group';
import { Label } from '@/components/ui/shadcn/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select';
import {
  INDICATOR_CATEGORIES,
  getPreviousMonth,
  isValidMonth,
  numericIndicatorField,
} from '../../../../features/esgIndicators/esgIndicatorsValidation';
import type { MonthlyIndicator } from '../../../../features/esgIndicators/types';
import { ApiError } from '../../../../services/api/apiError';
import {
  createCustomerIndicator,
  saveEsgIndicators,
} from '../../../../services/api/esgIndicatorsApi';
import type { IndicatorCategory } from '../../../../features/esgIndicators/esgIndicatorsValidation';

const GENERIC_SAVE_ERROR =
  'Não foi possível salvar os indicadores. Tente novamente mais tarde.';
const GENERIC_CREATE_ERROR =
  'Não foi possível criar o indicador. Tente novamente mais tarde.';
const NOTHING_TO_SAVE_MESSAGE = 'Preencha ao menos um indicador para salvar.';

// id used to associate the footer submit button with the registration form
// (the footer lives outside the <form> so the inline creation form is not nested)
const NEW_RECORD_FORM_ID = 'new-esg-indicator-form';

// ---------------------------------------------------------------------------
// Inline indicator creation form (rendered next to the registration form,
// never inside it: nested <form> elements are invalid HTML)
// ---------------------------------------------------------------------------

type CreateIndicatorFormProps = {
  onCancel: () => void;
  onCreated: (indicator: MonthlyIndicator) => void;
  companyId: string;
};

function CreateIndicatorForm({
  companyId,
  onCancel,
  onCreated,
}: CreateIndicatorFormProps) {
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [category, setCategory] = useState<IndicatorCategory>('Ambiental');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Informe o nome do indicador.');
      return;
    }
    if (!unit.trim()) {
      setError('Informe a unidade de medida.');
      return;
    }

    setIsSubmitting(true);
    try {
      const indicator = await createCustomerIndicator(companyId, {
        name: name.trim(),
        unit: unit.trim(),
        category,
      });
      onCreated(indicator);
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught.message : GENERIC_CREATE_ERROR
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      aria-label="Formulário de criação de indicador"
      className="flex flex-col gap-4 rounded-sm border border-border bg-surface-subtle p-4"
      noValidate
      onSubmit={(event) => void handleSubmit(event)}
    >
      <p className="text-sm font-bold text-text-primary">+ Novo Indicador</p>

      <div className="grid grid-cols-2 gap-4 max-[480px]:grid-cols-1">
        <div className="flex flex-col gap-2">
          <Label
            className="text-sm font-bold text-text-primary"
            htmlFor="new-ind-name"
          >
            Nome
          </Label>
          <InputGroup variant="field">
            <Input
              id="new-ind-name"
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Consumo de Combustível"
              value={name}
            />
          </InputGroup>
        </div>

        <div className="flex flex-col gap-2">
          <Label
            className="text-sm font-bold text-text-primary"
            htmlFor="new-ind-unit"
          >
            Unidade
          </Label>
          <InputGroup variant="field">
            <Input
              id="new-ind-unit"
              onChange={(e) => setUnit(e.target.value)}
              placeholder="Ex: L"
              value={unit}
            />
          </InputGroup>
        </div>

        <div className="col-span-2 flex flex-col gap-2 max-[480px]:col-span-1">
          <Label
            className="text-sm font-bold text-text-primary"
            htmlFor="new-ind-category"
          >
            Categoria
          </Label>
          <Select
            onValueChange={(v) => setCategory(v as IndicatorCategory)}
            value={category}
          >
            <SelectTrigger
              aria-label="Categoria do indicador"
              className="min-h-[42px] w-full justify-between border-border bg-surface text-sm text-text-primary focus:border-focus"
              id="new-ind-category"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-border bg-surface">
              {INDICATOR_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <p className="m-0 text-sm font-semibold text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-3">
        <Button onClick={onCancel} type="button" variant="subtle">
          Cancelar
        </Button>
        <Button disabled={isSubmitting} type="submit" variant="dialogPrimary">
          {isSubmitting ? 'Criando...' : 'Criar Indicador'}
        </Button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Inner form — bulk registration for company indicators
// ---------------------------------------------------------------------------

type NewEsgIndicatorFormProps = {
  companyId: string;
  initialMonth?: string;
  onClose: () => void;
  onSaved: (month: string) => void;
  savedIndicators?: MonthlyIndicator[] | null;
};

function NewEsgIndicatorForm({
  companyId,
  initialMonth,
  onClose,
  onSaved,
  savedIndicators,
}: NewEsgIndicatorFormProps) {
  const [month, setMonth] = useState(() => initialMonth || getPreviousMonth());

  /*
   * The working list of indicators. Starts from what was loaded, and grows
   * when the user creates a new indicator inline.
   */
  const [indicators, setIndicators] = useState<MonthlyIndicator[]>(
    () => savedIndicators ?? []
  );

  // String-keyed input values: { [indicator_id]: string }
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const ind of savedIndicators ?? []) {
      initial[ind.indicator_id] =
        ind.value !== null && ind.value !== undefined ? String(ind.value) : '';
    }
    return initial;
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  function handleIndicatorCreated(newIndicator: MonthlyIndicator) {
    setIndicators((prev) => [...prev, newIndicator]);
    setValues((prev) => ({ ...prev, [newIndicator.indicator_id]: '' }));
    setShowCreateForm(false);
  }

  function validateAll(): boolean {
    const errors: Record<string, string> = {};
    for (const ind of indicators) {
      const raw = values[ind.indicator_id] ?? '';
      const result = numericIndicatorField.safeParse(raw);
      if (!result.success) {
        errors[ind.indicator_id] =
          result.error.issues[0]?.message ?? 'Valor inválido.';
      }
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitError(null);

    if (!isValidMonth(month)) {
      setSubmitError('Selecione um mês de referência válido.');
      return;
    }

    if (!validateAll()) return;

    const records: { indicator_id: string; value: number | null }[] = [];
    for (const ind of indicators) {
      const raw = values[ind.indicator_id] ?? '';
      if (raw.trim() !== '') {
        records.push({ indicator_id: ind.indicator_id, value: Number(raw) });
      }
    }

    if (records.length === 0) {
      setSubmitError(NOTHING_TO_SAVE_MESSAGE);
      return;
    }

    setIsSubmitting(true);
    try {
      await saveEsgIndicators(companyId, month, { records });
      onSaved(month);
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
    <div className="mt-4 flex flex-col gap-6">
      {/* Registration form: month + indicator values */}
      <form
        aria-label="Formulário de novo registro de indicador"
        className="flex flex-col gap-6"
        id={NEW_RECORD_FORM_ID}
        noValidate
        onSubmit={(event) => void handleSubmit(event)}
      >
        {/* Month selector */}
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

        {/* Dynamic indicator fields */}
        {indicators.length > 0 ? (
          <div className="grid grid-cols-2 gap-5 max-[480px]:grid-cols-1">
            {indicators.map((ind) => {
              const err = fieldErrors[ind.indicator_id];
              const inputId = `esg-modal-${ind.indicator_id}`;

              return (
                <div className="flex flex-col gap-2" key={ind.indicator_id}>
                  <Label
                    className="text-sm font-bold text-text-primary"
                    htmlFor={inputId}
                  >
                    {ind.name} ({ind.unit})
                  </Label>
                  <InputGroup variant="field">
                    <Input
                      id={inputId}
                      inputMode="decimal"
                      min={0}
                      onChange={(e) =>
                        setValues((prev) => ({
                          ...prev,
                          [ind.indicator_id]: e.target.value,
                        }))
                      }
                      placeholder="0"
                      step="any"
                      type="number"
                      value={values[ind.indicator_id] ?? ''}
                    />
                    <InputGroupAddon className="text-[13px] font-bold">
                      {ind.unit}
                    </InputGroupAddon>
                  </InputGroup>
                  {err && (
                    <p
                      className="m-0 text-[13px] font-semibold text-destructive"
                      role="alert"
                    >
                      {err}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-text-secondary">
            Esta empresa ainda não tem indicadores configurados.
          </p>
        )}
      </form>

      {/* Inline indicator creation: sibling of the registration form, not nested */}
      {showCreateForm ? (
        <CreateIndicatorForm
          companyId={companyId}
          onCancel={() => setShowCreateForm(false)}
          onCreated={handleIndicatorCreated}
        />
      ) : (
        <button
          className="self-start text-sm font-bold text-primary underline"
          onClick={() => setShowCreateForm(true)}
          type="button"
        >
          + Novo Indicador
        </button>
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
        <Button
          disabled={isSubmitting}
          form={NEW_RECORD_FORM_ID}
          type="submit"
          variant="dialogPrimary"
        >
          {isSubmitting ? 'Salvando...' : 'Registrar Dados'}
        </Button>
      </DialogFooter>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Public modal wrapper
// ---------------------------------------------------------------------------

type NewEsgIndicatorModalProps = {
  companyId: string;
  initialMonth?: string;
  onOpenChange: (open: boolean) => void;
  onSaved: (month: string) => void;
  open: boolean;
  savedIndicators?: MonthlyIndicator[] | null;
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
            key={`${initialMonth}-${String(savedIndicators?.length ?? 0)}`}
            onClose={() => onOpenChange(false)}
            onSaved={onSaved}
            savedIndicators={savedIndicators}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
