import { useState } from 'react';
import { Check, Pencil, Plus, Trash2 } from 'lucide-react';
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
import { Textarea } from '@/components/ui/shadcn/textarea';
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
  const { append, fields, insert, remove, update } = useFieldArray({
    control,
    name: 'conditions',
  });
  const conditions =
    useWatch({ control, name: 'conditions' }) ?? ([] as LicenseConditionRow[]);
  const [addedDescriptors, setAddedDescriptors] = useState<string[]>([]);
  const [isDescriptorDialogOpen, setIsDescriptorDialogOpen] = useState(false);
  const [newDescriptor, setNewDescriptor] = useState('');
  const [descriptorError, setDescriptorError] = useState<string | null>(null);
  const [conditionDialog, setConditionDialog] =
    useState<ConditionDialogState | null>(null);
  /* Remounts the dialog per opening so it starts from its initial values. */
  const [dialogKey, setDialogKey] = useState(0);

  /*
   * Groups come from the descriptors added through the dialog plus those of
   * the conditions already in the form — e.g. the ones suggested by the AI
   * reading of the PDF — in order of first appearance.
   */
  const environmentalDescriptors = Array.from(
    new Set([
      ...addedDescriptors,
      ...conditions.map((condition) => condition.environmentalDescriptor),
    ])
  );
  const incompleteCount = conditions.filter(
    (condition) => !licenseConditionRowSchema.safeParse(condition).success
  ).length;

  function openConditionDialog(state: ConditionDialogState) {
    setDialogKey((key) => key + 1);
    setConditionDialog(state);
  }

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

    setAddedDescriptors((current) => [...current, descriptor]);
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

    setConditionDialog(null);
  }

  function editCondition(index: number, condition: LicenseConditionRow) {
    update(index, condition);
    setConditionDialog(null);
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
    setAddedDescriptors((current) =>
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

      {incompleteCount > 0 ? (
        <p
          className="m-0 rounded-sm border border-[#fedf89] bg-[#fffaeb] px-3 py-2 text-[13px] font-semibold text-[#b54708]"
          role="status"
        >
          {incompleteCount === 1
            ? '1 condicionante está com dados pendentes.'
            : `${incompleteCount} condicionantes estão com dados pendentes.`}{' '}
          Use o botão de editar (lápis) para completá-las.
        </p>
      ) : null}

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
                    onAddCondition={() =>
                      openConditionDialog({ mode: 'add', descriptor })
                    }
                    onEditCondition={(index) =>
                      openConditionDialog({
                        mode: 'edit',
                        index,
                        initial: conditions[index],
                      })
                    }
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

      {conditionDialog ? (
        <ConditionDialog
          key={dialogKey}
          onClose={() => setConditionDialog(null)}
          onSubmit={(condition) =>
            conditionDialog.mode === 'add'
              ? addCondition(condition)
              : editCondition(conditionDialog.index, condition)
          }
          state={conditionDialog}
        />
      ) : null}
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
  onEditCondition: (index: number) => void;
  onRemoveCondition: (index: number) => void;
  onRemoveDescriptor: () => void;
};

/* Placeholder for a required value still missing (e.g. not in the PDF). */
function Pending() {
  return <span className="font-semibold text-[#b54708]">Preencher</span>;
}

function EnvironmentalDescriptorRows({
  conditions,
  descriptor,
  descriptorConditions,
  descriptorIndex,
  disabled,
  onAddCondition,
  onEditCondition,
  onRemoveCondition,
  onRemoveDescriptor,
}: EnvironmentalDescriptorRowsProps) {
  const descriptorNumber = descriptorIndex + 1;
  // Conditions read from the PDF may come without a descriptor; they are
  // grouped here until the user sets one through the edit button.
  const hasDescriptor = descriptor.trim() !== '';
  const descriptorRemovalLabel = hasDescriptor
    ? `Remover descritor ambiental ${descriptor}`
    : 'Remover condicionantes sem descritor ambiental';

  return (
    <>
      <tr className="border-t border-border bg-slate-100 font-bold text-text-primary">
        <td className="w-[72px] px-3 py-2.5">{descriptorNumber}</td>
        <td className="px-3 py-2.5" colSpan={5}>
          {hasDescriptor ? (
            descriptor
          ) : (
            <span className="text-[#b54708]">Sem descritor ambiental</span>
          )}
        </td>
        <td className="px-3 py-2.5" colSpan={2}>
          <div className="flex items-center justify-end gap-2">
            {hasDescriptor ? (
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
            ) : null}
            <Button
              aria-label={descriptorRemovalLabel}
              disabled={disabled}
              onClick={onRemoveDescriptor}
              title={descriptorRemovalLabel}
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
        const isIncomplete =
          !licenseConditionRowSchema.safeParse(condition).success;
        const needsPeriodicity =
          condition.conditionType === 'PERIODIC' && !condition.periodicity;

        return (
          <tr
            className={`border-t border-border ${isIncomplete ? 'bg-[#fffaeb]' : 'bg-white'}`}
            data-incomplete={isIncomplete || undefined}
            key={field.id}
          >
            <td className="px-3 py-2.5 text-text-secondary">{itemNumber}</td>
            <td className="max-w-[280px] px-3 py-2.5 pl-8 text-text-primary">
              <span className="block truncate" title={condition.description}>
                {condition.description || <Pending />}
              </span>
            </td>
            <td className="px-3 py-2.5 text-emerald-700">
              {condition.conditionType ? (
                formatConditionType(condition.conditionType)
              ) : (
                <Pending />
              )}
            </td>
            <td className="px-3 py-2.5 text-text-secondary">
              {needsPeriodicity ? (
                <Pending />
              ) : condition.periodicity ? (
                formatConditionPeriodicity(condition.periodicity)
              ) : (
                'N/A'
              )}
            </td>
            <td className="px-3 py-2.5 text-text-secondary">
              {condition.deadline ? (
                formatDeadline(condition.deadline)
              ) : (
                <Pending />
              )}
            </td>
            <td className="px-3 py-2.5 text-text-primary">
              {condition.responsibleName || <Pending />}
            </td>
            <td className="px-3 py-2.5 text-text-secondary">
              {condition.hasDelivery ? 'Sim' : 'Não'}
            </td>
            <td className="px-2 py-2">
              <div className="flex items-center justify-end gap-1.5">
                <Button
                  aria-label={`Editar condicionante ${itemNumber}`}
                  disabled={disabled}
                  onClick={() => onEditCondition(conditionIndex)}
                  type="button"
                  variant="iconSoft"
                >
                  <Pencil aria-hidden="true" size={14} />
                </Button>
                <Button
                  aria-label={`Remover condicionante ${itemNumber}`}
                  disabled={disabled}
                  onClick={() => onRemoveCondition(conditionIndex)}
                  type="button"
                  variant="iconDanger"
                >
                  <Trash2 aria-hidden="true" size={14} />
                </Button>
              </div>
            </td>
          </tr>
        );
      })}
    </>
  );
}

type ConditionDialogState =
  | { mode: 'add'; descriptor: string }
  | { mode: 'edit'; index: number; initial: LicenseConditionRow };

type ConditionDialogProps = {
  onClose: () => void;
  onSubmit: (condition: LicenseConditionRow) => void;
  state: ConditionDialogState;
};

/*
 * Adds a condition to a descriptor group, or edits an existing one — e.g. to
 * complete what the AI could not read from the PDF. Mounted per opening, so
 * its local state always starts from the condition being edited.
 */
function ConditionDialog({ onClose, onSubmit, state }: ConditionDialogProps) {
  const isEdit = state.mode === 'edit';
  const [condition, setCondition] = useState<LicenseConditionRow>(
    isEdit
      ? { ...state.initial }
      : { ...EMPTY_CONDITION_ROW, environmentalDescriptor: state.descriptor }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    const result = licenseConditionRowSchema.safeParse(condition);

    if (!result.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0] ?? 'root');
        if (!nextErrors[key]) nextErrors[key] = issue.message;
      }
      setErrors(nextErrors);
      return;
    }

    onSubmit(result.data);
  }

  return (
    <Dialog onOpenChange={(open) => !open && onClose()} open>
      <DialogContent className="max-h-[92vh] gap-5 overflow-y-auto p-6 sm:max-w-3xl">
        <DialogHeader className="gap-1.5 border-b border-border pb-5">
          <DialogTitle className="text-lg font-bold text-text-primary">
            {isEdit ? 'Editar Condicionante' : 'Nova Condicionante'}
          </DialogTitle>
          <DialogDescription className="text-xs text-text-secondary">
            {isEdit
              ? 'Revise e complete os dados da condicionante.'
              : `Adicione uma condicionante ao descritor ambiental “${state.descriptor}”.`}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-x-3 gap-y-4 max-[560px]:grid-cols-1">
          {isEdit ? (
            <div className="col-span-2 max-[560px]:col-span-1">
              <DialogField
                error={errors.environmentalDescriptor}
                id="new-condition-descriptor"
                label="Descritor ambiental"
              >
                <Input
                  id="new-condition-descriptor"
                  maxLength={120}
                  onChange={(event) =>
                    updateCondition({
                      environmentalDescriptor: event.target.value,
                    })
                  }
                  placeholder="Ex: Resíduos sólidos"
                  value={condition.environmentalDescriptor}
                />
              </DialogField>
            </div>
          ) : null}

          <div className="col-span-2 flex flex-col gap-2 max-[560px]:col-span-1">
            <Label className={FIELD_LABEL} htmlFor="new-condition-description">
              Descrição *
            </Label>
            <Textarea
              aria-invalid={Boolean(errors.description)}
              className="min-h-[120px] text-[15px]"
              id="new-condition-description"
              maxLength={500}
              onChange={(event) =>
                updateCondition({ description: event.target.value })
              }
              placeholder="Descreva a condicionante"
              value={condition.description}
            />
            <FieldError message={errors.description} />
          </div>

          <div className="flex flex-col gap-2">
            <Label className={FIELD_LABEL} htmlFor="new-condition-type">
              Tipo
            </Label>
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
                className={SELECT_TRIGGER}
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
            <Label className={FIELD_LABEL} htmlFor="new-condition-periodicity">
              Periodicidade
            </Label>
            <Select
              disabled={condition.conditionType !== 'PERIODIC'}
              onValueChange={(value) => updateCondition({ periodicity: value })}
              value={condition.periodicity}
            >
              <SelectTrigger
                aria-invalid={Boolean(errors.periodicity)}
                className={SELECT_TRIGGER}
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

          <label className="col-span-2 flex w-fit cursor-pointer items-center gap-2.5 text-[15px] text-text-primary max-[560px]:col-span-1">
            <input
              checked={condition.hasDelivery}
              className="peer sr-only"
              onChange={(event) =>
                updateCondition({ hasDelivery: event.target.checked })
              }
              type="checkbox"
            />
            <span
              aria-hidden="true"
              className="flex size-5 items-center justify-center rounded-full border-2 border-border text-white transition-colors peer-checked:border-text-primary peer-checked:bg-text-primary peer-focus-visible:ring-3 peer-focus-visible:ring-focus/30 [&>svg]:opacity-0 peer-checked:[&>svg]:opacity-100"
            >
              <Check size={12} strokeWidth={3.5} />
            </span>
            Possui entrega?
          </label>
        </div>

        <DialogFooter className="mx-0 mb-0 rounded-none border-t border-border bg-transparent px-0 pt-5 pb-0">
          <Button onClick={onClose} type="button" variant="subtle">
            Cancelar
          </Button>
          <Button
            onClick={submitCondition}
            type="button"
            variant="dialogPrimary"
          >
            {isEdit ? 'Salvar Alterações' : 'Adicionar Condicionante'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* Field label of the condition dialog: lighter than the default form label. */
const FIELD_LABEL = 'font-normal text-sm text-text-secondary';
/* Matches the 42px `field` input shell next to it. */
const SELECT_TRIGGER =
  'w-full rounded-control border-border bg-surface px-3 text-[15px] text-text-primary shadow-control data-[size=default]:h-[42px]';

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
      <Label className={FIELD_LABEL} htmlFor={id}>
        {label}
      </Label>
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
