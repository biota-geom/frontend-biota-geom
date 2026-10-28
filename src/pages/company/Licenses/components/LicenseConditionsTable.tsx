import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useFieldArray, useWatch, type Control } from 'react-hook-form';
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
  CONDITION_PERIODICITIES,
  CONDITION_TYPES,
  EMPTY_CONDITION_ROW,
  licenseConditionRowSchema,
  type LicenseConditionRow,
} from '../../../../features/licenses/createLicenseValidation';
import {
  formatConditionPeriodicity,
  formatConditionType,
} from '../../../../features/licenses/licenseDetailsFormatting';

type ConditionsFormValues = { conditions: LicenseConditionRow[] };

type LicenseConditionsTableProps<TForm extends ConditionsFormValues> = {
  control: Control<TForm>;
  description?: string;
  disabled?: boolean;
  title?: string;
};

const HEADERS = [
  'Nº Item',
  'Descrição',
  'Tipo',
  'Periodicidade',
  'Prazo',
  'Responsável',
  'Entrega',
];

function formatDeadline(value: string) {
  if (!value) return '—';
  const [year, month, day] = value.split('-');
  return year && month && day ? `${day}/${month}/${year}` : value;
}

export function LicenseConditionsTable<TForm extends ConditionsFormValues>({
  control: hostControl,
  description = 'Adicione as condicionantes vinculadas à licença',
  disabled = false,
  title = 'Condicionantes',
}: LicenseConditionsTableProps<TForm>) {
  const control = hostControl as unknown as Control<ConditionsFormValues>;
  const { append, fields, insert, remove } = useFieldArray({
    control,
    name: 'conditions',
  });
  const conditions =
    useWatch({ control, name: 'conditions' }) ?? ([] as LicenseConditionRow[]);
  const [environmentalDescriptors, setEnvironmentalDescriptors] = useState<
    string[]
  >([]);
  const [isDescriptorDialogOpen, setIsDescriptorDialogOpen] = useState(false);
  const [newDescriptor, setNewDescriptor] = useState('');
  const [descriptorError, setDescriptorError] = useState<string | null>(null);
  const [conditionDescriptor, setConditionDescriptor] = useState<string | null>(
    null
  );

  function openDescriptorDialog() {
    setNewDescriptor('');
    setDescriptorError(null);
    setIsDescriptorDialogOpen(true);
  }

  function addEnvironmentalDescriptor() {
    const descriptor = newDescriptor.trim();

    if (!descriptor) {
      setDescriptorError('Informe o novo descritor ambiental.');
      return;
    }

    if (
      environmentalDescriptors.some(
        (item) =>
          item.trim().toLocaleLowerCase('pt-BR') ===
          descriptor.toLocaleLowerCase('pt-BR')
      )
    ) {
      setDescriptorError('Este descritor ambiental já foi adicionado.');
      return;
    }

    setEnvironmentalDescriptors((current) => [...current, descriptor]);
    setIsDescriptorDialogOpen(false);
  }

  function addCondition(condition: LicenseConditionRow) {
    const descriptorIndex = environmentalDescriptors.findIndex(
      (descriptor) => descriptor === condition.environmentalDescriptor
    );
    const laterDescriptors = new Set(
      environmentalDescriptors.slice(descriptorIndex + 1)
    );
    const insertionIndex = conditions.findIndex((item) =>
      laterDescriptors.has(item.environmentalDescriptor)
    );

    if (insertionIndex === -1) append(condition);
    else insert(insertionIndex, condition);

    setConditionDescriptor(null);
  }

  function removeEnvironmentalDescriptor(descriptor: string) {
    const conditionIndexes = conditions.reduce<number[]>(
      (indexes, condition, index) =>
        condition.environmentalDescriptor === descriptor
          ? [...indexes, index]
          : indexes,
      []
    );

    if (conditionIndexes.length > 0) remove(conditionIndexes);
    setEnvironmentalDescriptors((current) =>
      current.filter((item) => item !== descriptor)
    );
  }

  return (
    <section
      aria-labelledby="license-conditions-title"
      className="col-span-2 flex flex-col gap-3 max-[560px]:col-span-1"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3
          className="m-0 text-base font-bold text-text-primary"
          id="license-conditions-title"
        >
          {title}
        </h3>
        <p className="m-0 text-[13px] text-text-secondary">{description}</p>
      </div>

      {environmentalDescriptors.length > 0 ? (
        <div className="rounded-panel overflow-x-auto border border-border">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead>
              <tr className="bg-surface-muted text-left text-[12px] font-bold text-text-primary">
                {HEADERS.map((header) => (
                  <th className="px-3 py-2.5 font-bold" key={header}>
                    {header}
                  </th>
                ))}
                <th className="w-10 px-2 py-2.5">
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {environmentalDescriptors.map((descriptor, descriptorIndex) => {
                const descriptorConditions = fields
                  .map((field, conditionIndex) => ({ field, conditionIndex }))
                  .filter(
                    ({ conditionIndex }) =>
                      conditions[conditionIndex]?.environmentalDescriptor ===
                      descriptor
                  );

                return (
                  <EnvironmentalDescriptorRows
                    conditions={conditions}
                    descriptor={descriptor}
                    descriptorConditions={descriptorConditions}
                    descriptorIndex={descriptorIndex}
                    disabled={disabled}
                    key={descriptor}
                    onAddCondition={() => setConditionDescriptor(descriptor)}
                    onRemoveCondition={remove}
                    onRemoveDescriptor={() =>
                      removeEnvironmentalDescriptor(descriptor)
                    }
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      <div>
        <Button
          disabled={disabled}
          onClick={openDescriptorDialog}
          type="button"
          variant="addRow"
        >
          <Plus aria-hidden="true" size={16} />
          Adicionar Descritor Ambiental
        </Button>
      </div>

      <Dialog
        onOpenChange={setIsDescriptorDialogOpen}
        open={isDescriptorDialogOpen}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo Descritor Ambiental</DialogTitle>
            <DialogDescription>
              Informe o descritor ambiental das novas condicionantes.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="new-environmental-descriptor">
                Descritor ambiental
              </Label>
              <InputGroup variant="field">
                <Input
                  id="new-environmental-descriptor"
                  maxLength={120}
                  onChange={(event) => {
                    setNewDescriptor(event.target.value);
                    setDescriptorError(null);
                  }}
                  placeholder="Ex: Resíduos sólidos"
                  value={newDescriptor}
                />
              </InputGroup>
            </div>

            {descriptorError ? (
              <p
                className="m-0 text-[13px] font-semibold text-red-600"
                role="alert"
              >
                {descriptorError}
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              onClick={() => setIsDescriptorDialogOpen(false)}
              type="button"
              variant="subtle"
            >
              Cancelar
            </Button>
            <Button
              onClick={addEnvironmentalDescriptor}
              type="button"
              variant="dialogPrimary"
            >
              Adicionar Descritor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConditionDialog
        descriptor={conditionDescriptor}
        onAdd={addCondition}
        onOpenChange={(isOpen) => {
          if (!isOpen) setConditionDescriptor(null);
        }}
      />
    </section>
  );
}

type EnvironmentalDescriptorRowsProps = {
  conditions: LicenseConditionRow[];
  descriptor: string;
  descriptorConditions: Array<{
    field: { id: string };
    conditionIndex: number;
  }>;
  descriptorIndex: number;
  disabled: boolean;
  onAddCondition: () => void;
  onRemoveCondition: (index: number) => void;
  onRemoveDescriptor: () => void;
};

function EnvironmentalDescriptorRows({
  conditions,
  descriptor,
  descriptorConditions,
  descriptorIndex,
  disabled,
  onAddCondition,
  onRemoveCondition,
  onRemoveDescriptor,
}: EnvironmentalDescriptorRowsProps) {
  const descriptorNumber = descriptorIndex + 1;

  return (
    <>
      <tr className="border-t border-border bg-slate-100 font-bold text-text-primary">
        <td className="w-[72px] px-3 py-2.5">{descriptorNumber}</td>
        <td className="px-3 py-2.5" colSpan={5}>
          {descriptor}
        </td>
        <td className="px-3 py-2.5" colSpan={2}>
          <div className="flex items-center justify-end gap-2">
            <Button
              aria-label={`Adicionar condicionante em ${descriptor}`}
              disabled={disabled}
              onClick={onAddCondition}
              type="button"
              variant="addRow"
            >
              <Plus aria-hidden="true" size={15} />
              Adicionar Condicionante
            </Button>
            <Button
              aria-label={`Remover descritor ambiental ${descriptor}`}
              disabled={disabled}
              onClick={onRemoveDescriptor}
              title={`Remover descritor ambiental ${descriptor}`}
              type="button"
              variant="iconDanger"
            >
              <Trash2 aria-hidden="true" size={14} />
            </Button>
          </div>
        </td>
      </tr>

      {descriptorConditions.map(({ conditionIndex, field }, itemIndex) => {
        const condition = conditions[conditionIndex];
        const itemNumber = `${descriptorNumber}.${itemIndex + 1}`;

        return (
          <tr className="border-t border-border bg-white" key={field.id}>
            <td className="px-3 py-2.5 text-text-secondary">{itemNumber}</td>
            <td className="max-w-[280px] px-3 py-2.5 pl-8 text-text-primary">
              <span className="block truncate" title={condition.description}>
                {condition.description}
              </span>
            </td>
            <td className="px-3 py-2.5 text-emerald-700">
              {formatConditionType(condition.conditionType)}
            </td>
            <td className="px-3 py-2.5 text-text-secondary">
              {condition.periodicity
                ? formatConditionPeriodicity(condition.periodicity)
                : 'N/A'}
            </td>
            <td className="px-3 py-2.5 text-text-secondary">
              {formatDeadline(condition.deadline)}
            </td>
            <td className="px-3 py-2.5 text-text-primary">
              {condition.responsibleName}
            </td>
            <td className="px-3 py-2.5 text-text-secondary">
              {condition.hasDelivery ? 'Sim' : 'Não'}
            </td>
            <td className="px-2 py-2 text-right">
              <Button
                aria-label={`Remover condicionante ${itemNumber}`}
                disabled={disabled}
                onClick={() => onRemoveCondition(conditionIndex)}
                type="button"
                variant="iconDanger"
              >
                <Trash2 aria-hidden="true" size={14} />
              </Button>
            </td>
          </tr>
        );
      })}
    </>
  );
}

type ConditionDialogProps = {
  descriptor: string | null;
  onAdd: (condition: LicenseConditionRow) => void;
  onOpenChange: (open: boolean) => void;
};

function ConditionDialog({
  descriptor,
  onAdd,
  onOpenChange,
}: ConditionDialogProps) {
  const [condition, setCondition] = useState<LicenseConditionRow>({
    ...EMPTY_CONDITION_ROW,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function close() {
    setCondition({ ...EMPTY_CONDITION_ROW });
    setErrors({});
    onOpenChange(false);
  }

  function updateCondition(patch: Partial<LicenseConditionRow>) {
    setCondition((current) => ({ ...current, ...patch }));
    for (const key of Object.keys(patch)) {
      setErrors((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });
    }
  }

  function submitCondition() {
    if (!descriptor) return;
    const candidate = { ...condition, environmentalDescriptor: descriptor };
    const result = licenseConditionRowSchema.safeParse(candidate);

    if (!result.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0] ?? 'root');
        if (!nextErrors[key]) nextErrors[key] = issue.message;
      }
      setErrors(nextErrors);
      return;
    }

    onAdd(result.data);
    setCondition({ ...EMPTY_CONDITION_ROW });
    setErrors({});
  }

  return (
    <Dialog
      onOpenChange={(open) => !open && close()}
      open={descriptor !== null}
    >
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nova Condicionante</DialogTitle>
          <DialogDescription>
            Adicione uma condicionante ao descritor ambiental “{descriptor}”.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 max-[560px]:grid-cols-1">
          <DialogField
            error={errors.description}
            id="new-condition-description"
            label="Descrição"
          >
            <Input
              id="new-condition-description"
              maxLength={500}
              onChange={(event) =>
                updateCondition({ description: event.target.value })
              }
              placeholder="Descreva a condicionante"
              value={condition.description}
            />
          </DialogField>

          <div className="flex flex-col gap-2">
            <Label htmlFor="new-condition-type">Tipo</Label>
            <Select
              onValueChange={(value) =>
                updateCondition({
                  conditionType: value,
                  ...(value === 'INFORMATIVE' ? { periodicity: '' } : {}),
                })
              }
              value={condition.conditionType}
            >
              <SelectTrigger
                aria-invalid={Boolean(errors.conditionType)}
                className="w-full"
                id="new-condition-type"
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
            <FieldError message={errors.conditionType} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="new-condition-periodicity">Periodicidade</Label>
            <Select
              disabled={condition.conditionType !== 'PERIODIC'}
              onValueChange={(value) => updateCondition({ periodicity: value })}
              value={condition.periodicity}
            >
              <SelectTrigger
                aria-invalid={Boolean(errors.periodicity)}
                className="w-full"
                id="new-condition-periodicity"
              >
                <SelectValue
                  placeholder={
                    condition.conditionType === 'INFORMATIVE'
                      ? 'Não se aplica'
                      : 'Selecione a periodicidade'
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
            <FieldError message={errors.periodicity} />
          </div>

          <DialogField
            error={errors.deadline}
            id="new-condition-deadline"
            label="Prazo"
          >
            <Input
              id="new-condition-deadline"
              onChange={(event) =>
                updateCondition({ deadline: event.target.value })
              }
              type="date"
              value={condition.deadline}
            />
          </DialogField>

          <DialogField
            error={errors.responsibleName}
            id="new-condition-responsible"
            label="Responsável"
          >
            <Input
              id="new-condition-responsible"
              maxLength={150}
              onChange={(event) =>
                updateCondition({ responsibleName: event.target.value })
              }
              placeholder="Nome do responsável"
              value={condition.responsibleName}
            />
          </DialogField>

          <label className="flex items-center gap-2 self-end pb-2 text-sm font-semibold text-text-primary">
            <input
              checked={condition.hasDelivery}
              className="h-4 w-4 accent-emerald-600"
              onChange={(event) =>
                updateCondition({ hasDelivery: event.target.checked })
              }
              type="checkbox"
            />
            Possui entrega?
          </label>
        </div>

        <DialogFooter>
          <Button onClick={close} type="button" variant="subtle">
            Cancelar
          </Button>
          <Button
            onClick={submitCondition}
            type="button"
            variant="dialogPrimary"
          >
            Adicionar Condicionante
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DialogField({
  children,
  error,
  id,
  label,
}: {
  children: React.ReactNode;
  error?: string;
  id: string;
  label: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <InputGroup aria-invalid={Boolean(error)} variant="field">
        {children}
      </InputGroup>
      <FieldError message={error} />
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  return message ? (
    <p className="m-0 text-[13px] font-semibold text-red-600" role="alert">
      {message}
    </p>
  ) : null;
}
