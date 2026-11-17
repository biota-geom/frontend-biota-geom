import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef, useState, type ReactNode } from 'react';
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
  formatLegislationType,
  LEGISLATION_TYPES,
  formatLegislationNumber,
} from '../../features/legislation/legislationFormatting';
import {
  EMPTY_LEGISLATION_FORM,
  legislationFormSchema,
  toLegislationFormResult,
  type LegislationFormResult,
  type LegislationFormValues,
  type ParsedLegislationForm,
} from '../../features/legislation/legislationFormValidation';
import { ApiError } from '../../services/api/apiError';
import { searchLegislationCatalog } from '../../services/api/legislationsApi';
import type { Legislation } from '../../features/legislation/types';

const GENERIC_ERROR_MESSAGE =
  'Não foi possível salvar a legislação. Tente novamente mais tarde.';

interface LegislationFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** `edit` prefills the fields from `initialValue`. */
  mode: 'create' | 'edit';
  initialValue?: LegislationFormResult;
  /**
   * Persists the form. Resolving closes the modal; a thrown `ApiError` keeps
   * it open with the backend message (e.g. the 409 of a duplicated act).
   */
  onSubmit: (result: LegislationFormResult) => Promise<void>;
  /** The catalog has no license context, so it hides the cited excerpt. */
  showCitedExcerpt?: boolean;
}

function toFormValues(value?: LegislationFormResult): LegislationFormValues {
  if (!value) return EMPTY_LEGISLATION_FORM;

  return {
    type: value.legislation.type,
    number: value.legislation.number,
    year: String(value.legislation.year),
    issuingBody: value.legislation.issuingBody,
    summary: value.legislation.summary ?? '',
    citedExcerpt: value.citedExcerpt ?? '',
  };
}

/*
 * Create/edit form of a legislation, independent of where it is saved: the
 * license radar passes an `onSubmit` that calls its endpoint, and other
 * screens (e.g. the legislation catalog) can pass their own.
 */
export function LegislationFormModal({
  initialValue,
  mode,
  onOpenChange,
  onSubmit,
  open,
  showCitedExcerpt = true,
}: LegislationFormModalProps) {
  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
    clearErrors,
    setError,
    setValue,
  } = useForm<LegislationFormValues, unknown, ParsedLegislationForm>({
    defaultValues: EMPTY_LEGISLATION_FORM,
    mode: 'onTouched',
    resolver: zodResolver(legislationFormSchema),
  });
  const [catalogSuggestions, setCatalogSuggestions] = useState<Legislation[]>(
    []
  );
  const [selectedCatalogId, setSelectedCatalogId] = useState<string | null>(
    null
  );
  const [selectedCatalog, setSelectedCatalog] = useState<Legislation | null>(
    null
  );
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogResultQuery, setCatalogResultQuery] = useState<string | null>(
    null
  );
  const [catalogSearchStatus, setCatalogSearchStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const catalogSearchRequestRef = useRef(0);
  const numberRegistration = register('number');
  const isCatalogSearchActive =
    mode === 'create' &&
    open &&
    !selectedCatalogId &&
    catalogSearch.trim().length >= 2;
  const hasCurrentCatalogResult =
    isCatalogSearchActive && catalogResultQuery === catalogSearch;

  useEffect(() => {
    if (!isCatalogSearchActive) {
      catalogSearchRequestRef.current += 1;
      return;
    }

    const requestId = ++catalogSearchRequestRef.current;
    const timeout = window.setTimeout(() => {
      void searchLegislationCatalog(catalogSearch)
        .then((suggestions) => {
          if (requestId !== catalogSearchRequestRef.current) return;
          setCatalogSuggestions(suggestions);
          setCatalogResultQuery(catalogSearch);
          setCatalogSearchStatus('success');
        })
        .catch(() => {
          if (requestId !== catalogSearchRequestRef.current) return;
          setCatalogSuggestions([]);
          setCatalogResultQuery(catalogSearch);
          setCatalogSearchStatus('error');
        });
    }, 300);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [catalogSearch, isCatalogSearchActive]);

  useEffect(() => {
    if (open) {
      reset(toFormValues(initialValue));
    }
  }, [initialValue, mode, open, reset]);

  function resetCatalogSearch() {
    setSelectedCatalogId(null);
    setSelectedCatalog(null);
    setCatalogSearch('');
    setCatalogSuggestions([]);
    setCatalogResultQuery(null);
    setCatalogSearchStatus('idle');
  }

  function handleOpenChange(nextOpen: boolean) {
    if (isSubmitting) return;
    if (!nextOpen) resetCatalogSearch();
    onOpenChange(nextOpen);
  }

  const submit = handleSubmit(async (values) => {
    try {
      if (mode === 'create' && selectedCatalog) {
        const result: LegislationFormResult = {
          legislationId: selectedCatalog.id,
          legislation: {
            type: selectedCatalog.type,
            number: selectedCatalog.number,
            year: selectedCatalog.year,
            issuingBody: selectedCatalog.issuingBody,
            summary: selectedCatalog.summary,
          },
          citedExcerpt: values.citedExcerpt || null,
        };
        await onSubmit(result);
      } else {
        await onSubmit(toLegislationFormResult(values));
      }
      resetCatalogSearch();
      onOpenChange(false);
    } catch (error) {
      setError('root', {
        message:
          error instanceof ApiError ? error.message : GENERIC_ERROR_MESSAGE,
      });
    }
  });

  const isEdit = mode === 'edit';

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Editar legislação' : 'Adicionar legislação'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Atualize os dados da legislação vinculada.'
              : 'Pesquise uma legislação cadastrada ou informe os dados para cadastrar uma nova.'}
          </DialogDescription>
        </DialogHeader>

        <form
          className="grid grid-cols-2 gap-4 max-[560px]:grid-cols-1"
          noValidate
          onSubmit={(event) => void submit(event)}
        >
          <div
            className={`relative flex flex-col gap-2 ${
              isEdit ? '' : 'col-span-2 max-[560px]:col-span-1'
            }`}
          >
            <Label htmlFor="legislation-number">
              {isEdit ? 'Número *' : 'Pesquisar no catálogo (opcional)'}
            </Label>
            <InputGroup aria-invalid={Boolean(errors.number)} variant="field">
              <Input
                {...(isEdit ? numberRegistration : {})}
                aria-invalid={isEdit ? Boolean(errors.number) : undefined}
                id="legislation-number"
                onChange={(event) => {
                  if (isEdit) {
                    void numberRegistration.onChange(event);
                  } else {
                    const nextSearch = event.currentTarget.value;
                    clearErrors('root');
                    setCatalogSearch(nextSearch);
                    setCatalogResultQuery(null);
                    setCatalogSearchStatus(
                      nextSearch.trim().length >= 2 ? 'loading' : 'idle'
                    );
                    if (selectedCatalogId) {
                      setSelectedCatalogId(null);
                      setSelectedCatalog(null);
                    }
                  }
                }}
                value={isEdit ? undefined : catalogSearch}
                placeholder={
                  isEdit ? 'Ex.: 12.305' : 'Pesquisar por número, ano ou ementa'
                }
              />
            </InputGroup>
            {isCatalogSearchActive && catalogSearchStatus === 'loading' ? (
              <p
                aria-live="polite"
                className="m-0 text-xs text-text-secondary"
                role="status"
              >
                Pesquisando legislações...
              </p>
            ) : hasCurrentCatalogResult &&
              catalogSearchStatus === 'success' &&
              catalogSuggestions.length > 0 ? (
              <div
                aria-label="Sugestões de legislações"
                className="max-h-80 w-full overflow-y-auto rounded-control border border-border bg-surface"
                role="listbox"
              >
                {catalogSuggestions.map((item) => (
                  <button
                    aria-selected={selectedCatalogId === item.id}
                    className="block w-full border-0 border-b border-border bg-surface px-3 py-2 text-left text-xs text-text-primary last:border-b-0 hover:bg-surface-muted"
                    key={item.id}
                    onClick={() => {
                      setSelectedCatalogId(item.id);
                      setSelectedCatalog(item);
                      setCatalogResultQuery(null);
                      setCatalogSearchStatus('idle');
                      setValue('type', item.type, { shouldValidate: true });
                      setValue('number', item.number, { shouldValidate: true });
                      setValue('year', String(item.year), {
                        shouldValidate: true,
                      });
                      setValue('issuingBody', item.issuingBody, {
                        shouldValidate: true,
                      });
                      setValue('summary', item.summary ?? '', {
                        shouldValidate: true,
                      });
                      setCatalogSearch(item.number);
                      setCatalogSuggestions([]);
                    }}
                    type="button"
                    role="option"
                  >
                    <span className="block font-bold">
                      {formatLegislationType(item.type)}{' '}
                      {formatLegislationNumber(item)}
                    </span>
                    {item.issuingBody ? (
                      <span className="block text-text-secondary">
                        {item.issuingBody}
                      </span>
                    ) : null}
                    {item.summary ? (
                      <span className="mt-1 block text-text-secondary">
                        {item.summary}
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            ) : hasCurrentCatalogResult && catalogSearchStatus === 'error' ? (
              <p className="m-0 text-xs text-[#b42318]" role="alert">
                Não foi possível pesquisar no catálogo. Tente novamente.
              </p>
            ) : hasCurrentCatalogResult &&
              catalogSearchStatus === 'success' &&
              catalogSuggestions.length === 0 ? (
              <p className="m-0 text-xs text-text-secondary" role="status">
                Nenhuma legislação encontrada no catálogo. Preencha os dados
                abaixo para cadastrar uma nova.
              </p>
            ) : null}
          </div>

          {mode === 'create' && selectedCatalog ? (
            <div className="col-span-2 flex flex-col gap-1 rounded-control border border-border bg-surface-muted px-3 py-2 max-[560px]:col-span-1">
              <p className="m-0 text-xs font-bold text-text-primary">
                {formatLegislationType(selectedCatalog.type)}{' '}
                {formatLegislationNumber(selectedCatalog)}
              </p>
              {selectedCatalog.issuingBody ? (
                <p className="m-0 text-xs text-text-secondary">
                  {selectedCatalog.issuingBody}
                </p>
              ) : null}
              {selectedCatalog.summary ? (
                <p className="m-0 text-xs text-text-secondary">
                  {selectedCatalog.summary}
                </p>
              ) : null}
            </div>
          ) : null}

          {isEdit || (mode === 'create' && !selectedCatalog) ? (
            <>
              <div className="flex flex-col gap-2">
                <Label htmlFor="legislation-type">Tipo *</Label>
                <Controller
                  control={control}
                  name="type"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger
                        aria-invalid={Boolean(errors.type)}
                        aria-label="Tipo da legislação"
                        className="min-h-[42px] w-full justify-between border-border bg-surface text-sm text-text-primary focus:border-focus"
                        id="legislation-type"
                        onBlur={field.onBlur}
                      >
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent className="border-border bg-surface">
                        {LEGISLATION_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {formatLegislationType(type)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError message={errors.type?.message} />
              </div>

              {mode === 'create' ? (
                <TextField
                  error={errors.number?.message}
                  id="legislation-new-number"
                  label="Número *"
                >
                  <Input
                    {...register('number')}
                    aria-invalid={Boolean(errors.number)}
                    id="legislation-new-number"
                    placeholder="Ex.: 12.305"
                  />
                </TextField>
              ) : null}

              <TextField
                error={errors.year?.message}
                id="legislation-year"
                label="Ano *"
              >
                <Input
                  {...register('year')}
                  aria-invalid={Boolean(errors.year)}
                  id="legislation-year"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="Ex.: 2010"
                />
              </TextField>

              <TextField
                error={errors.issuingBody?.message}
                id="legislation-issuing-body"
                label="Órgão emissor *"
              >
                <Input
                  {...register('issuingBody')}
                  aria-invalid={Boolean(errors.issuingBody)}
                  id="legislation-issuing-body"
                  placeholder="Ex.: Governo Federal"
                />
              </TextField>

              <div className="col-span-2 flex flex-col gap-2 max-[560px]:col-span-1">
                <Label htmlFor="legislation-summary">Ementa</Label>
                <Textarea
                  {...register('summary')}
                  aria-invalid={Boolean(errors.summary)}
                  id="legislation-summary"
                />
                <FieldError message={errors.summary?.message} />
              </div>
            </>
          ) : null}

          {showCitedExcerpt ? (
            <div className="col-span-2 flex flex-col gap-2 max-[560px]:col-span-1">
              <Label htmlFor="legislation-cited-excerpt">
                Trecho citado (opcional)
              </Label>
              <Textarea
                {...register('citedExcerpt')}
                aria-invalid={Boolean(errors.citedExcerpt)}
                id="legislation-cited-excerpt"
                placeholder="Trecho da licença que cita a legislação"
              />
              <FieldError message={errors.citedExcerpt?.message} />
            </div>
          ) : null}

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
              disabled={isSubmitting}
              type="submit"
              variant="dialogPrimary"
            >
              {isSubmitting
                ? 'Salvando...'
                : isEdit
                  ? 'Salvar alterações'
                  : 'Adicionar legislação'}
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
  children: ReactNode;
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
