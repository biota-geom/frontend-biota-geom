import { useState } from 'react';
import { Button } from '@/components/ui/shadcn/button';
import { Input } from '@/components/ui/shadcn/input';
import {
  InputGroup,
  InputGroupAddon,
} from '@/components/ui/shadcn/input-group';
import { Label } from '@/components/ui/shadcn/label';
import {
  isValidMonth,
  numericIndicatorField,
  toFormValues,
  toPayload,
} from '../../../../features/esgIndicators/esgIndicatorsValidation';
import type { EsgIndicatorsLoadStatus } from '../../../../features/esgIndicators/useEsgIndicators';
import type { MonthlyIndicator } from '../../../../features/esgIndicators/types';
import { ApiError } from '../../../../services/api/apiError';
import { saveEsgIndicators } from '../../../../services/api/esgIndicatorsApi';

const SAVE_ERROR_MESSAGE =
  'Não foi possível salvar os indicadores. Tente novamente mais tarde.';
const NOTHING_TO_SAVE_MESSAGE = 'Preencha ao menos um indicador para salvar.';

type FieldErrors = Record<string, string>;

type EsgIndicatorsFormProps = {
  companyId: string;
  loadError: string | null;
  loadStatus: EsgIndicatorsLoadStatus;
  month: string;
  onIndicatorCreated: () => void;
  onMonthChange: (month: string) => void;
  onReload: () => void;
  onSaved: (month: string) => void;
  savedIndicators: MonthlyIndicator[] | null;
};

export function EsgIndicatorsForm({
  companyId,
  loadError,
  loadStatus,
  month,
  onIndicatorCreated,
  onMonthChange,
  onReload,
  onSaved,
  savedIndicators,
}: EsgIndicatorsFormProps) {
  /*
   * What is stored for this month right now: the loaded list, kept up to date
   * after each save. It decides which blank fields are a "clear" (null) and
   * which are simply "never informed".
   */
  const [baseline, setBaseline] = useState<MonthlyIndicator[] | null>(
    savedIndicators
  );
  const [loadedFrom, setLoadedFrom] = useState(savedIndicators);

  // A freshly loaded month replaces whatever was tracked for the previous one.
  if (loadedFrom !== savedIndicators) {
    setLoadedFrom(savedIndicators);
    setBaseline(savedIndicators);
  }

  // String-keyed form values: { [indicator_id]: string }
  const [values, setValues] = useState<Record<string, string>>(() =>
    savedIndicators ? toFormValues(savedIndicators) : {}
  );
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [rootError, setRootError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /*
   * Opens pre-filled when the month already has data, blank otherwise. Also
   * blanks the form while a month is loading, so stale values aren't shown.
   */
  const [prevSavedIndicators, setPrevSavedIndicators] =
    useState(savedIndicators);
  if (savedIndicators !== prevSavedIndicators) {
    setPrevSavedIndicators(savedIndicators);
    setValues(savedIndicators ? toFormValues(savedIndicators) : {});
    setFieldErrors({});
    setRootError(null);
  }

  const indicators = savedIndicators ?? [];
  const isMonthValid = isValidMonth(month);
  const isLoading = loadStatus === 'loading';
  const canEdit = isMonthValid && loadStatus === 'success';

  function validateAll(): boolean {
    const errors: FieldErrors = {};
    for (const indicator of indicators) {
      const raw = values[indicator.indicator_id] ?? '';
      const result = numericIndicatorField.safeParse(raw);
      if (!result.success) {
        errors[indicator.indicator_id] =
          result.error.issues[0]?.message ?? 'Valor inválido.';
      }
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setRootError(null);

    if (!validateAll()) return;

    const payload = toPayload(values, baseline ?? indicators);

    if (payload.records.length === 0) {
      setRootError(NOTHING_TO_SAVE_MESSAGE);
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await saveEsgIndicators(companyId, month, payload);
      setBaseline(updated.length > 0 ? updated : baseline);
      onSaved(month);
    } catch (error) {
      setRootError(
        error instanceof ApiError ? error.message : SAVE_ERROR_MESSAGE
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      aria-label="Cadastro mensal de indicadores ESG"
      className="rounded-panel border border-border bg-surface p-8 shadow-control max-[640px]:p-6"
      noValidate
      onSubmit={(event) => void handleSubmit(event)}
    >
      <div className="mb-6 flex max-w-[260px] flex-col gap-2">
        <Label htmlFor="esg-month">Mês de referência</Label>
        <InputGroup variant="field">
          <Input
            id="esg-month"
            onChange={(event) => onMonthChange(event.target.value)}
            type="month"
            value={month}
          />
        </InputGroup>
        {isMonthValid ? null : (
          <p
            className="m-0 text-[13px] font-semibold text-red-600"
            role="alert"
          >
            Selecione um mês válido.
          </p>
        )}
      </div>

      {isLoading ? (
        <p className="mt-0 mb-6 text-sm text-text-secondary" role="status">
          Carregando indicadores...
        </p>
      ) : null}

      {loadStatus === 'error' ? (
        <div
          className="mb-6 flex flex-wrap items-center gap-3 rounded-sm border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] text-red-700"
          role="alert"
        >
          <span>{loadError}</span>
          <button
            className="font-bold underline"
            onClick={onReload}
            type="button"
          >
            Tentar novamente
          </button>
        </div>
      ) : null}

      {canEdit && indicators.length === 0 ? (
        <p className="mb-6 text-sm text-text-secondary">
          Esta empresa ainda não tem indicadores configurados.{' '}
          <button
            className="font-bold underline"
            onClick={onIndicatorCreated}
            type="button"
          >
            Adicionar indicador
          </button>
        </p>
      ) : null}

      {indicators.length > 0 ? (
        <div className="grid grid-cols-2 gap-5 max-[640px]:grid-cols-1">
          {indicators.map((indicator) => {
            const err = fieldErrors[indicator.indicator_id];
            const inputId = `esg-${indicator.indicator_id}`;
            const errorId = `${inputId}-error`;

            return (
              <div className="flex flex-col gap-2" key={indicator.indicator_id}>
                <Label htmlFor={inputId}>{indicator.name}</Label>
                <InputGroup aria-invalid={Boolean(err)} variant="field">
                  <Input
                    aria-describedby={err ? errorId : undefined}
                    aria-invalid={Boolean(err)}
                    disabled={!canEdit}
                    id={inputId}
                    inputMode="decimal"
                    min={0}
                    onChange={(e) =>
                      setValues((prev) => ({
                        ...prev,
                        [indicator.indicator_id]: e.target.value,
                      }))
                    }
                    placeholder="0"
                    step="any"
                    type="number"
                    value={values[indicator.indicator_id] ?? ''}
                  />
                  <InputGroupAddon className="text-[13px] font-bold">
                    {indicator.unit}
                  </InputGroupAddon>
                </InputGroup>
                {err ? (
                  <p
                    className="m-0 text-[13px] font-semibold text-red-600"
                    id={errorId}
                    role="alert"
                  >
                    {err}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}

      {rootError ? (
        <p
          className="mt-6 mb-0 text-[13px] font-semibold text-red-600"
          role="alert"
        >
          {rootError}
        </p>
      ) : null}

      <div className="mt-8 flex justify-end max-[640px]:justify-stretch">
        <Button
          className="max-[640px]:w-full"
          disabled={!canEdit || isSubmitting}
          type="submit"
          variant="dialogPrimary"
        >
          {isSubmitting ? 'Salvando...' : 'Salvar indicadores'}
        </Button>
      </div>
    </form>
  );
}
