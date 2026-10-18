import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { Textarea } from '@/components/ui/shadcn/textarea';
import {
  editLicenseConditionSchema,
  type EditLicenseConditionForm,
} from '../../../../features/licenseConditions/createLicenseConditionValidation';
import type { LicenseCondition } from '../../../../features/licenseConditions/types';
import { ApiError } from '../../../../services/api/apiError';
import { updateLicenseCondition } from '../../../../services/api/licenseConditionsApi';

const GENERIC_ERROR_MESSAGE =
  'Não foi possível atualizar a condicionante. Tente novamente mais tarde.';

type EditConditionModalProps = {
  condition: LicenseCondition | null;
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
    dueDate: condition.dueDate.slice(0, 10),
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
  onOpenChange,
  onUpdated,
  open,
}: EditConditionModalProps) {
  const {
    formState: { errors, isSubmitting, isValid },
    handleSubmit,
    register,
    reset,
    setError,
  } = useForm<EditLicenseConditionForm>({
    defaultValues: {
      name: '',
      environmentalDescriptor: '',
      responsibleAgency: '',
      dueDate: '',
      hasDelivery: true,
      isViolated: false,
      description: '',
    },
    mode: 'onChange',
    resolver: zodResolver(editLicenseConditionSchema),
  });

  useEffect(() => {
    if (condition && open) reset(valuesFromCondition(condition));
  }, [condition, open, reset]);

  function handleOpenChange(nextOpen: boolean) {
    if (isSubmitting) return;
    onOpenChange(nextOpen);
  }

  const submit = handleSubmit(async (values) => {
    if (!condition) return;

    try {
      await updateLicenseCondition(condition.id, {
        name: values.name,
        environmentalDescriptor: values.environmentalDescriptor,
        responsibleAgency: values.responsibleAgency || undefined,
        dueDate: toUtcIsoDate(values.dueDate),
        hasDelivery: values.hasDelivery,
        isViolated: values.isViolated,
        description: values.description || undefined,
      });
      onUpdated(values.name);
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

          <EditTextField
            error={errors.environmentalDescriptor?.message}
            id="edit-condition-environmental-descriptor"
            label="Descritor Ambiental"
          >
            <Input
              {...register('environmentalDescriptor')}
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
            label="Data de Vencimento"
          >
            <Input
              {...register('dueDate')}
              aria-invalid={Boolean(errors.dueDate)}
              id="edit-condition-due-date"
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
              disabled={!condition || !isValid || isSubmitting}
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
