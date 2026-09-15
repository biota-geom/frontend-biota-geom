import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../../app/router/AppRouter';
import { APP_ROUTES, buildCompanyRoutes } from '../../app/router/routes';
import { COMPANY_MESSAGES } from '../../features/companies/companyMessages';
import { useCompanies } from '../../features/companies/useCompanies';
import {
  getCompanyCountLabel,
  getComplianceTone,
  getStatusLabel,
} from '../../pages/admin/Companies/companyCardFormatting';
import { ApiError } from '../../services/api/apiError';
import { MOCK_AUTH_USER, renderWithAuth } from '../mocks/renderWithAuth';

vi.mock('../../services/api/customersApi', () => ({
  listCompanies: vi.fn(),
}));

vi.mock('../../services/api/esgMetricsApi', () => ({
  createEsgMetric: vi.fn(),
  listEsgMetrics: vi.fn(),
}));

vi.mock('../../services/api/sectorsApi', () => ({
  listSectors: vi.fn(),
}));

/*
 * getCompanyById stays real (it reads the mocked customers listing) so the
 * card-to-dashboard navigation test keeps exercising the actual lookup.
 */
vi.mock('../../services/api/companiesApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../services/api/companiesApi')>()),
  createCompany: vi.fn(),
  linkCompanyEsgMetrics: vi.fn(),
}));

const customersApi = await import('../../services/api/customersApi');
const esgMetricsApi = await import('../../services/api/esgMetricsApi');
const sectorsApi = await import('../../services/api/sectorsApi');
const companiesApi = await import('../../services/api/companiesApi');

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

const COMPANIES = [
  {
    id: 'customer-1',
    name: 'Unidade Industrial RS',
    status: 'active' as const,
    segment: 'Siderurgia',
    location: 'Porto Alegre - RS',
  },
  {
    id: 'customer-2',
    name: 'Fábrica São Paulo',
    status: 'active' as const,
    segment: 'Metalúrgica',
    location: 'Sorocaba - SP',
  },
  {
    id: 'customer-3',
    name: 'Agro Centro-Oeste',
    status: 'inactive' as const,
    segment: 'Agronegócio',
    location: 'Sorriso - MT',
  },
];

function LocationProbe() {
  const location = useLocation();

  return <span data-testid="current-path">{location.pathname}</span>;
}

function renderAppRoutes(initialRoute = APP_ROUTES.admin.companies) {
  return renderWithAuth(
    <>
      <AppRoutes />
      <LocationProbe />
    </>,
    { status: 'authenticated', user: MOCK_AUTH_USER, initialRoute }
  );
}

/*
 * The create form has twelve fields, and userEvent's default inter-key delay
 * makes filling it the slowest thing in this file. `delay: null` keeps every
 * event userEvent dispatches, only without waiting between keystrokes.
 */
function setupUser() {
  return userEvent.setup({ delay: null });
}

/** Opens the modal and waits for GET /sectors, which unlocks the submit button. */
async function openCreateModal(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /nova empresa/i }));
  await waitFor(() => {
    expect(
      screen.getByRole('button', { name: /cadastrar empresa/i })
    ).toBeEnabled();
  });
}

async function fillCompanyForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/nome da empresa/i), 'Empresa Teste');
  await user.type(screen.getByLabelText(/cnpj/i), '77666555000144');
  await user.selectOptions(screen.getByLabelText(/segmento/i), 'Siderurgia');
  await user.type(screen.getByLabelText(/^cidade/i), 'Porto Alegre');
  await user.type(screen.getByLabelText(/^estado/i), 'RS');
  await user.type(
    screen.getByLabelText(/responsável ambiental/i),
    'Maria Silva'
  );
  await user.type(
    screen.getByLabelText(/e-mail do responsável/i),
    'maria@empresa.com'
  );
}

const EXPECTED_CREATE_PAYLOAD = {
  name: 'Empresa Teste',
  document: '77666555000144',
  document_type: 'CNPJ',
  sector_id: 'sector-siderurgia',
  owner_name: 'Maria Silva',
  owner_email: 'maria@empresa.com',
  address: {
    type: 'BILLING',
    city: 'Porto Alegre',
    state: 'RS',
    country_code: 'BR',
  },
};

describe('AdminCompaniesPage', () => {
  beforeEach(() => {
    useCompanies.setState({ companies: [], status: 'idle', error: null });
    vi.resetAllMocks();
    vi.restoreAllMocks();
    vi.mocked(sectorsApi.listSectors).mockResolvedValue(SECTORS);
    vi.mocked(esgMetricsApi.listEsgMetrics).mockResolvedValue(INDICATORS);
  });

  it('fetches and renders company cards from the customers API', async () => {
    vi.mocked(customersApi.listCompanies).mockResolvedValue(COMPANIES);

    renderAppRoutes();

    expect(
      screen.getByRole('heading', { name: /empresas cadastradas/i })
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByRole('article', { name: /unidade industrial rs/i })
      ).toBeInTheDocument();
    });

    expect(
      screen.getByRole('article', { name: /fábrica são paulo/i })
    ).toBeInTheDocument();
    expect(screen.getAllByText(/atenção/i)).toHaveLength(3);
    expect(screen.getAllByText(/vencido/i)).toHaveLength(3);
    expect(screen.queryByText(/alertas/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /configurações/i })
    ).not.toBeInTheDocument();
  });

  it('shows the registered company total in the header', async () => {
    vi.mocked(customersApi.listCompanies).mockResolvedValue(COMPANIES);

    renderAppRoutes();

    expect(await screen.findByText('3 empresas')).toBeInTheDocument();
  });

  it('keeps the header total on the whole portfolio when a filter reduces the listing', async () => {
    vi.mocked(customersApi.listCompanies).mockResolvedValue(COMPANIES);
    const user = setupUser();
    renderAppRoutes();

    expect(await screen.findByText('3 empresas')).toBeInTheDocument();

    await user.type(
      screen.getByPlaceholderText(/buscar por nome da filial/i),
      'Agro'
    );

    await waitFor(() => {
      expect(screen.getAllByRole('article')).toHaveLength(1);
    });
    expect(screen.getByText('3 empresas')).toBeInTheDocument();
  });

  it('writes the header total in the singular for a single company', async () => {
    vi.mocked(customersApi.listCompanies).mockResolvedValue([COMPANIES[0]]);

    renderAppRoutes();

    expect(await screen.findByText('1 empresa')).toBeInTheDocument();
  });

  it('holds back the header total while the listing is loading', async () => {
    let resolveCompanies: (companies: typeof COMPANIES) => void = () => {};
    vi.mocked(customersApi.listCompanies).mockReturnValue(
      new Promise((resolve) => {
        resolveCompanies = resolve;
      })
    );

    renderAppRoutes();

    expect(await screen.findByText(/carregando empresas/i)).toBeInTheDocument();
    expect(screen.queryByText(/^\d+ empresas?$/)).not.toBeInTheDocument();

    resolveCompanies(COMPANIES);

    expect(await screen.findByText('3 empresas')).toBeInTheDocument();
  });

  it('shows an error state with a retry action when the fetch fails', async () => {
    vi.mocked(customersApi.listCompanies).mockRejectedValueOnce(
      new ApiError(500, 'Erro ao carregar empresas.')
    );

    const user = setupUser();
    renderAppRoutes();

    await waitFor(() => {
      expect(
        screen.getByText(/erro ao carregar empresas\./i)
      ).toBeInTheDocument();
    });

    vi.mocked(customersApi.listCompanies).mockResolvedValueOnce(COMPANIES);
    await user.click(screen.getByRole('button', { name: /tentar novamente/i }));

    await waitFor(() => {
      expect(
        screen.getByRole('article', { name: /unidade industrial rs/i })
      ).toBeInTheDocument();
    });
  });

  it('shows an empty state when there are no companies', async () => {
    vi.mocked(customersApi.listCompanies).mockResolvedValue([]);

    renderAppRoutes();

    await waitFor(() => {
      expect(
        screen.getByText(/nenhuma empresa cadastrada até o momento\./i)
      ).toBeInTheDocument();
    });
  });

  it('navigates from a company card to the company dashboard', async () => {
    vi.mocked(customersApi.listCompanies).mockResolvedValue(COMPANIES);
    const user = setupUser();
    renderAppRoutes();

    const companyCard = await screen.findByRole('article', {
      name: /unidade industrial rs/i,
    });

    await user.click(
      within(companyCard).getByRole('link', { name: /ver detalhes/i })
    );

    expect(screen.getByTestId('current-path')).toHaveTextContent(
      buildCompanyRoutes.dashboard('customer-1')
    );
  });

  it('renders the admin navigation with the current section highlighted', async () => {
    vi.mocked(customersApi.listCompanies).mockResolvedValue(COMPANIES);
    renderAppRoutes();

    const companiesLink = screen.getByRole('link', { name: 'Empresas' });
    const legislationLink = screen.getByRole('link', { name: 'Legislação' });
    const indicatorsLink = screen.getByRole('link', { name: 'Indicadores' });

    expect(companiesLink).toHaveAttribute('href', APP_ROUTES.admin.companies);
    expect(legislationLink).toHaveAttribute(
      'href',
      APP_ROUTES.admin.legislation
    );
    expect(indicatorsLink).toHaveAttribute('href', APP_ROUTES.admin.indicators);
    expect(companiesLink.className).toContain('border-primary-strong');
    expect(legislationLink.className).not.toContain('border-primary-strong');
  });

  it('renders the "Nova Empresa" action button', async () => {
    vi.mocked(customersApi.listCompanies).mockResolvedValue(COMPANIES);
    renderAppRoutes();

    expect(
      screen.getByRole('button', { name: /nova empresa/i })
    ).toBeInTheDocument();
  });

  it('shows edit and delete controls scoped to each company', async () => {
    vi.mocked(customersApi.listCompanies).mockResolvedValue(COMPANIES);
    renderAppRoutes();

    const companyCard = await screen.findByRole('article', {
      name: /unidade industrial rs/i,
    });

    expect(
      within(companyCard).getByRole('button', {
        name: /editar unidade industrial rs/i,
      })
    ).toBeInTheDocument();
    expect(
      within(companyCard).getByRole('button', {
        name: /excluir unidade industrial rs/i,
      })
    ).toBeInTheDocument();
  });

  it('labels active and inactive companies with the matching status badge', async () => {
    vi.mocked(customersApi.listCompanies).mockResolvedValue(COMPANIES);
    renderAppRoutes();

    const activeCard = await screen.findByRole('article', {
      name: /unidade industrial rs/i,
    });
    const inactiveCard = screen.getByRole('article', {
      name: /agro centro-oeste/i,
    });

    const activeBadge = within(activeCard).getByText('Ativo');
    const inactiveBadge = within(inactiveCard).getByText('Inativo');

    expect(activeBadge.className).toContain('text-primary-strong');
    expect(inactiveBadge.className).toContain('text-amber-600');
  });

  it('opens and closes the create company modal', async () => {
    vi.mocked(customersApi.listCompanies).mockResolvedValue([]);
    const user = setupUser();
    renderAppRoutes();

    await user.click(screen.getByRole('button', { name: /nova empresa/i }));
    expect(
      screen.getByRole('dialog', { name: /cadastrar nova empresa/i })
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(
      screen.queryByRole('dialog', { name: /cadastrar nova empresa/i })
    ).not.toBeInTheDocument();
  });

  it('loads the real sectors into the segment select and unlocks submit', async () => {
    vi.mocked(customersApi.listCompanies).mockResolvedValue([]);
    const user = setupUser();
    renderAppRoutes();
    await user.click(screen.getByRole('button', { name: /nova empresa/i }));

    expect(
      await screen.findByRole('option', { name: 'Siderurgia' })
    ).toHaveValue('sector-siderurgia');
    expect(screen.getByRole('option', { name: 'Agronegócio' })).toHaveValue(
      'sector-agro'
    );
    expect(
      screen.getByRole('button', { name: /cadastrar empresa/i })
    ).toBeEnabled();
    expect(sectorsApi.listSectors).toHaveBeenCalledTimes(1);
  });

  it('refuses to submit and reports the missing fields when the form is empty', async () => {
    vi.mocked(customersApi.listCompanies).mockResolvedValue([]);
    const user = setupUser();
    renderAppRoutes();
    await openCreateModal(user);

    await user.click(
      screen.getByRole('button', { name: /cadastrar empresa/i })
    );

    expect(
      screen.getByText(COMPANY_MESSAGES.NAME_REQUIRED)
    ).toBeInTheDocument();
    expect(
      screen.getByText(COMPANY_MESSAGES.RESPONSIBLE_EMAIL_INVALID)
    ).toBeInTheDocument();
    expect(companiesApi.createCompany).not.toHaveBeenCalled();
    expect(
      screen.getByRole('dialog', { name: /cadastrar nova empresa/i })
    ).toBeInTheDocument();
  });

  it('creates a new indicator via a real POST and selects it as a chip', async () => {
    vi.mocked(customersApi.listCompanies).mockResolvedValue([]);
    vi.mocked(esgMetricsApi.createEsgMetric).mockResolvedValue({
      id: 'metric-new',
      name: 'Consumo de Energia',
      unit: 'kWh',
    });
    const user = setupUser();
    renderAppRoutes();
    await user.click(screen.getByRole('button', { name: /nova empresa/i }));

    await user.type(
      screen.getByPlaceholderText(/nome do novo indicador/i),
      'Consumo de Energia'
    );
    await user.type(screen.getByPlaceholderText(/unidade/i), 'kWh');
    await user.selectOptions(screen.getByDisplayValue(/pilar/i), 'AMBIENTAL');
    await user.click(screen.getByRole('button', { name: /^criar$/i }));

    await waitFor(() => {
      expect(esgMetricsApi.createEsgMetric).toHaveBeenCalledWith({
        name: 'Consumo de Energia',
        unit: 'kWh',
        pillar: 'AMBIENTAL',
      });
    });

    expect(await screen.findByText('Consumo de Energia')).toBeInTheDocument();
  });

  it('shows an error message when creating an indicator fails', async () => {
    vi.mocked(customersApi.listCompanies).mockResolvedValue([]);
    vi.mocked(esgMetricsApi.createEsgMetric).mockRejectedValue(
      new ApiError(400, 'Não foi possível criar o indicador.')
    );
    const user = setupUser();
    renderAppRoutes();
    await user.click(screen.getByRole('button', { name: /nova empresa/i }));

    await user.type(
      screen.getByPlaceholderText(/nome do novo indicador/i),
      'Teste'
    );
    await user.type(screen.getByPlaceholderText(/unidade/i), 'kg');
    await user.selectOptions(screen.getByDisplayValue(/pilar/i), 'SOCIAL');
    await user.click(screen.getByRole('button', { name: /^criar$/i }));

    expect(
      await screen.findByText(/não foi possível criar o indicador\./i)
    ).toBeInTheDocument();
  });

  it('resets the form when cancelled and reopened', async () => {
    vi.mocked(customersApi.listCompanies).mockResolvedValue([]);
    const user = setupUser();
    renderAppRoutes();
    await user.click(screen.getByRole('button', { name: /nova empresa/i }));

    await user.type(
      screen.getByLabelText(/nome da empresa/i),
      'Empresa Descartada'
    );
    await user.click(screen.getByRole('button', { name: /cancelar/i }));
    await user.click(screen.getByRole('button', { name: /nova empresa/i }));

    expect(screen.getByLabelText(/nome da empresa/i)).toHaveValue('');
  });

  it('registers the company, reloads the listing and closes the modal', async () => {
    vi.mocked(customersApi.listCompanies).mockResolvedValue([]);
    vi.mocked(companiesApi.createCompany).mockResolvedValue({
      id: 'customer-new',
      name: 'Empresa Teste',
    });
    const user = setupUser();
    renderAppRoutes();
    await openCreateModal(user);

    await fillCompanyForm(user);
    vi.mocked(customersApi.listCompanies).mockResolvedValue(COMPANIES);
    await user.click(
      screen.getByRole('button', { name: /cadastrar empresa/i })
    );

    await waitFor(() => {
      expect(
        screen.queryByRole('dialog', { name: /cadastrar nova empresa/i })
      ).not.toBeInTheDocument();
    });
    expect(companiesApi.createCompany).toHaveBeenCalledWith(
      EXPECTED_CREATE_PAYLOAD
    );
    expect(companiesApi.linkCompanyEsgMetrics).not.toHaveBeenCalled();
    expect(
      screen.getByRole('article', { name: /unidade industrial rs/i })
    ).toBeInTheDocument();
  });

  it('links the selected ESG indicators to the company it just created', async () => {
    vi.mocked(customersApi.listCompanies).mockResolvedValue([]);
    vi.mocked(companiesApi.createCompany).mockResolvedValue({
      id: 'customer-new',
      name: 'Empresa Teste',
    });
    vi.mocked(companiesApi.linkCompanyEsgMetrics).mockResolvedValue(undefined);
    const user = setupUser();
    renderAppRoutes();
    await openCreateModal(user);

    await fillCompanyForm(user);
    await user.click(screen.getByPlaceholderText(/buscar ou criar indicador/i));
    await user.click(await screen.findByText('Consumo de Água'));
    await user.click(
      screen.getByRole('button', { name: /cadastrar empresa/i })
    );

    await waitFor(() => {
      expect(companiesApi.linkCompanyEsgMetrics).toHaveBeenCalledWith(
        'customer-new',
        ['metric-agua']
      );
    });
    expect(
      screen.queryByRole('dialog', { name: /cadastrar nova empresa/i })
    ).not.toBeInTheDocument();
  });

  it('keeps the modal open with the backend message when the CNPJ already exists', async () => {
    vi.mocked(customersApi.listCompanies).mockResolvedValue([]);
    vi.mocked(companiesApi.createCompany).mockRejectedValue(
      new ApiError(409, 'Já existe uma empresa cadastrada com este CNPJ.')
    );
    const user = setupUser();
    renderAppRoutes();
    await openCreateModal(user);

    await fillCompanyForm(user);
    await user.click(
      screen.getByRole('button', { name: /cadastrar empresa/i })
    );

    expect(
      await screen.findByText('Já existe uma empresa cadastrada com este CNPJ.')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('dialog', { name: /cadastrar nova empresa/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/nome da empresa/i)).toHaveValue(
      'Empresa Teste'
    );
  });

  it('says the company was created when only the ESG link fails, and still reloads the listing', async () => {
    vi.mocked(customersApi.listCompanies).mockResolvedValue([]);
    vi.mocked(companiesApi.createCompany).mockResolvedValue({
      id: 'customer-new',
      name: 'Empresa Teste',
    });
    vi.mocked(companiesApi.linkCompanyEsgMetrics).mockRejectedValue(
      new ApiError(400, 'Indicador inexistente.')
    );
    const user = setupUser();
    renderAppRoutes();
    await openCreateModal(user);

    await fillCompanyForm(user);
    await user.click(screen.getByPlaceholderText(/buscar ou criar indicador/i));
    await user.click(await screen.findByText('Consumo de Água'));
    vi.mocked(customersApi.listCompanies).mockResolvedValue(COMPANIES);
    await user.click(
      screen.getByRole('button', { name: /cadastrar empresa/i })
    );

    expect(
      await screen.findByText(COMPANY_MESSAGES.CREATED_WITHOUT_ESG_METRICS)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('dialog', { name: /cadastrar nova empresa/i })
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(customersApi.listCompanies).toHaveBeenCalledTimes(2);
    });
  });

  it('selects an existing indicator from the dropdown and removes it via its chip', async () => {
    vi.mocked(customersApi.listCompanies).mockResolvedValue([]);
    const user = setupUser();
    renderAppRoutes();
    await user.click(screen.getByRole('button', { name: /nova empresa/i }));

    await user.click(screen.getByPlaceholderText(/buscar ou criar indicador/i));
    await user.click(await screen.findByText('Consumo de Água'));

    expect(screen.getByText('Consumo de Água')).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: /remover consumo de água/i })
    );

    expect(screen.queryByText('Consumo de Água')).not.toBeInTheDocument();
  });

  it('shows a message once every indicator has been selected', async () => {
    vi.mocked(customersApi.listCompanies).mockResolvedValue([]);
    const user = setupUser();
    renderAppRoutes();
    await user.click(screen.getByRole('button', { name: /nova empresa/i }));

    const search = screen.getByPlaceholderText(/buscar ou criar indicador/i);
    for (const name of [
      'Consumo de Água',
      'Geração de Resíduos',
      'Emissão de CO₂',
    ]) {
      await user.click(search);
      await user.click(await screen.findByText(name));
    }

    await user.click(search);
    expect(
      await screen.findByText(/todos os indicadores já foram selecionados/i)
    ).toBeInTheDocument();
  });
});

describe('getComplianceTone', () => {
  it.each([
    { compliance: 100, expected: '!text-primary-strong' },
    { compliance: 90, expected: '!text-primary-strong' },
    { compliance: 89, expected: '!text-amber-500' },
    { compliance: 70, expected: '!text-amber-500' },
    { compliance: 69, expected: '!text-red-500' },
    { compliance: 0, expected: '!text-red-500' },
  ])('returns $expected for $compliance%', ({ compliance, expected }) => {
    expect(getComplianceTone(compliance)).toBe(expected);
  });
});

describe('getCompanyCountLabel', () => {
  it.each([
    { total: 0, expected: '0 empresas' },
    { total: 1, expected: '1 empresa' },
    { total: 2, expected: '2 empresas' },
    { total: 7, expected: '7 empresas' },
  ])('returns $expected for a total of $total', ({ total, expected }) => {
    expect(getCompanyCountLabel(total)).toBe(expected);
  });
});

describe('getStatusLabel', () => {
  it('returns "Ativo" for an active company', () => {
    expect(getStatusLabel('active')).toBe('Ativo');
  });

  it('returns "Inativo" for an inactive company', () => {
    expect(getStatusLabel('inactive')).toBe('Inativo');
  });
});
