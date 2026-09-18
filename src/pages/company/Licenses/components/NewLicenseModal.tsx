import { type ChangeEvent, type FormEvent, useEffect, useState } from 'react';
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
  LICENSE_TYPE_LABELS,
  type IssuingAgency,
  type License,
  type LicenseType,
} from '../../../../features/licenses/types';
import { ApiError } from '../../../../services/api/apiError';
import { listIssuingAgencies } from '../../../../services/api/issuingAgenciesApi';
import { createLicense } from '../../../../services/api/licensesApi';

const LICENSE_TYPES: LicenseType[] = ['LP', 'LI', 'LO'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

const GENERIC_ERROR_MESSAGE =
  'Não foi possível cadastrar a licença. Tente novamente mais tarde.';
const INVALID_FILE_TYPE_MESSAGE = 'O arquivo deve estar no formato PDF.';
const FILE_TOO_LARGE_MESSAGE = 'O arquivo não pode ultrapassar 5MB.';
const INVALID_DATE_RANGE_MESSAGE =
  'A data de validade deve ser posterior à data de emissão.';

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
  const [type, setType] = useState<LicenseType | ''>('');
  const [processNumber, setProcessNumber] = useState('');
  const [issuingAgencyId, setIssuingAgencyId] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const [issuingAgencies, setIssuingAgencies] = useState<IssuingAgency[]>([]);
  const [isLoadingAgencies, setIsLoadingAgencies] = useState(false);

  const [fileError, setFileError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  function resetForm() {
    setType('');
    setProcessNumber('');
    setIssuingAgencyId('');
    setIssueDate('');
    setExpirationDate('');
    setFile(null);
    setFileError(null);
    setFormError(null);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) resetForm();
    onOpenChange(nextOpen);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null;

    if (!selected) {
      setFile(null);
      setFileError(null);
      return;
    }

    if (selected.type !== 'application/pdf') {
      setFile(null);
      setFileError(INVALID_FILE_TYPE_MESSAGE);
      event.target.value = '';
      return;
    }

    if (selected.size > MAX_FILE_SIZE_BYTES) {
      setFile(null);
      setFileError(FILE_TOO_LARGE_MESSAGE);
      event.target.value = '';
      return;
    }

    setFile(selected);
    setFileError(null);
  }

  const isDateRangeInvalid = Boolean(
    issueDate && expirationDate && expirationDate <= issueDate
  );
  const isFormValid = Boolean(
    type &&
    processNumber.trim() &&
    issuingAgencyId &&
    issueDate &&
    expirationDate &&
    !isDateRangeInvalid &&
    file &&
    !fileError
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!isFormValid || !type || !file) return;

    setIsSubmitting(true);
    try {
      const license = await createLicense(companyId, {
        type,
        processNumber: processNumber.trim(),
        issuingAgencyId,
        issueDate,
        expirationDate,
        documentFile: file,
      });
      onCreated?.(license);
      handleOpenChange(false);
    } catch (error) {
      setFormError(
        error instanceof ApiError ? error.message : GENERIC_ERROR_MESSAGE
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nova Licença</DialogTitle>
          <DialogDescription>
            Preencha os dados da licença ambiental e anexe o documento em PDF.
          </DialogDescription>
        </DialogHeader>

        <form
          className="grid grid-cols-2 gap-4 max-[560px]:grid-cols-1"
          onSubmit={(event) => void handleSubmit(event)}
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="license-type">Tipo de Licença</Label>
            <Select
              onValueChange={(value) => setType(value as LicenseType)}
              value={type}
            >
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
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="process-number">Nº do Processo / Licença</Label>
            <InputGroup variant="field">
              <Input
                id="process-number"
                onChange={(event) => setProcessNumber(event.target.value)}
                placeholder="Ex: LO nº 118/2020"
                required
                value={processNumber}
              />
            </InputGroup>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="issuing-agency">Órgão Emissor</Label>
            <Select
              disabled={isLoadingAgencies}
              onValueChange={setIssuingAgencyId}
              value={issuingAgencyId}
            >
              <SelectTrigger className="w-full" id="issuing-agency">
                <SelectValue
                  placeholder={
                    isLoadingAgencies ? 'Carregando...' : 'Selecione o órgão'
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
          </div>

          <div aria-hidden="true" className="max-[560px]:hidden" />

          <div className="flex flex-col gap-2">
            <Label htmlFor="issue-date">Data de Emissão</Label>
            <InputGroup variant="field">
              <Input
                id="issue-date"
                onChange={(event) => setIssueDate(event.target.value)}
                required
                type="date"
                value={issueDate}
              />
            </InputGroup>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="expiration-date">Data de Validade</Label>
            <InputGroup variant="field">
              <Input
                id="expiration-date"
                onChange={(event) => setExpirationDate(event.target.value)}
                required
                type="date"
                value={expirationDate}
              />
            </InputGroup>
            {isDateRangeInvalid ? (
              <p
                className="m-0 text-[13px] font-semibold text-red-600"
                role="alert"
              >
                {INVALID_DATE_RANGE_MESSAGE}
              </p>
            ) : null}
          </div>

          <div className="col-span-2 flex flex-col gap-2 max-[560px]:col-span-1">
            <Label htmlFor="document-file">Upload de Arquivo (PDF)</Label>
            <input
              accept="application/pdf,.pdf"
              className="text-sm text-text-secondary file:mr-3 file:cursor-pointer file:rounded-control file:border-0 file:bg-surface-muted file:px-3 file:py-1.5 file:text-text-primary"
              id="document-file"
              onChange={handleFileChange}
              type="file"
            />
            {fileError ? (
              <p
                className="m-0 text-[13px] font-semibold text-red-600"
                role="alert"
              >
                {fileError}
              </p>
            ) : null}
          </div>

          {formError ? (
            <p
              aria-live="polite"
              className="col-span-2 m-0 rounded-sm border border-[#fda29b] bg-[#fef3f2] px-3 py-2.5 text-[13px] font-semibold text-[#b42318] max-[560px]:col-span-1"
              role="alert"
            >
              {formError}
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
              disabled={!isFormValid || isSubmitting}
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
