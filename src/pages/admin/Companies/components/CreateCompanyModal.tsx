import { type FormEvent, useEffect, useState } from 'react';
import { ChevronDownIcon } from '../../../../components/ui/icons';
import { maskCnpj } from '../../../../features/companies/cnpj';
import { COMPANY_MESSAGES } from '../../../../features/companies/companyMessages';
import type {
  CreateCompanyField,
  CreateCompanyFieldErrors,
  CreateCompanyFormState,
  CreateCompanySubmission,
} from '../../../../features/companies/createCompany.types';
import {
  EMPTY_CREATE_COMPANY_FORM,
  buildCreateCompanyRequest,
  validateCreateCompany,
} from '../../../../features/companies/createCompanyValidation';
import type {
  EsgIndicator,
  Sector,
} from '../../../../features/companies/types';
import { ApiError } from '../../../../services/api/apiError';
import {
  createEsgMetric,
  listEsgMetrics,
} from '../../../../services/api/esgMetricsApi';
import { listSectors } from '../../../../services/api/sectorsApi';

const FIELD_CLASS =
  'rounded-control min-h-[42px] w-full bg-surface px-2.5 text-text-primary outline-0 placeholder:text-text-muted focus:border-focus';

type LoadStatus = 'loading' | 'success' | 'error';

type TextFieldProps = {
  error?: string;
  id: string;
  inputMode?: 'numeric' | 'tel';
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: 'text' | 'email';
  value: string;
};

function TextField({
  error,
  id,
  inputMode,
  label,
  onChange,
  placeholder,
  type = 'text',
  value,
}: TextFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[13px] font-bold text-text-primary" htmlFor={id}>
        {label}
      </label>
      <input
        aria-describedby={error ? `${id}-error` : undefined}
        aria-invalid={error ? true : undefined}
        className={`${FIELD_CLASS} border ${error ? 'border-red-400' : 'border-border'}`}
        id={id}
        inputMode={inputMode}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
      {error ? (
        <p className="m-0 text-xs font-medium text-red-500" id={`${id}-error`}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

type CreateCompanyModalProps = {
  isOpen: boolean;
  onClose: () => void;
  /** Rejects with the backend's PT-BR message, which is shown without closing the modal. */
  onSubmit: (submission: CreateCompanySubmission) => Promise<void>;
};

export function CreateCompanyModal({
  isOpen,
  onClose,
  onSubmit,
}: CreateCompanyModalProps) {
  const [form, setForm] = useState<CreateCompanyFormState>(
    EMPTY_CREATE_COMPANY_FORM
  );
  const [fieldErrors, setFieldErrors] = useState<CreateCompanyFieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [sectorsStatus, setSectorsStatus] = useState<LoadStatus>('loading');
  const [indicators, setIndicators] = useState<EsgIndicator[]>([]);
  const [indicatorsError, setIndicatorsError] = useState<string | null>(null);
  const [indicatorQuery, setIndicatorQuery] = useState('');
  const [isIndicatorMenuOpen, setIsIndicatorMenuOpen] = useState(false);
  const [newIndicatorName, setNewIndicatorName] = useState('');
  const [newIndicatorUnit, setNewIndicatorUnit] = useState('');
  const [newIndicatorPillar, setNewIndicatorPillar] = useState('');
  const [isCreatingIndicator, setIsCreatingIndicator] = useState(false);
  const [createIndicatorError, setCreateIndicatorError] = useState<
    string | null
  >(null);

  /*
   * Both catalogs are (re)loaded every time the modal opens rather than once at
   * mount: the admin can create an ESG metric here, and a sector can be added
   * server-side between two registrations. Reopening keeps the previous result
   * on screen while the refetch is in flight instead of flipping back to
   * 'loading' — hence the initial state, and no status reset in the effect.
   */
  useEffect(() => {
    if (!isOpen) return;

    let isCurrent = true;

    listSectors()
      .then((loaded) => {
        if (!isCurrent) return;
        setSectors(loaded);
        setSectorsStatus('success');
      })
      .catch(() => {
        if (!isCurrent) return;
        setSectorsStatus('error');
      });

    return () => {
      isCurrent = false;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    let isCurrent = true;

    listEsgMetrics()
      .then((loaded) => {
        if (!isCurrent) return;
        setIndicators(loaded);
        setIndicatorsError(null);
      })
      .catch(() => {
        if (!isCurrent) return;
        setIndicatorsError(COMPANY_MESSAGES.INDICATORS_FETCH_ERROR);
      });

    return () => {
      isCurrent = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const unselectedIndicators = indicators.filter(
    (indicator) => !form.selectedIndicatorIds.includes(indicator.id)
  );
  const trimmedQuery = indicatorQuery.trim().toLowerCase();
  const filteredIndicators = trimmedQuery
    ? unselectedIndicators.filter((indicator) =>
        indicator.name.toLowerCase().includes(trimmedQuery)
      )
    : unselectedIndicators;

  function updateField(field: CreateCompanyField, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    clearFieldErrorIfFixed(field, value);
  }

  /*
   * Validation still runs on submit — the submit button stays clickable on
   * purpose, so every PT-BR message is reachable. This only ever takes a
   * message back off the screen, once the field it belongs to passes, instead
   * of leaving a corrected field looking broken until the next submit.
   *
   * No rule is restated here: `validateCreateCompany` is re-run over the value
   * the user just typed and only its verdict for that one field is read. Every
   * rule in it looks at its own field alone, so the sibling values copied from
   * `form` cannot change the answer even if a keystroke lands before the state
   * from the previous one has been applied.
   */
  function clearFieldErrorIfFixed(field: CreateCompanyField, value: string) {
    setFieldErrors((current) => {
      if (current[field] === undefined) return current;

      const typed: CreateCompanyFormState = { ...form, [field]: value };
      if (validateCreateCompany(typed)[field] !== undefined) return current;

      const next = { ...current };
      delete next[field];
      return next;
    });
  }

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

  async function handleCreateIndicator() {
    if (
      !newIndicatorName.trim() ||
      !newIndicatorUnit.trim() ||
      !newIndicatorPillar
    ) {
      return;
    }

    setIsCreatingIndicator(true);
    setCreateIndicatorError(null);

    try {
      const created = await createEsgMetric({
        name: newIndicatorName.trim(),
        unit: newIndicatorUnit.trim(),
        pillar: newIndicatorPillar as 'AMBIENTAL' | 'SOCIAL' | 'GOVERNANCA',
      });

      setIndicators((current) => [...current, created]);
      setForm((current) => ({
        ...current,
        selectedIndicatorIds: [...current.selectedIndicatorIds, created.id],
      }));
      setNewIndicatorName('');
      setNewIndicatorUnit('');
      setNewIndicatorPillar('');
    } catch (error) {
      setCreateIndicatorError(
        error instanceof ApiError
          ? error.message
          : COMPANY_MESSAGES.CREATE_INDICATOR_ERROR
      );
    } finally {
      setIsCreatingIndicator(false);
    }
  }

  function resetForm() {
    setForm(EMPTY_CREATE_COMPANY_FORM);
    setFieldErrors({});
    setSubmitError(null);
    setIndicatorQuery('');
    setIsIndicatorMenuOpen(false);
    setNewIndicatorName('');
    setNewIndicatorUnit('');
    setNewIndicatorPillar('');
    setCreateIndicatorError(null);
  }

  function handleCancel() {
    resetForm();
    onClose();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    const errors = validateCreateCompany(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);

    try {
      await onSubmit({
        company: buildCreateCompanyRequest(form),
        esgMetricIds: form.selectedIndicatorIds,
      });
      resetForm();
    } catch (error) {
      setSubmitError(
        error instanceof ApiError
          ? error.message
          : COMPANY_MESSAGES.CREATE_COMPANY_ERROR
      );
    } finally {
      setIsSubmitting(false);
    }
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
        className="shadow-card rounded-panel max-h-[92vh] w-full max-w-[42rem] overflow-y-auto bg-surface p-6"
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

        <form
          className="flex flex-col gap-5"
          onSubmit={(event) => void handleSubmit(event)}
        >
          <div className="grid grid-cols-[3fr_2fr] gap-4">
            <TextField
              error={fieldErrors.name}
              id="company-name"
              label="Nome da Empresa / Filial"
              onChange={(value) => updateField('name', value)}
              placeholder="Ex: Siderurgia Sul Porto Alegre"
              value={form.name}
            />
            <TextField
              error={fieldErrors.cnpj}
              id="company-cnpj"
              inputMode="numeric"
              label="CNPJ"
              onChange={(value) => updateField('cnpj', maskCnpj(value))}
              placeholder="00.000.000/0000-00"
              value={form.cnpj}
            />
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
                  aria-describedby={
                    fieldErrors.sectorId ? 'company-sector-error' : undefined
                  }
                  aria-invalid={fieldErrors.sectorId ? true : undefined}
                  className={`rounded-control min-h-[42px] w-full appearance-none border bg-surface px-2.5 pr-9 outline-0 focus:border-focus ${fieldErrors.sectorId ? 'border-red-400' : 'border-border'} ${form.sectorId === '' ? 'text-text-muted' : 'text-text-primary'}`}
                  disabled={sectorsStatus !== 'success'}
                  id="company-sector"
                  onChange={(event) =>
                    updateField('sectorId', event.target.value)
                  }
                  value={form.sectorId}
                >
                  <option disabled hidden value="">
                    {sectorsStatus === 'loading'
                      ? 'Carregando segmentos...'
                      : 'Selecione o segmento'}
                  </option>
                  {sectors.map((sector) => (
                    <option key={sector.id} value={sector.id}>
                      {sector.name}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-text-secondary">
                  <ChevronDownIcon />
                </span>
              </div>
              {fieldErrors.sectorId ? (
                <p
                  className="m-0 text-xs font-medium text-red-500"
                  id="company-sector-error"
                >
                  {fieldErrors.sectorId}
                </p>
              ) : null}
              {sectorsStatus === 'error' ? (
                <p
                  className="m-0 text-xs font-medium text-red-500"
                  role="alert"
                >
                  {COMPANY_MESSAGES.SECTORS_FETCH_ERROR}
                </p>
              ) : null}
            </div>
            <TextField
              error={fieldErrors.state}
              id="company-state"
              label="Estado"
              onChange={(value) => updateField('state', value)}
              placeholder="Ex: RS"
              value={form.state}
            />
            <TextField
              error={fieldErrors.city}
              id="company-city"
              label="Cidade"
              onChange={(value) => updateField('city', value)}
              placeholder="Ex: Porto Alegre"
              value={form.city}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <TextField
              error={fieldErrors.responsibleName}
              id="company-responsible-name"
              label="Responsável Ambiental"
              onChange={(value) => updateField('responsibleName', value)}
              placeholder="Nome completo do responsável"
              value={form.responsibleName}
            />
            <TextField
              error={fieldErrors.responsibleEmail}
              id="company-responsible-email"
              label="E-mail do Responsável"
              onChange={(value) => updateField('responsibleEmail', value)}
              placeholder="responsavel@empresa.com"
              type="email"
              value={form.responsibleEmail}
            />
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

            {indicatorsError ? (
              <p className="m-0 text-xs font-medium text-red-500" role="alert">
                {indicatorsError}
              </p>
            ) : null}

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
              <div className="relative">
                <select
                  className={`rounded-control min-h-[42px] w-36 appearance-none border border-border bg-surface px-2.5 pr-8 text-sm outline-0 focus:border-focus ${newIndicatorPillar === '' ? 'text-text-muted' : 'text-text-primary'}`}
                  onChange={(event) =>
                    setNewIndicatorPillar(event.target.value)
                  }
                  value={newIndicatorPillar}
                >
                  <option disabled hidden value="">
                    Pilar...
                  </option>
                  <option value="AMBIENTAL">Ambiental</option>
                  <option value="SOCIAL">Social</option>
                  <option value="GOVERNANCA">Governança</option>
                </select>
                <span className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-text-secondary">
                  <ChevronDownIcon />
                </span>
              </div>
              <button
                className="rounded-control cursor-pointer border-0 bg-primary px-4 text-sm font-bold text-white hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-60"
                disabled={
                  isCreatingIndicator ||
                  !newIndicatorName.trim() ||
                  !newIndicatorUnit.trim() ||
                  !newIndicatorPillar
                }
                onClick={() => void handleCreateIndicator()}
                type="button"
              >
                {isCreatingIndicator ? 'Criando...' : 'Criar'}
              </button>
            </div>
            {createIndicatorError && (
              <p className="text-xs font-medium text-red-500">
                {createIndicatorError}
              </p>
            )}
          </section>

          {submitError ? (
            <p
              aria-live="polite"
              className="m-0 rounded-sm border border-[#fda29b] bg-[#fef3f2] px-3 py-2.5 text-[13px] font-semibold text-[#b42318]"
              role="alert"
            >
              {submitError}
            </p>
          ) : null}

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
              disabled={isSubmitting || sectorsStatus !== 'success'}
              type="submit"
            >
              {isSubmitting ? 'Cadastrando...' : 'Cadastrar Empresa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
