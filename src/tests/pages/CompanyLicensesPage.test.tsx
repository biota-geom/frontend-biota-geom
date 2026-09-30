import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../../app/router/AppRouter';
import { buildCompanyRoutes } from '../../app/router/routes';
import type { CompanyListItem } from '../../features/companies/types';
import { useCompanyContext } from '../../features/companies/useCompanyContext';
import { ApiError } from '../../services/api/apiError';
import { MOCK_AUTH_USER, renderWithAuth } from '../mocks/renderWithAuth';

vi.mock('../../services/api/issuingAgenciesApi', () => ({
  listIssuingAgencies: vi.fn(),
}));
vi.mock('../../services/api/licensesApi', () => ({
  createLicense: vi.fn(),
  listLicenses: vi.fn(),
}));
/*
 * CompanyLayout loads the company in context and swaps the routed page for
 * <CompanyNotFound /> when that request fails, so without these the page
 * under test unmounts mid-interaction.
 */
vi.mock('../../services/api/companiesApi', () => ({
  getCompanyById: vi.fn(),
  createCompany: vi.fn(),
  linkCompanyEsgMetrics: vi.fn(),
}));
vi.mock('../../services/api/customersApi', () => ({
  listCompanies: vi.fn(),
}));

const issuingAgenciesApi =
  await import('../../services/api/issuingAgenciesApi');
const licensesApi = await import('../../services/api/licensesApi');
const companiesApi = await import('../../services/api/companiesApi');
const customersApi = await import('../../services/api/customersApi');

const COMPANY_ID = 'customer-1';

const COMPANY_IN_CONTEXT: CompanyListItem = {
  id: COMPANY_ID,
  name: 'Unidade Industrial Ouro Preto',
  status: 'active',
  segment: 'Mineração',
  location: 'Ouro Preto - MG',
  conformityPercentage: null,
  totalLicenses: 1,
  updatedAt: '2026-09-01T12:00:00.000Z',
};

const LICENSES_PANEL = {
  summary: { total: 3, regular: 1, attention: 1, expired: 1 },
  licenses: [
    {
      id: 'license-1',
      type: 'Licença Prévia (LP)',
      processNumber: 'LP nº 482/2024',
      issuingAgency: 'FEPAM',
      issueDate: '2024-03-12T00:00:00.000Z',
      expirationDate: '2026-03-12T00:00:00.000Z',
      status: 'Regular',
      documentUrl: 'https://bucket.aws.com/licenses/lp-482-2024.pdf',
    },
    {
      id: 'license-2',
      type: 'Outorga de Captação de Água',
      processNumber: 'OUT nº 085/2021',
      issuingAgency: 'SIOUT',
      issueDate: '2021-08-22T00:00:00.000Z',
      expirationDate: '2026-08-22T00:00:00.000Z',
      status: 'Atenção',
      documentUrl: null,
    },
    {
      id: 'license-3',
      type: 'Licença de Operação (LO)',
      processNumber: 'LO nº 118/2020',
      issuingAgency: 'FEPAM',
      issueDate: '2020-01-10T00:00:00.000Z',
      expirationDate: '2025-01-10T00:00:00.000Z',
      status: 'Vencida',
      documentUrl: 'https://bucket.aws.com/licenses/lo-118-2020.pdf',
    },
  ],
};

function renderLicensesPage() {
  return renderWithAuth(<AppRoutes />, {
    status: 'authenticated',
    user: MOCK_AUTH_USER,
    initialRoute: buildCompanyRoutes.licenses(COMPANY_ID),
  });
}

function pdfFile(name = 'licenca.pdf') {
  return new File(['%PDF-1.4'], name, { type: 'application/pdf' });
}

async function openModalAndFillRequiredFields(
  user: ReturnType<typeof userEvent.setup>
) {
  await user.click(screen.getByRole('button', { name: /nova licença/i }));

  await user.click(screen.getByRole('combobox', { name: /tipo de licença/i }));
  await user.click(
    await screen.findByRole('option', { name: /licença de operação/i })
  );

  await user.type(screen.getByLabelText(/nº do processo/i), 'LO nº 118/2020');

  await user.click(screen.getByRole('combobox', { name: /órgão emissor/i }));
  await user.click(await screen.findByRole('option', { name: 'FEPAM' }));

  await user.type(screen.getByLabelText(/data de emissão/i), '2020-01-10');
  await user.type(screen.getByLabelText(/data de validade/i), '2025-01-10');

  await user.upload(screen.getByLabelText(/upload de arquivo/i), pdfFile());
}

describe('CompanyLicensesPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    useCompanyContext.getState().clearCompany();
    vi.mocked(companiesApi.getCompanyById).mockResolvedValue(
      COMPANY_IN_CONTEXT
    );
    vi.mocked(customersApi.listCompanies).mockResolvedValue([
      COMPANY_IN_CONTEXT,
    ]);
    vi.mocked(issuingAgenciesApi.listIssuingAgencies).mockResolvedValue([
      { id: 'agency-1', name: 'FEPAM', acronym: 'FEPAM' },
    ]);
    vi.mocked(licensesApi.listLicenses).mockResolvedValue(LICENSES_PANEL);
  });

  it('opens the "Nova Licença" modal and loads the issuing agencies', async () => {
    const user = userEvent.setup();
    renderLicensesPage();

    await user.click(screen.getByRole('button', { name: /nova licença/i }));

    expect(
      screen.getByRole('heading', { name: /^nova licença$/i })
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(issuingAgenciesApi.listIssuingAgencies).toHaveBeenCalledTimes(1)
    );
  });

  it('rejects a non-PDF file before it ever reaches the API', async () => {
    const user = userEvent.setup();
    renderLicensesPage();

    await user.click(screen.getByRole('button', { name: /nova licença/i }));
    const jpgFile = new File(['fake'], 'licenca.jpg', { type: 'image/jpeg' });
    /*
     * Not user.upload(): it enforces the input's `accept` filter and simply
     * drops a non-matching file with no change event at all — which would
     * make this test pass for the wrong reason (nothing happened) instead of
     * exercising the component's own rejection message.
     */
    fireEvent.change(screen.getByLabelText(/upload de arquivo/i), {
      target: { files: [jpgFile] },
    });

    expect(
      screen.getByText('O arquivo deve estar no formato PDF.')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /salvar licença/i })
    ).toBeDisabled();
  });

  it('submits the form and shows a success message with the computed status', async () => {
    const user = userEvent.setup();
    vi.mocked(licensesApi.createLicense).mockResolvedValue({
      id: 'license-1',
      customerId: COMPANY_ID,
      type: 'LO',
      processNumber: 'LO nº 118/2020',
      issuingAgencyId: 'agency-1',
      issuingAgencyName: 'FEPAM',
      issueDate: '2020-01-10T00:00:00.000Z',
      expirationDate: '2025-01-10T00:00:00.000Z',
      status: 'Vencida',
      documentUrl: 'https://bucket.aws.com/licenses/lo-118-2020.pdf',
      createdAt: '2020-01-10T00:00:00.000Z',
    });

    renderLicensesPage();
    await openModalAndFillRequiredFields(user);

    const submitButton = screen.getByRole('button', {
      name: /salvar licença/i,
    });
    expect(submitButton).toBeEnabled();
    await user.click(submitButton);

    await waitFor(() => {
      expect(licensesApi.createLicense).toHaveBeenCalledWith(COMPANY_ID, {
        type: 'LO',
        processNumber: 'LO nº 118/2020',
        issuingAgencyId: 'agency-1',
        issueDate: '2020-01-10',
        expirationDate: '2025-01-10',
        documentFile: expect.any(File),
      });
    });

    expect(
      await screen.findByText(/cadastrada com status\s*Vencida/i)
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: /^nova licença$/i })
    ).not.toBeInTheDocument();
  });

  it('shows the server error message and keeps the modal open when creation fails', async () => {
    const user = userEvent.setup();
    vi.mocked(licensesApi.createLicense).mockRejectedValue(
      new ApiError(422, 'Órgão emissor inexistente.')
    );

    renderLicensesPage();
    await openModalAndFillRequiredFields(user);
    await user.click(screen.getByRole('button', { name: /salvar licença/i }));

    expect(
      await screen.findByText('Órgão emissor inexistente.')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /^nova licença$/i })
    ).toBeInTheDocument();
  });

  it('renders the summary cards from the API, with the total equal to the sum of the other three', async () => {
    renderLicensesPage();

    const summaryRegion = await screen.findByRole('region', {
      name: /resumo das licenças/i,
    });

    const totalCard = within(summaryRegion)
      .getByText('Total de Licenças')
      .closest('article');
    const regularCard = within(summaryRegion)
      .getByText('Regulares')
      .closest('article');
    const attentionCard = within(summaryRegion)
      .getByText('Atenção')
      .closest('article');
    const expiredCard = within(summaryRegion)
      .getByText('Vencidas')
      .closest('article');

    expect(totalCard).toHaveTextContent('3');
    expect(regularCard).toHaveTextContent('1');
    expect(attentionCard).toHaveTextContent('1');
    expect(expiredCard).toHaveTextContent('1');
  });

  it('fetches the licenses of the company in the current route', async () => {
    renderLicensesPage();

    await waitFor(() =>
      expect(licensesApi.listLicenses).toHaveBeenCalledWith(COMPANY_ID)
    );
  });

  it('filters the table in real time when searching by process number', async () => {
    const user = userEvent.setup();
    renderLicensesPage();

    expect(await screen.findByText('LP nº 482/2024')).toBeInTheDocument();
    expect(screen.getByText('LO nº 118/2020')).toBeInTheDocument();
    expect(screen.getByText('OUT nº 085/2021')).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText(/buscar licença/i), '118/2020');

    expect(screen.getByText('LO nº 118/2020')).toBeInTheDocument();
    expect(screen.queryByText('LP nº 482/2024')).not.toBeInTheDocument();
    expect(screen.queryByText('OUT nº 085/2021')).not.toBeInTheDocument();
  });

  it('renders a status badge for each license using the value returned by the backend', async () => {
    renderLicensesPage();

    expect(await screen.findByText('LP nº 482/2024')).toBeInTheDocument();
    const row = screen.getByText('LP nº 482/2024').closest('tr');

    expect(row).not.toBeNull();
    expect(row).toHaveTextContent('Regular');
  });

  it('renders skeleton rows while the licenses are loading', async () => {
    // Delay the API response so the loading state is visible during the test.
    vi.mocked(licensesApi.listLicenses).mockImplementation(
      () => new Promise(() => {})
    );

    renderLicensesPage();

    // The skeleton uses animate-pulse spans — at least one must be present.
    await waitFor(() =>
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
    );
  });

  it('shows an empty state with a "+ Nova Licença" shortcut when there are no licenses', async () => {
    vi.mocked(licensesApi.listLicenses).mockResolvedValue({
      summary: { total: 0, regular: 0, attention: 0, expired: 0 },
      licenses: [],
    });

    renderLicensesPage();

    expect(
      await screen.findByText(/nenhuma licença cadastrada/i)
    ).toBeInTheDocument();
    // The empty state includes a shortcut button to open the modal.
    expect(
      screen.getAllByRole('button', { name: /\+\s*nova licença/i })
    ).not.toHaveLength(0);
  });

  it('renders an "Abrir PDF" link that points to the document_url in a new tab', async () => {
    renderLicensesPage();

    // Two licenses in LICENSES_PANEL have a documentUrl; pick the first one.
    const pdfLinks = await screen.findAllByRole('link', { name: /abrir pdf/i });
    const firstLink = pdfLinks[0]!;
    expect(firstLink).toHaveAttribute(
      'href',
      'https://bucket.aws.com/licenses/lp-482-2024.pdf'
    );
    expect(firstLink).toHaveAttribute('target', '_blank');
    expect(firstLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('does not render an "Abrir PDF" link when document_url is null', async () => {
    renderLicensesPage();

    await screen.findByText('LP nº 482/2024');
    // license-2 (OUT nº 085/2021) has documentUrl: null — it renders
    // "Sem PDF" text instead of a link.
    const row = screen.getByText('OUT nº 085/2021').closest('tr')!;
    expect(within(row).getByText(/sem pdf/i)).toBeInTheDocument();
    expect(within(row).queryByRole('link', { name: /abrir pdf/i })).toBeNull();
  });
});
