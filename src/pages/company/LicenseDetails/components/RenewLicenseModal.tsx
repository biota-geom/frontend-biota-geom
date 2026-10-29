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
import {
  getActionableConditions,
  type ActionableCondition,
} from '../../../../features/licenses/actionableConditions';
import type {
  LicenseDetails,
  LicenseRenewed,
  RenewalConditionDecision,
} from '../../../../features/licenses/types';
import { ApiError } from '../../../../services/api/apiError';
import { renewLicense } from '../../../../services/api/licensesApi';
import { ConditionFulfillmentList } from './ConditionFulfillmentList';

const GENERIC_ERROR_MESSAGE =
  'Não foi possível renovar a licença. Tente novamente mais tarde.';
const INVALID_COPY_DUE_DATE_MESSAGE =
  'O novo vencimento das condicionantes copiadas deve ser uma data futura e não pode passar da validade da nova licença.';

type RenewLicenseModalProps = {
  license: LicenseDetails;
  /** Reloads `license`: its conditions changed since the modal was opened. */
  onConditionsOutdated: () => void;
  onOpenChange: (open: boolean) => void;
  onRenewed: (license: LicenseRenewed) => void;
  open: boolean;
};

type CopyChoice = { copy: boolean; dueDate: string };

/* `YYYY-MM-DD` of the local day `days` from today, as date inputs use. */
function localDateInputValue(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${date.getFullYear()}-${month}-${day}`;
}

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
  onConditionsOutdated,
  onOpenChange,
  onRenewed,
  open,
}: RenewLicenseModalProps) {
  const [form, setForm] = useState(emptyForm);
  const [step, setStep] = useState<1 | 2>(1);
  const [fulfillment, setFulfillment] = useState<
    Partial<Record<string, boolean>>
  >({});
  const [copyChoices, setCopyChoices] = useState<
    Partial<Record<string, CopyChoice>>
  >({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 2 only exists when the previous license has conditions to decide on.
  // Everything below is derived from the current list, so answers about a
  // condition that was removed meanwhile are simply ignored.
  const previousConditions = getActionableConditions(license.conditions);
  const hasConditionsStep = previousConditions.length > 0;
  const isLastStep = !hasConditionsStep || step === 2;
  const copiedConditions = previousConditions.filter(
    (condition) => copyChoices[condition.id]?.copy
  );
  // Tomorrow, so the backend's "not before today (UTC)" rule always holds.
  const minCopyDueDate = localDateInputValue(1);

  const isLicenseDataComplete =
    form.processNumber.trim().length > 0 &&
    form.issueDate.length > 0 &&
    form.expirationDate.length > 0 &&
    Boolean(form.file);

  const isFulfillmentComplete = previousConditions.every(
    (condition) => fulfillment[condition.id] !== undefined
  );
  const isConditionsStepComplete =
    !hasConditionsStep ||
    (isFulfillmentComplete &&
      copiedConditions.every(
        (condition) => (copyChoices[condition.id]?.dueDate ?? '').length > 0
      ));

  const canSubmit =
    isLicenseDataComplete && (!isLastStep || isConditionsStepComplete);

  const areAllMarkedToCopy = previousConditions.every(
    (condition) => copyChoices[condition.id]?.copy
  );

  function closeAndReset() {
    setForm(emptyForm());
    setStep(1);
    setFulfillment({});
    setCopyChoices({});
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

  function handleFulfillmentSelect(conditionId: string, fulfilled: boolean) {
    setFulfillment((current) => ({ ...current, [conditionId]: fulfilled }));
  }

  function updateCopyChoice(conditionId: string, change: Partial<CopyChoice>) {
    setCopyChoices((current) => {
      const previous = current[conditionId] ?? { copy: false, dueDate: '' };
      return { ...current, [conditionId]: { ...previous, ...change } };
    });
  }

  function markAllToCopy() {
    setCopyChoices((current) =>
      Object.fromEntries(
        previousConditions.map((condition) => [
          condition.id,
          { copy: true, dueDate: current[condition.id]?.dueDate ?? '' },
        ])
      )
    );
  }

  function goBack() {
    setError(null);
    setStep(1);
  }

  function buildConditionDecisions(): RenewalConditionDecision[] {
    return previousConditions.map((condition) => {
      const choice = copyChoices[condition.id];
      const copyToNew = choice?.copy ?? false;

      return {
        conditionId: condition.id,
        // fulfilled is guaranteed to be boolean once the list is complete
        fulfilled: fulfillment[condition.id] as boolean,
        copyToNew,
        ...(copyToNew ? { newDueDate: choice?.dueDate } : {}),
      };
    });
  }

  function hasInvalidCopyDueDate(): boolean {
    return copiedConditions.some((condition) => {
      const dueDate = copyChoices[condition.id]?.dueDate ?? '';
      return dueDate < minCopyDueDate || dueDate > form.expirationDate;
    });
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

    if (!isLastStep) {
      setStep(2);
      return;
    }

    if (!isConditionsStepComplete) return;

    if (hasInvalidCopyDueDate()) {
      setError(INVALID_COPY_DUE_DATE_MESSAGE);
      return;
    }

    setIsSubmitting(true);
    try {
      const renewed = await renewLicense(license.id, {
        processNumber: form.processNumber,
        issueDate: form.issueDate,
        expirationDate: form.expirationDate,
        documentFile: form.file,
        conditions: buildConditionDecisions(),
      });
      closeAndReset();
      onRenewed(renewed);
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught.message : GENERIC_ERROR_MESSAGE
      );
      // The conditions changed elsewhere: reload them so the list shows what
      // the backend expects, keeping the answers that still apply.
      if (caught instanceof ApiError && caught.status === 409) {
        onConditionsOutdated();
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function renderCopyControls(condition: ActionableCondition) {
    const choice = copyChoices[condition.id];

    return (
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <label className="flex items-center gap-2 text-xs font-semibold text-text-secondary">
          <input
            aria-label={`Copiar para a nova licença (condicionante ${condition.itemNumber})`}
            checked={choice?.copy ?? false}
            className="h-4 w-4 accent-emerald-600"
            onChange={(event) =>
              updateCopyChoice(condition.id, { copy: event.target.checked })
            }
            type="checkbox"
          />
          Copiar para a nova licença
        </label>

        {choice?.copy ? (
          <div className="flex items-center gap-2">
            <label
              className="text-xs font-semibold text-text-secondary"
              htmlFor={`renew-copy-due-date-${condition.id}`}
            >
              Novo vencimento
            </label>
            <div className="w-40">
              <InputGroup variant="field">
                <Input
                  aria-label={`Novo vencimento (condicionante ${condition.itemNumber})`}
                  id={`renew-copy-due-date-${condition.id}`}
                  max={form.expirationDate || undefined}
                  min={minCopyDueDate}
                  onChange={(event) =>
                    updateCopyChoice(condition.id, {
                      dueDate: event.target.value,
                    })
                  }
                  type="date"
                  value={choice.dueDate}
                />
              </InputGroup>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Renovar Licença</DialogTitle>
          <DialogDescription>
            A licença atual será arquivada e uma nova licença será criada com
            vínculo ao histórico anterior.
          </DialogDescription>
          {hasConditionsStep ? (
            <p className="m-0 text-xs font-semibold text-text-muted">
              Passo {step} de 2 ·{' '}
              {step === 1
                ? 'Dados da nova licença'
                : 'Condicionantes da licença anterior'}
            </p>
          ) : null}
        </DialogHeader>

        <form
          className="grid grid-cols-2 gap-4 max-[560px]:grid-cols-1"
          noValidate
          onSubmit={(event) => void submit(event)}
        >
          {/*
           * Both steps stay mounted and are only hidden, so going back keeps
           * the chosen PDF and the answers already given in step 2.
           */}
          <div className="contents" hidden={step !== 1}>
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
              <Label htmlFor="renew-process-number">
                Novo número da licença
              </Label>
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
          </div>

          {hasConditionsStep ? (
            <section
              aria-label="Condicionantes da licença anterior"
              className="col-span-2 flex flex-col gap-3 max-[560px]:col-span-1"
              hidden={step !== 2}
            >
              <div className="flex items-center justify-between gap-3 max-[560px]:flex-col max-[560px]:items-start">
                <p className="m-0 text-xs text-text-secondary">
                  Marque se cada condicionante foi cumprida e escolha quais
                  devem ser copiadas para a nova licença.
                </p>
                <Button
                  className="shrink-0"
                  disabled={areAllMarkedToCopy}
                  onClick={markAllToCopy}
                  type="button"
                  variant="addRow"
                >
                  Marcar todas para copiar
                </Button>
              </div>

              <div className="max-h-[50vh] overflow-y-auto rounded-panel border border-border">
                <ConditionFulfillmentList
                  conditions={license.conditions}
                  onSelect={handleFulfillmentSelect}
                  renderRowAddon={renderCopyControls}
                  selections={fulfillment}
                />
              </div>
            </section>
          ) : null}

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
            {step === 2 ? (
              <Button
                disabled={isSubmitting}
                onClick={goBack}
                type="button"
                variant="subtle"
              >
                Voltar
              </Button>
            ) : (
              <Button
                disabled={isSubmitting}
                onClick={() => handleOpenChange(false)}
                type="button"
                variant="subtle"
              >
                Cancelar
              </Button>
            )}
            <Button
              disabled={!canSubmit || isSubmitting}
              type="submit"
              variant="dialogPrimary"
            >
              {isSubmitting
                ? 'Renovando...'
                : isLastStep
                  ? 'Renovar Licença'
                  : 'Próximo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
