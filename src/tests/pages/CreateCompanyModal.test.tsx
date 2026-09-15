import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { COMPANY_MESSAGES } from '../../features/companies/companyMessages';
import type { CreateCompanySubmission } from '../../features/companies/createCompany.types';
import { CreateCompanyModal } from '../../pages/admin/Companies/components/CreateCompanyModal';
import { ApiError } from '../../services/api/apiError';

/*
 * AdminCompaniesPage.test.tsx covers the modal wired to the page (open,
 * close on success, the real POST sequencing). This file stays on what is
 * CreateCompanyModal's own responsibility: loading the sector and indicator
 * catalogs, the client-side validation messages, the payload it hands over,
 * the submitting state, and what a backend error does to the form.
 */

vi.mock('../../services/api/sectorsApi', () => ({
  listSectors: vi.fn(),
}));

vi.mock('../../services/api/esgMetricsApi', () => ({
  createEsgMetric: vi.fn(),
  listEsgMetrics: vi.fn(),
}));

const sectorsApi = await import('../../services/api/sectorsApi');
const esgMetricsApi = await import('../../services/api/esgMetricsApi');

const SECTORS = [
  {
    id: 'sector-siderurgia',
    name: 'Siderurgia',
    description: 'Processamento e transformação de metais.',
  },
  { id: 'sector-agro', name: 'Agronegócio', description: null },
];

const INDICATORS = [
  { id: 'metric-agua', name: 'Consumo de Água', unit: 'm³' },
  { id: 'metric-residuos', name: 'Geração de Resíduos', unit: 't' },
  { id: 'metric-co2', name: 'Emissão de CO₂', unit: 't CO₂e' },
];

const VALID_INPUT = {
  name: 'Empresa Teste',
  cnpj: '77666555000144',
  email: 'contato@empresa.com',
  sector: 'Siderurgia',
  street: 'Av. Assis Brasil',
  number: '1234',
  city: 'Porto Alegre',
  state: 'RS',
  postalCode: '91010-000',
  responsibleName: 'Maria Silva',
  responsibleEmail: 'maria@empresa.com',
  responsiblePhone: '(51) 99999-0000',
};

type FormOverrides = Partial<typeof VALID_INPUT>;

/*
 * The form has twelve fields, and userEvent's default inter-key delay makes
 * filling it the slowest thing in this file. `delay: null` keeps every event
 * userEvent dispatches, only without waiting a macrotask between keystrokes.
 */
function setupUser() {
  return userEvent.setup({ delay: null });
}

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function renderModal() {
  const onClose = vi.fn();
  const onSubmit =
    vi.fn<(submission: CreateCompanySubmission) => Promise<void>>();
  onSubmit.mockResolvedValue(undefined);

  const utils = render(
    <CreateCompanyModal isOpen onClose={onClose} onSubmit={onSubmit} />
  );

  return { ...utils, onClose, onSubmit };
}

/** The submit button unlocks only once GET /sectors has answered. */
async function waitForSectors() {
  await waitFor(() => {
    expect(
      screen.getByRole('button', { name: /cadastrar empresa/i })
    ).toBeEnabled();
  });
}

async function fillForm(
  user: ReturnType<typeof userEvent.setup>,
  overrides: FormOverrides = {}
) {
  const values = { ...VALID_INPUT, ...overrides };

  async function typeInto(label: RegExp, value: string) {
    if (!value) return;
    await user.type(screen.getByLabelText(label), value);
  }

  await typeInto(/nome da empresa/i, values.name);
  await typeInto(/cnpj/i, values.cnpj);
  await typeInto(/e-mail da empresa/i, values.email);
  if (values.sector) {
    await user.selectOptions(screen.getByLabelText(/segmento/i), values.sector);
  }
  await typeInto(/logradouro/i, values.street);
  await typeInto(/^número/i, values.number);
  await typeInto(/^cidade/i, values.city);
  await typeInto(/^estado/i, values.state);
  await typeInto(/^cep/i, values.postalCode);
  await typeInto(/responsável ambiental/i, values.responsibleName);
  await typeInto(/e-mail do responsável/i, values.responsibleEmail);
  await typeInto(/telefone do responsável/i, values.responsiblePhone);
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(sectorsApi.listSectors).mockResolvedValue(SECTORS);
  vi.mocked(esgMetricsApi.listEsgMetrics).mockResolvedValue(INDICATORS);
});

describe('CreateCompanyModal catalogs', () => {
  it('renders nothing while closed and loads no catalog', () => {
    render(
      <CreateCompanyModal
        isOpen={false}
        onClose={vi.fn()}
        onSubmit={vi.fn().mockResolvedValue(undefined)}
      />
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(sectorsApi.listSectors).not.toHaveBeenCalled();
    expect(esgMetricsApi.listEsgMetrics).not.toHaveBeenCalled();
  });

  it('fills the segment select with the sectors returned by the API', async () => {
    renderModal();

    expect(
      await screen.findByRole('option', { name: 'Siderurgia' })
    ).toHaveValue('sector-siderurgia');
    expect(screen.getByRole('option', { name: 'Agronegócio' })).toHaveValue(
      'sector-agro'
    );
    expect(sectorsApi.listSectors).toHaveBeenCalledTimes(1);
  });

  it('keeps the segment select and the submit button locked while the sectors load', async () => {
    const deferred = createDeferred<typeof SECTORS>();
    vi.mocked(sectorsApi.listSectors).mockReturnValue(deferred.promise);
    renderModal();

    expect(screen.getByLabelText(/segmento/i)).toBeDisabled();
    expect(
      screen.getByRole('button', { name: /cadastrar empresa/i })
    ).toBeDisabled();
    expect(screen.getByText(/carregando segmentos/i)).toBeInTheDocument();

    deferred.resolve(SECTORS);

    await waitForSectors();
    expect(screen.getByLabelText(/segmento/i)).toBeEnabled();
  });

  it('reports a failed sector load and never unlocks the submit button', async () => {
    vi.mocked(sectorsApi.listSectors).mockRejectedValue(
      new ApiError(500, 'Erro interno.')
    );
    renderModal();

    expect(
      await screen.findByText(COMPANY_MESSAGES.SECTORS_FETCH_ERROR)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /cadastrar empresa/i })
    ).toBeDisabled();
  });

  it('offers the indicators returned by the API in the search dropdown', async () => {
    const user = setupUser();
    renderModal();
    await waitForSectors();

    await user.click(screen.getByPlaceholderText(/buscar ou criar indicador/i));

    expect(await screen.findByText('Consumo de Água')).toBeInTheDocument();
    expect(screen.getByText('Geração de Resíduos')).toBeInTheDocument();
    expect(esgMetricsApi.listEsgMetrics).toHaveBeenCalledTimes(1);
  });

  it('reports a failed indicator load', async () => {
    vi.mocked(esgMetricsApi.listEsgMetrics).mockRejectedValue(
      new ApiError(500, 'Erro interno.')
    );
    renderModal();

    expect(
      await screen.findByText(COMPANY_MESSAGES.INDICATORS_FETCH_ERROR)
    ).toBeInTheDocument();
  });
});

describe('CreateCompanyModal validation', () => {
  it('lists every required field and submits nothing when the form is empty', async () => {
    const user = setupUser();
    const { onSubmit } = renderModal();
    await waitForSectors();

    await user.click(
      screen.getByRole('button', { name: /cadastrar empresa/i })
    );

    for (const message of [
      COMPANY_MESSAGES.NAME_REQUIRED,
      COMPANY_MESSAGES.CNPJ_INVALID,
      COMPANY_MESSAGES.EMAIL_INVALID,
      COMPANY_MESSAGES.SECTOR_REQUIRED,
      COMPANY_MESSAGES.STREET_REQUIRED,
      COMPANY_MESSAGES.NUMBER_REQUIRED,
      COMPANY_MESSAGES.CITY_REQUIRED,
      COMPANY_MESSAGES.STATE_REQUIRED,
      COMPANY_MESSAGES.POSTAL_CODE_REQUIRED,
      COMPANY_MESSAGES.RESPONSIBLE_NAME_REQUIRED,
      COMPANY_MESSAGES.RESPONSIBLE_EMAIL_INVALID,
      COMPANY_MESSAGES.RESPONSIBLE_PHONE_REQUIRED,
    ]) {
      expect(screen.getByText(message)).toBeInTheDocument();
    }
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('points the field at its message for assistive technology', async () => {
    const user = setupUser();
    renderModal();
    await waitForSectors();

    await user.click(
      screen.getByRole('button', { name: /cadastrar empresa/i })
    );

    const nameInput = screen.getByLabelText(/nome da empresa/i);
    expect(nameInput).toHaveAttribute('aria-invalid', 'true');
    expect(nameInput).toHaveAccessibleDescription(
      COMPANY_MESSAGES.NAME_REQUIRED
    );
  });

  it('reports only the single missing field when everything else is filled', async () => {
    const user = setupUser();
    const { onSubmit } = renderModal();
    await waitForSectors();

    await fillForm(user, { postalCode: '' });
    await user.click(
      screen.getByRole('button', { name: /cadastrar empresa/i })
    );

    expect(
      screen.getByText(COMPANY_MESSAGES.POSTAL_CODE_REQUIRED)
    ).toBeInTheDocument();
    expect(
      screen.queryByText(COMPANY_MESSAGES.NAME_REQUIRED)
    ).not.toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('clears the messages once the missing field is filled and resubmitted', async () => {
    const user = setupUser();
    const { onSubmit } = renderModal();
    await waitForSectors();

    await fillForm(user, { city: '' });
    await user.click(
      screen.getByRole('button', { name: /cadastrar empresa/i })
    );
    expect(
      screen.getByText(COMPANY_MESSAGES.CITY_REQUIRED)
    ).toBeInTheDocument();

    await user.type(screen.getByLabelText(/^cidade/i), 'Porto Alegre');
    await user.click(
      screen.getByRole('button', { name: /cadastrar empresa/i })
    );

    await waitFor(() => {
      expect(
        screen.queryByText(COMPANY_MESSAGES.CITY_REQUIRED)
      ).not.toBeInTheDocument();
    });
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('prevents the browser from submitting the form natively', async () => {
    const { container } = renderModal();
    await waitForSectors();
    const form = container.querySelector('form');
    if (!form) throw new Error('form not found');

    expect(fireEvent.submit(form)).toBe(false);
  });
});

describe('CreateCompanyModal live error clearing', () => {
  const ALL_MESSAGES = [
    COMPANY_MESSAGES.NAME_REQUIRED,
    COMPANY_MESSAGES.CNPJ_INVALID,
    COMPANY_MESSAGES.EMAIL_INVALID,
    COMPANY_MESSAGES.SECTOR_REQUIRED,
    COMPANY_MESSAGES.STREET_REQUIRED,
    COMPANY_MESSAGES.NUMBER_REQUIRED,
    COMPANY_MESSAGES.CITY_REQUIRED,
    COMPANY_MESSAGES.STATE_REQUIRED,
    COMPANY_MESSAGES.POSTAL_CODE_REQUIRED,
    COMPANY_MESSAGES.RESPONSIBLE_NAME_REQUIRED,
    COMPANY_MESSAGES.RESPONSIBLE_EMAIL_INVALID,
    COMPANY_MESSAGES.RESPONSIBLE_PHONE_REQUIRED,
  ];

  async function submitEmptyForm(user: ReturnType<typeof userEvent.setup>) {
    await waitForSectors();
    await user.click(
      screen.getByRole('button', { name: /cadastrar empresa/i })
    );
    expect(
      screen.getByText(COMPANY_MESSAGES.NAME_REQUIRED)
    ).toBeInTheDocument();
  }

  it('takes a message away as soon as its own field becomes valid', async () => {
    const user = setupUser();
    renderModal();
    await submitEmptyForm(user);

    await user.type(screen.getByLabelText(/nome da empresa/i), 'Empresa Teste');

    expect(
      screen.queryByText(COMPANY_MESSAGES.NAME_REQUIRED)
    ).not.toBeInTheDocument();
    // Every other field is still empty, so its message must stay put.
    expect(
      screen.getByText(COMPANY_MESSAGES.CITY_REQUIRED)
    ).toBeInTheDocument();
  });

  it('restores the accessible state of the field it cleared', async () => {
    const user = setupUser();
    renderModal();
    await submitEmptyForm(user);

    await user.type(screen.getByLabelText(/nome da empresa/i), 'Empresa Teste');

    const nameInput = screen.getByLabelText(/nome da empresa/i);
    expect(nameInput).not.toHaveAttribute('aria-invalid');
    expect(nameInput).not.toHaveAttribute('aria-describedby');
    expect(screen.getByLabelText(/^cidade/i)).toHaveAttribute(
      'aria-invalid',
      'true'
    );
  });

  it('keeps the message while the value typed so far is still invalid', async () => {
    const user = setupUser();
    renderModal();
    await submitEmptyForm(user);

    // Nine of the fourteen digits a CNPJ needs.
    await user.type(screen.getByLabelText(/cnpj/i), '776665550');
    expect(screen.getByText(COMPANY_MESSAGES.CNPJ_INVALID)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/cnpj/i), '00144');
    expect(
      screen.queryByText(COMPANY_MESSAGES.CNPJ_INVALID)
    ).not.toBeInTheDocument();
  });

  it('clears the segment message when the select finally gets a value', async () => {
    const user = setupUser();
    renderModal();
    await submitEmptyForm(user);

    await user.selectOptions(screen.getByLabelText(/segmento/i), 'Siderurgia');

    expect(
      screen.queryByText(COMPANY_MESSAGES.SECTOR_REQUIRED)
    ).not.toBeInTheDocument();
  });

  it('leaves no message on screen once every field is corrected, without a second submit', async () => {
    const user = setupUser();
    const { onSubmit } = renderModal();
    await submitEmptyForm(user);

    await fillForm(user);

    for (const message of ALL_MESSAGES) {
      expect(screen.queryByText(message)).not.toBeInTheDocument();
    }
    // The form was corrected, not submitted: the button still had to be clicked.
    expect(onSubmit).not.toHaveBeenCalled();
    expect(
      screen.getByRole('button', { name: /cadastrar empresa/i })
    ).toBeEnabled();
  });

  it('does not invent messages for fields the user never submitted', async () => {
    const user = setupUser();
    renderModal();
    await waitForSectors();

    await user.type(screen.getByLabelText(/nome da empresa/i), 'Empresa Teste');
    await user.clear(screen.getByLabelText(/nome da empresa/i));

    for (const message of ALL_MESSAGES) {
      expect(screen.queryByText(message)).not.toBeInTheDocument();
    }
  });
});

describe('CreateCompanyModal submit', () => {
  it('hands over the CreateCustomerDto payload plus the selected metric ids', async () => {
    const user = setupUser();
    const { onSubmit } = renderModal();
    await waitForSectors();

    await fillForm(user, {
      name: '  Empresa Teste  ',
      street: '  Av. Assis Brasil  ',
      city: '  Porto Alegre  ',
    });

    const search = screen.getByPlaceholderText(/buscar ou criar indicador/i);
    await user.click(search);
    await user.click(await screen.findByText('Consumo de Água'));

    await user.click(
      screen.getByRole('button', { name: /cadastrar empresa/i })
    );

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      company: {
        name: 'Empresa Teste',
        document: '77666555000144',
        document_type: 'CNPJ',
        sector_id: 'sector-siderurgia',
        email: 'contato@empresa.com',
        owner_name: 'Maria Silva',
        owner_email: 'maria@empresa.com',
        owner_phone: '(51) 99999-0000',
        address: {
          type: 'BILLING',
          street: 'Av. Assis Brasil',
          number: '1234',
          city: 'Porto Alegre',
          state: 'RS',
          postal_code: '91010-000',
          country_code: 'BR',
        },
      },
      esgMetricIds: ['metric-agua'],
    });
  });

  it('sends an empty metric list when no indicator was picked, and clears the form afterwards', async () => {
    const user = setupUser();
    const { onSubmit } = renderModal();
    await waitForSectors();

    await fillForm(user);
    await user.click(
      screen.getByRole('button', { name: /cadastrar empresa/i })
    );

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ esgMetricIds: [] })
    );
    await waitFor(() => {
      expect(screen.getByLabelText(/nome da empresa/i)).toHaveValue('');
    });
    expect(screen.getByLabelText(/cnpj/i)).toHaveValue('');
    expect(screen.getByLabelText(/telefone do responsável/i)).toHaveValue('');
  });

  it('shows "Cadastrando..." on a disabled button while the request is in flight', async () => {
    const deferred = createDeferred<void>();
    const user = setupUser();
    const { onSubmit } = renderModal();
    onSubmit.mockReturnValue(deferred.promise);
    await waitForSectors();

    await fillForm(user);
    await user.click(
      screen.getByRole('button', { name: /cadastrar empresa/i })
    );

    expect(screen.getByRole('button', { name: /cadastrando/i })).toBeDisabled();

    deferred.resolve();

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /cadastrar empresa/i })
      ).toBeEnabled();
    });
  });

  it('renders the backend message verbatim and keeps the typed values on a duplicate CNPJ', async () => {
    const user = setupUser();
    const { onSubmit, onClose } = renderModal();
    onSubmit.mockRejectedValue(
      new ApiError(409, 'Já existe uma empresa cadastrada com este CNPJ.')
    );
    await waitForSectors();

    await fillForm(user);
    await user.click(
      screen.getByRole('button', { name: /cadastrar empresa/i })
    );

    expect(
      await screen.findByText('Já existe uma empresa cadastrada com este CNPJ.')
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/nome da empresa/i)).toHaveValue(
      'Empresa Teste'
    );
    expect(onClose).not.toHaveBeenCalled();
  });

  it('falls back to generic copy when the rejection carries no backend message', async () => {
    const user = setupUser();
    const { onSubmit } = renderModal();
    onSubmit.mockRejectedValue(new Error('network down'));
    await waitForSectors();

    await fillForm(user);
    await user.click(
      screen.getByRole('button', { name: /cadastrar empresa/i })
    );

    expect(
      await screen.findByText(COMPANY_MESSAGES.CREATE_COMPANY_ERROR)
    ).toBeInTheDocument();
  });

  it('drops a previous backend error on the next submit attempt', async () => {
    const user = setupUser();
    const { onSubmit } = renderModal();
    onSubmit.mockRejectedValueOnce(new ApiError(409, 'CNPJ duplicado.'));
    await waitForSectors();

    await fillForm(user);
    await user.click(
      screen.getByRole('button', { name: /cadastrar empresa/i })
    );
    expect(await screen.findByText('CNPJ duplicado.')).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: /cadastrar empresa/i })
    );

    await waitFor(() => {
      expect(screen.queryByText('CNPJ duplicado.')).not.toBeInTheDocument();
    });
  });
});

describe('CreateCompanyModal indicator search', () => {
  it('starts with the indicator dropdown closed', async () => {
    renderModal();
    await waitForSectors();

    expect(screen.queryByText('Consumo de Água')).not.toBeInTheDocument();
  });

  it('filters indicators by a case-insensitive, whitespace-trimmed query', async () => {
    const user = setupUser();
    renderModal();
    await waitForSectors();
    const search = screen.getByPlaceholderText(/buscar ou criar indicador/i);

    await user.click(search);
    await user.type(search, '  ÁGUA  ');

    expect(await screen.findByText('Consumo de Água')).toBeInTheDocument();
    expect(screen.queryByText('Geração de Resíduos')).not.toBeInTheDocument();
    expect(screen.queryByText('Emissão de CO₂')).not.toBeInTheDocument();
  });

  it('shows a not-found message when the search query matches no indicator', async () => {
    const user = setupUser();
    renderModal();
    await waitForSectors();
    const search = screen.getByPlaceholderText(/buscar ou criar indicador/i);

    await user.click(search);
    await user.type(search, 'inexistente-xyz');

    expect(
      await screen.findByText(/nenhum indicador encontrado\. crie um abaixo\./i)
    ).toBeInTheDocument();
  });

  it('closes the indicator dropdown when Escape is pressed', async () => {
    const user = setupUser();
    renderModal();
    await waitForSectors();
    const search = screen.getByPlaceholderText(/buscar ou criar indicador/i);

    await user.click(search);
    expect(await screen.findByText('Consumo de Água')).toBeInTheDocument();

    await user.keyboard('{Escape}');

    expect(screen.queryByText('Consumo de Água')).not.toBeInTheDocument();
  });

  it('keeps the indicator dropdown open for a key other than Escape', async () => {
    const user = setupUser();
    renderModal();
    await waitForSectors();
    const search = screen.getByPlaceholderText(/buscar ou criar indicador/i);

    await user.click(search);
    expect(await screen.findByText('Consumo de Água')).toBeInTheDocument();

    // ArrowDown doesn't change the input's value, so only the keydown
    // handler is in play here (unlike typing, which also fires onChange
    // and would mask a guard that reacted to every key press).
    await user.keyboard('{ArrowDown}');

    expect(screen.getByText('Consumo de Água')).toBeInTheDocument();
  });

  it('removes only the targeted indicator, keeping the others selected', async () => {
    const user = setupUser();
    renderModal();
    await waitForSectors();
    const search = screen.getByPlaceholderText(/buscar ou criar indicador/i);

    await user.click(search);
    await user.click(await screen.findByText('Consumo de Água'));
    await user.click(await screen.findByText('Geração de Resíduos'));

    await user.click(
      screen.getByRole('button', { name: /remover consumo de água/i })
    );

    expect(screen.queryByText('Consumo de Água')).not.toBeInTheDocument();
    expect(screen.getByText('Geração de Resíduos')).toBeInTheDocument();
  });

  it('shows a message once every indicator has been selected', async () => {
    const user = setupUser();
    renderModal();
    await waitForSectors();
    const search = screen.getByPlaceholderText(/buscar ou criar indicador/i);

    for (const indicator of INDICATORS) {
      await user.click(search);
      await user.click(await screen.findByText(indicator.name));
    }

    await user.click(search);
    expect(
      await screen.findByText(/todos os indicadores já foram selecionados/i)
    ).toBeInTheDocument();
  });
});

describe('CreateCompanyModal indicator creation', () => {
  it('does not render an indicator-creation error message before any attempt', async () => {
    const { container } = renderModal();
    await waitForSectors();

    expect(container.querySelector('.text-red-500')).not.toBeInTheDocument();
  });

  it('keeps "Criar" disabled while the new indicator name is only whitespace', async () => {
    const user = setupUser();
    renderModal();
    await waitForSectors();

    await user.type(
      screen.getByPlaceholderText(/nome do novo indicador/i),
      '   '
    );
    await user.type(screen.getByPlaceholderText(/unidade/i), 'kg');
    await user.selectOptions(screen.getByDisplayValue(/pilar/i), 'AMBIENTAL');

    expect(screen.getByRole('button', { name: /^criar$/i })).toBeDisabled();
  });

  it('keeps "Criar" disabled while the new indicator unit is only whitespace', async () => {
    const user = setupUser();
    renderModal();
    await waitForSectors();

    await user.type(
      screen.getByPlaceholderText(/nome do novo indicador/i),
      'Consumo de Gás'
    );
    await user.type(screen.getByPlaceholderText(/unidade/i), '   ');
    await user.selectOptions(screen.getByDisplayValue(/pilar/i), 'AMBIENTAL');

    expect(screen.getByRole('button', { name: /^criar$/i })).toBeDisabled();
  });

  it('switches the pillar select from muted placeholder styling to primary once a value is chosen', async () => {
    const user = setupUser();
    renderModal();
    await waitForSectors();
    const pillarSelect = screen.getByDisplayValue(/pilar/i);

    expect(pillarSelect.className).toContain('text-text-muted');
    expect(pillarSelect.className).not.toContain('text-text-primary');

    await user.selectOptions(pillarSelect, 'AMBIENTAL');

    expect(pillarSelect.className).toContain('text-text-primary');
    expect(pillarSelect.className).not.toContain('text-text-muted');
  });

  it('shows a loading state while creating, trims the payload, then resets and selects the new indicator', async () => {
    const deferred = createDeferred<{
      id: string;
      name: string;
      unit: string;
    }>();
    vi.mocked(esgMetricsApi.createEsgMetric).mockReturnValue(deferred.promise);
    const user = setupUser();
    renderModal();
    await waitForSectors();

    await user.type(
      screen.getByPlaceholderText(/nome do novo indicador/i),
      '  Consumo de Gás  '
    );
    await user.type(screen.getByPlaceholderText(/unidade/i), '  m³  ');
    await user.selectOptions(screen.getByDisplayValue(/pilar/i), 'AMBIENTAL');
    await user.click(screen.getByRole('button', { name: /^criar$/i }));

    expect(esgMetricsApi.createEsgMetric).toHaveBeenCalledWith({
      name: 'Consumo de Gás',
      unit: 'm³',
      pillar: 'AMBIENTAL',
    });
    expect(screen.getByRole('button', { name: /criando/i })).toBeDisabled();

    deferred.resolve({ id: 'metric-gas', name: 'Consumo de Gás', unit: 'm³' });

    // Fields are cleared on success, so the button goes back to its default
    // label but stays disabled (now because the inputs are empty again, not
    // because of the loading state).
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /^criar$/i })
      ).toBeInTheDocument();
    });
    expect(screen.getByText('Consumo de Gás')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/nome do novo indicador/i)).toHaveValue(
      ''
    );
    expect(screen.getByPlaceholderText(/unidade/i)).toHaveValue('');
    expect(screen.getByDisplayValue(/^pilar\.\.\.$/i)).toBeInTheDocument();
  });

  it('shows a loading state, then a generic error, when creation fails without an ApiError', async () => {
    const deferred = createDeferred<{
      id: string;
      name: string;
      unit: string;
    }>();
    vi.mocked(esgMetricsApi.createEsgMetric).mockReturnValue(deferred.promise);
    const user = setupUser();
    renderModal();
    await waitForSectors();

    await user.type(
      screen.getByPlaceholderText(/nome do novo indicador/i),
      'Consumo de Gás'
    );
    await user.type(screen.getByPlaceholderText(/unidade/i), 'm³');
    await user.selectOptions(screen.getByDisplayValue(/pilar/i), 'AMBIENTAL');
    await user.click(screen.getByRole('button', { name: /^criar$/i }));

    expect(screen.getByRole('button', { name: /criando/i })).toBeDisabled();

    deferred.reject(new Error('network down'));

    expect(
      await screen.findByText(COMPANY_MESSAGES.CREATE_INDICATOR_ERROR)
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^criar$/i })).toBeEnabled();
    });
  });

  it('clears a previous indicator error after a successful retry', async () => {
    vi.mocked(esgMetricsApi.createEsgMetric).mockRejectedValueOnce(
      new ApiError(400, COMPANY_MESSAGES.CREATE_INDICATOR_ERROR)
    );
    const user = setupUser();
    renderModal();
    await waitForSectors();

    await user.type(
      screen.getByPlaceholderText(/nome do novo indicador/i),
      'Consumo de Gás'
    );
    await user.type(screen.getByPlaceholderText(/unidade/i), 'm³');
    await user.selectOptions(screen.getByDisplayValue(/pilar/i), 'AMBIENTAL');
    await user.click(screen.getByRole('button', { name: /^criar$/i }));

    expect(
      await screen.findByText(COMPANY_MESSAGES.CREATE_INDICATOR_ERROR)
    ).toBeInTheDocument();

    vi.mocked(esgMetricsApi.createEsgMetric).mockResolvedValueOnce({
      id: 'metric-gas',
      name: 'Consumo de Gás',
      unit: 'm³',
    });
    await user.click(screen.getByRole('button', { name: /^criar$/i }));

    await waitFor(() => {
      expect(
        screen.queryByText(COMPANY_MESSAGES.CREATE_INDICATOR_ERROR)
      ).not.toBeInTheDocument();
    });
  });
});

describe('CreateCompanyModal cancel', () => {
  it('resets every field, the selection and any error when cancelled', async () => {
    const user = setupUser();
    const { onClose } = renderModal();
    await waitForSectors();

    await fillForm(user);
    const search = screen.getByPlaceholderText(/buscar ou criar indicador/i);
    await user.click(search);
    await user.click(await screen.findByText('Consumo de Água'));

    vi.mocked(esgMetricsApi.createEsgMetric).mockRejectedValueOnce(
      new ApiError(400, COMPANY_MESSAGES.CREATE_INDICATOR_ERROR)
    );
    await user.type(
      screen.getByPlaceholderText(/nome do novo indicador/i),
      'Rascunho'
    );
    await user.type(screen.getByPlaceholderText(/unidade/i), 'kg');
    await user.selectOptions(screen.getByDisplayValue(/pilar/i), 'AMBIENTAL');
    await user.click(screen.getByRole('button', { name: /^criar$/i }));
    expect(
      await screen.findByText(COMPANY_MESSAGES.CREATE_INDICATOR_ERROR)
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /cancelar/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText(/nome da empresa/i)).toHaveValue('');
    expect(screen.getByLabelText(/^cep/i)).toHaveValue('');
    expect(screen.getByLabelText(/segmento/i)).toHaveValue('');
    expect(
      screen.getByPlaceholderText(/buscar ou criar indicador/i)
    ).toHaveValue('');
    expect(screen.getByPlaceholderText(/nome do novo indicador/i)).toHaveValue(
      ''
    );
    expect(screen.getByPlaceholderText(/unidade/i)).toHaveValue('');
    expect(screen.getByDisplayValue(/^pilar\.\.\.$/i)).toBeInTheDocument();
    expect(
      screen.queryByText(COMPANY_MESSAGES.CREATE_INDICATOR_ERROR)
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Consumo de Água')).not.toBeInTheDocument();
  });

  it('clears the validation messages on cancel', async () => {
    const user = setupUser();
    renderModal();
    await waitForSectors();

    await user.click(
      screen.getByRole('button', { name: /cadastrar empresa/i })
    );
    expect(
      screen.getByText(COMPANY_MESSAGES.NAME_REQUIRED)
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /cancelar/i }));

    expect(
      screen.queryByText(COMPANY_MESSAGES.NAME_REQUIRED)
    ).not.toBeInTheDocument();
  });

  it('closes the indicator dropdown as part of the cancel reset, not just from losing focus', async () => {
    const user = setupUser();
    renderModal();
    await waitForSectors();
    const search = screen.getByPlaceholderText(/buscar ou criar indicador/i);

    await user.click(search);
    expect(await screen.findByText('Consumo de Água')).toBeInTheDocument();

    // Use a raw fireEvent (not user.click) so the search input keeps DOM
    // focus and never blurs — isolating handleCancel's own explicit
    // setIsIndicatorMenuOpen(false) from the dropdown's onBlur handler.
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));

    expect(screen.queryByText('Consumo de Água')).not.toBeInTheDocument();
  });

  it('closes when the backdrop is clicked', async () => {
    const user = setupUser();
    const { onClose } = renderModal();
    await waitForSectors();

    await user.click(screen.getByRole('dialog'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
