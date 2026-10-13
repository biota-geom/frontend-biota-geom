import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/shadcn/button';
import { Input } from '@/components/ui/shadcn/input';
import {
  InputGroup,
  InputGroupAddon,
} from '@/components/ui/shadcn/input-group';
import { Label } from '@/components/ui/shadcn/label';
import {
  EMPTY_ESG_FORM_VALUES,
  ESG_INDICATOR_FIELDS,
  esgIndicatorsSchema,
  isValidMonth,
  toFormValues,
  toPayload,
  type EsgIndicatorsFormValues,
} from '../../../../features/esgIndicators/esgIndicatorsValidation';
import type { EsgIndicatorsLoadStatus } from '../../../../features/esgIndicators/useEsgIndicators';
import type { EsgMonthlyIndicators } from '../../../../features/esgIndicators/types';
import { ApiError } from '../../../../services/api/apiError';
import { saveEsgIndicators } from '../../../../services/api/esgIndicatorsApi';

const SAVE_ERROR_MESSAGE =
  'Não foi possível salvar os indicadores. Tente novamente mais tarde.';
const NOTHING_TO_SAVE_MESSAGE = 'Preencha ao menos um indicador para salvar.';

type EsgIndicatorsFormProps = {
  companyId: string;
  loadError: string | null;
  loadStatus: EsgIndicatorsLoadStatus;
  month: string;
  onMonthChange: (month: string) => void;
  onReload: () => void;
  onSaved: (month: string) => void;
  savedIndicators: EsgMonthlyIndicators | null;
};

export function EsgIndicatorsForm({
  companyId,
  loadError,
  loadStatus,
  month,
  onMonthChange,
  onReload,
  onSaved,
  savedIndicators,
}: EsgIndicatorsFormProps) {
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
    setError,
  } = useForm<EsgIndicatorsFormValues>({
    defaultValues: EMPTY_ESG_FORM_VALUES,
    resolver: zodResolver(esgIndicatorsSchema),
  });

  /*
   * Opens pre-filled when the month already has data, blank otherwise. It
   * also blanks the form while a month is loading or failed, so the previous
   * month's numbers are never left on screen under the new month's name.
   */
  useEffect(() => {
    reset(
      savedIndicators ? toFormValues(savedIndicators) : EMPTY_ESG_FORM_VALUES
    );
  }, [reset, savedIndicators]);

  const isMonthValid = isValidMonth(month);
  const isLoading = loadStatus === 'loading';
  const canEdit = isMonthValid && loadStatus === 'success';

  const submit = handleSubmit(async (values) => {
    const payload = toPayload(values);

    if (Object.keys(payload).length === 0) {
      setError('root', { message: NOTHING_TO_SAVE_MESSAGE });
      return;
    }

    try {
      await saveEsgIndicators(companyId, month, payload);
      onSaved(month);
    } catch (error) {
      setError('root', {
        message: error instanceof ApiError ? error.message : SAVE_ERROR_MESSAGE,
      });
    }
  });

  return (
    <form
      aria-label="Cadastro mensal de indicadores ESG"
      className="rounded-panel border border-border bg-surface p-8 shadow-control max-[640px]:p-6"
      noValidate
      onSubmit={(event) => void submit(event)}
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

      <div className="grid grid-cols-2 gap-5 max-[640px]:grid-cols-1">
        {ESG_INDICATOR_FIELDS.map((field) => {
          const error = errors[field.key];
          const inputId = `esg-${field.key}`;
          const errorId = `${inputId}-error`;

          return (
            <div className="flex flex-col gap-2" key={field.key}>
              <Label htmlFor={inputId}>{field.label}</Label>
              <InputGroup aria-invalid={Boolean(error)} variant="field">
                <Input
                  {...register(field.key)}
                  aria-describedby={error ? errorId : undefined}
                  aria-invalid={Boolean(error)}
                  disabled={!canEdit}
                  id={inputId}
                  inputMode={field.key === 'employees' ? 'numeric' : 'decimal'}
                  min={0}
                  placeholder={field.placeholder}
                  step={field.key === 'employees' ? 1 : 'any'}
                  type="number"
                />
                <InputGroupAddon className="text-[13px] font-bold">
                  {field.unit}
                </InputGroupAddon>
              </InputGroup>
              {error ? (
                <p
                  className="m-0 text-[13px] font-semibold text-red-600"
                  id={errorId}
                  role="alert"
                >
                  {error.message}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>

      {errors.root ? (
        <p
          className="mt-6 mb-0 text-[13px] font-semibold text-red-600"
          role="alert"
        >
          {errors.root.message}
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
