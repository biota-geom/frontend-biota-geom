import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Sparkles } from 'lucide-react';
import { Controller, useForm, useWatch } from 'react-hook-form';
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
  CREATE_LICENSE_DEFAULT_VALUES,
  createLicenseSchema,
  LICENSE_TYPES,
  MAX_FILE_SIZE_BYTES,
  toLicenseConditionBatchItem,
  type CreateLicenseForm,
} from '../../../../features/licenses/createLicenseValidation';
import {
  matchIssuingAgency,
  selectedSuggestedConditions,
  toSuggestedConditionRow,
} from '../../../../features/licenses/licenseExtraction';
import {
  LICENSE_TYPE_LABELS,
  type IssuingAgency,
  type License,
  type LicenseExtraction,
  type LicenseType,
} from '../../../../features/licenses/types';
import { ApiError } from '../../../../services/api/apiError';
import { listIssuingAgencies } from '../../../../services/api/issuingAgenciesApi';
import { createLicenseConditions } from '../../../../services/api/licenseConditionsApi';
import {
  createLicense,
  extractLicenseData,
} from '../../../../services/api/licensesApi';
import { LicenseConditionsTable } from './LicenseConditionsTable';
import { SuggestedConditionsList } from './SuggestedConditionsList';

const GENERIC_ERROR_MESSAGE =
  'Não foi possível cadastrar a licença. Tente novamente mais tarde.';
const CONDITIONS_ERROR_PREFIX =
  'A licença foi cadastrada, mas as condicionantes não foram salvas.';
const CONDITIONS_ERROR_FALLBACK = 'Tente novamente.';
const EXTRACTION_ERROR_FALLBACK =
  'Não foi possível ler o documento automaticamente. Preencha os campos manualmente.';

type ExtractionState =
  | { status: 'idle' | 'loading' | 'success' }
  | { status: 'error'; message: string };

type ExtractableField =
  'type' | 'processNumber' | 'issueDate' | 'expirationDate';

type NewLicenseModalProps = {
  companyId: string;
  onCreated?: (license: License) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

export function NewLicenseModal({
  companyId,
  onCreated,
  onOpenChange,
  open,
}: NewLicenseModalProps) {
  const [issuingAgencies, setIssuingAgencies] = useState<IssuingAgency[]>([]);
  const [isLoadingAgencies, setIsLoadingAgencies] = useState(false);
  /* Set after step 1 succeeds so a retry never creates the license twice. */
  const [createdLicense, setCreatedLicense] = useState<License | null>(null);
  const [extraction, setExtraction] = useState<ExtractionState>({
    status: 'idle',
  });
  /* Agency name/acronym the AI read, matched once the agency list is loaded. */
  const [extractedAgency, setExtractedAgency] = useState<string | null>(null);
  /* Bumped per extraction (and on close) so a stale response is ignored. */
  const extractionRequestRef = useRef(0);

  const {
    control,
    formState: { errors, isSubmitting, isValid },
    getValues,
    handleSubmit,
    register,
    reset,
    setError,
    setValue,
  } = useForm<CreateLicenseForm>({
    defaultValues: CREATE_LICENSE_DEFAULT_VALUES,
    mode: 'onChange',
    resolver: zodResolver(createLicenseSchema),
  });
  const issuingAgencyId = useWatch({ control, name: 'issuingAgencyId' });

  useEffect(() => {
    if (!open) return;

    let isCurrent = true;

    async function loadIssuingAgencies() {
      setIsLoadingAgencies(true);
      try {
        const agencies = await listIssuingAgencies();
        if (isCurrent) setIssuingAgencies(agencies);
      } catch {
        if (isCurrent) setIssuingAgencies([]);
      } finally {
        if (isCurrent) setIsLoadingAgencies(false);
      }
    }

    void loadIssuingAgencies();

    return () => {
      isCurrent = false;
    };
  }, [open]);

  useEffect(() => {
    if (!extractedAgency || getValues('issuingAgencyId')) return;

    const agencyId = matchIssuingAgency(extractedAgency, issuingAgencies);
    if (agencyId) {
      setValue('issuingAgencyId', agencyId, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [extractedAgency, issuingAgencies, getValues, setValue]);

  // Closing the modal discards any extraction still in flight.
  useEffect(() => {
    if (!open) extractionRequestRef.current += 1;
  }, [open]);

  function closeAndReset() {
    reset(CREATE_LICENSE_DEFAULT_VALUES);
    setCreatedLicense(null);
    setExtraction({ status: 'idle' });
    setExtractedAgency(null);
    onOpenChange(false);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      onOpenChange(true);
      return;
    }
    if (isSubmitting) return;
    closeAndReset();
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setValue('file', file, {
      shouldDirty: true,
      shouldValidate: true,
    });

    // Only a file the form itself would accept is sent for reading.
    if (
      file &&
      file.type === 'application/pdf' &&
      file.size <= MAX_FILE_SIZE_BYTES
    ) {
      void runExtraction(file);
    }
  }

  async function runExtraction(file: File) {
    const requestId = ++extractionRequestRef.current;
    setExtraction({ status: 'loading' });

    try {
      const result = await extractLicenseData(file);
      if (requestId !== extractionRequestRef.current) return;

      applyExtraction(result);
      setExtraction({ status: 'success' });
    } catch (error) {
      if (requestId !== extractionRequestRef.current) return;

      // Manual filling stays available: nothing typed so far is touched.
      setExtraction({
        status: 'error',
        message:
          error instanceof ApiError ? error.message : EXTRACTION_ERROR_FALLBACK,
      });
    }
  }

  /*
   * Suggestions only fill fields that are still empty, so a value the user
   * already typed or picked is never silently replaced.
   */
  function applyExtraction({
    extractedData,
    suggestedConditions,
  }: LicenseExtraction) {
    const suggestions: Record<ExtractableField, string | null> = {
      type: extractedData.type,
      processNumber: extractedData.processNumber,
      issueDate: extractedData.issueDate,
      expirationDate: extractedData.expirationDate,
    };

    for (const [field, value] of Object.entries(suggestions) as Array<
      [ExtractableField, string | null]
    >) {
      if (value && !getValues(field)) {
        setValue(field, value, { shouldDirty: true, shouldValidate: true });
      }
    }

    setExtractedAgency(extractedData.issuingAgency);
    setValue(
      'suggestedConditions',
      suggestedConditions.map(toSuggestedConditionRow),
      { shouldValidate: true }
    );
  }

  const unmatchedAgency =
    extraction.status === 'success' &&
    extractedAgency &&
    !issuingAgencyId &&
    !isLoadingAgencies
      ? extractedAgency
      : null;

  const submit = handleSubmit(async (values) => {
    let license = createdLicense;

    if (!license) {
      try {
        license = await createLicense(companyId, {
          type: values.type as LicenseType,
          processNumber: values.processNumber,
          issuingAgencyId: values.issuingAgencyId,
          issueDate: values.issueDate,
          expirationDate: values.expirationDate,
          // the schema guarantees a non-null PDF here
          documentFile: values.file as File,
        });
      } catch (error) {
        setError('root', {
          message:
            error instanceof ApiError ? error.message : GENERIC_ERROR_MESSAGE,
        });
        return;
      }
      setCreatedLicense(license);
      onCreated?.(license);
    }

    const conditions = [
      ...values.conditions,
      ...selectedSuggestedConditions(values.suggestedConditions),
    ];

    if (conditions.length > 0) {
      try {
        await createLicenseConditions(
          companyId,
          license.id,
          conditions.map(toLicenseConditionBatchItem)
        );
      } catch (error) {
        setError('root', {
          message: `${CONDITIONS_ERROR_PREFIX} ${
            error instanceof ApiError
              ? error.message
              : CONDITIONS_ERROR_FALLBACK
          }`,
        });
        return;
      }
    }

    closeAndReset();
  });

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle>Nova Licença</DialogTitle>
          <DialogDescription>
            Anexe o documento em PDF para que a IA sugira o preenchimento, ou
            preencha os dados da licença manualmente, e adicione as
            condicionantes iniciais.
          </DialogDescription>
        </DialogHeader>

        <form
          className="grid grid-cols-2 gap-4 max-[560px]:grid-cols-1"
          noValidate
          onSubmit={(event) => void submit(event)}
        >
          <div className="col-span-2 flex flex-col gap-2 max-[560px]:col-span-1">
            <Label htmlFor="document-file">Upload de Arquivo (PDF)</Label>
            <input
              accept="application/pdf,.pdf"
              className="text-sm text-text-secondary file:mr-3 file:cursor-pointer file:rounded-control file:border-0 file:bg-surface-muted file:px-3 file:py-1.5 file:text-text-primary"
              id="document-file"
              onChange={handleFileChange}
              type="file"
            />
            {errors.file ? (
              <p
                className="m-0 text-[13px] font-semibold text-red-600"
                role="alert"
              >
                {errors.file.message}
              </p>
            ) : null}
            <ExtractionStatus extraction={extraction} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="license-type">Tipo de Licença</Label>
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="w-full" id="license-type">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {LICENSE_TYPES.map((licenseType) => (
                      <SelectItem key={licenseType} value={licenseType}>
                        {LICENSE_TYPE_LABELS[licenseType]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="process-number">Nº do Processo / Licença</Label>
            <InputGroup variant="field">
              <Input
                {...register('processNumber')}
                id="process-number"
                placeholder="Ex: LO nº 118/2020"
              />
            </InputGroup>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="issuing-agency">Órgão Emissor</Label>
            <Controller
              control={control}
              name="issuingAgencyId"
              render={({ field }) => (
                <Select
                  disabled={isLoadingAgencies}
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <SelectTrigger className="w-full" id="issuing-agency">
                    <SelectValue
                      placeholder={
                        isLoadingAgencies
                          ? 'Carregando...'
                          : 'Selecione o órgão'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {issuingAgencies.map((agency) => (
                      <SelectItem key={agency.id} value={agency.id}>
                        {agency.acronym ?? agency.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {unmatchedAgency ? (
              <p className="m-0 text-[13px] text-text-secondary">
                Órgão identificado no documento: “{unmatchedAgency}”. Selecione
                o órgão correspondente na lista.
              </p>
            ) : null}
          </div>

          <div aria-hidden="true" className="max-[560px]:hidden" />

          <div className="flex flex-col gap-2">
            <Label htmlFor="issue-date">Data de Emissão</Label>
            <InputGroup variant="field">
              <Input {...register('issueDate')} id="issue-date" type="date" />
            </InputGroup>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="expiration-date">Data de Validade</Label>
            <InputGroup
              aria-invalid={Boolean(errors.expirationDate)}
              variant="field"
            >
              <Input
                {...register('expirationDate')}
                id="expiration-date"
                type="date"
              />
            </InputGroup>
            {errors.expirationDate ? (
              <p
                className="m-0 text-[13px] font-semibold text-red-600"
                role="alert"
              >
                {errors.expirationDate.message}
              </p>
            ) : null}
          </div>

          <SuggestedConditionsList
            control={control}
            disabled={isSubmitting}
            register={register}
            setValue={setValue}
          />

          <LicenseConditionsTable control={control} disabled={isSubmitting} />

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
              disabled={isSubmitting}
              onClick={() => handleOpenChange(false)}
              type="button"
              variant="subtle"
            >
              Cancelar
            </Button>
            <Button
              disabled={(!isValid && !createdLicense) || isSubmitting}
              type="submit"
              variant="dialogPrimary"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Licença'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ExtractionStatus({ extraction }: { extraction: ExtractionState }) {
  if (extraction.status === 'loading') {
    return (
      <p
        aria-live="polite"
        className="m-0 flex items-center gap-2 text-[13px] font-semibold text-text-secondary"
        role="status"
      >
        <Loader2 aria-hidden="true" className="animate-spin" size={14} />
        Lendo documento…
      </p>
    );
  }

  if (extraction.status === 'success') {
    return (
      <p
        aria-live="polite"
        className="m-0 flex items-center gap-2 rounded-sm border border-[#fedf89] bg-[#fffaeb] px-3 py-2 text-[13px] font-semibold text-[#b54708]"
        role="status"
      >
        <Sparkles aria-hidden="true" size={14} />
        Revise os dados sugeridos pela IA
      </p>
    );
  }

  if (extraction.status === 'error') {
    return (
      <p
        aria-live="polite"
        className="m-0 rounded-sm border border-[#fda29b] bg-[#fef3f2] px-3 py-2 text-[13px] font-semibold text-[#b42318]"
        role="alert"
      >
        {extraction.message}
      </p>
    );
  }

  return null;
}
