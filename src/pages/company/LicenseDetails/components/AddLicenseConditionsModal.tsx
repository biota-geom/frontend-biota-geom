import { zodResolver } from '@hookform/resolvers/zod';
import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
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
  ADD_LICENSE_CONDITIONS_DEFAULT_VALUES,
  addLicenseConditionsSchema,
  toLicenseConditionBatchItem,
  type AddLicenseConditionsForm,
} from '../../../../features/licenses/createLicenseValidation';
import type { LicenseConditionDetail } from '../../../../features/licenses/types';
import { ApiError } from '../../../../services/api/apiError';
import {
  createLicenseConditions,
  deleteLicenseCondition,
  updateLicenseConditionDescriptor,
} from '../../../../services/api/licenseConditionsApi';
import { LicenseConditionsTable } from '../../Licenses/components/LicenseConditionsTable';

const GENERIC_ERROR_MESSAGE =
  'Não foi possível cadastrar as condicionantes. Tente novamente mais tarde.';
const DELETE_ERROR_MESSAGE =
  'Não foi possível excluir a condicionante. Tente novamente mais tarde.';
const UPDATE_DESCRIPTOR_ERROR_MESSAGE =
  'Não foi possível alterar o descritor ambiental. Tente novamente mais tarde.';

type AddLicenseConditionsModalProps = {
  companyId: string;
  conditions: LicenseConditionDetail[];
  licenseId: string;
  onCreated: (count: number) => void;
  onDeleted: (conditionName: string) => void;
  onDescriptorUpdated: (descriptor: string) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

export function AddLicenseConditionsModal({
  companyId,
  conditions,
  licenseId,
  onCreated,
  onDeleted,
  onDescriptorUpdated,
  onOpenChange,
  open,
}: AddLicenseConditionsModalProps) {
  const [deletedConditionIds, setDeletedConditionIds] = useState<Set<string>>(
    () => new Set()
  );
  const [deletingConditionId, setDeletingConditionId] = useState<string | null>(
    null
  );
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [descriptorBeingEdited, setDescriptorBeingEdited] = useState<
    string | null
  >(null);
  const [editedDescriptor, setEditedDescriptor] = useState('');
  const [descriptorEditError, setDescriptorEditError] = useState<string | null>(
    null
  );
  const [isUpdatingDescriptor, setIsUpdatingDescriptor] = useState(false);
  const {
    control,
    formState: { errors, isSubmitting, isValid },
    handleSubmit,
    reset,
    setError,
  } = useForm<AddLicenseConditionsForm>({
    defaultValues: ADD_LICENSE_CONDITIONS_DEFAULT_VALUES,
    mode: 'onChange',
    resolver: zodResolver(addLicenseConditionsSchema),
  });

  const existingConditions = conditions.filter(
    (condition): condition is LicenseConditionDetail & { id: string } =>
      !condition.isEnvironmentalDescriptor &&
      condition.id !== null &&
      !deletedConditionIds.has(condition.id)
  );
  const existingDescriptorGroups = Array.from(
    existingConditions.reduce((groups, condition) => {
      const group = groups.get(condition.environmentalDescriptor) ?? [];
      group.push(condition);
      groups.set(condition.environmentalDescriptor, group);
      return groups;
    }, new Map<string, Array<LicenseConditionDetail & { id: string }>>())
  ).map(([descriptor, descriptorConditions]) => ({
    descriptor,
    conditions: descriptorConditions,
  }));

  function openDescriptorEditor(descriptor: string) {
    setDescriptorBeingEdited(descriptor);
    setEditedDescriptor(descriptor);
    setDescriptorEditError(null);
  }

  function closeDescriptorEditor() {
    if (isUpdatingDescriptor) return;
    setDescriptorBeingEdited(null);
    setEditedDescriptor('');
    setDescriptorEditError(null);
  }

  async function saveDescriptor() {
    if (!descriptorBeingEdited) return;
    const descriptor = editedDescriptor.trim();

    if (!descriptor) {
      setDescriptorEditError('Informe o descritor ambiental.');
      return;
    }
    if (descriptor.length > 120) {
      setDescriptorEditError(
        'O descritor ambiental deve ter no máximo 120 caracteres.'
      );
      return;
    }
    if (
      existingDescriptorGroups.some(
        (group) =>
          group.descriptor !== descriptorBeingEdited &&
          group.descriptor.toLocaleLowerCase('pt-BR') ===
            descriptor.toLocaleLowerCase('pt-BR')
      )
    ) {
      setDescriptorEditError('Este descritor ambiental já existe.');
      return;
    }
    if (descriptor === descriptorBeingEdited) {
      closeDescriptorEditor();
      return;
    }

    const descriptorConditions = existingConditions.filter(
      (condition) => condition.environmentalDescriptor === descriptorBeingEdited
    );
    setIsUpdatingDescriptor(true);
    setDescriptorEditError(null);

    try {
      await Promise.all(
        descriptorConditions.map((condition) =>
          updateLicenseConditionDescriptor(
            companyId,
            licenseId,
            condition.id,
            descriptor
          )
        )
      );
      setDescriptorBeingEdited(null);
      setEditedDescriptor('');
      onDescriptorUpdated(descriptor);
    } catch (error) {
      setDescriptorEditError(
        error instanceof ApiError
          ? error.message
          : UPDATE_DESCRIPTOR_ERROR_MESSAGE
      );
    } finally {
      setIsUpdatingDescriptor(false);
    }
  }

  async function removeExistingCondition(
    condition: LicenseConditionDetail & { id: string }
  ) {
    setDeletingConditionId(condition.id);
    setDeleteError(null);

    try {
      await deleteLicenseCondition(companyId, licenseId, condition.id);
      setDeletedConditionIds((current) => new Set(current).add(condition.id));
      onDeleted(
        condition.description ?? condition.name ?? condition.itemNumber
      );
    } catch (error) {
      setDeleteError(
        error instanceof ApiError ? error.message : DELETE_ERROR_MESSAGE
      );
    } finally {
      setDeletingConditionId(null);
    }
  }

  function closeAndReset() {
    reset(ADD_LICENSE_CONDITIONS_DEFAULT_VALUES);
    setDeletedConditionIds(new Set());
    setDeletingConditionId(null);
    setDeleteError(null);
    setDescriptorBeingEdited(null);
    setEditedDescriptor('');
    setDescriptorEditError(null);
    setIsUpdatingDescriptor(false);
    onOpenChange(false);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      onOpenChange(true);
      return;
    }
    if (isSubmitting || deletingConditionId !== null || isUpdatingDescriptor)
      return;
    closeAndReset();
  }

  const submit = handleSubmit(async (values) => {
    try {
      await createLicenseConditions(
        companyId,
        licenseId,
        values.conditions.map(toLicenseConditionBatchItem)
      );
    } catch (error) {
      setError('root', {
        message:
          error instanceof ApiError ? error.message : GENERIC_ERROR_MESSAGE,
      });
      return;
    }

    onCreated(values.conditions.length);
    closeAndReset();
  });

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle>Editar Condicionantes</DialogTitle>
          <DialogDescription>
            Consulte e exclua as condicionantes existentes ou cadastre novas
            condicionantes para esta licença.
          </DialogDescription>
        </DialogHeader>

        <section aria-labelledby="existing-conditions-title">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h3
              className="m-0 text-base font-bold text-text-primary"
              id="existing-conditions-title"
            >
              Condicionantes cadastradas
            </h3>
            <span className="text-xs font-semibold text-text-secondary">
              {existingConditions.length} cadastrada(s)
            </span>
          </div>

          {existingConditions.length > 0 ? (
            <div className="rounded-panel overflow-x-auto border border-border">
              <table className="w-full min-w-[760px] border-collapse text-sm">
                <thead>
                  <tr className="bg-surface-muted text-left text-xs font-bold text-text-primary">
                    <th className="px-3 py-2.5">Item</th>
                    <th className="px-3 py-2.5">Descritor ambiental</th>
                    <th className="px-3 py-2.5">Descrição</th>
                    <th className="px-3 py-2.5">Responsável</th>
                    <th className="w-12 px-2 py-2.5">
                      <span className="sr-only">Ações</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {existingDescriptorGroups.map((group) => (
                    <DescriptorGroupRows
                      deletingConditionId={deletingConditionId}
                      disabled={isUpdatingDescriptor}
                      group={group}
                      key={group.descriptor}
                      onDeleteCondition={removeExistingCondition}
                      onEditDescriptor={() =>
                        openDescriptorEditor(group.descriptor)
                      }
                    />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="rounded-panel m-0 border border-border bg-surface-muted px-4 py-5 text-sm text-text-secondary">
              Nenhuma condicionante cadastrada nesta licença.
            </p>
          )}

          {deleteError ? (
            <p
              className="mt-3 mb-0 rounded-sm border border-[#fda29b] bg-[#fef3f2] px-3 py-2.5 text-[13px] font-semibold text-[#b42318]"
              role="alert"
            >
              {deleteError}
            </p>
          ) : null}
        </section>

        <form
          className="grid grid-cols-2 gap-4 max-[560px]:grid-cols-1"
          noValidate
          onSubmit={(event) => void submit(event)}
        >
          <LicenseConditionsTable
            control={control}
            description="Adicione novos descritores e condicionantes"
            disabled={
              isSubmitting ||
              deletingConditionId !== null ||
              isUpdatingDescriptor
            }
            title="Novas condicionantes"
          />

          {errors.root ? (
            <p
              aria-live="polite"
              className="col-span-2 m-0 rounded-sm border border-[#fda29b] bg-[#fef3f2] px-3 py-2.5 text-[13px] font-semibold text-[#b42318] max-[560px]:col-span-1"
              role="alert"
            >
              {errors.root.message}
            </p>
          ) : null}

          <DialogFooter className="col-span-2 max-[560px]:col-span-1">
            <Button
              disabled={
                isSubmitting ||
                deletingConditionId !== null ||
                isUpdatingDescriptor
              }
              onClick={() => handleOpenChange(false)}
              type="button"
              variant="subtle"
            >
              Cancelar
            </Button>
            <Button
              disabled={
                !isValid ||
                isSubmitting ||
                deletingConditionId !== null ||
                isUpdatingDescriptor
              }
              type="submit"
              variant="dialogPrimary"
            >
              {isSubmitting ? 'Salvando...' : 'Adicionar novas condicionantes'}
            </Button>
          </DialogFooter>
        </form>

        <Dialog
          onOpenChange={(isOpen) => !isOpen && closeDescriptorEditor()}
          open={descriptorBeingEdited !== null}
        >
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Editar Descritor Ambiental</DialogTitle>
              <DialogDescription>
                O novo nome será aplicado a todas as condicionantes deste
                descritor.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-environmental-descriptor">
                Descritor ambiental
              </Label>
              <InputGroup
                aria-invalid={Boolean(descriptorEditError)}
                variant="field"
              >
                <Input
                  disabled={isUpdatingDescriptor}
                  id="edit-environmental-descriptor"
                  maxLength={120}
                  onChange={(event) => {
                    setEditedDescriptor(event.target.value);
                    setDescriptorEditError(null);
                  }}
                  value={editedDescriptor}
                />
              </InputGroup>
              {descriptorEditError ? (
                <p
                  className="m-0 text-[13px] font-semibold text-red-600"
                  role="alert"
                >
                  {descriptorEditError}
                </p>
              ) : null}
            </div>

            <DialogFooter>
              <Button
                disabled={isUpdatingDescriptor}
                onClick={closeDescriptorEditor}
                type="button"
                variant="subtle"
              >
                Cancelar
              </Button>
              <Button
                disabled={isUpdatingDescriptor}
                onClick={() => void saveDescriptor()}
                type="button"
                variant="dialogPrimary"
              >
                {isUpdatingDescriptor ? 'Salvando...' : 'Salvar descritor'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}

type ExistingCondition = LicenseConditionDetail & { id: string };

function DescriptorGroupRows({
  deletingConditionId,
  disabled,
  group,
  onDeleteCondition,
  onEditDescriptor,
}: {
  deletingConditionId: string | null;
  disabled: boolean;
  group: { descriptor: string; conditions: ExistingCondition[] };
  onDeleteCondition: (condition: ExistingCondition) => Promise<void>;
  onEditDescriptor: () => void;
}) {
  return (
    <>
      <tr className="bg-surface-muted font-bold text-text-primary">
        <td className="px-3 py-2.5">
          {group.conditions[0]?.itemNumber.split('.')[0]}
        </td>
        <td className="px-3 py-2.5" colSpan={3}>
          {group.descriptor}
        </td>
        <td className="px-2 py-2 text-right">
          <Button
            aria-label={`Editar descritor ambiental ${group.descriptor}`}
            disabled={disabled || deletingConditionId !== null}
            onClick={onEditDescriptor}
            title="Editar descritor ambiental"
            type="button"
            variant="iconSoft"
          >
            <Pencil aria-hidden="true" size={14} />
          </Button>
        </td>
      </tr>
      {group.conditions.map((condition) => (
        <tr className="bg-white" key={condition.id}>
          <td className="px-3 py-2.5 text-text-secondary">
            {condition.itemNumber}
          </td>
          <td className="px-3 py-2.5 text-text-secondary">—</td>
          <td className="max-w-[320px] px-3 py-2.5 text-text-primary">
            <span
              className="block truncate"
              title={condition.description ?? undefined}
            >
              {condition.description ?? condition.name ?? '—'}
            </span>
          </td>
          <td className="px-3 py-2.5 text-text-secondary">
            {condition.responsibleName ?? '—'}
          </td>
          <td className="px-2 py-2 text-right">
            <Button
              aria-label={`Excluir condicionante ${condition.itemNumber}`}
              disabled={disabled || deletingConditionId !== null}
              onClick={() => void onDeleteCondition(condition)}
              title="Excluir condicionante"
              type="button"
              variant="iconDanger"
            >
              <Trash2 aria-hidden="true" size={14} />
            </Button>
          </td>
        </tr>
      ))}
    </>
  );
}
