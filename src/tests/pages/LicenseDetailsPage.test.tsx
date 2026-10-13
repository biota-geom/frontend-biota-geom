import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { LicenseDetails } from '../../features/licenses/types';
import { LicenseDetailsPage } from '../../pages/company/LicenseDetails/LicenseDetailsPage';
import { ApiError } from '../../services/api/apiError';

vi.mock('../../services/api/licensesApi', () => ({
  getLicenseDetails: vi.fn(),
}));
vi.mock('../../services/api/companiesApi', () => ({
  listCompanyEsgMetrics: vi.fn(),
}));
vi.mock('../../services/api/licenseConditionsApi', () => ({
  createLicenseConditions: vi.fn(),
  saveConditionsFulfillment: vi.fn(),
}));

const licensesApi = await import('../../services/api/licensesApi');
const companiesApi = await import('../../services/api/companiesApi');
const licenseConditionsApi =
  await import('../../services/api/licenseConditionsApi');

const DETAILS: LicenseDetails = {
  id: 'license-1',
  processNumber: 'LP nº 482/2024',
  issueDate: '2024-03-12T00:00:00.000Z',
  expirationDate: '2026-03-12T00:00:00.000Z',
  status: 'Regular',
  conditions: [
    {
      id: 'condition-group-1',
      itemNumber: '1',
      description: 'Monitoramento de Estacionamento e Serviços',
      conditionType: 'Informativo',
      periodicity: 'NA',
      deadline: null,
      status: 'Em andamento',
      completionDate: null,
      responsibleName: '',
      isViolated: false,
    },
    {
      id: 'condition-1-1',
      itemNumber: '1.1',
      description: 'Manter registros de estacionamento da frota.',
      conditionType: 'Informativo',
      periodicity: 'NA',
      deadline: null,
      status: 'Atendida',
      completionDate: '2024-03-12T00:00:00.000Z',
      responsibleName: 'Lucas Silva',
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
    await screen.findByRole('combobox', {
      name: 'Categoria da condicionante 1',
    })
  );
  await user.click(await screen.findByRole('option', { name: 'Água' }));
  await user.type(screen.getByLabelText('Nº do item da condicionante 1'), '2');
  await user.type(
    screen.getByLabelText('Descrição da condicionante 1'),
    'Monitoramento hidroquímico'
  );
  await user.click(
    screen.getByRole('combobox', { name: 'Tipo da condicionante 1' })
  );
  await user.click(await screen.findByRole('option', { name: 'Periódico' }));
  await user.click(
    screen.getByRole('combobox', { name: 'Periodicidade da condicionante 1' })
  );
  await user.click(await screen.findByRole('option', { name: 'Anual' }));
  await user.type(
    screen.getByLabelText('Prazo da condicionante 1'),
    '2026-10-30'
  );
  await user.type(
    screen.getByLabelText('Responsável pela condicionante 1'),
    'Lucas Silva'
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
    vi.mocked(companiesApi.listCompanyEsgMetrics).mockResolvedValue([
      { id: 'metric-water', name: 'Água', unit: 'm³' },
    ]);
  });

  it('loads and displays license conditions with local filtering and group rows', async () => {
    renderDetailsPage();

    expect(await screen.findByText('1 de 2 atendidas')).toBeInTheDocument();
    expect(licensesApi.getLicenseDetails).toHaveBeenCalledWith(
      'customer-1',
      'license-1'
    );
    expect(screen.getByText('Grupo de Condicionante')).toBeInTheDocument();
    expect(screen.getByText('Atendida')).toBeInTheDocument();
    expect(
      within(screen.getByRole('row', { name: /1\.1/ })).getAllByRole('cell')
    ).toHaveLength(10);

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
          ...DETAILS.conditions[0],
          itemNumber: null,
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
            esgMetricId: 'metric-water',
            itemNumber: '2',
            description: 'Monitoramento hidroquímico',
            conditionType: 'PERIODIC',
            periodicity: 'ANNUAL',
            deadline: '2026-10-30T00:00:00.000Z',
            responsibleName: 'Lucas Silva',
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
      new ApiError(422, 'Categoria não vinculada à empresa.')
    );
    renderDetailsPage();

    const dialog = await openAddConditionsModal(user);
    await fillConditionRow(user);
    await user.click(
      within(dialog).getByRole('button', { name: 'Salvar Condicionantes' })
    );

    expect(
      await within(dialog).findByText('Categoria não vinculada à empresa.')
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

  describe('Registrar Cumprimento modal', () => {
    async function openFulfillmentModal(
      user: ReturnType<typeof userEvent.setup>
    ) {
      await user.click(
        await screen.findByRole('button', { name: 'Registrar Cumprimento' })
      );
      return screen.findByRole('dialog', {
        name: 'Registrar cumprimento das condicionantes',
      });
    }

    it('opens the fulfillment modal when clicking the button', async () => {
      const user = userEvent.setup();
      renderDetailsPage();

      const dialog = await openFulfillmentModal(user);
      expect(dialog).toBeInTheDocument();
      expect(
        within(dialog).getByText('Registrar Cumprimento das Condicionantes')
      ).toBeInTheDocument();
    });

    it('Salvar button is disabled until all conditions are answered', async () => {
      const user = userEvent.setup();
      renderDetailsPage();

      const dialog = await openFulfillmentModal(user);
      const saveBtn = within(dialog).getByRole('button', { name: 'Salvar' });
      expect(saveBtn).toBeDisabled();

      // Answer only the first condition
      const groups = within(dialog).getAllByRole('group');
      await user.click(
        within(groups[0]).getByRole('button', { name: 'Cumprida' })
      );
      expect(saveBtn).toBeDisabled();

      // Answer the second condition
      await user.click(
        within(groups[1]).getByRole('button', { name: 'Não cumprida' })
      );
      expect(saveBtn).not.toBeDisabled();
    });

    it('calls saveConditionsFulfillment with the correct payload and shows toast', async () => {
      const user = userEvent.setup();
      vi.mocked(
        licenseConditionsApi.saveConditionsFulfillment
      ).mockResolvedValue(undefined);
      renderDetailsPage();

      const dialog = await openFulfillmentModal(user);
      const groups = within(dialog).getAllByRole('group');

      await user.click(
        within(groups[0]).getByRole('button', { name: 'Cumprida' })
      );
      await user.click(
        within(groups[1]).getByRole('button', { name: 'Não cumprida' })
      );

      await user.click(within(dialog).getByRole('button', { name: 'Salvar' }));

      await waitFor(() =>
        expect(
          licenseConditionsApi.saveConditionsFulfillment
        ).toHaveBeenCalledWith('customer-1', 'license-1', [
          { conditionId: 'condition-group-1', fulfilled: true },
          { conditionId: 'condition-1-1', fulfilled: false },
        ])
      );

      expect(
        await screen.findByText(
          'Cumprimento das condicionantes registrado com sucesso.'
        )
      ).toBeInTheDocument();

      // Modal should be closed
      expect(
        screen.queryByRole('dialog', {
          name: 'Registrar cumprimento das condicionantes',
        })
      ).not.toBeInTheDocument();

      // Page should have refetched
      expect(licensesApi.getLicenseDetails).toHaveBeenCalledTimes(2);
    });

    it('closes the modal without saving when Cancel is clicked', async () => {
      const user = userEvent.setup();
      renderDetailsPage();

      const dialog = await openFulfillmentModal(user);
      await user.click(
        within(dialog).getByRole('button', { name: 'Cancelar' })
      );

      expect(
        screen.queryByRole('dialog', {
          name: 'Registrar cumprimento das condicionantes',
        })
      ).not.toBeInTheDocument();
      expect(
        licenseConditionsApi.saveConditionsFulfillment
      ).not.toHaveBeenCalled();
    });
  });
});
