import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { LicenseCondition } from '../../features/licenseConditions/types';
import { ApiError } from '../../services/api/apiError';

vi.mock('../../services/api/licenseConditionsApi', () => ({
  updateLicenseCondition: vi.fn(),
}));
vi.mock('../../services/api/licensesApi', () => ({
  listLicenses: vi.fn(),
}));

const licenseConditionsApi =
  await import('../../services/api/licenseConditionsApi');
const licensesApi = await import('../../services/api/licensesApi');
const { EditConditionModal } =
  await import('../../pages/company/Conditions/components/EditConditionModal');

const CONDITION: LicenseCondition = {
  id: 'condition-1',
  licenseId: 'license-1',
  title: 'MTR - Manifesto de Transporte de Resíduos',
  description: 'Emissão de manifesto obrigatório.',
  category: 'Resíduos',
  dueDate: '2026-05-20T00:00:00.000Z',
  riskLevel: 'REGULAR',
};

function renderModal(
  overrides: Partial<React.ComponentProps<typeof EditConditionModal>> = {}
) {
  const props = {
    categories: ['Resíduos', 'Emissões'],
    companyId: 'customer-1',
    condition: CONDITION,
    onOpenChange: vi.fn(),
    onUpdated: vi.fn(),
    open: true,
    ...overrides,
  };

  render(<EditConditionModal {...props} />);

  return props;
}

describe('EditConditionModal', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(licensesApi.listLicenses).mockResolvedValue({
      summary: { total: 1, regular: 1, attention: 0, expired: 0 },
      licenses: [
        {
          id: 'license-1',
          type: 'Licença de Operação (LO)',
          processNumber: 'LO nº 118/2020',
          issuingAgency: 'FEPAM',
          issueDate: '2020-01-10T00:00:00.000Z',
          expirationDate: '2027-01-10T00:00:00.000Z',
          status: 'Regular',
        },
      ],
    });
  });

  it('preloads every field from the condition being edited', async () => {
    renderModal();

    expect(
      screen.getByRole('heading', { name: 'Editar Condicionante' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('Atualize as informações da condicionante ambiental.')
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Nome da Condicionante')).toHaveValue(
      'MTR - Manifesto de Transporte de Resíduos'
    );
    expect(screen.getByLabelText('Data de Vencimento')).toHaveValue(
      '2026-05-20'
    );
    expect(screen.getByLabelText('Descrição da Condicionante')).toHaveValue(
      'Emissão de manifesto obrigatório.'
    );
    expect(screen.getByLabelText('Status')).toHaveValue('Regular');
  });

  it('fills the responsible agency from the license the condition hangs from', async () => {
    renderModal();

    await waitFor(() =>
      expect(licensesApi.listLicenses).toHaveBeenCalledWith('customer-1')
    );
    await waitFor(() =>
      expect(screen.getByLabelText('Órgão Responsável')).toHaveValue('FEPAM')
    );
  });

  it('saves the edited due date and hands the updated condition back', async () => {
    const user = userEvent.setup();
    const updated = { ...CONDITION, dueDate: '2026-06-30T00:00:00.000Z' };
    vi.mocked(licenseConditionsApi.updateLicenseCondition).mockResolvedValue(
      updated
    );
    const { onUpdated, onOpenChange } = renderModal();

    fireEvent.change(screen.getByLabelText('Data de Vencimento'), {
      target: { value: '2026-06-30' },
    });
    await user.click(screen.getByRole('button', { name: 'Salvar Alterações' }));

    await waitFor(() =>
      expect(licenseConditionsApi.updateLicenseCondition).toHaveBeenCalledWith(
        'customer-1',
        'condition-1',
        {
          title: 'MTR - Manifesto de Transporte de Resíduos',
          description: 'Emissão de manifesto obrigatório.',
          category: 'Resíduos',
          licenseId: 'license-1',
          dueDate: '2026-06-30',
        }
      )
    );
    expect(onUpdated).toHaveBeenCalledWith(updated);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('keeps the modal open and shows the API message when saving fails', async () => {
    const user = userEvent.setup();
    vi.mocked(licenseConditionsApi.updateLicenseCondition).mockRejectedValue(
      new ApiError(422, 'Licença vinculada inexistente.')
    );
    const { onUpdated } = renderModal();

    await user.click(screen.getByRole('button', { name: 'Salvar Alterações' }));

    expect(
      await screen.findByText('Licença vinculada inexistente.')
    ).toBeInTheDocument();
    expect(onUpdated).not.toHaveBeenCalled();
  });

  it('blocks saving while a required field is empty', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.clear(screen.getByLabelText('Nome da Condicionante'));

    expect(
      screen.getByRole('button', { name: 'Salvar Alterações' })
    ).toBeDisabled();
  });
});
