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
  TARGET_OPERATORS,
  type CreateLicenseConditionForm,
} from '../../../../features/licenseConditions/createLicenseConditionValidation';
import type { EsgIndicator } from '../../../../features/companies/types';
import type { LicensePanelItem } from '../../../../features/licenses/types';
import { ApiError } from '../../../../services/api/apiError';
import { listCompanyEsgMetrics } from '../../../../services/api/companiesApi';
import { createLicenseCondition } from '../../../../services/api/licenseConditionsApi';
import { listLicenses } from '../../../../services/api/licensesApi';

const DEFAULT_VALUES: CreateLicenseConditionForm = {
  name: '',
  esgMetricId: '',
  licenseId: '',
  responsibleAgency: '',
  dueDate: '',
  status: 'Regular',
  description: '',
  targetMetricId: '',
  targetOperator: '',
  targetValue: '',
};

const GENERIC_ERROR_MESSAGE =
  'Não foi possível cadastrar a condicionante. Tente novamente mais tarde.';
const LICENSES_ERROR_MESSAGE =
  'Não foi possível carregar as licenças vinculadas.';
const CATEGORIES_ERROR_MESSAGE =
  'Não foi possível carregar os parâmetros GRI da empresa.';

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
  const [categories, setCategories] = useState<EsgIndicator[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

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

  useEffect(() => {
    if (!open) return;

    let isCurrent = true;

    // Only the GRI parameters linked to this company (US02) are valid
    // categories — the backend rejects any other with 422.
    async function loadCompanyCategories() {
      setIsLoadingCategories(true);
      setCategoriesError(null);

      try {
        const metrics = await listCompanyEsgMetrics(companyId);
        if (!isCurrent) return;
        setCategories(metrics);
      } catch (error) {
        if (!isCurrent) return;
        setCategories([]);
        setCategoriesError(
          error instanceof ApiError ? error.message : CATEGORIES_ERROR_MESSAGE
        );
      } finally {
        if (isCurrent) setIsLoadingCategories(false);
      }
    }

    void loadCompanyCategories();

    return () => {
      isCurrent = false;
    };
  }, [companyId, open]);

  const hasNoCategories =
    !isLoadingCategories && !categoriesError && categories.length === 0;

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      reset(DEFAULT_VALUES);
      setLicensesError(null);
      setCategoriesError(null);
    }
    onOpenChange(nextOpen);
  }

  const submit = handleSubmit(async (values) => {
    try {
      const created = await createLicenseCondition({
        name: values.name,
        esgMetricId: values.esgMetricId,
        licenseId: values.licenseId,
        responsibleAgency: values.responsibleAgency,
        dueDate: toUtcIsoDate(values.dueDate),
        status: values.status,
        description: values.description || undefined,
        ...(values.targetMetricId && values.targetOperator
          ? {
              targetMetricId: values.targetMetricId,
              targetOperator: values.targetOperator,
              targetValue: Number(values.targetValue),
            }
          : {}),
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
              name="esgMetricId"
              render={({ field }) => (
                <Select
                  disabled={isLoadingCategories || categories.length === 0}
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <SelectTrigger
                    aria-invalid={Boolean(errors.esgMetricId)}
                    className="w-full"
                    id="condition-category"
                  >
                    <SelectValue
                      placeholder={
                        isLoadingCategories
                          ? 'Carregando parâmetros GRI...'
                          : 'Selecione o parâmetro GRI'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.esgMetricId ? (
              <p
                className="m-0 text-[13px] font-semibold text-red-600"
                role="alert"
              >
                {errors.esgMetricId.message}
              </p>
            ) : null}
            {categoriesError ? (
              <p
                className="m-0 text-[13px] font-semibold text-red-600"
                role="alert"
              >
                {categoriesError}
              </p>
            ) : null}
            {hasNoCategories ? (
              <p
                className="m-0 rounded-sm border border-amber-300 bg-amber-50 px-3 py-2.5 text-[13px] text-amber-800"
                role="status"
              >
                Esta empresa ainda não possui parâmetros GRI vinculados. Faça a
                parametrização GRI da empresa antes de cadastrar condicionantes.
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
            <Label htmlFor="condition-due-date">
              Data de Vencimento <span aria-hidden="true">*</span>
            </Label>
            <InputGroup aria-invalid={Boolean(errors.dueDate)} variant="field">
              <Input
                {...register('dueDate')}
                aria-describedby={
                  errors.dueDate ? 'condition-due-date-error' : undefined
                }
                aria-invalid={Boolean(errors.dueDate)}
                aria-required="true"
                id="condition-due-date"
                required
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

          <fieldset className="col-span-2 m-0 grid grid-cols-3 gap-4 border-0 p-0 max-[560px]:col-span-1 max-[560px]:grid-cols-1">
            <legend className="mb-2 p-0 text-sm font-semibold">
              Meta de Conformidade ESG
            </legend>

            <div className="flex flex-col gap-2">
              <Label htmlFor="condition-target-metric">Métrica ESG alvo</Label>
              <Controller
                control={control}
                name="targetMetricId"
                render={({ field }) => (
                  <Select
                    disabled={isLoadingCategories || categories.length === 0}
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <SelectTrigger
                      aria-invalid={Boolean(errors.targetMetricId)}
                      className="w-full"
                      id="condition-target-metric"
                    >
                      <SelectValue placeholder="Selecione a métrica" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((metric) => (
                        <SelectItem key={metric.id} value={metric.id}>
                          {metric.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.targetMetricId ? (
                <p
                  className="m-0 text-[13px] font-semibold text-red-600"
                  role="alert"
                >
                  {errors.targetMetricId.message}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="condition-target-operator">Operador</Label>
              <Controller
                control={control}
                name="targetOperator"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger
                      aria-invalid={Boolean(errors.targetOperator)}
                      className="w-full"
                      id="condition-target-operator"
                    >
                      <SelectValue placeholder="Selecione o operador" />
                    </SelectTrigger>
                    <SelectContent>
                      {TARGET_OPERATORS.map((operator) => (
                        <SelectItem key={operator.value} value={operator.value}>
                          {operator.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.targetOperator ? (
                <p
                  className="m-0 text-[13px] font-semibold text-red-600"
                  role="alert"
                >
                  {errors.targetOperator.message}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="condition-target-value">Valor da meta</Label>
              <InputGroup
                aria-invalid={Boolean(errors.targetValue)}
                variant="field"
              >
                <Input
                  {...register('targetValue')}
                  aria-invalid={Boolean(errors.targetValue)}
                  id="condition-target-value"
                  inputMode="decimal"
                  placeholder="Ex: 6.5"
                  type="number"
                  step="any"
                />
              </InputGroup>
              {errors.targetValue ? (
                <p
                  className="m-0 text-[13px] font-semibold text-red-600"
                  role="alert"
                >
                  {errors.targetValue.message}
                </p>
              ) : null}
            </div>
          </fieldset>

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
                !isValid ||
                isSubmitting ||
                isLoadingLicenses ||
                licenses.length === 0 ||
                isLoadingCategories ||
                categories.length === 0
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
