import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { LicenseDetails } from '../../features/licenses/types';
import { LicenseDetailsPage } from '../../pages/company/LicenseDetails/LicenseDetailsPage';

vi.mock('../../services/api/licensesApi', () => ({
  getLicenseDetails: vi.fn(),
}));

const licensesApi = await import('../../services/api/licensesApi');

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

describe('LicenseDetailsPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(licensesApi.getLicenseDetails).mockResolvedValue(DETAILS);
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
});
