import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { LicenseDetails } from '../../features/licenses/types';
import { LicenseDetailsPage } from '../../pages/company/LicenseDetails/LicenseDetailsPage';
import { ApiError } from '../../services/api/apiError';

vi.mock('../../services/api/licensesApi', () => ({
  getLicenseDetails: vi.fn(),
  renewLicense: vi.fn(),
}));
vi.mock('../../services/api/licenseConditionsApi', () => ({
  createLicenseConditions: vi.fn(),
}));

const licensesApi = await import('../../services/api/licensesApi');
const licenseConditionsApi =
  await import('../../services/api/licenseConditionsApi');

const DETAILS: LicenseDetails = {
  id: 'license-1',
  processNumber: 'LP nº 482/2024',
  type: 'Licença Prévia (LP)',
  issuingAgency: 'FEPAM',
  issueDate: '2024-03-12T00:00:00.000Z',
  expirationDate: '2026-03-12T00:00:00.000Z',
  status: 'Regular',
  conditions: [
    {
      id: null,
      itemNumber: '1',
      isEnvironmentalDescriptor: true,
      environmentalDescriptor: 'Monitoramento de Estacionamento e Serviços',
      name: null,
      description: null,
      conditionType: null,
      periodicity: 'NA',
      deadline: null,
      status: null,
      completionDate: null,
      responsibleName: null,
      hasDelivery: null,
      isViolated: false,
    },
    {
      id: 'condition-1-1',
      itemNumber: '1.1',
      isEnvironmentalDescriptor: false,
      environmentalDescriptor: 'Monitoramento de Estacionamento e Serviços',
      name: 'Controle da frota',
      description: 'Manter registros de estacionamento da frota.',
      conditionType: 'Informativo',
      periodicity: 'NA',
      deadline: null,
      status: 'Atendida',
      completionDate: '2024-03-12T00:00:00.000Z',
      responsibleName: 'Lucas Silva',
      hasDelivery: true,
      isViolated: false,
    },
  ],
};

function renderDetailsPage() {
  return render(
    <MemoryRouter initialEntries={['/companies/customer-1/licenses/license-1']}>
      <Routes>
        <Route
          element={<LicenseDetailsPage />}
          path="/companies/:companyId/licenses/:licenseId"
        />
      </Routes>
    </MemoryRouter>
  );
}

function LicenseDetailsPageWithLocation() {
  const location = useLocation();

  return (
    <>
      <LicenseDetailsPage />
      <span data-testid="current-path">{location.pathname}</span>
    </>
  );
}

async function openAddConditionsModal(
  user: ReturnType<typeof userEvent.setup>
) {
  await user.click(
    await screen.findByRole('button', { name: 'Adicionar Condicionante' })
  );
  return screen.findByRole('dialog', { name: 'Adicionar Condicionantes' });
}

async function fillConditionRow(user: ReturnType<typeof userEvent.setup>) {
  await user.click(
    screen.getByRole('button', { name: 'Adicionar Descritor Ambiental' })
  );
  const descriptorDialog = screen.getByRole('dialog', {
    name: 'Novo Descritor Ambiental',
  });
  await user.type(
    within(descriptorDialog).getByLabelText('Descritor ambiental'),
    'Água'
  );
  await user.click(
    within(descriptorDialog).getByRole('button', {
      name: 'Adicionar Descritor',
    })
  );
  await user.click(
    screen.getByRole('button', { name: 'Adicionar condicionante em Água' })
  );
  const conditionDialog = screen.getByRole('dialog', {
    name: 'Nova Condicionante',
  });
  await user.type(
    within(conditionDialog).getByLabelText('Descrição'),
    'Monitoramento hidroquímico'
  );
  await user.click(
    within(conditionDialog).getByRole('combobox', { name: 'Tipo' })
  );
  await user.click(await screen.findByRole('option', { name: 'Periódico' }));
  await user.click(
    within(conditionDialog).getByRole('combobox', { name: 'Periodicidade' })
  );
  await user.click(await screen.findByRole('option', { name: 'Anual' }));
  await user.type(
    within(conditionDialog).getByLabelText('Prazo'),
    '2026-10-30'
  );
  await user.type(
    within(conditionDialog).getByLabelText('Responsável'),
    'Lucas Silva'
  );
  await user.click(
    within(conditionDialog).getByRole('button', {
      name: 'Adicionar Condicionante',
    })
  );
}

/*
 * Filling a full conditions row drives several Radix selects through
 * userEvent: ~2s alone, but 9-10s when the whole suite runs in parallel,
 * right at the global 10s testTimeout. Those flows pass 20_000 instead.
 */
describe('LicenseDetailsPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(licensesApi.getLicenseDetails).mockResolvedValue(DETAILS);
    vi.mocked(licensesApi.renewLicense).mockResolvedValue({
      id: 'license-2',
      previousLicenseId: 'license-1',
      status: 'Regular',
    });
  });

  it('loads and displays license conditions with descriptor rows', async () => {
    renderDetailsPage();

    expect(await screen.findByText('1 de 1 atendidas')).toBeInTheDocument();
    expect(licensesApi.getLicenseDetails).toHaveBeenCalledWith(
      'customer-1',
      'license-1'
    );
    expect(
      screen.getByRole('columnheader', { name: 'Descritor ambiental' })
    ).toBeInTheDocument();
    expect(screen.getByText('Atendida')).toBeInTheDocument();
    expect(
      within(screen.getByRole('row', { name: /1\.1/ })).getAllByRole('cell')
    ).toHaveLength(11);

    fireEvent.change(
      screen.getByRole('searchbox', {
        name: 'Filtrar condicionantes por termo',
      }),
      { target: { value: 'frota' } }
    );

    expect(
      screen.getByText('Manter registros de estacionamento da frota.')
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Monitoramento de Estacionamento e Serviços')
    ).not.toBeInTheDocument();

    const table = screen.getByRole('table');
    expect(
      within(table).getByRole('columnheader', { name: 'Alerta' })
    ).toBeInTheDocument();
    expect(
      within(table).getByRole('columnheader', { name: 'Dia Limite' })
    ).toBeInTheDocument();
  });

  it('translates raw backend enums and safely displays nullable fields', async () => {
    vi.mocked(licensesApi.getLicenseDetails).mockResolvedValue({
      ...DETAILS,
      status: 'REGULAR',
      conditions: [
        {
          ...DETAILS.conditions[1],
          itemNumber: '1.1',
          description: null,
          conditionType: 'PERIODIC',
          periodicity: 'MONTHLY',
          status: 'FULFILLED',
          responsibleName: null,
        },
      ],
    });

    renderDetailsPage();

    expect(await screen.findByText('Regular')).toBeInTheDocument();
    expect(screen.getByText('Periódico')).toBeInTheDocument();
    expect(screen.getByText('Mensal')).toBeInTheDocument();
    expect(screen.getByText('Atendida')).toBeInTheDocument();
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
    expect(screen.getByText('1 de 1 atendidas')).toBeInTheDocument();
  });

  it('adds conditions to the license and reloads the details', async () => {
    const user = userEvent.setup();
    vi.mocked(licenseConditionsApi.createLicenseConditions).mockResolvedValue(
      undefined
    );
    renderDetailsPage();

    const dialog = await openAddConditionsModal(user);
    const saveButton = within(dialog).getByRole('button', {
      name: 'Salvar Condicionantes',
    });
    expect(saveButton).toBeDisabled();

    await fillConditionRow(user);
    await user.click(saveButton);

    await waitFor(() =>
      expect(licenseConditionsApi.createLicenseConditions).toHaveBeenCalledWith(
        'customer-1',
        'license-1',
        [
          {
            environmentalDescriptor: 'Água',
            description: 'Monitoramento hidroquímico',
            conditionType: 'PERIODIC',
            periodicity: 'ANNUAL',
            deadline: '2026-10-30T00:00:00.000Z',
            responsibleName: 'Lucas Silva',
            hasDelivery: true,
          },
        ]
      )
    );
    expect(
      await screen.findByText('Condicionante cadastrada com sucesso.')
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('dialog', { name: 'Adicionar Condicionantes' })
    ).not.toBeInTheDocument();
    expect(licensesApi.getLicenseDetails).toHaveBeenCalledTimes(2);
  }, 20_000);

  it('keeps the modal open with the API error when saving fails', async () => {
    const user = userEvent.setup();
    vi.mocked(licenseConditionsApi.createLicenseConditions).mockRejectedValue(
      new ApiError(422, 'Não foi possível salvar a condicionante.')
    );
    renderDetailsPage();

    const dialog = await openAddConditionsModal(user);
    await fillConditionRow(user);
    await user.click(
      within(dialog).getByRole('button', { name: 'Salvar Condicionantes' })
    );

    expect(
      await within(dialog).findByText(
        'Não foi possível salvar a condicionante.'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole('dialog', { name: 'Adicionar Condicionantes' })
    ).toBeInTheDocument();
    expect(licensesApi.getLicenseDetails).toHaveBeenCalledTimes(1);
  }, 20_000);

  it('hides the add action when the license fails to load', async () => {
    vi.mocked(licensesApi.getLicenseDetails).mockRejectedValue(
      new ApiError(404, 'Licença não encontrada.')
    );
    renderDetailsPage();

    expect(
      await screen.findByText('Licença não encontrada.')
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Adicionar Condicionante' })
    ).not.toBeInTheDocument();
  });

  it('renews the license and redirects to the new license details page', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter
        initialEntries={['/companies/customer-1/licenses/license-1']}
      >
        <Routes>
          <Route
            element={<LicenseDetailsPageWithLocation />}
            path="/companies/:companyId/licenses/:licenseId"
          />
        </Routes>
      </MemoryRouter>
    );

    await user.click(
      await screen.findByRole('button', { name: 'Renovar licença' })
    );
    const dialog = await screen.findByRole('dialog', {
      name: 'Renovar Licença',
    });

    expect(
      within(dialog).getByDisplayValue('Licença Prévia (LP)')
    ).toBeInTheDocument();
    expect(within(dialog).getByDisplayValue('FEPAM')).toBeInTheDocument();

    await user.type(
      within(dialog).getByLabelText('Novo número da licença'),
      'LO nº 119/2026'
    );
    await user.type(
      within(dialog).getByLabelText('Data de Emissão'),
      '2026-01-10'
    );
    await user.type(
      within(dialog).getByLabelText('Data de Validade'),
      '2030-01-10'
    );
    await user.upload(
      within(dialog).getByLabelText('PDF da nova licença'),
      new File(['%PDF-1.4'], 'renovada.pdf', { type: 'application/pdf' })
    );
    await user.click(
      within(dialog).getByRole('button', { name: 'Renovar Licença' })
    );

    await waitFor(() =>
      expect(licensesApi.renewLicense).toHaveBeenCalledWith(
        'license-1',
        expect.objectContaining({
          processNumber: 'LO nº 119/2026',
          issueDate: '2026-01-10',
          expirationDate: '2030-01-10',
        })
      )
    );
    await waitFor(() =>
      expect(screen.getByTestId('current-path')).toHaveTextContent(
        '/companies/customer-1/licenses/license-2'
      )
    );
  });

  it('hides mutation actions for an archived license', async () => {
    vi.mocked(licensesApi.getLicenseDetails).mockResolvedValue({
      ...DETAILS,
      status: 'Renovada/Arquivada',
    });

    renderDetailsPage();

    expect(await screen.findByText('Renovada/Arquivada')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Renovar licença' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Adicionar Condicionante' })
    ).not.toBeInTheDocument();
  });
});
