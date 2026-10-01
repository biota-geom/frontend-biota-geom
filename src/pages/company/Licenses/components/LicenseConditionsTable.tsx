import { Plus, Trash2 } from 'lucide-react';
import {
  Controller,
  useFieldArray,
  useFormState,
  type Control,
  type UseFormRegister,
} from 'react-hook-form';
import { Button } from '@/components/ui/shadcn/button';
import { Input } from '@/components/ui/shadcn/input';
import { InputGroup } from '@/components/ui/shadcn/input-group';
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
  type CreateLicenseForm,
  type LicenseConditionRow,
} from '../../../../features/licenses/createLicenseValidation';
import type { EsgIndicator } from '../../../../features/companies/types';

type LicenseConditionsTableProps = {
  categories: EsgIndicator[];
  categoriesError: string | null;
  control: Control<CreateLicenseForm>;
  disabled?: boolean;
  isLoadingCategories: boolean;
  register: UseFormRegister<CreateLicenseForm>;
};

const HEADERS = [
  'Categoria',
  'Nº Item',
  'Descrição',
  'Tipo',
  'Periodicidade',
  'Prazo',
  'Responsável',
];

export function LicenseConditionsTable({
  categories,
  categoriesError,
  control,
  disabled = false,
  isLoadingCategories,
  register,
}: LicenseConditionsTableProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'conditions',
  });
  const { errors } = useFormState({ control, name: 'conditions' });

  function hasError(index: number, key: keyof LicenseConditionRow) {
    return Boolean(errors.conditions?.[index]?.[key]);
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
          Condicionantes
        </h3>
        <p className="m-0 text-[13px] text-text-secondary">
          Adicione obrigações vinculadas à licença
        </p>
      </div>

      {fields.length > 0 ? (
        <>
          <div className="rounded-panel overflow-x-auto border border-border">
            <table className="w-full min-w-[1040px] border-collapse text-sm">
              <thead>
                <tr className="bg-surface-muted text-left text-[13px] font-bold text-text-primary">
                  {HEADERS.map((header) => (
                    <th className="px-2 py-2.5 font-bold" key={header}>
                      {header}
                    </th>
                  ))}
                  <th className="w-10 px-2 py-2.5">
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {fields.map((field, index) => {
                  const n = index + 1;
                  return (
                    <tr className="border-t border-border" key={field.id}>
                      <td className="w-[180px] px-1.5 py-1.5">
                        <Controller
                          control={control}
                          name={`conditions.${index}.esgMetricId`}
                          render={({ field: categoryField }) => (
                            <Select
                              disabled={
                                disabled ||
                                isLoadingCategories ||
                                categories.length === 0
                              }
                              onValueChange={categoryField.onChange}
                              value={categoryField.value}
                            >
                              <SelectTrigger
                                aria-invalid={hasError(index, 'esgMetricId')}
                                aria-label={`Categoria da condicionante ${n}`}
                                className="w-full"
                              >
                                <SelectValue
                                  placeholder={
                                    isLoadingCategories
                                      ? 'Carregando...'
                                      : 'Categoria GRI'
                                  }
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {categories.map((category) => (
                                  <SelectItem
                                    key={category.id}
                                    value={category.id}
                                  >
                                    {category.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </td>
                      <td className="w-[84px] px-1.5 py-1.5">
                        <InputGroup
                          aria-invalid={hasError(index, 'itemNumber')}
                          variant="cell"
                        >
                          <Input
                            {...register(`conditions.${index}.itemNumber`)}
                            aria-label={`Nº do item da condicionante ${n}`}
                            aria-invalid={hasError(index, 'itemNumber')}
                            placeholder="1.1"
                          />
                        </InputGroup>
                      </td>
                      <td className="min-w-[220px] px-1.5 py-1.5">
                        <InputGroup
                          aria-invalid={hasError(index, 'description')}
                          variant="cell"
                        >
                          <Input
                            {...register(`conditions.${index}.description`)}
                            aria-label={`Descrição da condicionante ${n}`}
                            aria-invalid={hasError(index, 'description')}
                            placeholder="Descreva a obrigação"
                          />
                        </InputGroup>
                      </td>
                      <td className="w-[130px] px-1.5 py-1.5">
                        <Controller
                          control={control}
                          name={`conditions.${index}.conditionType`}
                          render={({ field: typeField }) => (
                            <Select
                              onValueChange={typeField.onChange}
                              value={typeField.value}
                            >
                              <SelectTrigger
                                aria-invalid={hasError(index, 'conditionType')}
                                aria-label={`Tipo da condicionante ${n}`}
                                className="w-full"
                              >
                                <SelectValue placeholder="Tipo" />
                              </SelectTrigger>
                              <SelectContent>
                                {CONDITION_TYPES.map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {type}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </td>
                      <td className="w-[150px] px-1.5 py-1.5">
                        <Controller
                          control={control}
                          name={`conditions.${index}.periodicity`}
                          render={({ field: periodicityField }) => (
                            <Select
                              onValueChange={periodicityField.onChange}
                              value={periodicityField.value}
                            >
                              <SelectTrigger
                                aria-invalid={hasError(index, 'periodicity')}
                                aria-label={`Periodicidade da condicionante ${n}`}
                                className="w-full"
                              >
                                <SelectValue placeholder="Periodicidade" />
                              </SelectTrigger>
                              <SelectContent>
                                {CONDITION_PERIODICITIES.map((periodicity) => (
                                  <SelectItem
                                    key={periodicity}
                                    value={periodicity}
                                  >
                                    {periodicity}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </td>
                      <td className="w-[150px] px-1.5 py-1.5">
                        <InputGroup
                          aria-invalid={hasError(index, 'deadline')}
                          variant="cell"
                        >
                          <Input
                            {...register(`conditions.${index}.deadline`)}
                            aria-label={`Prazo da condicionante ${n}`}
                            aria-invalid={hasError(index, 'deadline')}
                            type="date"
                          />
                        </InputGroup>
                      </td>
                      <td className="w-[160px] px-1.5 py-1.5">
                        <InputGroup
                          aria-invalid={hasError(index, 'responsibleName')}
                          variant="cell"
                        >
                          <Input
                            {...register(`conditions.${index}.responsibleName`)}
                            aria-label={`Responsável pela condicionante ${n}`}
                            aria-invalid={hasError(index, 'responsibleName')}
                            placeholder="Nome"
                          />
                        </InputGroup>
                      </td>
                      <td className="px-1.5 py-1.5 text-right">
                        <Button
                          aria-label={`Remover condicionante ${n}`}
                          disabled={disabled}
                          onClick={() => remove(index)}
                          type="button"
                          variant="iconDanger"
                        >
                          <Trash2 aria-hidden="true" size={14} />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="m-0 text-[13px] text-text-secondary">
            Todos os campos são obrigatórios. Remova a linha para não incluir a
            condicionante.
          </p>
          {categoriesError ? (
            <p
              className="m-0 text-[13px] font-semibold text-red-600"
              role="alert"
            >
              {categoriesError}
            </p>
          ) : null}
          {!isLoadingCategories &&
          !categoriesError &&
          categories.length === 0 ? (
            <p
              className="m-0 rounded-sm border border-amber-300 bg-amber-50 px-3 py-2.5 text-[13px] text-amber-800"
              role="status"
            >
              Esta empresa ainda não possui parâmetros GRI vinculados. Faça a
              parametrização GRI da empresa antes de cadastrar condicionantes.
            </p>
          ) : null}
        </>
      ) : null}

      <div>
        <Button
          disabled={disabled}
          onClick={() => append({ ...EMPTY_CONDITION_ROW })}
          type="button"
          variant="addRow"
        >
          <Plus aria-hidden="true" size={16} />
          Adicionar Condicionante
        </Button>
      </div>
    </section>
  );
}
