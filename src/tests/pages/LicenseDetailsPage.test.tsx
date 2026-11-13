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
import { MOCK_LICENSE_LEGISLATIONS } from '../../features/legislation/legislations.mock';
import { ApiError } from '../../services/api/apiError';

vi.mock('../../services/api/licensesApi', () => ({
  getLicenseDetails: vi.fn(),
  getLicenseHistory: vi.fn(),
  renewLicense: vi.fn(),
}));
vi.mock('../../services/api/legislationsApi', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('../../services/api/legislationsApi')
  >()),
  getLicenseLegislations: vi.fn(),
  updateLicenseLegislation: vi.fn(),
}));
vi.mock('../../services/api/licenseConditionsApi', () => ({
  createLicenseConditions: vi.fn(),
  deleteLicenseCondition: vi.fn(),
  updateLicenseConditionDescriptor: vi.fn(),
}));

const licensesApi = await import('../../services/api/licensesApi');
const licenseConditionsApi =
  await import('../../services/api/licenseConditionsApi');
const legislationsApi = await import('../../services/api/legislationsApi');

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
    await screen.findByRole('button', { name: 'Editar Condicionante' })
  );
  return screen.findByRole('dialog', { name: 'Editar Condicionantes' });
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
    within(conditionDialog).getByLabelText(/^Descrição/),
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
    vi.mocked(licensesApi.getLicenseHistory).mockResolvedValue([]);
    vi.mocked(legislationsApi.getLicenseLegislations).mockResolvedValue([]);
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
      name: 'Adicionar novas condicionantes',
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
      screen.queryByRole('dialog', { name: 'Editar Condicionantes' })
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
      within(dialog).getByRole('button', {
        name: 'Adicionar novas condicionantes',
      })
    );

    expect(
      await within(dialog).findByText(
        'Não foi possível salvar a condicionante.'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole('dialog', { name: 'Editar Condicionantes' })
    ).toBeInTheDocument();
    expect(licensesApi.getLicenseDetails).toHaveBeenCalledTimes(1);
  }, 20_000);

  it('lists and deletes an existing condition without closing the editor', async () => {
    const user = userEvent.setup();
    vi.mocked(licenseConditionsApi.deleteLicenseCondition).mockResolvedValue(
      undefined
    );
    renderDetailsPage();

    const dialog = await openAddConditionsModal(user);
    expect(
      within(dialog).getByText('Manter registros de estacionamento da frota.')
    ).toBeInTheDocument();

    await user.click(
      within(dialog).getByRole('button', {
        name: 'Excluir condicionante 1.1',
      })
    );

    await waitFor(() =>
      expect(licenseConditionsApi.deleteLicenseCondition).toHaveBeenCalledWith(
        'customer-1',
        'license-1',
        'condition-1-1'
      )
    );
    expect(
      within(dialog).queryByText('Manter registros de estacionamento da frota.')
    ).not.toBeInTheDocument();
    expect(
      await screen.findByText(/excluída com sucesso/i)
    ).toBeInTheDocument();
    expect(dialog).toBeInTheDocument();
    expect(licensesApi.getLicenseDetails).toHaveBeenCalledTimes(2);
  });

  it('edits an existing descriptor in every condition from its group', async () => {
    const user = userEvent.setup();
    vi.mocked(licensesApi.getLicenseDetails).mockResolvedValue({
      ...DETAILS,
      conditions: [
        ...DETAILS.conditions,
        {
          ...DETAILS.conditions[1],
          id: 'condition-1-2',
          itemNumber: '1.2',
          description: 'Revisar os registros da frota.',
        },
      ],
    });
    vi.mocked(
      licenseConditionsApi.updateLicenseConditionDescriptor
    ).mockResolvedValue(undefined);
    renderDetailsPage();

    await openAddConditionsModal(user);
    await user.click(
      screen.getByRole('button', {
        name: /editar descritor ambiental monitoramento de estacionamento/i,
      })
    );
    const descriptorDialog = await screen.findByRole('dialog', {
      name: 'Editar Descritor Ambiental',
    });
    const descriptorInput = within(descriptorDialog).getByLabelText(
      'Descritor ambiental'
    );
    await user.clear(descriptorInput);
    await user.type(descriptorInput, 'Gestão da frota');
    await user.click(
      within(descriptorDialog).getByRole('button', {
        name: 'Salvar descritor',
      })
    );

    await waitFor(() =>
      expect(
        licenseConditionsApi.updateLicenseConditionDescriptor
      ).toHaveBeenCalledTimes(2)
    );
    expect(
      licenseConditionsApi.updateLicenseConditionDescriptor
    ).toHaveBeenNthCalledWith(
      1,
      'customer-1',
      'license-1',
      'condition-1-1',
      'Gestão da frota'
    );
    expect(
      licenseConditionsApi.updateLicenseConditionDescriptor
    ).toHaveBeenNthCalledWith(
      2,
      'customer-1',
      'license-1',
      'condition-1-2',
      'Gestão da frota'
    );
    expect(
      await screen.findByText(
        'Descritor ambiental alterado para "Gestão da frota".'
      )
    ).toBeInTheDocument();
  });

  it('hides the add action when the license fails to load', async () => {
    vi.mocked(licensesApi.getLicenseDetails).mockRejectedValue(
      new ApiError(404, 'Licença não encontrada.')
    );
    renderDetailsPage();

    expect(
      await screen.findByText('Licença não encontrada.')
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Editar Condicionante' })
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
    await user.click(within(dialog).getByRole('button', { name: 'Próximo' }));
    await user.click(
      within(
        within(dialog).getByRole('group', {
          name: 'Cumprimento da condicionante 1.1',
        })
      ).getByRole('button', { name: 'Cumprida' })
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
          conditions: [
            { conditionId: 'condition-1-1', fulfilled: true, copyToNew: false },
          ],
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
      screen.queryByRole('button', { name: 'Editar Condicionante' })
    ).not.toBeInTheDocument();
  });

  it('lists the previous versions with links to their details', async () => {
    vi.mocked(licensesApi.getLicenseHistory).mockResolvedValue([
      {
        id: 'license-1',
        processNumber: 'LP nº 482/2024',
        issueDate: '2024-03-12T00:00:00.000Z',
        expirationDate: '2026-03-12T00:00:00.000Z',
        status: 'Regular',
        isCurrent: true,
      },
      {
        id: 'license-0',
        processNumber: 'LP nº 100/2019',
        issueDate: '2019-01-10T00:00:00.000Z',
        expirationDate: '2024-01-10T00:00:00.000Z',
        status: 'Renovada/Arquivada',
        isCurrent: false,
      },
    ]);

    renderDetailsPage();

    const history = await screen.findByRole('region', {
      name: 'Histórico de versões',
    });
    expect(licensesApi.getLicenseHistory).toHaveBeenCalledWith('license-1');
    expect(
      within(history).getByRole('link', { name: 'LP nº 100/2019' })
    ).toHaveAttribute('href', '/companies/customer-1/licenses/license-0');
    expect(within(history).getByText('Renovada/Arquivada')).toBeInTheDocument();
    expect(
      within(history).queryByText('LP nº 482/2024')
    ).not.toBeInTheDocument();
  });

  it('lists the newer versions when viewing an older one', async () => {
    vi.mocked(licensesApi.getLicenseHistory).mockResolvedValue([
      {
        id: 'license-2',
        processNumber: 'LP nº 700/2026',
        issueDate: '2026-03-12T00:00:00.000Z',
        expirationDate: '2030-03-12T00:00:00.000Z',
        status: 'Regular',
        isCurrent: false,
      },
      {
        id: 'license-1',
        processNumber: 'LP nº 482/2024',
        issueDate: '2024-03-12T00:00:00.000Z',
        expirationDate: '2026-03-12T00:00:00.000Z',
        status: 'Renovada/Arquivada',
        isCurrent: true,
      },
    ]);

    renderDetailsPage();

    const history = await screen.findByRole('region', {
      name: 'Histórico de versões',
    });
    expect(
      within(history).getByRole('link', { name: 'LP nº 700/2026' })
    ).toHaveAttribute('href', '/companies/customer-1/licenses/license-2');
    expect(
      within(history).queryByText('LP nº 482/2024')
    ).not.toBeInTheDocument();
  });

  it('reloads the license when the renewal says its conditions changed', async () => {
    const user = userEvent.setup();
    vi.mocked(licensesApi.renewLicense).mockRejectedValue(
      new ApiError(409, 'As condicionantes da licença anterior mudaram.')
    );
    renderDetailsPage();

    await user.click(
      await screen.findByRole('button', { name: 'Renovar licença' })
    );
    const dialog = await screen.findByRole('dialog', {
      name: 'Renovar Licença',
    });
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
    await user.click(within(dialog).getByRole('button', { name: 'Próximo' }));
    await user.click(
      within(
        within(dialog).getByRole('group', {
          name: 'Cumprimento da condicionante 1.1',
        })
      ).getByRole('button', { name: 'Cumprida' })
    );
    await user.click(
      within(dialog).getByRole('button', { name: 'Renovar Licença' })
    );

    expect(
      await within(dialog).findByText(
        'As condicionantes da licença anterior mudaram.'
      )
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(licensesApi.getLicenseDetails).toHaveBeenCalledTimes(2)
    );
    expect(dialog).toBeInTheDocument();
  });

  it('drops the previous history while the linked version loads its own', async () => {
    const user = userEvent.setup();
    vi.mocked(licensesApi.getLicenseDetails).mockImplementation(
      (_customerId, licenseId) =>
        Promise.resolve(
          licenseId === 'license-0'
            ? {
                ...DETAILS,
                id: 'license-0',
                processNumber: 'LP nº 100/2019',
                status: 'Renovada/Arquivada',
              }
            : DETAILS
        )
    );
    vi.mocked(licensesApi.getLicenseHistory).mockImplementation((licenseId) =>
      licenseId === 'license-1'
        ? Promise.resolve([
            {
              id: 'license-1',
              processNumber: 'LP nº 482/2024',
              issueDate: '2024-03-12T00:00:00.000Z',
              expirationDate: '2026-03-12T00:00:00.000Z',
              status: 'Regular',
              isCurrent: true,
            },
            {
              id: 'license-0',
              processNumber: 'LP nº 100/2019',
              issueDate: '2019-01-10T00:00:00.000Z',
              expirationDate: '2024-01-10T00:00:00.000Z',
              status: 'Renovada/Arquivada',
              isCurrent: false,
            },
          ])
        : new Promise(() => {})
    );

    renderDetailsPage();

    const history = await screen.findByRole('region', {
      name: 'Histórico de versões',
    });
    await user.click(
      within(history).getByRole('link', { name: 'LP nº 100/2019' })
    );

    expect(
      await screen.findByText('LP nº 100/2019', { selector: 'p' })
    ).toBeInTheDocument();
    expect(licensesApi.getLicenseHistory).toHaveBeenLastCalledWith('license-0');
    expect(
      screen.queryByRole('region', { name: 'Histórico de versões' })
    ).not.toBeInTheDocument();
  });

  it('does not show the version history for a license that was never renewed', async () => {
    vi.mocked(licensesApi.getLicenseHistory).mockResolvedValue([
      {
        id: 'license-1',
        processNumber: 'LP nº 482/2024',
        issueDate: '2024-03-12T00:00:00.000Z',
        expirationDate: '2026-03-12T00:00:00.000Z',
        status: 'Regular',
        isCurrent: true,
      },
    ]);

    renderDetailsPage();

    expect(await screen.findByText('1 de 1 atendidas')).toBeInTheDocument();
    expect(
      screen.queryByRole('region', { name: 'Histórico de versões' })
    ).not.toBeInTheDocument();
  });

  it('keeps the details usable when the history fails to load', async () => {
    vi.mocked(licensesApi.getLicenseHistory).mockRejectedValue(
      new ApiError(500, 'Erro interno.')
    );

    renderDetailsPage();

    expect(await screen.findByText('1 de 1 atendidas')).toBeInTheDocument();
    expect(
      screen.queryByRole('region', { name: 'Histórico de versões' })
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('lists the license legislations in the radar, as the backend orders them', async () => {
    vi.mocked(legislationsApi.getLicenseLegislations).mockResolvedValue(
      MOCK_LICENSE_LEGISLATIONS.map(legislationsApi.toLicenseLegislation)
    );

    renderDetailsPage();

    const radar = await screen.findByRole('region', {
      name: 'Radar de Legislação',
    });
    await waitFor(() =>
      expect(within(radar).getAllByRole('listitem')).toHaveLength(3)
    );
    expect(
      within(radar)
        .getAllByRole('heading', { level: 3 })
        .map((heading) => heading.textContent)
    ).toEqual([
      'Lei nº 12.305/2010',
      'Resolução nº 237/1997',
      'Lei nº 9.605/1998',
    ]);
    expect(legislationsApi.getLicenseLegislations).toHaveBeenCalledWith(
      'license-1',
      {}
    );
  });

  describe('legislation radar edits', () => {
    const RADAR = MOCK_LICENSE_LEGISLATIONS.map(
      legislationsApi.toLicenseLegislation
    );

    async function findRadar() {
      const radar = await screen.findByRole('region', {
        name: 'Radar de Legislação',
      });
      await waitFor(() =>
        expect(within(radar).getAllByRole('listitem').length).toBeGreaterThan(0)
      );
      return radar;
    }

    beforeEach(() => {
      vi.mocked(legislationsApi.getLicenseLegislations).mockImplementation(
        async (_licenseId, filter) =>
          RADAR.filter(
            (item) => !filter?.impact || item.impact === filter.impact
          )
      );
    });

    it('shows each entry impact badge, including the missing classification', async () => {
      renderDetailsPage();

      const items = within(await findRadar()).getAllByRole('listitem');
      expect(
        within(items[0]).getByText('Impacta sua operação', { selector: 'span' })
      ).toHaveClass('bg-rose-100');
      expect(
        within(items[1]).getByText('Sem classificação', { selector: 'span' })
      ).toBeInTheDocument();
      expect(
        within(items[2]).getByText('Impacto moderado', { selector: 'span' })
      ).toBeInTheDocument();
    });

    it('changes the impact, sends it to the backend and updates the badge', async () => {
      vi.mocked(legislationsApi.updateLicenseLegislation).mockResolvedValue({
        ...RADAR[1],
        impact: 'LOW',
      });
      renderDetailsPage();
      const item = within(await findRadar()).getAllByRole('listitem')[1];

      await userEvent.selectOptions(
        within(item).getByRole('combobox', {
          name: 'Impacto de Resolução nº 237/1997',
        }),
        'LOW'
      );

      expect(legislationsApi.updateLicenseLegislation).toHaveBeenCalledWith(
        'license-1',
        RADAR[1].id,
        { impact: 'LOW' }
      );
      expect(
        await within(item).findByText('Baixo impacto', { selector: 'span' })
      ).toHaveClass('bg-emerald-100');
      expect(
        within(item).queryByText('Sem classificação', { selector: 'span' })
      ).not.toBeInTheDocument();
      expect(legislationsApi.getLicenseLegislations).toHaveBeenCalledTimes(1);
    });

    it('clears the classification', async () => {
      vi.mocked(legislationsApi.updateLicenseLegislation).mockResolvedValue({
        ...RADAR[0],
        impact: null,
      });
      renderDetailsPage();
      const item = within(await findRadar()).getAllByRole('listitem')[0];

      await userEvent.selectOptions(
        within(item).getByRole('combobox', {
          name: 'Impacto de Lei nº 12.305/2010',
        }),
        ''
      );

      expect(legislationsApi.updateLicenseLegislation).toHaveBeenCalledWith(
        'license-1',
        RADAR[0].id,
        { impact: null }
      );
      expect(
        await within(item).findByText('Sem classificação', { selector: 'span' })
      ).toBeInTheDocument();
    });

    it('keeps the old impact and shows the error when saving fails', async () => {
      vi.mocked(legislationsApi.updateLicenseLegislation).mockRejectedValue(
        new ApiError(404, 'Legislação não encontrada nesta licença.')
      );
      renderDetailsPage();
      const item = within(await findRadar()).getAllByRole('listitem')[0];

      await userEvent.selectOptions(
        within(item).getByRole('combobox', {
          name: 'Impacto de Lei nº 12.305/2010',
        }),
        'LOW'
      );

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Legislação não encontrada nesta licença.'
      );
      expect(
        within(item).getByText('Impacta sua operação', { selector: 'span' })
      ).toBeInTheDocument();
      expect(
        within(item).getByRole('combobox', {
          name: 'Impacto de Lei nº 12.305/2010',
        })
      ).toHaveValue('HIGH');
    });

    it('marks an unread entry as read when it is opened', async () => {
      vi.mocked(legislationsApi.updateLicenseLegislation).mockResolvedValue({
        ...RADAR[0],
        readAt: '2026-11-12T15:00:00.000Z',
      });
      renderDetailsPage();
      const item = within(await findRadar()).getAllByRole('listitem')[0];
      expect(within(item).getByText('Novo')).toBeInTheDocument();

      await userEvent.click(
        within(item).getByRole('button', { name: 'Ver detalhes' })
      );

      expect(legislationsApi.updateLicenseLegislation).toHaveBeenCalledWith(
        'license-1',
        RADAR[0].id,
        { read: true }
      );
      await waitFor(() =>
        expect(within(item).queryByText('Novo')).not.toBeInTheDocument()
      );
    });

    it('does not call the backend again for an entry that was already read', async () => {
      renderDetailsPage();
      const item = within(await findRadar()).getAllByRole('listitem')[1];

      await userEvent.click(
        within(item).getByRole('button', { name: 'Ver detalhes' })
      );

      expect(legislationsApi.updateLicenseLegislation).not.toHaveBeenCalled();
    });

    it('filters the radar by impact on the server', async () => {
      renderDetailsPage();
      const radar = await findRadar();

      await userEvent.selectOptions(
        within(radar).getByRole('combobox', { name: 'Filtrar por impacto' }),
        'HIGH'
      );

      await waitFor(() =>
        expect(within(radar).getAllByRole('listitem')).toHaveLength(1)
      );
      expect(legislationsApi.getLicenseLegislations).toHaveBeenLastCalledWith(
        'license-1',
        { impact: 'HIGH' }
      );
      expect(
        within(radar).getByRole('heading', { name: 'Lei nº 12.305/2010' })
      ).toBeInTheDocument();

      await userEvent.selectOptions(
        within(radar).getByRole('combobox', { name: 'Filtrar por impacto' }),
        ''
      );

      await waitFor(() =>
        expect(within(radar).getAllByRole('listitem')).toHaveLength(3)
      );
      expect(legislationsApi.getLicenseLegislations).toHaveBeenLastCalledWith(
        'license-1',
        {}
      );
    });

    it('drops an entry from the filtered list once it is reclassified', async () => {
      vi.mocked(legislationsApi.updateLicenseLegislation).mockResolvedValue({
        ...RADAR[0],
        impact: 'LOW',
      });
      renderDetailsPage();
      const radar = await findRadar();
      await userEvent.selectOptions(
        within(radar).getByRole('combobox', { name: 'Filtrar por impacto' }),
        'HIGH'
      );
      await waitFor(() =>
        expect(within(radar).getAllByRole('listitem')).toHaveLength(1)
      );

      await userEvent.selectOptions(
        within(radar).getByRole('combobox', {
          name: 'Impacto de Lei nº 12.305/2010',
        }),
        'LOW'
      );

      expect(
        await within(radar).findByText(
          'Nenhuma legislação com o impacto “Impacta sua operação”.'
        )
      ).toBeInTheDocument();
    });
  });

  it('shows the empty radar with the add button', async () => {
    renderDetailsPage();

    const radar = await screen.findByRole('region', {
      name: 'Radar de Legislação',
    });
    expect(
      await within(radar).findByText('Nenhuma legislação vinculada')
    ).toBeInTheDocument();
    expect(
      within(radar).getByRole('button', { name: 'Adicionar legislação' })
    ).toBeInTheDocument();
  });
});
