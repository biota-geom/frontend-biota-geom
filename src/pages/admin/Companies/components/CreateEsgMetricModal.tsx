import { type FormEvent, useState } from 'react';
import { ChevronDownIcon } from '../../../../components/ui/icons';
import type { EsgIndicator } from '../../../../features/companies/esgIndicators.mock';
import { createEsgMetric } from '../../../../services/api/esgMetricsApi';
import { ApiError } from '../../../../services/api/apiError';

type EsgMetricFormState = {
  name: string;
  unit: string;
  pillar: '' | 'AMBIENTAL' | 'SOCIAL' | 'GOVERNANCA';
};

const EMPTY_FORM: EsgMetricFormState = { name: '', unit: '', pillar: '' };

type CreateEsgMetricModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (metric: EsgIndicator) => void;
};

export function CreateEsgMetricModal({
  isOpen,
  onClose,
  onCreated,
}: CreateEsgMetricModalProps) {
  const [form, setForm] = useState<EsgMetricFormState>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isFormValid =
    form.name.trim() !== '' && form.unit.trim() !== '' && form.pillar !== '';

  function handleCancel() {
    if (isSaving) return;
    setForm(EMPTY_FORM);
    setError(null);
    onClose();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isFormValid || isSaving) return;

    setIsSaving(true);
    setError(null);

    try {
      const created = await createEsgMetric({
        name: form.name.trim(),
        unit: form.unit.trim(),
        pillar: form.pillar as 'AMBIENTAL' | 'SOCIAL' | 'GOVERNANCA',
      });

      setForm(EMPTY_FORM);
      setIsSaving(false);
      onCreated(created);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Não foi possível criar a métrica.'
      );
      setIsSaving(false);
    }
  }

  return (
    <div
      aria-labelledby="create-esg-metric-title"
      aria-modal="true"
      className="fixed inset-0 z-[60] grid place-items-center bg-[#1f2a3d]/40 px-4"
      onClick={(event) => {
        event.stopPropagation();
        handleCancel();
      }}
      role="dialog"
    >
      <div
        className="shadow-card rounded-panel w-full max-w-md bg-surface p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="mb-5 flex items-start justify-between gap-4">
          <h2
            className="m-0 text-lg font-bold text-text-primary"
            id="create-esg-metric-title"
          >
            Nova Métrica Customizada
          </h2>
          <button
            aria-label="Fechar"
            className="rounded-control grid size-8 shrink-0 place-items-center border-0 bg-transparent text-text-muted hover:bg-surface-muted hover:text-text-secondary cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSaving}
            onClick={handleCancel}
            type="button"
          >
            ×
          </button>
        </header>

        <hr className="mb-5 border-border" />

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2">
            <label
              className="text-[13px] font-bold text-text-primary"
              htmlFor="esg-metric-name"
            >
              Nome
            </label>
            <input
              className="rounded-control min-h-[42px] w-full border border-border bg-surface px-2.5 text-text-primary outline-0 placeholder:text-text-muted focus:border-focus"
              id="esg-metric-name"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              placeholder="Ex: Efluentes Químicos Específicos"
              value={form.name}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              className="text-[13px] font-bold text-text-primary"
              htmlFor="esg-metric-unit"
            >
              Unidade de Medida
            </label>
            <input
              className="rounded-control min-h-[42px] w-full border border-border bg-surface px-2.5 text-text-primary outline-0 placeholder:text-text-muted focus:border-focus"
              id="esg-metric-unit"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  unit: event.target.value,
                }))
              }
              placeholder='Ex: "m³", "ton", "kWh"'
              value={form.unit}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              className="text-[13px] font-bold text-text-primary"
              htmlFor="esg-metric-pillar"
            >
              Pilar
            </label>
            <div className="relative">
              <select
                className={`rounded-control min-h-[42px] w-full appearance-none border border-border bg-surface px-2.5 pr-9 outline-0 focus:border-focus ${form.pillar === '' ? 'text-text-muted' : 'text-text-primary'}`}
                id="esg-metric-pillar"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    pillar: event.target.value as EsgMetricFormState['pillar'],
                  }))
                }
                value={form.pillar}
              >
                <option disabled hidden value="">
                  Selecione o pilar
                </option>
                <option value="AMBIENTAL">Ambiental</option>
                <option value="SOCIAL">Social</option>
                <option value="GOVERNANCA">Governança</option>
              </select>
              <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-text-secondary">
                <ChevronDownIcon />
              </span>
            </div>
          </div>

          {error && <p className="text-xs font-medium text-red-500">{error}</p>}

          <div className="mt-2 flex justify-end gap-3">
            <button
              className="rounded-control border border-border bg-surface px-4 py-2 text-sm font-semibold text-text-secondary hover:bg-surface-muted cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSaving}
              onClick={handleCancel}
              type="button"
            >
              Cancelar
            </button>
            <button
              className="rounded-panel cursor-pointer border-0 bg-primary px-4 py-2 text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-70"
              disabled={!isFormValid || isSaving}
              type="submit"
            >
              {isSaving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
