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
import type { UpdateCompanyRequest } from '../../../../features/companies/createCompany.types';
import type {
  CompanyListItem,
  Sector,
} from '../../../../features/companies/types';
import { ApiError } from '../../../../services/api/apiError';
import {
  getCompanyForEdit,
  updateCompany,
} from '../../../../services/api/companiesApi';
import { listSectors } from '../../../../services/api/sectorsApi';

type EditCompanyModalProps = {
  company: CompanyListItem | null;
  onSaved: () => void;
  onOpenChange: (open: boolean) => void;
};

type EditForm = UpdateCompanyRequest;

const EMPTY_FORM: EditForm = {
  name: '',
  sector_id: '',
  responsible_name: '',
  responsible_email: '',
  address: { city: '', state: '' },
};

const FIELD_CLASS =
  'rounded-control min-h-[42px] w-full border border-border bg-surface px-2.5 text-sm text-text-primary outline-0 focus:border-focus';

export function EditCompanyModal({
  company,
  onSaved,
  onOpenChange,
}: EditCompanyModalProps) {
  const [form, setForm] = useState<EditForm>(EMPTY_FORM);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadResult, setLoadResult] = useState<{
    companyId: string;
    error?: string;
  } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const isLoading = company !== null && loadResult?.companyId !== company.id;
  const loadError =
    company && loadResult?.companyId === company.id ? loadResult.error : null;

  useEffect(() => {
    if (!company) return;

    let isCurrent = true;

    Promise.all([getCompanyForEdit(company.id), listSectors()])
      .then(([details, loadedSectors]) => {
        if (!isCurrent) return;
        setSectors(loadedSectors);
        setForm({
          name: details.name,
          sector_id: details.sectorId,
          responsible_name: details.responsibleName,
          responsible_email: details.responsibleEmail,
          address: { city: details.city, state: details.state },
        });
        setLoadResult({ companyId: company.id });
      })
      .catch((error: unknown) => {
        if (!isCurrent) return;
        setLoadResult({
          companyId: company.id,
          error:
            error instanceof ApiError
              ? error.message
              : 'Não foi possível carregar os dados da empresa.',
        });
      });

    return () => {
      isCurrent = false;
    };
  }, [company]);

  function handleOpenChange(open: boolean) {
    if (!open && isSubmitting) return;
    if (!open) {
      setLoadResult(null);
      setSubmitError(null);
    }
    onOpenChange(open);
  }

  function updateField(
    field: Exclude<keyof EditForm, 'address'>,
    value: string
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateAddress(field: 'city' | 'state', value: string) {
    setForm((current) => ({
      ...current,
      address: { ...current.address, [field]: value },
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!company || isLoading || loadError) return;

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      await updateCompany(company.id, {
        name: form.name.trim(),
        sector_id: form.sector_id,
        responsible_name: form.responsible_name.trim(),
        responsible_email: form.responsible_email.trim(),
        address: {
          city: form.address.city.trim(),
          state: form.address.state.trim(),
        },
      });
      onSaved();
      setLoadResult(null);
      setSubmitError(null);
      onOpenChange(false);
    } catch (error) {
      setSubmitError(
        error instanceof ApiError
          ? error.message
          : 'Não foi possível salvar as alterações da empresa.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={company !== null}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar empresa</DialogTitle>
          <DialogDescription>
            Atualize os dados cadastrais e do responsável.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <p className="m-0 text-sm text-text-secondary" role="status">
            Carregando dados da empresa...
          </p>
        ) : null}

        {loadError ? (
          <p className="m-0 text-sm text-red-600" role="alert">
            {loadError}
          </p>
        ) : null}

        {!isLoading && !loadError ? (
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
            <label className="flex flex-col gap-2 text-[13px] font-bold text-text-primary sm:col-span-2">
              Nome da empresa
              <input
                className={FIELD_CLASS}
                maxLength={255}
                onChange={(event) => updateField('name', event.target.value)}
                required
                value={form.name}
              />
            </label>

            <label className="flex flex-col gap-2 text-[13px] font-bold text-text-primary sm:col-span-2">
              Segmento
              <select
                className={FIELD_CLASS}
                onChange={(event) =>
                  updateField('sector_id', event.target.value)
                }
                required
                value={form.sector_id}
              >
                <option disabled value="">
                  Selecione um segmento
                </option>
                {sectors.map((sector) => (
                  <option key={sector.id} value={sector.id}>
                    {sector.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 text-[13px] font-bold text-text-primary">
              Cidade
              <input
                className={FIELD_CLASS}
                maxLength={100}
                onChange={(event) => updateAddress('city', event.target.value)}
                required
                value={form.address.city}
              />
            </label>

            <label className="flex flex-col gap-2 text-[13px] font-bold text-text-primary">
              Estado
              <input
                className={FIELD_CLASS}
                maxLength={100}
                onChange={(event) => updateAddress('state', event.target.value)}
                required
                value={form.address.state}
              />
            </label>

            <label className="flex flex-col gap-2 text-[13px] font-bold text-text-primary">
              Responsável
              <input
                className={FIELD_CLASS}
                maxLength={255}
                onChange={(event) =>
                  updateField('responsible_name', event.target.value)
                }
                required
                value={form.responsible_name}
              />
            </label>

            <label className="flex flex-col gap-2 text-[13px] font-bold text-text-primary">
              E-mail do responsável
              <input
                className={FIELD_CLASS}
                maxLength={255}
                onChange={(event) =>
                  updateField('responsible_email', event.target.value)
                }
                required
                type="email"
                value={form.responsible_email}
              />
            </label>

            {submitError ? (
              <p
                className="m-0 text-sm text-red-600 sm:col-span-2"
                role="alert"
              >
                {submitError}
              </p>
            ) : null}

            <DialogFooter className="sm:col-span-2">
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
                {isSubmitting ? 'Salvando...' : 'Salvar alterações'}
              </Button>
            </DialogFooter>
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
