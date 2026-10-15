import { useState, type ChangeEvent, type FormEvent } from 'react';
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
import type {
  LicenseDetails,
  LicenseRenewed,
} from '../../../../features/licenses/types';
import { ApiError } from '../../../../services/api/apiError';
import { renewLicense } from '../../../../services/api/licensesApi';

const GENERIC_ERROR_MESSAGE =
  'Não foi possível renovar a licença. Tente novamente mais tarde.';

type RenewLicenseModalProps = {
  license: LicenseDetails;
  onOpenChange: (open: boolean) => void;
  onRenewed: (license: LicenseRenewed) => void;
  open: boolean;
};

function emptyForm() {
  return {
    processNumber: '',
    issueDate: '',
    expirationDate: '',
    file: null as File | null,
  };
}

export function RenewLicenseModal({
  license,
  onOpenChange,
  onRenewed,
  open,
}: RenewLicenseModalProps) {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function closeAndReset() {
    setForm(emptyForm());
    setError(null);
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
    setForm((current) => ({
      ...current,
      file: event.target.files?.[0] ?? null,
    }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!form.file) {
      setError('Envie o arquivo PDF da nova licença.');
      return;
    }

    if (form.expirationDate <= form.issueDate) {
      setError('A data de validade deve ser posterior à data de emissão.');
      return;
    }

    setIsSubmitting(true);
    try {
      const renewed = await renewLicense(license.id, {
        processNumber: form.processNumber,
        issueDate: form.issueDate,
        expirationDate: form.expirationDate,
        documentFile: form.file,
      });
      closeAndReset();
      onRenewed(renewed);
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught.message : GENERIC_ERROR_MESSAGE
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const canSubmit =
    form.processNumber.trim().length > 0 &&
    form.issueDate.length > 0 &&
    form.expirationDate.length > 0 &&
    Boolean(form.file);

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Renovar Licença</DialogTitle>
          <DialogDescription>
            A licença atual será arquivada e uma nova licença será criada com
            vínculo ao histórico anterior.
          </DialogDescription>
        </DialogHeader>

        <form
          className="grid grid-cols-2 gap-4 max-[560px]:grid-cols-1"
          noValidate
          onSubmit={(event) => void submit(event)}
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="renew-license-type">Tipo de Licença</Label>
            <InputGroup variant="field">
              <Input id="renew-license-type" readOnly value={license.type} />
            </InputGroup>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="renew-license-agency">Órgão Emissor</Label>
            <InputGroup variant="field">
              <Input
                id="renew-license-agency"
                readOnly
                value={license.issuingAgency ?? '—'}
              />
            </InputGroup>
          </div>

          <div className="col-span-2 flex flex-col gap-2 max-[560px]:col-span-1">
            <Label htmlFor="renew-process-number">Novo número da licença</Label>
            <InputGroup variant="field">
              <Input
                id="renew-process-number"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    processNumber: event.target.value,
                  }))
                }
                placeholder="Ex: LO nº 119/2026"
                value={form.processNumber}
              />
            </InputGroup>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="renew-issue-date">Data de Emissão</Label>
            <InputGroup variant="field">
              <Input
                id="renew-issue-date"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    issueDate: event.target.value,
                  }))
                }
                type="date"
                value={form.issueDate}
              />
            </InputGroup>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="renew-expiration-date">Data de Validade</Label>
            <InputGroup variant="field">
              <Input
                id="renew-expiration-date"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    expirationDate: event.target.value,
                  }))
                }
                type="date"
                value={form.expirationDate}
              />
            </InputGroup>
          </div>

          <div className="col-span-2 flex flex-col gap-2 max-[560px]:col-span-1">
            <Label htmlFor="renew-document-file">PDF da nova licença</Label>
            <input
              accept="application/pdf,.pdf"
              className="text-sm text-text-secondary file:mr-3 file:cursor-pointer file:rounded-control file:border-0 file:bg-surface-muted file:px-3 file:py-1.5 file:text-text-primary"
              id="renew-document-file"
              onChange={handleFileChange}
              type="file"
            />
          </div>

          {error ? (
            <p
              aria-live="polite"
              className="col-span-2 m-0 rounded-sm border border-[#fda29b] bg-[#fef3f2] px-3 py-2.5 text-[13px] font-semibold text-[#b42318] max-[560px]:col-span-1"
              role="alert"
            >
              {error}
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
              disabled={!canSubmit || isSubmitting}
              type="submit"
              variant="dialogPrimary"
            >
              {isSubmitting ? 'Renovando...' : 'Renovar Licença'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
