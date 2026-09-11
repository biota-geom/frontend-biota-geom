import { type FormEvent, useState } from 'react';
import { ChevronDownIcon } from '../../../../components/ui/icons';
import { MOCK_SECTORS } from '../../../../features/companies/sectors.mock';
import {
  createMockEsgIndicator,
  MOCK_ESG_INDICATORS,
  type EsgIndicator,
} from '../../../../features/companies/esgIndicators.mock';
import { maskCnpj, unmaskCnpj } from '../../../../features/companies/cnpj';
import type {
  CreateCompanyFormState,
  CreateCompanyRequest,
} from '../../../../features/companies/createCompany.types';

const EMPTY_FORM: CreateCompanyFormState = {
  name: '',
  cnpj: '',
  sectorId: '',
  state: '',
  city: '',
  responsibleName: '',
  responsibleEmail: '',
  selectedIndicatorIds: [],
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type CreateCompanyModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateCompanyRequest) => void;
};

export function CreateCompanyModal({
  isOpen,
  onClose,
  onSubmit,
}: CreateCompanyModalProps) {
  const [form, setForm] = useState<CreateCompanyFormState>(EMPTY_FORM);
  const [indicators, setIndicators] =
    useState<EsgIndicator[]>(MOCK_ESG_INDICATORS);
  const [indicatorQuery, setIndicatorQuery] = useState('');
  const [isIndicatorMenuOpen, setIsIndicatorMenuOpen] = useState(false);
  const [newIndicatorName, setNewIndicatorName] = useState('');
  const [newIndicatorUnit, setNewIndicatorUnit] = useState('');

  if (!isOpen) return null;
  const isFormValid =
    form.name.trim() !== '' &&
    unmaskCnpj(form.cnpj).length === 14 &&
    form.sectorId !== '' &&
    form.state.trim() !== '' &&
    form.city.trim() !== '' &&
    form.responsibleName.trim() !== '' &&
    EMAIL_PATTERN.test(form.responsibleEmail);
  const unselectedIndicators = indicators.filter(
    (indicator) => !form.selectedIndicatorIds.includes(indicator.id)
  );
  const trimmedQuery = indicatorQuery.trim().toLowerCase();
  const filteredIndicators = trimmedQuery
    ? unselectedIndicators.filter((indicator) =>
        indicator.name.toLowerCase().includes(trimmedQuery)
      )
    : unselectedIndicators;
  function selectIndicator(id: string) {
    setForm((current) => ({
      ...current,
      selectedIndicatorIds: [...current.selectedIndicatorIds, id],
    }));
    setIndicatorQuery('');
  }
  function removeIndicator(id: string) {
    setForm((current) => ({
      ...current,
      selectedIndicatorIds: current.selectedIndicatorIds.filter(
        (existing) => existing !== id
      ),
    }));
  }

  function handleCreateIndicator() {
    if (!newIndicatorName.trim() || !newIndicatorUnit.trim()) return;

    // TODO(#45): swap for POST /api/esg-metrics once the backend exists.
    const created = createMockEsgIndicator(
      newIndicatorName.trim(),
      newIndicatorUnit.trim()
    );

    setIndicators((current) => [...current, created]);
    setForm((current) => ({
      ...current,
      selectedIndicatorIds: [...current.selectedIndicatorIds, created.id],
    }));
    setNewIndicatorName('');
    setNewIndicatorUnit('');
  }

  function handleCancel() {
    setForm(EMPTY_FORM);
    setIndicators(MOCK_ESG_INDICATORS);
    setIndicatorQuery('');
    setIsIndicatorMenuOpen(false);
    setNewIndicatorName('');
    setNewIndicatorUnit('');
    onClose();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isFormValid) return;

    const payload: CreateCompanyRequest = {
      name: form.name.trim(),
      document: unmaskCnpj(form.cnpj),
      document_type: 'cnpj',
      sector_id: form.sectorId,
      address: {
        type: 'billing',
        state: form.state.trim(),
        city: form.city.trim(),
      },
      responsible_name: form.responsibleName.trim(),
      responsible_email: form.responsibleEmail.trim(),
      esg_indicator_ids: form.selectedIndicatorIds,
    };

    // TODO(#45): swap for POST /api/customers once the backend exists.
    onSubmit(payload);
    setForm(EMPTY_FORM);
  }

  return (
    <div
      aria-labelledby="create-company-title"
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-[#1f2a3d]/40 px-4"
      onClick={handleCancel}
      role="dialog"
    >
      <div
        className="shadow-card rounded-panel w-full max-w-[42rem] bg-surface p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2
              className="m-0 text-xl font-bold text-text-primary"
              id="create-company-title"
            >
              Cadastrar Nova Empresa
            </h2>
            <p className="mt-1 mb-0 text-sm text-text-secondary">
              Insira as informações gerais e selecione os indicadores ESG
              aplicáveis.
            </p>
          </div>
          <button
            aria-label="Fechar"
            className="rounded-control grid size-8 shrink-0 place-items-center border-0 bg-transparent text-text-muted hover:bg-surface-muted hover:text-text-secondary cursor-pointer"
            onClick={handleCancel}
            type="button"
          >
            ×
          </button>
        </header>

        <hr className="mb-5 border-border" />

        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          <div className="grid grid-cols-[3fr_2fr] gap-4">
            <div className="flex flex-col gap-2">
              <label
                className="text-[13px] font-bold text-text-primary"
                htmlFor="company-name"
              >
                Nome da Empresa / Filial
              </label>
              <input
                className="rounded-control min-h-[42px] w-full border border-border bg-surface px-2.5 text-text-primary outline-0 placeholder:text-text-muted focus:border-focus"
                id="company-name"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="Ex: Siderurgia Sul Porto Alegre"
                value={form.name}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label
                className="text-[13px] font-bold text-text-primary"
                htmlFor="company-cnpj"
              >
                CNPJ
              </label>
              <input
                className="rounded-control min-h-[42px] w-full border border-border bg-surface px-2.5 text-text-primary outline-0 placeholder:text-text-muted focus:border-focus"
                id="company-cnpj"
                inputMode="numeric"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    cnpj: maskCnpj(event.target.value),
                  }))
                }
                placeholder="00.000.000/0000-00"
                value={form.cnpj}
              />
            </div>
          </div>

          <div className="grid grid-cols-[2fr_1fr_1fr] gap-4">
            <div className="flex flex-col gap-2">
              <label
                className="text-[13px] font-bold text-text-primary"
                htmlFor="company-sector"
              >
                Segmento
              </label>
              <div className="relative">
                <select
                  className={`rounded-control min-h-[42px] w-full appearance-none border border-border bg-surface px-2.5 pr-9 outline-0 focus:border-focus ${form.sectorId === '' ? 'text-text-muted' : 'text-text-primary'}`}
                  id="company-sector"
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      sectorId: event.target.value,
                    }))
                  }
                  value={form.sectorId}
                >
                  <option disabled hidden value="">
                    Selecione o segmento
                  </option>
                  {MOCK_SECTORS.map((sector) => (
                    <option key={sector.id} value={sector.id}>
                      {sector.name}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-text-secondary">
                  <ChevronDownIcon />
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label
                className="text-[13px] font-bold text-text-primary"
                htmlFor="company-state"
              >
                Estado
              </label>
              <input
                className="rounded-control min-h-[42px] w-full border border-border bg-surface px-2.5 text-text-primary outline-0 placeholder:text-text-muted focus:border-focus"
                id="company-state"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    state: event.target.value,
                  }))
                }
                placeholder="Ex: RS"
                value={form.state}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label
                className="text-[13px] font-bold text-text-primary"
                htmlFor="company-city"
              >
                Cidade
              </label>
              <input
                className="rounded-control min-h-[42px] w-full border border-border bg-surface px-2.5 text-text-primary outline-0 placeholder:text-text-muted focus:border-focus"
                id="company-city"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    city: event.target.value,
                  }))
                }
                placeholder="Ex: Porto Alegre"
                value={form.city}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label
                className="text-[13px] font-bold text-text-primary"
                htmlFor="company-responsible-name"
              >
                Responsável Ambiental
              </label>
              <input
                className="rounded-control min-h-[42px] w-full border border-border bg-surface px-2.5 text-text-primary outline-0 placeholder:text-text-muted focus:border-focus"
                id="company-responsible-name"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    responsibleName: event.target.value,
                  }))
                }
                placeholder="Nome completo do responsável"
                value={form.responsibleName}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label
                className="text-[13px] font-bold text-text-primary"
                htmlFor="company-responsible-email"
              >
                E-mail do Responsável
              </label>
              <input
                className="rounded-control min-h-[42px] w-full border border-border bg-surface px-2.5 text-text-primary outline-0 placeholder:text-text-muted focus:border-focus"
                id="company-responsible-email"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    responsibleEmail: event.target.value,
                  }))
                }
                placeholder="responsavel@empresa.com"
                type="email"
                value={form.responsibleEmail}
              />
            </div>
          </div>

          <hr className="m-0 border-border" />

          <section
            aria-label="Indicadores ESG Monitorados"
            className="flex flex-col gap-2"
          >
            <div>
              <label
                className="text-[13px] font-bold text-text-primary"
                htmlFor="indicator-search"
              >
                Indicadores ESG Monitorados
              </label>
              <p className="mt-0.5 mb-0 text-xs text-text-secondary">
                Selecione os indicadores que esta empresa deverá reportar
                periodicamente no sistema.
              </p>
            </div>
            <div className="relative">
              <input
                className="rounded-control min-h-[42px] w-full border border-border bg-surface px-2.5 pr-9 text-text-primary outline-0 placeholder:text-text-muted focus:border-focus"
                id="indicator-search"
                onBlur={() => setIsIndicatorMenuOpen(false)}
                onChange={(event) => {
                  setIndicatorQuery(event.target.value);
                  setIsIndicatorMenuOpen(true);
                }}
                onFocus={() => setIsIndicatorMenuOpen(true)}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') setIsIndicatorMenuOpen(false);
                }}
                placeholder="Buscar ou criar indicador..."
                value={indicatorQuery}
              />
              <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-text-secondary">
                <ChevronDownIcon />
              </span>

              {isIndicatorMenuOpen && (
                <ul className="shadow-card rounded-control absolute z-10 mt-1 max-h-48 w-full overflow-y-auto border border-border bg-surface p-1">
                  {unselectedIndicators.length === 0 ? (
                    <li className="px-2.5 py-2 text-sm text-text-muted">
                      Todos os indicadores já foram selecionados.
                    </li>
                  ) : filteredIndicators.length > 0 ? (
                    filteredIndicators.map((indicator) => (
                      <li key={indicator.id}>
                        <button
                          className="rounded-control flex w-full items-center justify-between gap-3 px-2.5 py-2 text-left text-sm text-text-primary hover:bg-surface-muted cursor-pointer"
                          onClick={() => selectIndicator(indicator.id)}
                          onMouseDown={(event) => event.preventDefault()}
                          type="button"
                        >
                          <span>{indicator.name}</span>
                          <span className="text-xs text-text-muted">
                            {indicator.unit}
                          </span>
                        </button>
                      </li>
                    ))
                  ) : (
                    <li className="px-2.5 py-2 text-sm text-text-muted">
                      Nenhum indicador encontrado. Crie um abaixo.
                    </li>
                  )}
                </ul>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {form.selectedIndicatorIds.map((id) => {
                const indicator = indicators.find((item) => item.id === id);
                if (!indicator) return null;

                return (
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#d8f8ea] px-3 py-1 text-xs font-medium text-primary-strong"
                    key={id}
                  >
                    {indicator.name}
                    <button
                      aria-label={`Remover ${indicator.name}`}
                      className="text-primary-strong/70 hover:text-primary-strong cursor-pointer"
                      onClick={() => removeIndicator(id)}
                      type="button"
                    >
                      x
                    </button>
                  </span>
                );
              })}
            </div>

            <div className="flex gap-2">
              <input
                className="rounded-control min-h-[42px] flex-1 border border-border bg-surface px-2.5 text-sm text-text-primary outline-0 placeholder:text-text-muted focus:border-focus"
                onChange={(event) => setNewIndicatorName(event.target.value)}
                placeholder="Nome do novo indicador..."
                value={newIndicatorName}
              />
              <input
                className="rounded-control min-h-[42px] w-28 border border-border bg-surface px-2.5 text-sm text-text-primary outline-0 placeholder:text-text-muted focus:border-focus"
                onChange={(event) => setNewIndicatorUnit(event.target.value)}
                placeholder="Unidade..."
                value={newIndicatorUnit}
              />
              <button
                className="rounded-control border-0 bg-primary px-4 text-sm font-bold text-white hover:bg-primary-strong cursor-pointer"
                onClick={handleCreateIndicator}
                type="button"
              >
                Criar
              </button>
            </div>
          </section>

          <div className="mt-2 flex justify-end gap-3">
            <button
              className="rounded-control border border-border bg-surface px-4 py-2 text-sm font-semibold text-text-secondary hover:bg-surface-muted cursor-pointer"
              onClick={handleCancel}
              type="button"
            >
              Cancelar
            </button>
            <button
              className="rounded-panel cursor-pointer border-0 bg-primary px-4 py-2 text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-70"
              disabled={!isFormValid}
              type="submit"
            >
              Cadastrar Empresa
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
