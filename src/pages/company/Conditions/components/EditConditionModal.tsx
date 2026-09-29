import { type FormEvent, useEffect, useState } from 'react';
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
  RISK_LEVEL_LABELS,
  type LicenseCondition,
} from '../../../../features/licenseConditions/types';
import type { LicensePanelItem } from '../../../../features/licenses/types';
import { ApiError } from '../../../../services/api/apiError';
import { updateLicenseCondition } from '../../../../services/api/licenseConditionsApi';
import { listLicenses } from '../../../../services/api/licensesApi';

const GENERIC_ERROR_MESSAGE =
  'Não foi possível salvar a condicionante. Tente novamente mais tarde.';
const NO_AGENCY_LABEL = 'Não informado';

/** `2026-06-30T00:00:00.000Z` -> `2026-06-30`, what `<input type="date">` reads. */
function toDateInputValue(isoDate: string): string {
  return isoDate.slice(0, 10);
}

function toLicenseLabel(license: LicensePanelItem): string {
  return license.issuingAgency
    ? `${license.processNumber} - ${license.issuingAgency}`
    : license.processNumber;
}

type EditConditionFormProps = {
  categories: string[];
  companyId: string;
  condition: LicenseCondition;
  onClose: () => void;
  onUpdated?: (condition: LicenseCondition) => void;
};

/*
 * Split out of the modal so the condition being edited can seed the fields
 * through useState instead of an effect: the modal mounts it under
 * `key={condition.id}`, so opening another card — or reopening the same one
 * after a cancelled edit — remounts the form with the stored values.
 */
function EditConditionForm({
  categories,
  companyId,
  condition,
  onClose,
  onUpdated,
}: EditConditionFormProps) {
  const [title, setTitle] = useState(condition.title);
  const [category, setCategory] = useState(condition.category);
  const [licenseId, setLicenseId] = useState(condition.licenseId);
  const [dueDate, setDueDate] = useState(toDateInputValue(condition.dueDate));
  const [description, setDescription] = useState(condition.description);

  const [licenses, setLicenses] = useState<LicensePanelItem[]>([]);
  const [isLoadingLicenses, setIsLoadingLicenses] = useState(false);

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isCurrent = true;

    async function loadLicenses() {
      setIsLoadingLicenses(true);
      try {
        const panel = await listLicenses(companyId);
        if (isCurrent) setLicenses(panel.licenses);
      } catch {
        if (isCurrent) setLicenses([]);
      } finally {
        if (isCurrent) setIsLoadingLicenses(false);
      }
    }

    void loadLicenses();

    return () => {
      isCurrent = false;
    };
  }, [companyId]);

  const categoryOptions = Array.from(
    new Set([...categories, condition.category])
  ).sort((left, right) => left.localeCompare(right, 'pt-BR'));

  /*
   * Both derived, never typed: the responsible agency is the one that issued
   * the linked license, and the status is the risk level the API recomputes
   * from the due date. They are shown because the form shows them, and
   * disabled because the server owns them.
   */
  const selectedLicense = licenses.find((license) => license.id === licenseId);
  const responsibleAgency = selectedLicense?.issuingAgency ?? NO_AGENCY_LABEL;

  const isFormValid = Boolean(
    title.trim() && category && licenseId && dueDate && description.trim()
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!isFormValid) return;

    setIsSubmitting(true);
    try {
      const updated = await updateLicenseCondition(companyId, condition.id, {
        title: title.trim(),
        category,
        licenseId,
        dueDate,
        description: description.trim(),
      });
      onUpdated?.(updated);
      onClose();
    } catch (error) {
      setFormError(
        error instanceof ApiError ? error.message : GENERIC_ERROR_MESSAGE
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      className="grid grid-cols-2 gap-4 max-[560px]:grid-cols-1"
      onSubmit={(event) => void handleSubmit(event)}
    >
      <div className="col-span-2 flex flex-col gap-2 max-[560px]:col-span-1">
        <Label htmlFor="condition-title">Nome da Condicionante</Label>
        <InputGroup variant="field">
          <Input
            id="condition-title"
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Ex: MTR - Manifesto de Transporte de Resíduos"
            required
            value={title}
          />
        </InputGroup>
      </div>

      <div className="col-span-2 flex flex-col gap-2 max-[560px]:col-span-1">
        <Label htmlFor="condition-category">Categoria</Label>
        <Select onValueChange={setCategory} value={category}>
          <SelectTrigger
            className="w-full cursor-pointer"
            id="condition-category"
          >
            <SelectValue placeholder="Selecione a categoria" />
          </SelectTrigger>
          <SelectContent>
            {categoryOptions.map((option) => (
              <SelectItem
                className="cursor-pointer"
                key={option}
                value={option}
              >
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="condition-license">Licença Vinculada</Label>
        <Select
          disabled={isLoadingLicenses}
          onValueChange={setLicenseId}
          value={licenseId}
        >
          <SelectTrigger
            className="w-full cursor-pointer"
            id="condition-license"
          >
            <SelectValue
              placeholder={
                isLoadingLicenses ? 'Carregando...' : 'Selecione a licença'
              }
            />
          </SelectTrigger>
          <SelectContent>
            {licenses.map((license) => (
              <SelectItem
                className="cursor-pointer"
                key={license.id}
                value={license.id}
              >
                {toLicenseLabel(license)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="condition-agency">Órgão Responsável</Label>
        <InputGroup variant="field">
          <Input
            disabled
            id="condition-agency"
            readOnly
            value={responsibleAgency}
          />
        </InputGroup>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="condition-due-date">Data de Vencimento</Label>
        <InputGroup variant="field">
          <Input
            id="condition-due-date"
            onChange={(event) => setDueDate(event.target.value)}
            required
            type="date"
            value={dueDate}
          />
        </InputGroup>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="condition-status">Status</Label>
        <InputGroup variant="field">
          <Input
            disabled
            id="condition-status"
            readOnly
            value={RISK_LEVEL_LABELS[condition.riskLevel]}
          />
        </InputGroup>
      </div>

      <div className="col-span-2 flex flex-col gap-2 max-[560px]:col-span-1">
        <Label htmlFor="condition-description">
          Descrição da Condicionante
        </Label>
        <textarea
          className="min-h-24 w-full rounded-control border border-border bg-surface px-3 py-2 text-sm text-text-primary"
          id="condition-description"
          onChange={(event) => setDescription(event.target.value)}
          required
          value={description}
        />
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
          className="cursor-pointer"
          onClick={onClose}
          type="button"
          variant="subtle"
        >
          Cancelar
        </Button>
        <Button
          className="cursor-pointer"
          disabled={!isFormValid || isSubmitting}
          type="submit"
          variant="dialogPrimary"
        >
          {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </DialogFooter>
    </form>
  );
}

type EditConditionModalProps = {
  /**
   * Categories already in use by the company, so the select offers the same
   * vocabulary the listing shows. The condition's own category is added by
   * the form, so a value that is no longer in use still renders.
   */
  categories: string[];
  companyId: string;
  /** The condition being edited; null while no card has been opened. */
  condition: LicenseCondition | null;
  onOpenChange: (open: boolean) => void;
  onUpdated?: (condition: LicenseCondition) => void;
  open: boolean;
};

export function EditConditionModal({
  categories,
  companyId,
  condition,
  onOpenChange,
  onUpdated,
  open,
}: EditConditionModalProps) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Condicionante</DialogTitle>
          <DialogDescription>
            Atualize as informações da condicionante ambiental.
          </DialogDescription>
        </DialogHeader>

        {condition ? (
          <EditConditionForm
            categories={categories}
            companyId={companyId}
            condition={condition}
            key={condition.id}
            onClose={() => onOpenChange(false)}
            onUpdated={onUpdated}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
