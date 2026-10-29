import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CompanyListItem } from '../../features/companies/types';
import { DeleteCompanyDialog } from '../../pages/admin/Companies/components/DeleteCompanyDialog';
import { ApiError } from '../../services/api/apiError';

vi.mock('../../services/api/customersApi', () => ({
  deleteCompany: vi.fn(),
}));

const { deleteCompany } = await import('../../services/api/customersApi');

const COMPANY: CompanyListItem = {
  id: 'customer-1',
  name: 'Unidade Industrial RS',
  status: 'active',
  segment: 'Siderurgia',
  location: 'Porto Alegre - RS',
  conformityPercentage: 96,
  totalLicenses: 2,
  updatedAt: '2026-09-17T14:30:00.000Z',
};

function renderDialog(company: CompanyListItem | null = COMPANY) {
  return render(
    <DeleteCompanyDialog
      company={company}
      onDeleted={vi.fn()}
      onOpenChange={vi.fn()}
    />
  );
}

describe('DeleteCompanyDialog', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('does not render an open dialog when there is no selected company', () => {
    renderDialog(null);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('deletes the selected company and notifies the parent', async () => {
    vi.mocked(deleteCompany).mockResolvedValue(undefined);
    const onDeleted = vi.fn();
    const onOpenChange = vi.fn();
    const user = userEvent.setup();

    render(
      <DeleteCompanyDialog
        company={COMPANY}
        onDeleted={onDeleted}
        onOpenChange={onOpenChange}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Excluir empresa' }));

    await waitFor(() => {
      expect(deleteCompany).toHaveBeenCalledWith(COMPANY.id);
      expect(onDeleted).toHaveBeenCalledOnce();
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it('shows the API error and keeps the confirmation open', async () => {
    vi.mocked(deleteCompany).mockRejectedValue(
      new ApiError(409, 'A empresa possui registros vinculados.')
    );
    const onDeleted = vi.fn();
    const user = userEvent.setup();
    render(
      <DeleteCompanyDialog
        company={COMPANY}
        onDeleted={onDeleted}
        onOpenChange={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Excluir empresa' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'A empresa possui registros vinculados.'
    );
    expect(onDeleted).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('shows a fallback message for an unexpected deletion error', async () => {
    vi.mocked(deleteCompany).mockRejectedValue(new Error('network failure'));
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole('button', { name: 'Excluir empresa' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível excluir a empresa.'
    );
  });

  it('disables the confirmation while the delete request is pending', async () => {
    let finishDelete: () => void = () => {};
    vi.mocked(deleteCompany).mockReturnValue(
      new Promise((resolve) => {
        finishDelete = () => resolve(undefined);
      })
    );
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole('button', { name: 'Excluir empresa' }));

    const pendingButton = screen.getByRole('button', { name: 'Excluindo...' });
    expect(pendingButton).toBeDisabled();
    finishDelete();
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Excluindo...' })).toBeNull();
    });
  });

  it('closes without deleting when the user cancels', async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    render(
      <DeleteCompanyDialog
        company={COMPANY}
        onDeleted={vi.fn()}
        onOpenChange={onOpenChange}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(deleteCompany).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
