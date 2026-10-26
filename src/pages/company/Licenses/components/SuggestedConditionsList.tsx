import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import {
  Controller,
  useFieldArray,
  useFormState,
  useWatch,
  type Control,
  type UseFormRegister,
  type UseFormSetValue,
} from 'react-hook-form';
import { Button } from '@/components/ui/shadcn/button';
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
import { Textarea } from '@/components/ui/shadcn/textarea';
import {
  CONDITION_PERIODICITIES,
  CONDITION_TYPES,
  type CreateLicenseForm,
  type SuggestedConditionRow,
} from '../../../../features/licenses/createLicenseValidation';
import {
  formatConditionPeriodicity,
  formatConditionType,
} from '../../../../features/licenses/licenseDetailsFormatting';

type SuggestedConditionsListProps = {
  control: Control<CreateLicenseForm>;
  disabled?: boolean;
  register: UseFormRegister<CreateLicenseForm>;
  setValue: UseFormSetValue<CreateLicenseForm>;
};

const SET_OPTIONS = { shouldDirty: true, shouldValidate: true } as const;

/**
 * Conditions the AI found in the PDF. None is included by default: the user
 * ticks the ones to keep, and each ticked one opens for review and for the
 * fields a license document does not state (responsible, often the deadline).
 */
export function SuggestedConditionsList({
  control,
  disabled = false,
  register,
  setValue,
}: SuggestedConditionsListProps) {
  const { fields } = useFieldArray({ control, name: 'suggestedConditions' });
  const rows =
    useWatch({ control, name: 'suggestedConditions' }) ??
    ([] as SuggestedConditionRow[]);
  const [bulkDeadline, setBulkDeadline] = useState('');
  const [bulkResponsible, setBulkResponsible] = useState('');

  if (fields.length === 0) return null;

  const selectedCount = rows.filter((row) => row.selected).length;
  const allSelected = selectedCount === rows.length;

  function toggleAll() {
    rows.forEach((_row, index) =>
      setValue(
        `suggestedConditions.${index}.selected`,
        !allSelected,
        SET_OPTIONS
      )
    );
  }

  // Only fills blanks, so nothing the user already typed is overwritten.
  function applyToEmptyFields() {
    rows.forEach((row, index) => {
      if (!row.selected) return;
      if (bulkDeadline && !row.deadline) {
        setValue(
          `suggestedConditions.${index}.deadline`,
          bulkDeadline,
          SET_OPTIONS
        );
      }
      if (bulkResponsible.trim() && !row.responsibleName.trim()) {
        setValue(
          `suggestedConditions.${index}.responsibleName`,
          bulkResponsible.trim(),
          SET_OPTIONS
        );
      }
    });
  }

  return (
    <section
      aria-labelledby="suggested-conditions-title"
      className="col-span-2 flex flex-col gap-3 rounded-panel border border-border bg-surface-muted/40 p-3 max-[560px]:col-span-1"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <h3
            className="m-0 flex items-center gap-1.5 text-base font-bold text-text-primary"
            id="suggested-conditions-title"
          >
            <Sparkles aria-hidden="true" size={16} />
            Condicionantes sugeridas pela IA
          </h3>
          <p className="m-0 text-[13px] text-text-secondary">
            Marque as que deseja incluir e complete os campos obrigatórios.{' '}
            {selectedCount} de {rows.length} selecionada(s).
          </p>
        </div>
        <Button
          disabled={disabled}
          onClick={toggleAll}
          type="button"
          variant="subtle"
        >
          {allSelected ? 'Desmarcar todas' : 'Selecionar todas'}
        </Button>
      </div>

      {selectedCount > 0 ? (
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="suggested-bulk-deadline">Prazo padrão</Label>
            <InputGroup variant="field">
              <Input
                disabled={disabled}
                id="suggested-bulk-deadline"
                onChange={(event) => setBulkDeadline(event.target.value)}
                type="date"
                value={bulkDeadline}
              />
            </InputGroup>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="suggested-bulk-responsible">
              Responsável padrão
            </Label>
            <InputGroup variant="field">
              <Input
                disabled={disabled}
                id="suggested-bulk-responsible"
                maxLength={150}
                onChange={(event) => setBulkResponsible(event.target.value)}
                placeholder="Nome do responsável"
                value={bulkResponsible}
              />
            </InputGroup>
          </div>
          <Button
            disabled={disabled || (!bulkDeadline && !bulkResponsible.trim())}
            onClick={applyToEmptyFields}
            type="button"
            variant="subtle"
          >
            Preencher vazios das selecionadas
          </Button>
        </div>
      ) : null}

      <ul className="m-0 flex max-h-[420px] list-none flex-col gap-2 overflow-y-auto p-0">
        {fields.map((field, index) => (
          <SuggestedConditionItem
            control={control}
            disabled={disabled}
            index={index}
            key={field.id}
            register={register}
            row={rows[index]}
            setValue={setValue}
          />
        ))}
      </ul>
    </section>
  );
}

type SuggestedConditionItemProps = {
  control: Control<CreateLicenseForm>;
  disabled: boolean;
  index: number;
  register: UseFormRegister<CreateLicenseForm>;
  row: SuggestedConditionRow | undefined;
  setValue: UseFormSetValue<CreateLicenseForm>;
};

function SuggestedConditionItem({
  control,
  disabled,
  index,
  register,
  row,
  setValue,
}: SuggestedConditionItemProps) {
  const { errors } = useFormState({
    control,
    name: `suggestedConditions.${index}`,
  });
  const rowErrors = errors.suggestedConditions?.[index];
  const n = index + 1;
  const id = (key: string) => `suggested-condition-${index}-${key}`;

  if (!row) return null;

  return (
    <li className="rounded-panel border border-border bg-white p-3">
      <label className="flex cursor-pointer items-start gap-3">
        <input
          {...register(`suggestedConditions.${index}.selected`)}
          aria-label={`Incluir condicionante sugerida ${n}`}
          className="mt-0.5 h-4 w-4 shrink-0 accent-emerald-600"
          disabled={disabled}
          type="checkbox"
        />
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="text-[12px] font-bold text-text-secondary">
            {row.environmentalDescriptor || 'Sem descritor ambiental'}
          </span>
          <span
            className={
              row.selected
                ? 'text-sm text-text-primary'
                : 'line-clamp-2 text-sm text-text-primary'
            }
          >
            {row.description}
          </span>
        </span>
      </label>

      {row.selected ? (
        <div className="mt-3 grid grid-cols-2 gap-3 border-t border-border pt-3 max-[560px]:grid-cols-1">
          <Field
            error={rowErrors?.environmentalDescriptor?.message}
            htmlFor={id('descriptor')}
            label="Descritor ambiental"
          >
            <InputGroup
              aria-invalid={Boolean(rowErrors?.environmentalDescriptor)}
              variant="field"
            >
              <Input
                {...register(
                  `suggestedConditions.${index}.environmentalDescriptor`
                )}
                disabled={disabled}
                id={id('descriptor')}
                maxLength={120}
                placeholder="Ex: Resíduos sólidos"
              />
            </InputGroup>
          </Field>

          <Field
            error={rowErrors?.responsibleName?.message}
            htmlFor={id('responsible')}
            label="Responsável"
          >
            <InputGroup
              aria-invalid={Boolean(rowErrors?.responsibleName)}
              variant="field"
            >
              <Input
                {...register(`suggestedConditions.${index}.responsibleName`)}
                disabled={disabled}
                id={id('responsible')}
                maxLength={150}
                placeholder="Nome do responsável"
              />
            </InputGroup>
          </Field>

          <div className="col-span-2 max-[560px]:col-span-1">
            <Field
              error={rowErrors?.description?.message}
              htmlFor={id('description')}
              label="Descrição"
            >
              <Textarea
                {...register(`suggestedConditions.${index}.description`)}
                aria-invalid={Boolean(rowErrors?.description)}
                className="min-h-20"
                disabled={disabled}
                id={id('description')}
                maxLength={500}
              />
            </Field>
          </div>

          <Field
            error={rowErrors?.conditionType?.message}
            htmlFor={id('type')}
            label="Tipo"
          >
            <Controller
              control={control}
              name={`suggestedConditions.${index}.conditionType`}
              render={({ field }) => (
                <Select
                  disabled={disabled}
                  onValueChange={(value) => {
                    field.onChange(value);
                    if (value !== 'PERIODIC') {
                      setValue(
                        `suggestedConditions.${index}.periodicity`,
                        '',
                        SET_OPTIONS
                      );
                    }
                  }}
                  value={field.value}
                >
                  <SelectTrigger
                    aria-invalid={Boolean(rowErrors?.conditionType)}
                    className="w-full"
                    id={id('type')}
                  >
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONDITION_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {formatConditionType(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          <Field
            error={rowErrors?.periodicity?.message}
            htmlFor={id('periodicity')}
            label="Periodicidade"
          >
            <Controller
              control={control}
              name={`suggestedConditions.${index}.periodicity`}
              render={({ field }) => (
                <Select
                  disabled={disabled || row.conditionType !== 'PERIODIC'}
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <SelectTrigger
                    aria-invalid={Boolean(rowErrors?.periodicity)}
                    className="w-full"
                    id={id('periodicity')}
                  >
                    <SelectValue
                      placeholder={
                        row.conditionType === 'PERIODIC'
                          ? 'Selecione a periodicidade'
                          : 'Não se aplica'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {CONDITION_PERIODICITIES.map((periodicity) => (
                      <SelectItem key={periodicity} value={periodicity}>
                        {formatConditionPeriodicity(periodicity)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          <Field
            error={rowErrors?.deadline?.message}
            htmlFor={id('deadline')}
            label="Prazo"
          >
            <InputGroup
              aria-invalid={Boolean(rowErrors?.deadline)}
              variant="field"
            >
              <Input
                {...register(`suggestedConditions.${index}.deadline`)}
                disabled={disabled}
                id={id('deadline')}
                type="date"
              />
            </InputGroup>
          </Field>

          <label className="flex items-center gap-2 self-end pb-2 text-sm font-semibold text-text-primary">
            <input
              {...register(`suggestedConditions.${index}.hasDelivery`)}
              className="h-4 w-4 accent-emerald-600"
              disabled={disabled}
              type="checkbox"
            />
            Possui entrega?
          </label>
        </div>
      ) : null}
    </li>
  );
}

function Field({
  children,
  error,
  htmlFor,
  label,
}: {
  children: React.ReactNode;
  error?: string;
  htmlFor: string;
  label: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p className="m-0 text-[13px] font-semibold text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
