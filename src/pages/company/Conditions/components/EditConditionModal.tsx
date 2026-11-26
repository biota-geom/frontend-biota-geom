import { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
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
import { Textarea } from '@/components/ui/shadcn/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select';
import { getLicenseDetails } from '../../../../services/api/licensesApi';
import { isInformativeConditionType } from '../../../../features/licenses/licenseDetailsFormatting';
import type { LicenseConditionDetail } from '../../../../features/licenses/types';
import {
  createEditLicenseConditionSchema,
  type EditLicenseConditionForm,
} from '../../../../features/licenseConditions/createLicenseConditionValidation';
import type { LicenseCondition } from '../../../../features/licenseConditions/types';
import { ApiError } from '../../../../services/api/apiError';
import { updateLicenseCondition } from '../../../../services/api/licenseConditionsApi';
import { useRefreshAlerts } from '../../../../features/alerts/useAlerts';

const GENERIC_ERROR_MESSAGE =
  'Não foi possível atualizar a condicionante. Tente novamente mais tarde.';

type EditConditionModalProps = {
  condition: LicenseCondition | null;
  customerId: string | undefined;
  onOpenChange: (open: boolean) => void;
  onUpdated: (conditionName: string) => void;
  open: boolean;
};

function valuesFromCondition(
  condition: LicenseCondition
): EditLicenseConditionForm {
  return {
    name: condition.name,
    environmentalDescriptor: condition.environmentalDescriptor,
    responsibleAgency: condition.responsibleAgency ?? '',
    dueDate: condition.dueDate?.slice(0, 10) ?? '',
    alertDate: condition.alertDate?.slice(0, 10) ?? '',
    hasDelivery: condition.hasDelivery,
    isViolated: condition.isViolated,
    description: condition.description ?? '',
  };
}

function toUtcIsoDate(value: string): string {
  return new Date(`${value}T00:00:00.000Z`).toISOString();
}

export function EditConditionModal({
  condition,
  customerId,
  onOpenChange,
  onUpdated,
  open,
}: EditConditionModalProps) {
  const refreshAlerts = useRefreshAlerts();
  const [parentData, setParentData] = useState<{
    conditionId: string;
    conditionType: string | null;
    conditions: LicenseConditionDetail[];
    parentConditionId: string;
    error: string | null;
  } | null>(null);
  const [parentSelection, setParentSelection] = useState<{
    conditionId: string;
    value: string;
  } | null>(null);
  const currentParentData =
    parentData?.conditionId === condition?.id ? parentData : null;
  const isInformative = isInformativeConditionType(
    condition?.conditionType ?? currentParentData?.conditionType
  );
  const editSchema = useMemo(
    () =>
      createEditLicenseConditionSchema({
        requireDueDate: !isInformative,
      }),
    [isInformative]
  );
  const {
    control,
    formState: { errors, isSubmitting, isValid },
    handleSubmit,
    register,
    reset,
    setError,
    trigger,
  } = useForm<EditLicenseConditionForm>({
    defaultValues: {
      name: '',
      environmentalDescriptor: '',
      responsibleAgency: '',
      dueDate: '',
      alertDate: '',
      hasDelivery: true,
      isViolated: false,
      description: '',
    },
    mode: 'onChange',
    resolver: zodResolver(editSchema),
  });
  const editedDescriptor = useWatch({
    control,
    name: 'environmentalDescriptor',
  });
  const isLoadingParents =
    Boolean(condition && open && customerId) &&
    parentData?.conditionId !== condition?.id;
  const licenseConditions = currentParentData?.conditions ?? [];
  const parentLoadError = currentParentData?.error ?? null;
  const parentConditionId =
    parentSelection && parentSelection.conditionId === condition?.id
      ? parentSelection.value
      : (currentParentData?.parentConditionId ??
        condition?.parentConditionId ??
        'none');

  useEffect(() => {
    if (condition && open) reset(valuesFromCondition(condition));
  }, [condition, open, reset]);

  useEffect(() => {
    if (condition && open) void trigger('dueDate');
  }, [condition, isInformative, open, trigger]);

  useEffect(() => {
    if (!condition || !open || !customerId) return;

    let isCurrent = true;
    void getLicenseDetails(customerId, condition.licenseId)
      .then((details) => {
        if (!isCurrent) return;
        const detailCondition = details.conditions.find(
          (item) => item.id === condition.id
        );
        setParentData({
          conditionId: condition.id,
          conditionType:
            detailCondition?.conditionType ?? condition.conditionType ?? null,
          conditions: details.conditions,
          parentConditionId:
            detailCondition?.parentConditionId ??
            condition.parentConditionId ??
            'none',
          error: null,
        });
      })
      .catch((error: unknown) => {
        if (!isCurrent) return;
        setParentData({
          conditionId: condition.id,
          conditionType: condition.conditionType ?? null,
          conditions: [],
          parentConditionId: 'none',
          error:
            error instanceof ApiError
              ? error.message
              : 'Não foi possível carregar as condicionantes da licença.',
        });
      });

    return () => {
      isCurrent = false;
    };
  }, [condition, customerId, open]);

  function handleOpenChange(nextOpen: boolean) {
    if (isSubmitting) return;
    if (!nextOpen) {
      setParentData(null);
      setParentSelection(null);
    }
    onOpenChange(nextOpen);
  }

  const submit = handleSubmit(async (values) => {
    if (!condition) return;

    try {
      const originalDates = valuesFromCondition(condition);
      await updateLicenseCondition(condition.id, {
        name: values.name,
        environmentalDescriptor: values.environmentalDescriptor,
        responsibleAgency: values.responsibleAgency || undefined,
        ...(values.dueDate !== originalDates.dueDate
          ? { dueDate: values.dueDate ? toUtcIsoDate(values.dueDate) : null }
          : {}),
        ...(values.alertDate !== originalDates.alertDate
          ? {
              alertDate: values.alertDate
                ? toUtcIsoDate(values.alertDate)
                : null,
            }
          : {}),
        hasDelivery: values.hasDelivery,
        isViolated: values.isViolated,
        description: values.description || undefined,
        ...(isLoadingParents || parentLoadError || !customerId
          ? {}
          : {
              parentConditionId:
                parentConditionId === 'none' ? null : parentConditionId,
            }),
      });
      // A new due date or fulfillment resolves the condition's alerts.
      void refreshAlerts();
      onUpdated(values.name);
      setParentData(null);
      setParentSelection(null);
      onOpenChange(false);
    } catch (error) {
      setError('root', {
        message:
          error instanceof ApiError ? error.message : GENERIC_ERROR_MESSAGE,
      });
    }
  });

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Condicionante</DialogTitle>
          <DialogDescription>
            Atualize os dados e marque manualmente se a condicionante está
            violada.
          </DialogDescription>
        </DialogHeader>

        <form
          className="grid grid-cols-2 gap-4 max-[560px]:grid-cols-1"
          noValidate
          onSubmit={(event) => void submit(event)}
        >
          <EditTextField
            error={errors.name?.message}
            id="edit-condition-name"
            label="Nome da Condicionante"
          >
            <Input
              {...register('name')}
              aria-invalid={Boolean(errors.name)}
              id="edit-condition-name"
            />
          </EditTextField>

          <div className="col-span-2 flex flex-col gap-2 max-[560px]:col-span-1">
            <Label htmlFor="edit-condition-parent">Sub-item de</Label>
            <Select
              disabled={
                isLoadingParents ||
                Boolean(parentLoadError) ||
                !customerId ||
                licenseConditions.some(
                  (child) => child.parentConditionId === condition?.id
                )
              }
              onValueChange={(value) => {
                if (condition)
                  setParentSelection({ conditionId: condition.id, value });
              }}
              value={parentConditionId}
            >
              <SelectTrigger
                className="w-full min-w-0"
                id="edit-condition-parent"
              >
                <SelectValue
                  className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap"
                  placeholder={
                    isLoadingParents
                      ? 'Carregando condicionantes...'
                      : 'Nenhuma (condicionante principal)'
                  }
                />
              </SelectTrigger>
              <SelectContent
                className="w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-2rem)]"
                position="popper"
              >
                <SelectItem value="none">
                  Nenhuma (condicionante principal)
                </SelectItem>
                {licenseConditions
                  .filter(
                    (candidate) =>
                      !candidate.isEnvironmentalDescriptor &&
                      candidate.id !== null &&
                      candidate.id !== condition?.id &&
                      candidate.environmentalDescriptor === editedDescriptor &&
                      !candidate.parentConditionId
                  )
                  .map((parent) => (
                    <SelectItem
                      className="h-auto min-h-8 whitespace-normal break-words"
                      key={parent.id}
                      value={parent.id ?? ''}
                    >
                      <span className="block min-w-0 whitespace-normal break-words">
                        {parent.itemNumber} —{' '}
                        {parent.description || parent.name}
                      </span>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {parentLoadError ? (
              <p
                className="m-0 text-[13px] font-semibold text-red-600"
                role="alert"
              >
                {parentLoadError}
              </p>
            ) : null}
          </div>

          <EditTextField
            error={errors.environmentalDescriptor?.message}
            id="edit-condition-environmental-descriptor"
            label="Descritor Ambiental"
          >
            <Input
              {...register('environmentalDescriptor', {
                onChange: () => {
                  if (condition)
                    setParentSelection({
                      conditionId: condition.id,
                      value: 'none',
                    });
                },
              })}
              aria-invalid={Boolean(errors.environmentalDescriptor)}
              id="edit-condition-environmental-descriptor"
            />
          </EditTextField>

          <EditTextField
            error={errors.responsibleAgency?.message}
            id="edit-condition-agency"
            label="Órgão Responsável"
          >
            <Input
              {...register('responsibleAgency')}
              aria-invalid={Boolean(errors.responsibleAgency)}
              id="edit-condition-agency"
            />
          </EditTextField>

          <EditTextField
            error={errors.dueDate?.message}
            id="edit-condition-due-date"
            label={
              isInformative
                ? 'Data de Vencimento (opcional)'
                : 'Data de Vencimento'
            }
          >
            <Input
              {...register('dueDate', { deps: ['alertDate'] })}
              aria-invalid={Boolean(errors.dueDate)}
              id="edit-condition-due-date"
              type="date"
            />
          </EditTextField>

          <EditTextField
            error={errors.alertDate?.message}
            id="edit-condition-alert-date"
            label="Data de alerta (opcional)"
          >
            <Input
              {...register('alertDate', { deps: ['dueDate'] })}
              aria-invalid={Boolean(errors.alertDate)}
              id="edit-condition-alert-date"
              type="date"
            />
          </EditTextField>

          <label className="flex items-center gap-2 text-sm font-semibold text-text-primary">
            <input
              {...register('hasDelivery')}
              className="h-4 w-4 accent-emerald-600"
              type="checkbox"
            />
            Possui entrega?
          </label>

          <label className="flex items-center gap-2 text-sm font-semibold text-text-primary">
            <input
              {...register('isViolated')}
              className="h-4 w-4 accent-rose-600"
              role="switch"
              type="checkbox"
            />
            Violada
          </label>

          <div className="col-span-2 flex flex-col gap-2 max-[560px]:col-span-1">
            <Label htmlFor="edit-condition-description">
              Descrição da Condicionante
            </Label>
            <Textarea
              {...register('description')}
              aria-invalid={Boolean(errors.description)}
              id="edit-condition-description"
            />
            {errors.description ? (
              <EditFieldError message={errors.description.message} />
            ) : null}
          </div>

          {errors.root ? (
            <p
              className="col-span-2 m-0 rounded-sm border border-[#fda29b] bg-[#fef3f2] px-3 py-2.5 text-[13px] font-semibold text-[#b42318] max-[560px]:col-span-1"
              role="alert"
            >
              {errors.root.message}
            </p>
          ) : null}

          <DialogFooter className="col-span-2 max-[560px]:col-span-1">
            <Button
              disabled={isSubmitting}
              onClick={() => handleOpenChange(false)}
              type="button"
              variant="subtle"
            >
              Cancelar
            </Button>
            <Button
              disabled={
                !condition ||
                !isValid ||
                isSubmitting ||
                isLoadingParents ||
                Boolean(parentLoadError) ||
                !customerId
              }
              type="submit"
              variant="dialogPrimary"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditTextField({
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
      {error ? <EditFieldError message={error} /> : null}
    </div>
  );
}

function EditFieldError({ message }: { message?: string }) {
  return message ? (
    <p className="m-0 text-[13px] font-semibold text-red-600" role="alert">
      {message}
    </p>
  ) : null;
}
