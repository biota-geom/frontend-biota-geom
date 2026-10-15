import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { LicenseDetails } from '../../features/licenses/types';
import { RenewLicenseModal } from '../../pages/company/LicenseDetails/components/RenewLicenseModal';
import { ApiError } from '../../services/api/apiError';

vi.mock('../../services/api/licensesApi', () => ({
  renewLicense: vi.fn(),
}));

const licensesApi = await import('../../services/api/licensesApi');

const LICENSE: LicenseDetails = {
  id: 'license-1',
  processNumber: 'LO nº 118/2020',
  type: 'Licença de Operação (LO)',
  issuingAgency: null,
  issueDate: '2020-01-10T00:00:00.000Z',
  expirationDate: '2025-01-10T00:00:00.000Z',
  status: 'Vencida',
  conditions: [],
};

function renderModal(
  overrides: Partial<{
    onOpenChange: (open: boolean) => void;
    onRenewed: (license: { id: string }) => void;
  }> = {}
) {
  const onOpenChange = overrides.onOpenChange ?? vi.fn();
  const onRenewed = overrides.onRenewed ?? vi.fn();

  render(
    <RenewLicenseModal
      license={LICENSE}
      onOpenChange={onOpenChange}
      onRenewed={onRenewed}
      open
    />
  );

  return { onOpenChange, onRenewed };
}

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
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

  return dialog;
}

describe('RenewLicenseModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(licensesApi.renewLicense).mockResolvedValue({
      id: 'license-2',
      previousLicenseId: 'license-1',
      status: 'Regular',
    });
  });

  it('shows the current license type and a fallback when there is no issuing agency', async () => {
    renderModal();

    expect(
      await screen.findByDisplayValue('Licença de Operação (LO)')
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue('—')).toBeInTheDocument();
  });

  it('submits the new license data and reports the renewed license', async () => {
    const user = userEvent.setup();
    const onRenewed = vi.fn();
    renderModal({ onRenewed });

    const dialog = await fillRequiredFields(user);
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
    expect(onRenewed).toHaveBeenCalledWith({
      id: 'license-2',
      previousLicenseId: 'license-1',
      status: 'Regular',
    });
  });

  it('keeps the modal open and shows an API error when renewal fails', async () => {
    const user = userEvent.setup();
    vi.mocked(licensesApi.renewLicense).mockRejectedValue(
      new ApiError(400, 'Licença já renovada/arquivada.')
    );
    renderModal();

    const dialog = await fillRequiredFields(user);
    await user.click(
      within(dialog).getByRole('button', { name: 'Renovar Licença' })
    );

    expect(
      await within(dialog).findByText('Licença já renovada/arquivada.')
    ).toBeInTheDocument();
  });

  it('validates the date range before calling the API', async () => {
    const user = userEvent.setup();
    renderModal();

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
      '2026-01-10'
    );
    await user.upload(
      within(dialog).getByLabelText('PDF da nova licença'),
      new File(['%PDF-1.4'], 'renovada.pdf', { type: 'application/pdf' })
    );
    await user.click(
      within(dialog).getByRole('button', { name: 'Renovar Licença' })
    );

    expect(
      await within(dialog).findByText(
        'A data de validade deve ser posterior à data de emissão.'
      )
    ).toBeInTheDocument();
    expect(licensesApi.renewLicense).not.toHaveBeenCalled();
  });

  it('closes through the cancel button', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderModal({ onOpenChange });

    await user.click(await screen.findByRole('button', { name: 'Cancelar' }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
