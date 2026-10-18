import { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
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
  createLicenseConditionSchema,
  LICENSE_CONDITION_STATUSES,
  type CreateLicenseConditionForm,
} from '../../../../features/licenseConditions/createLicenseConditionValidation';
import type { LicensePanelItem } from '../../../../features/licenses/types';
import { ApiError } from '../../../../services/api/apiError';
import {
  createLicenseCondition,
  listLicenseConditions,
} from '../../../../services/api/licenseConditionsApi';
import { listLicenses } from '../../../../services/api/licensesApi';

const DEFAULT_VALUES: CreateLicenseConditionForm = {
  name: '',
  environmentalDescriptor: '',
  licenseId: '',
  responsibleAgency: '',
  dueDate: '',
  status: 'Regular',
  hasDelivery: true,
  description: '',
};

const GENERIC_ERROR_MESSAGE =
  'Não foi possível cadastrar a condicionante. Tente novamente mais tarde.';
const LICENSES_ERROR_MESSAGE =
  'Não foi possível carregar as licenças vinculadas.';

const CREATE_DESCRIPTOR_VALUE = '__create_environmental_descriptor__';

type NewConditionModalProps = {
  companyId: string;
  onCreated: (conditionName: string) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

function toUtcIsoDate(value: string): string {
  return new Date(`${value}T00:00:00.000Z`).toISOString();
}

export function NewConditionModal({
  companyId,
  onCreated,
  onOpenChange,
  open,
}: NewConditionModalProps) {
  const schema = useMemo(() => createLicenseConditionSchema(), []);
  const [licenses, setLicenses] = useState<LicensePanelItem[]>([]);
  const [environmentalDescriptors, setEnvironmentalDescriptors] = useState<
    string[]
  >([]);
  const [isCreatingDescriptor, setIsCreatingDescriptor] = useState(false);
  const [isLoadingLicenses, setIsLoadingLicenses] = useState(false);
  const [licensesError, setLicensesError] = useState<string | null>(null);
  const {
    control,
    formState: { errors, isSubmitting, isValid },
    handleSubmit,
    register,
    reset,
    setError,
  } = useForm<CreateLicenseConditionForm>({
    defaultValues: DEFAULT_VALUES,
    mode: 'onChange',
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (!open) return;

    let isCurrent = true;
    async function loadLinkedLicenses() {
      setIsLoadingLicenses(true);
      setLicensesError(null);

      try {
        const panel = await listLicenses(companyId);
        if (isCurrent) {
          setLicenses(
            panel.licenses.filter((license) => license.status !== 'Vencida')
          );
        }
      } catch (error) {
        if (!isCurrent) return;
        setLicenses([]);
        setLicensesError(
          error instanceof ApiError ? error.message : LICENSES_ERROR_MESSAGE
        );
      } finally {
        if (isCurrent) setIsLoadingLicenses(false);
      }
    }

    async function loadEnvironmentalDescriptors() {
      try {
        const result = await listLicenseConditions(companyId, 'all');
        if (isCurrent) {
          setEnvironmentalDescriptors(
            Array.from(
              new Set(
                result.conditions
                  .map((condition) => condition.environmentalDescriptor.trim())
                  .filter(Boolean)
              )
            )
          );
        }
      } catch {
        if (isCurrent) setEnvironmentalDescriptors([]);
      }
    }

    void Promise.all([loadLinkedLicenses(), loadEnvironmentalDescriptors()]);

    return () => {
      isCurrent = false;
    };
  }, [companyId, open]);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      reset(DEFAULT_VALUES);
      setIsCreatingDescriptor(false);
      setLicensesError(null);
    }
    onOpenChange(nextOpen);
  }

  const submit = handleSubmit(async (values) => {
    try {
      const created = await createLicenseCondition({
        name: values.name,
        environmentalDescriptor: values.environmentalDescriptor,
        licenseId: values.licenseId,
        responsibleAgency: values.responsibleAgency,
        dueDate: toUtcIsoDate(values.dueDate),
        status: values.status,
        hasDelivery: values.hasDelivery,
        description: values.description || undefined,
      });

      onCreated(created.name);
      handleOpenChange(false);
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
          <DialogTitle className="text-xl font-bold">
            Nova Condicionante
          </DialogTitle>
          <DialogDescription>
            Cadastre uma nova condicionante ambiental vinculada a uma licença.
          </DialogDescription>
        </DialogHeader>

        <form
          className="grid grid-cols-2 gap-4 max-[560px]:grid-cols-1"
          noValidate
          onSubmit={(event) => void submit(event)}
        >
          <TextField
            error={errors.name?.message}
            id="condition-name"
            label="Nome da Condicionante"
          >
            <Input
              {...register('name')}
              aria-invalid={Boolean(errors.name)}
              id="condition-name"
              placeholder="Ex: MTR - Manifesto de Transporte de Resíduos"
            />
          </TextField>

          <div className="flex flex-col gap-2">
            <Label htmlFor="condition-environmental-descriptor">
              Descritor Ambiental
            </Label>
            <Controller
              control={control}
              name="environmentalDescriptor"
              render={({ field }) => (
                <>
                  <Select
                    onValueChange={(value) => {
                      const shouldCreate = value === CREATE_DESCRIPTOR_VALUE;
                      setIsCreatingDescriptor(shouldCreate);
                      field.onChange(shouldCreate ? '' : value);
                    }}
                    value={
                      isCreatingDescriptor
                        ? CREATE_DESCRIPTOR_VALUE
                        : field.value
                    }
                  >
                    <SelectTrigger
                      aria-invalid={Boolean(errors.environmentalDescriptor)}
                      className="w-full"
                      id="condition-environmental-descriptor"
                    >
                      <SelectValue placeholder="Selecione o descritor ambiental" />
                    </SelectTrigger>
                    <SelectContent>
                      {environmentalDescriptors.map((descriptor) => (
                        <SelectItem key={descriptor} value={descriptor}>
                          {descriptor}
                        </SelectItem>
                      ))}
                      <SelectItem value={CREATE_DESCRIPTOR_VALUE}>
                        + Criar novo descritor ambiental
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  {isCreatingDescriptor ? (
                    <InputGroup
                      aria-invalid={Boolean(errors.environmentalDescriptor)}
                      variant="field"
                    >
                      <Input
                        aria-label="Novo descritor ambiental"
                        autoFocus
                        maxLength={120}
                        onChange={field.onChange}
                        placeholder="Ex: Resíduos sólidos"
                        value={field.value}
                      />
                    </InputGroup>
                  ) : null}
                </>
              )}
            />
            {errors.environmentalDescriptor ? (
              <FieldError message={errors.environmentalDescriptor.message} />
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="condition-license">Licença Vinculada</Label>
            <Controller
              control={control}
              name="licenseId"
              render={({ field }) => (
                <Select
                  disabled={isLoadingLicenses || licenses.length === 0}
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <SelectTrigger
                    aria-invalid={Boolean(errors.licenseId)}
                    className="w-full"
                    id="condition-license"
                  >
                    <SelectValue
                      placeholder={
                        isLoadingLicenses
                          ? 'Carregando licenças...'
                          : 'Selecione a licença'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {licenses.map((license) => (
                      <SelectItem key={license.id} value={license.id}>
                        {license.processNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.licenseId ? (
              <FieldError message={errors.licenseId.message} />
            ) : null}
            {licensesError ? <FieldError message={licensesError} /> : null}
          </div>

          <TextField
            error={errors.responsibleAgency?.message}
            id="condition-agency"
            label="Órgão Responsável"
          >
            <Input
              {...register('responsibleAgency')}
              aria-invalid={Boolean(errors.responsibleAgency)}
              id="condition-agency"
              placeholder="Ex: FEPAM"
            />
          </TextField>

          <TextField
            error={errors.dueDate?.message}
            id="condition-due-date"
            label="Data de Vencimento"
          >
            <Input
              {...register('dueDate')}
              aria-invalid={Boolean(errors.dueDate)}
              id="condition-due-date"
              required
              type="date"
            />
          </TextField>

          <div className="flex flex-col gap-2">
            <Label htmlFor="condition-status">Status Inicial</Label>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="w-full" id="condition-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LICENSE_CONDITION_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <label className="col-span-2 flex items-center gap-2 text-sm font-semibold text-text-primary max-[560px]:col-span-1">
            <input
              {...register('hasDelivery')}
              className="h-4 w-4 accent-emerald-600"
              type="checkbox"
            />
            Possui entrega?
          </label>

          <div className="col-span-2 flex flex-col gap-2 max-[560px]:col-span-1">
            <Label htmlFor="condition-description">
              Descrição da Condicionante
            </Label>
            <Textarea
              {...register('description')}
              aria-invalid={Boolean(errors.description)}
              id="condition-description"
              placeholder="Descreva brevemente o objetivo e os requisitos desta condicionante..."
            />
            {errors.description ? (
              <FieldError message={errors.description.message} />
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
              disabled={!isValid || isSubmitting || licenses.length === 0}
              type="submit"
              variant="dialogPrimary"
            >
              {isSubmitting ? 'Cadastrando...' : 'Cadastrar Condicionante'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TextField({
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
      {error ? <FieldError message={error} /> : null}
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
