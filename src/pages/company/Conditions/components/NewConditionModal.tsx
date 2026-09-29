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
  LICENSE_CONDITION_CATEGORIES,
  LICENSE_CONDITION_STATUSES,
  type CreateLicenseConditionForm,
} from '../../../../features/licenseConditions/createLicenseConditionValidation';
import type { LicensePanelItem } from '../../../../features/licenses/types';
import { ApiError } from '../../../../services/api/apiError';
import { createLicenseCondition } from '../../../../services/api/licenseConditionsApi';
import { listLicenses } from '../../../../services/api/licensesApi';

const DEFAULT_VALUES: CreateLicenseConditionForm = {
  name: '',
  category: '',
  licenseId: '',
  responsibleAgency: '',
  dueDate: '',
  status: 'Regular',
  description: '',
};

const GENERIC_ERROR_MESSAGE =
  'Não foi possível cadastrar a condicionante. Tente novamente mais tarde.';
const LICENSES_ERROR_MESSAGE =
  'Não foi possível carregar as licenças vinculadas.';

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
  const [isLoadingLicenses, setIsLoadingLicenses] = useState(false);
  const [licensesError, setLicensesError] = useState<string | null>(null);

  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
    setError,
  } = useForm<CreateLicenseConditionForm>({
    defaultValues: DEFAULT_VALUES,
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
        if (!isCurrent) return;
        setLicenses(
          panel.licenses.filter((license) => license.status !== 'Vencida')
        );
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

    void loadLinkedLicenses();

    return () => {
      isCurrent = false;
    };
  }, [companyId, open]);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      reset(DEFAULT_VALUES);
      setLicensesError(null);
    }
    onOpenChange(nextOpen);
  }

  const submit = handleSubmit(async (values) => {
    try {
      const created = await createLicenseCondition({
        name: values.name,
        category: values.category,
        licenseId: values.licenseId,
        responsibleAgency: values.responsibleAgency,
        dueDate: toUtcIsoDate(values.dueDate),
        status: values.status,
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
          <div className="col-span-2 flex flex-col gap-2 max-[560px]:col-span-1">
            <Label htmlFor="condition-name">Nome da Condicionante</Label>
            <InputGroup aria-invalid={Boolean(errors.name)} variant="field">
              <Input
                {...register('name')}
                aria-describedby={
                  errors.name ? 'condition-name-error' : undefined
                }
                aria-invalid={Boolean(errors.name)}
                id="condition-name"
                placeholder="Ex: MTR - Manifesto de Transporte de Resíduos"
              />
            </InputGroup>
            {errors.name ? (
              <p
                className="m-0 text-[13px] font-semibold text-red-600"
                id="condition-name-error"
                role="alert"
              >
                {errors.name.message}
              </p>
            ) : null}
          </div>

          <div className="col-span-2 flex flex-col gap-2 max-[560px]:col-span-1">
            <Label htmlFor="condition-category">Categoria</Label>
            <Controller
              control={control}
              name="category"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger
                    aria-invalid={Boolean(errors.category)}
                    className="w-full"
                    id="condition-category"
                  >
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {LICENSE_CONDITION_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.category ? (
              <p
                className="m-0 text-[13px] font-semibold text-red-600"
                role="alert"
              >
                {errors.category.message}
              </p>
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
              <p
                className="m-0 text-[13px] font-semibold text-red-600"
                role="alert"
              >
                {errors.licenseId.message}
              </p>
            ) : null}
            {licensesError ? (
              <p
                className="m-0 text-[13px] font-semibold text-red-600"
                role="alert"
              >
                {licensesError}
              </p>
            ) : null}
            {!isLoadingLicenses && !licensesError && licenses.length === 0 ? (
              <p className="m-0 text-[13px] text-text-secondary">
                Nenhuma licença vigente disponível.
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="condition-agency">Órgão Responsável</Label>
            <InputGroup
              aria-invalid={Boolean(errors.responsibleAgency)}
              variant="field"
            >
              <Input
                {...register('responsibleAgency')}
                aria-invalid={Boolean(errors.responsibleAgency)}
                id="condition-agency"
                placeholder="Ex: FEPAM"
              />
            </InputGroup>
            {errors.responsibleAgency ? (
              <p
                className="m-0 text-[13px] font-semibold text-red-600"
                role="alert"
              >
                {errors.responsibleAgency.message}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="condition-due-date">Data de Vencimento</Label>
            <InputGroup aria-invalid={Boolean(errors.dueDate)} variant="field">
              <Input
                {...register('dueDate')}
                aria-describedby={
                  errors.dueDate ? 'condition-due-date-error' : undefined
                }
                aria-invalid={Boolean(errors.dueDate)}
                id="condition-due-date"
                type="date"
              />
            </InputGroup>
            {errors.dueDate ? (
              <p
                className="m-0 text-[13px] font-semibold text-red-600"
                id="condition-due-date-error"
                role="alert"
              >
                {errors.dueDate.message}
              </p>
            ) : null}
          </div>

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
              <p
                className="m-0 text-[13px] font-semibold text-red-600"
                role="alert"
              >
                {errors.description.message}
              </p>
            ) : null}
          </div>

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
              onClick={() => handleOpenChange(false)}
              type="button"
              variant="subtle"
            >
              Cancelar
            </Button>
            <Button
              disabled={
                isSubmitting || isLoadingLicenses || licenses.length === 0
              }
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
