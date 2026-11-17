import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LegislationFormModal } from '../../components/legislation/LegislationFormModal';
import type { LegislationFormResult } from '../../features/legislation/legislationFormValidation';
import { ApiError } from '../../services/api/apiError';
import { searchLegislationCatalog } from '../../services/api/legislationsApi';

vi.mock('../../services/api/legislationsApi', () => ({
  searchLegislationCatalog: vi.fn(),
}));

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
  await user.type(
    screen.getByLabelText('Pesquisar no catálogo (opcional)'),
    '12.305'
  );
  const suggestion = await screen.findByRole('option', {
    name: /Lei nº 12\.305\/2010/,
  });
  await user.click(suggestion);
}

describe('LegislationFormModal', () => {
  beforeEach(() => {
    vi.mocked(searchLegislationCatalog).mockResolvedValue([
      {
        id: 'legislation-123',
        type: 'LEI',
        number: '12.305',
        year: 2010,
        issuingBody: 'Governo Federal',
        summary: null,
      },
    ]);
  });

  it('searches catalog acts by number, year or summary', async () => {
    const user = userEvent.setup();
    renderModal();

    const search = screen.getByLabelText('Pesquisar no catálogo (opcional)');
    expect(search).toHaveAttribute(
      'placeholder',
      'Pesquisar por número, ano ou ementa'
    );

    await user.type(search, '2010');
    expect(
      await screen.findByRole('option', {
        name: /Lei nº 12\.305\/2010/,
      })
    ).toBeInTheDocument();
    expect(searchLegislationCatalog).toHaveBeenCalled();
  });

  it('shows every returned catalog act as a selectable option', async () => {
    const user = userEvent.setup();
    vi.mocked(searchLegislationCatalog).mockResolvedValue([
      {
        id: 'legislation-1',
        type: 'LEI',
        number: '12.305',
        year: 2010,
        issuingBody: 'Governo Federal',
        summary: 'Institui a PNRS.',
      },
      {
        id: 'legislation-2',
        type: 'DECRETO',
        number: '10.936',
        year: 2022,
        issuingBody: 'Governo Federal',
        summary: 'Regulamenta a PNRS.',
      },
    ]);
    const { onSubmit } = renderModal();

    await user.type(
      screen.getByLabelText('Pesquisar no catálogo (opcional)'),
      'PNRS'
    );

    await user.click(
      await screen.findByRole('option', {
        name: /Decreto nº 10\.936\/2022/,
      })
    );
    await user.click(
      screen.getByRole('button', { name: 'Adicionar legislação' })
    );

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ legislationId: 'legislation-2' })
      )
    );
  });

  it('reuses an existing catalog act when submitting its exact number', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderModal();
    vi.mocked(searchLegislationCatalog).mockResolvedValue([
      {
        id: 'legislation-123',
        type: 'LEI',
        number: '12.305',
        year: 2010,
        issuingBody: 'Governo Federal',
        summary: 'Institui a PNRS.',
      },
    ]);

    await fillRequired(user);
    await user.click(
      screen.getByRole('button', { name: 'Adicionar legislação' })
    );

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        legislationId: 'legislation-123',
        legislation: {
          type: 'LEI',
          number: '12.305',
          year: 2010,
          issuingBody: 'Governo Federal',
          summary: 'Institui a PNRS.',
        },
        citedExcerpt: null,
      })
    );
  });

  it('uses the selected catalog legislation when adding it', async () => {
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
        legislationId: 'legislation-123',
        legislation: {
          type: 'LEI',
          number: '12.305',
          year: 2010,
          issuingBody: 'Governo Federal',
          summary: null,
        },
        citedExcerpt: null,
      })
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('allows creating a legislation when the catalog has no match', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderModal();
    vi.mocked(searchLegislationCatalog).mockResolvedValue([]);

    await user.type(
      screen.getByLabelText('Pesquisar no catálogo (opcional)'),
      'Resolução ambiental'
    );
    expect(
      await screen.findByText(
        'Nenhuma legislação encontrada no catálogo. Preencha os dados abaixo para cadastrar uma nova.'
      )
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('combobox', { name: 'Tipo da legislação' })
    );
    await user.click(await screen.findByRole('option', { name: 'Resolução' }));
    await user.type(screen.getByLabelText('Número *'), '237');
    await user.type(screen.getByLabelText('Ano *'), '1997');
    await user.type(screen.getByLabelText('Órgão emissor *'), 'CONAMA');
    await user.click(
      screen.getByRole('button', { name: 'Adicionar legislação' })
    );

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        legislation: {
          type: 'RESOLUCAO',
          number: '237',
          year: 1997,
          issuingBody: 'CONAMA',
          summary: null,
        },
        citedExcerpt: null,
      })
    );
  });

  it('sends the optional fields when filled', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderModal();

    await fillRequired(user);
    await user.type(
      screen.getByLabelText('Trecho citado (opcional)'),
      'art. 3º'
    );
    await user.click(
      screen.getByRole('button', { name: 'Adicionar legislação' })
    );

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        legislationId: 'legislation-123',
        legislation: {
          type: 'LEI',
          number: '12.305',
          year: 2010,
          issuingBody: 'Governo Federal',
          summary: null,
        },
        citedExcerpt: 'art. 3º',
      })
    );
  });

  it('creates a legislation without searching the catalog', async () => {
    const user = userEvent.setup();
    vi.mocked(searchLegislationCatalog).mockClear();
    const { onSubmit } = renderModal();

    await user.click(
      screen.getByRole('combobox', { name: 'Tipo da legislação' })
    );
    await user.click(await screen.findByRole('option', { name: 'Resolução' }));
    await user.type(screen.getByLabelText('Número *'), '237');
    await user.type(screen.getByLabelText('Ano *'), '1997');
    await user.type(screen.getByLabelText('Órgão emissor *'), 'CONAMA');
    await user.click(
      screen.getByRole('button', { name: 'Adicionar legislação' })
    );

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        legislation: {
          type: 'RESOLUCAO',
          number: '237',
          year: 1997,
          issuingBody: 'CONAMA',
          summary: null,
        },
        citedExcerpt: null,
      })
    );
    expect(searchLegislationCatalog).not.toHaveBeenCalled();
  });

  it('prefills the fields when editing', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderModal({ initialValue: INITIAL, mode: 'edit' });

    expect(
      screen.getByRole('heading', { name: 'Editar legislação' })
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Número *')).toHaveValue('237');
    expect(screen.getByLabelText('Ano *')).toHaveValue('1997');
    expect(screen.getByLabelText('Órgão emissor *')).toHaveValue('CONAMA');
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
