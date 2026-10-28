import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  LicenseConditionDetail,
  LicenseDetails,
} from '../../features/licenses/types';
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

function condition(
  id: string,
  itemNumber: string,
  description: string
): LicenseConditionDetail {
  return {
    id,
    itemNumber,
    isEnvironmentalDescriptor: false,
    environmentalDescriptor: 'Recursos Hídricos',
    name: null,
    description,
    conditionType: 'Periódico',
    periodicity: 'Anual',
    deadline: null,
    status: 'Em andamento',
    completionDate: null,
    responsibleName: null,
    hasDelivery: true,
    isViolated: false,
  };
}

const LICENSE_WITH_CONDITIONS: LicenseDetails = {
  ...LICENSE,
  conditions: [
    {
      ...condition('descriptor', '1', 'Recursos Hídricos'),
      id: null,
      isEnvironmentalDescriptor: true,
    },
    condition('condition-1', '1.1', 'Monitorar a qualidade da água.'),
    condition('condition-2', '1.2', 'Apresentar relatório anual.'),
    condition('condition-3', '1.3', 'Manter outorga atualizada.'),
  ],
};

function renderModal(
  overrides: Partial<{
    license: LicenseDetails;
    onOpenChange: (open: boolean) => void;
    onRenewed: (license: { id: string }) => void;
  }> = {}
) {
  const onOpenChange = overrides.onOpenChange ?? vi.fn();
  const onRenewed = overrides.onRenewed ?? vi.fn();

  render(
    <RenewLicenseModal
      license={overrides.license ?? LICENSE}
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

async function goToConditionsStep(user: ReturnType<typeof userEvent.setup>) {
  const dialog = await fillRequiredFields(user);
  await user.click(within(dialog).getByRole('button', { name: 'Próximo' }));

  return dialog;
}

async function markFulfillment(
  user: ReturnType<typeof userEvent.setup>,
  dialog: HTMLElement,
  itemNumber: string,
  answer: 'Cumprida' | 'Não cumprida'
) {
  await user.click(
    within(
      within(dialog).getByRole('group', {
        name: `Cumprimento da condicionante ${itemNumber}`,
      })
    ).getByRole('button', { name: answer })
  );
}

async function markToCopy(
  user: ReturnType<typeof userEvent.setup>,
  dialog: HTMLElement,
  itemNumber: string,
  dueDate: string
) {
  await user.click(
    within(dialog).getByRole('checkbox', {
      name: `Copiar para a nova licença (condicionante ${itemNumber})`,
    })
  );
  await user.type(
    within(dialog).getByLabelText(
      `Novo vencimento (condicionante ${itemNumber})`
    ),
    dueDate
  );
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
          conditions: [],
        })
      )
    );
    expect(
      within(dialog).queryByRole('button', { name: 'Próximo' })
    ).not.toBeInTheDocument();
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

  describe('with conditions on the previous license', () => {
    it('asks for the previous license conditions in a second step', async () => {
      const user = userEvent.setup();
      renderModal({ license: LICENSE_WITH_CONDITIONS });

      const dialog = await goToConditionsStep(user);

      const step = within(dialog).getByRole('region', {
        name: 'Condicionantes da licença anterior',
      });
      expect(within(step).getAllByRole('listitem')).toHaveLength(3);
      expect(
        within(dialog).queryByRole('textbox', {
          name: 'Novo número da licença',
        })
      ).not.toBeInTheDocument();
      expect(licensesApi.renewLicense).not.toHaveBeenCalled();
    });

    it('validates the license data before moving to the conditions', async () => {
      const user = userEvent.setup();
      renderModal({ license: LICENSE_WITH_CONDITIONS });

      const dialog = await fillRequiredFields(user);
      await user.clear(within(dialog).getByLabelText('Data de Validade'));
      await user.type(
        within(dialog).getByLabelText('Data de Validade'),
        '2026-01-10'
      );
      await user.click(within(dialog).getByRole('button', { name: 'Próximo' }));

      expect(
        await within(dialog).findByText(
          'A data de validade deve ser posterior à data de emissão.'
        )
      ).toBeInTheDocument();
      expect(
        within(dialog).queryByRole('region', {
          name: 'Condicionantes da licença anterior',
        })
      ).not.toBeInTheDocument();
    });

    it('only renews once every condition is marked fulfilled or not', async () => {
      const user = userEvent.setup();
      renderModal({ license: LICENSE_WITH_CONDITIONS });

      const dialog = await goToConditionsStep(user);
      const renewButton = within(dialog).getByRole('button', {
        name: 'Renovar Licença',
      });

      await markFulfillment(user, dialog, '1.1', 'Cumprida');
      await markFulfillment(user, dialog, '1.2', 'Não cumprida');
      expect(renewButton).toBeDisabled();

      await markFulfillment(user, dialog, '1.3', 'Cumprida');
      expect(renewButton).toBeEnabled();
    });

    it('copies exactly the marked conditions with their new due dates', async () => {
      const user = userEvent.setup();
      const onRenewed = vi.fn();
      renderModal({ license: LICENSE_WITH_CONDITIONS, onRenewed });

      const dialog = await goToConditionsStep(user);
      await markFulfillment(user, dialog, '1.1', 'Cumprida');
      await markFulfillment(user, dialog, '1.2', 'Não cumprida');
      await markFulfillment(user, dialog, '1.3', 'Cumprida');
      await markToCopy(user, dialog, '1.1', '2027-10-01');
      await markToCopy(user, dialog, '1.2', '2027-11-01');
      await user.click(
        within(dialog).getByRole('button', { name: 'Renovar Licença' })
      );

      await waitFor(() =>
        expect(licensesApi.renewLicense).toHaveBeenCalledWith(
          'license-1',
          expect.objectContaining({
            conditions: [
              {
                conditionId: 'condition-1',
                fulfilled: true,
                copyToNew: true,
                newDueDate: '2027-10-01',
              },
              {
                conditionId: 'condition-2',
                fulfilled: false,
                copyToNew: true,
                newDueDate: '2027-11-01',
              },
              { conditionId: 'condition-3', fulfilled: true, copyToNew: false },
            ],
          })
        )
      );
      expect(onRenewed).toHaveBeenCalled();
    });

    it('requires a new due date for every condition marked to copy', async () => {
      const user = userEvent.setup();
      renderModal({ license: LICENSE_WITH_CONDITIONS });

      const dialog = await goToConditionsStep(user);
      await markFulfillment(user, dialog, '1.1', 'Cumprida');
      await markFulfillment(user, dialog, '1.2', 'Cumprida');
      await markFulfillment(user, dialog, '1.3', 'Cumprida');
      await user.click(
        within(dialog).getByRole('checkbox', {
          name: 'Copiar para a nova licença (condicionante 1.2)',
        })
      );

      const renewButton = within(dialog).getByRole('button', {
        name: 'Renovar Licença',
      });
      expect(renewButton).toBeDisabled();

      await user.type(
        within(dialog).getByLabelText('Novo vencimento (condicionante 1.2)'),
        '2027-11-01'
      );
      expect(renewButton).toBeEnabled();
    });

    it('marks every condition to copy through the shortcut', async () => {
      const user = userEvent.setup();
      renderModal({ license: LICENSE_WITH_CONDITIONS });

      const dialog = await goToConditionsStep(user);
      const shortcut = within(dialog).getByRole('button', {
        name: 'Marcar todas para copiar',
      });
      await user.click(shortcut);

      for (const itemNumber of ['1.1', '1.2', '1.3']) {
        expect(
          within(dialog).getByRole('checkbox', {
            name: `Copiar para a nova licença (condicionante ${itemNumber})`,
          })
        ).toBeChecked();
        expect(
          within(dialog).getByLabelText(
            `Novo vencimento (condicionante ${itemNumber})`
          )
        ).toBeInTheDocument();
      }
      expect(shortcut).toBeDisabled();
    });

    it('goes back to the license data without losing what was filled', async () => {
      const user = userEvent.setup();
      renderModal({ license: LICENSE_WITH_CONDITIONS });

      const dialog = await goToConditionsStep(user);
      await markFulfillment(user, dialog, '1.1', 'Cumprida');
      await user.click(within(dialog).getByRole('button', { name: 'Voltar' }));

      expect(
        within(dialog).getByRole('textbox', { name: 'Novo número da licença' })
      ).toHaveValue('LO nº 119/2026');

      await user.click(within(dialog).getByRole('button', { name: 'Próximo' }));
      expect(
        within(
          within(dialog).getByRole('group', {
            name: 'Cumprimento da condicionante 1.1',
          })
        ).getByRole('button', { name: 'Cumprida' })
      ).toHaveAttribute('aria-pressed', 'true');
    });
  });
});
