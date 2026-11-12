import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LegislationFormModal } from '../../components/legislation/LegislationFormModal';
import type { LegislationFormResult } from '../../features/legislation/legislationFormValidation';
import { ApiError } from '../../services/api/apiError';

const INITIAL: LegislationFormResult = {
  legislation: {
    type: 'RESOLUCAO',
    number: '237',
    year: 1997,
    issuingBody: 'CONAMA',
    summary: null,
  },
  citedExcerpt: '…conforme a Resolução…',
};

function renderModal(
  props: Partial<Parameters<typeof LegislationFormModal>[0]> = {}
) {
  const onOpenChange = vi.fn();
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  render(
    <LegislationFormModal
      mode="create"
      onOpenChange={onOpenChange}
      onSubmit={onSubmit}
      open
      {...props}
    />
  );

  return { onOpenChange, onSubmit };
}

async function fillRequired(user: ReturnType<typeof userEvent.setup>) {
  await user.click(
    screen.getByRole('combobox', { name: 'Tipo da legislação' })
  );
  await user.click(screen.getByRole('option', { name: 'Lei' }));
  await user.type(screen.getByLabelText('Número *'), '12.305');
  await user.type(screen.getByLabelText('Ano *'), '2010');
}

describe('LegislationFormModal', () => {
  it('creates a legislation with only the required fields', async () => {
    const user = userEvent.setup();
    const { onOpenChange, onSubmit } = renderModal();

    expect(
      screen.getByRole('heading', { name: 'Adicionar legislação' })
    ).toBeInTheDocument();
    await fillRequired(user);
    await user.click(
      screen.getByRole('button', { name: 'Adicionar legislação' })
    );

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        legislation: {
          type: 'LEI',
          number: '12.305',
          year: 2010,
          issuingBody: '',
          summary: null,
        },
        citedExcerpt: null,
      })
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('sends the optional fields when filled', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderModal();

    await fillRequired(user);
    await user.type(screen.getByLabelText('Órgão emissor'), 'Governo Federal');
    await user.type(screen.getByLabelText('Ementa'), 'Institui a PNRS.');
    await user.type(
      screen.getByLabelText('Trecho citado (opcional)'),
      'art. 3º'
    );
    await user.click(
      screen.getByRole('button', { name: 'Adicionar legislação' })
    );

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        legislation: {
          type: 'LEI',
          number: '12.305',
          year: 2010,
          issuingBody: 'Governo Federal',
          summary: 'Institui a PNRS.',
        },
        citedExcerpt: 'art. 3º',
      })
    );
  });

  it('blocks the submit until type, number and year are valid', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderModal();

    await user.click(
      screen.getByRole('button', { name: 'Adicionar legislação' })
    );

    expect(
      await screen.findByText('Selecione o tipo da legislação.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Informe o número da legislação.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Informe o ano da legislação.')
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('prefills the fields when editing', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderModal({ initialValue: INITIAL, mode: 'edit' });

    expect(
      screen.getByRole('heading', { name: 'Editar legislação' })
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Número *')).toHaveValue('237');
    expect(screen.getByLabelText('Ano *')).toHaveValue('1997');
    expect(screen.getByLabelText('Órgão emissor')).toHaveValue('CONAMA');
    expect(screen.getByLabelText('Ementa')).toHaveValue('');
    expect(screen.getByLabelText('Trecho citado (opcional)')).toHaveValue(
      '…conforme a Resolução…'
    );
    expect(
      screen.getByRole('combobox', { name: 'Tipo da legislação' })
    ).toHaveTextContent('Resolução');

    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(INITIAL));
  });

  it('keeps the modal open with the backend message when saving fails', async () => {
    const user = userEvent.setup();
    const { onOpenChange } = renderModal({
      onSubmit: vi
        .fn()
        .mockRejectedValue(
          new ApiError(409, 'Esta legislação já está no radar da licença.')
        ),
    });

    await fillRequired(user);
    await user.click(
      screen.getByRole('button', { name: 'Adicionar legislação' })
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Esta legislação já está no radar da licença.'
    );
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('falls back to a generic message on unexpected failures', async () => {
    const user = userEvent.setup();
    renderModal({ onSubmit: vi.fn().mockRejectedValue(new Error('boom')) });

    await fillRequired(user);
    await user.click(
      screen.getByRole('button', { name: 'Adicionar legislação' })
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível salvar a legislação. Tente novamente mais tarde.'
    );
  });

  it('can hide the cited excerpt and be cancelled', async () => {
    const user = userEvent.setup();
    const { onOpenChange } = renderModal({ showCitedExcerpt: false });

    expect(
      screen.queryByLabelText('Trecho citado (opcional)')
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
