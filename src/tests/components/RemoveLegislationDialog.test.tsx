import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MOCK_LICENSE_LEGISLATIONS } from '../../features/legislation/legislations.mock';
import { ApiError } from '../../services/api/apiError';

vi.mock('../../services/api/legislationsApi', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('../../services/api/legislationsApi')
  >()),
  removeLicenseLegislation: vi.fn(),
}));

const legislationsApi = await import('../../services/api/legislationsApi');
const { RemoveLegislationDialog } =
  await import('../../pages/company/LicenseDetails/components/RemoveLegislationDialog');

const ITEM = legislationsApi.toLicenseLegislation(MOCK_LICENSE_LEGISLATIONS[1]);

function renderDialog() {
  const onOpenChange = vi.fn();
  const onRemoved = vi.fn();
  render(
    <RemoveLegislationDialog
      item={ITEM}
      licenseId="license-1"
      onOpenChange={onOpenChange}
      onRemoved={onRemoved}
    />
  );

  return { onOpenChange, onRemoved };
}

describe('RemoveLegislationDialog', () => {
  beforeEach(() => vi.resetAllMocks());

  it('renders nothing without an item', () => {
    const { container } = render(
      <RemoveLegislationDialog
        item={null}
        licenseId="license-1"
        onOpenChange={vi.fn()}
        onRemoved={vi.fn()}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('removes the entry after confirmation', async () => {
    vi.mocked(legislationsApi.removeLicenseLegislation).mockResolvedValue();
    const user = userEvent.setup();
    const { onOpenChange, onRemoved } = renderDialog();

    expect(screen.getByText('Resolução nº 237/1997')).toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: 'Remover legislação' })
    );

    await waitFor(() => expect(onRemoved).toHaveBeenCalledWith(ITEM));
    expect(legislationsApi.removeLicenseLegislation).toHaveBeenCalledWith(
      'license-1',
      ITEM.id
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows the error and stays open when removing fails', async () => {
    vi.mocked(legislationsApi.removeLicenseLegislation).mockRejectedValue(
      new ApiError(404, 'Legislação não encontrada no radar desta licença.')
    );
    const user = userEvent.setup();
    const { onOpenChange, onRemoved } = renderDialog();

    await user.click(
      screen.getByRole('button', { name: 'Remover legislação' })
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Legislação não encontrada no radar desta licença.'
    );
    expect(onRemoved).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('uses a generic message on unexpected failures and can be cancelled', async () => {
    vi.mocked(legislationsApi.removeLicenseLegislation).mockRejectedValue(
      new Error('boom')
    );
    const user = userEvent.setup();
    const { onOpenChange } = renderDialog();

    await user.click(
      screen.getByRole('button', { name: 'Remover legislação' })
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível remover a legislação. Tente novamente mais tarde.'
    );

    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
