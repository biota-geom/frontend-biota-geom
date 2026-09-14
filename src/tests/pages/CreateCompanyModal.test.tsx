import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateCompanyModal } from '../../pages/admin/Companies/components/CreateCompanyModal';

/*
 * AdminCompaniesPage.test.tsx already covers the modal end to end (open,
 * cancel, incremental field validation, creating a custom ESG metric via the
 * quick-action CreateEsgMetricModal). This file stays on the pieces that are
 * CreateCompanyModal's own responsibility and are hard to exercise
 * meaningfully through the full page: every branch of the validation guard,
 * CNPJ/indicator-search trimming and casing, and exactly what gets reset on
 * cancel/submit. The quick-action modal's own form (validation, loading
 * state, error handling) is unit-tested in CreateEsgMetricModal.test.tsx.
 */

vi.mock('../../services/api/esgMetricsApi', () => ({
  createEsgMetric: vi.fn(),
}));

const esgMetricsApi = await import('../../services/api/esgMetricsApi');

type FormOverrides = Partial<{
  name: string;
  cnpj: string;
  sector: string;
  state: string;
  city: string;
  responsibleName: string;
  responsibleEmail: string;
}>;

const VALID_FORM = {
  name: 'Empresa Teste',
  cnpj: '12345678000199',
  sector: 'Siderurgia',
  state: 'RS',
  city: 'Porto Alegre',
  responsibleName: 'Maria Silva',
  responsibleEmail: 'maria@empresa.com',
};

async function fillForm(
  user: ReturnType<typeof userEvent.setup>,
  overrides: FormOverrides = {}
) {
  const values = { ...VALID_FORM, ...overrides };

  if (values.name) {
    await user.type(screen.getByLabelText(/nome da empresa/i), values.name);
  }
  if (values.cnpj) {
    await user.type(screen.getByLabelText(/cnpj/i), values.cnpj);
  }
  if (values.sector) {
    await user.selectOptions(screen.getByLabelText(/segmento/i), values.sector);
  }
  if (values.state) {
    await user.type(screen.getByLabelText(/^estado/i), values.state);
  }
  if (values.city) {
    await user.type(screen.getByLabelText(/^cidade/i), values.city);
  }
  if (values.responsibleName) {
    await user.type(
      screen.getByLabelText(/responsável ambiental/i),
      values.responsibleName
    );
  }
  if (values.responsibleEmail) {
    await user.type(
      screen.getByLabelText(/e-mail do responsável/i),
      values.responsibleEmail
    );
  }
}

function renderModal(isOpen = true) {
  const onClose = vi.fn();
  const onSubmit = vi.fn();
  const utils = render(
    <CreateCompanyModal isOpen={isOpen} onClose={onClose} onSubmit={onSubmit} />
  );
  return { ...utils, onClose, onSubmit };
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe('CreateCompanyModal validation', () => {
  const REQUIRED_FIELD_CASES = [
    { label: 'the company name is empty', overrides: { name: '' } },
    { label: 'the CNPJ is incomplete', overrides: { cnpj: '' } },
    { label: 'no sector is selected', overrides: { sector: '' } },
    { label: 'the state is empty', overrides: { state: '' } },
    { label: 'the city is empty', overrides: { city: '' } },
    {
      label: 'the responsible name is empty',
      overrides: { responsibleName: '' },
    },
    {
      label: 'the responsible email is invalid',
      overrides: { responsibleEmail: 'invalid-email' },
    },
  ];

  it.each(REQUIRED_FIELD_CASES)(
    'keeps submit disabled when $label',
    async ({ overrides }) => {
      const user = userEvent.setup();
      renderModal();

      await fillForm(user, overrides);

      expect(
        screen.getByRole('button', { name: /cadastrar empresa/i })
      ).toBeDisabled();
    }
  );

  const WHITESPACE_ONLY_CASES = [
    { label: 'the company name', overrides: { name: '   ' } },
    { label: 'the state', overrides: { state: '   ' } },
    { label: 'the city', overrides: { city: '   ' } },
    { label: 'the responsible name', overrides: { responsibleName: '   ' } },
  ];

  it.each(WHITESPACE_ONLY_CASES)(
    'keeps submit disabled when $label is only whitespace',
    async ({ overrides }) => {
      const user = userEvent.setup();
      renderModal();

      await fillForm(user, overrides);

      expect(
        screen.getByRole('button', { name: /cadastrar empresa/i })
      ).toBeDisabled();
    }
  );

  it('enables submit once every field is valid', async () => {
    const user = userEvent.setup();
    renderModal();

    await fillForm(user);

    expect(
      screen.getByRole('button', { name: /cadastrar empresa/i })
    ).toBeEnabled();
  });

  it('switches the sector select from muted placeholder styling to primary once a value is chosen', async () => {
    const user = userEvent.setup();
    renderModal();
    const sectorSelect = screen.getByLabelText(/segmento/i);

    expect(sectorSelect.className).toContain('text-text-muted');
    expect(sectorSelect.className).not.toContain('text-text-primary');

    await user.selectOptions(sectorSelect, 'Siderurgia');

    expect(sectorSelect.className).toContain('text-text-primary');
    expect(sectorSelect.className).not.toContain('text-text-muted');
  });
});

describe('CreateCompanyModal indicator search', () => {
  it('starts with the indicator dropdown closed', () => {
    renderModal();

    expect(screen.queryByText('Consumo de Água')).not.toBeInTheDocument();
  });

  it('filters indicators by a case-insensitive, whitespace-trimmed query', async () => {
    const user = userEvent.setup();
    renderModal();
    const search = screen.getByPlaceholderText(/buscar ou criar indicador/i);

    await user.click(search);
    await user.type(search, '  ÁGUA  ');

    expect(await screen.findByText('Consumo de Água')).toBeInTheDocument();
    expect(screen.queryByText('Geração de Resíduos')).not.toBeInTheDocument();
    expect(screen.queryByText('Emissão de CO₂')).not.toBeInTheDocument();
  });

  it('shows a not-found message when the search query matches no indicator', async () => {
    const user = userEvent.setup();
    renderModal();
    const search = screen.getByPlaceholderText(/buscar ou criar indicador/i);

    await user.click(search);
    await user.type(search, 'inexistente-xyz');

    expect(
      await screen.findByText(/nenhum indicador encontrado\. crie um abaixo\./i)
    ).toBeInTheDocument();
  });

  it('closes the indicator dropdown when Escape is pressed', async () => {
    const user = userEvent.setup();
    renderModal();
    const search = screen.getByPlaceholderText(/buscar ou criar indicador/i);

    await user.click(search);
    expect(await screen.findByText('Consumo de Água')).toBeInTheDocument();

    await user.keyboard('{Escape}');

    expect(screen.queryByText('Consumo de Água')).not.toBeInTheDocument();
  });

  it('keeps the indicator dropdown open for a key other than Escape', async () => {
    const user = userEvent.setup();
    renderModal();
    const search = screen.getByPlaceholderText(/buscar ou criar indicador/i);

    await user.click(search);
    expect(await screen.findByText('Consumo de Água')).toBeInTheDocument();

    // ArrowDown doesn't change the input's value, so only the keydown
    // handler is in play here (unlike typing, which also fires onChange
    // and would mask a guard that reacted to every key press).
    await user.keyboard('{ArrowDown}');

    expect(screen.getByText('Consumo de Água')).toBeInTheDocument();
  });

  it('removes only the targeted indicator, keeping the others selected', async () => {
    const user = userEvent.setup();
    renderModal();
    const search = screen.getByPlaceholderText(/buscar ou criar indicador/i);

    await user.click(search);
    await user.click(await screen.findByText('Consumo de Água'));
    await user.click(await screen.findByText('Geração de Resíduos'));

    await user.click(
      screen.getByRole('button', { name: /remover consumo de água/i })
    );

    expect(screen.queryByText('Consumo de Água')).not.toBeInTheDocument();
    expect(screen.getByText('Geração de Resíduos')).toBeInTheDocument();
  });
});

describe('CreateCompanyModal cancel', () => {
  it('resets the company fields and the indicator search when cancelled', async () => {
    const user = userEvent.setup();
    const { onClose } = renderModal();

    await user.type(
      screen.getByLabelText(/nome da empresa/i),
      'Empresa Descartada'
    );
    const search = screen.getByPlaceholderText(/buscar ou criar indicador/i);
    await user.click(search);
    await user.click(await screen.findByText('Consumo de Água'));
    expect(
      screen.getByRole('button', { name: /remover consumo de água/i })
    ).toBeInTheDocument();

    await user.click(search);
    await user.type(search, 'resíduos');

    await user.click(screen.getByRole('button', { name: /cancelar/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText(/nome da empresa/i)).toHaveValue('');
    expect(
      screen.getByPlaceholderText(/buscar ou criar indicador/i)
    ).toHaveValue('');
    expect(
      screen.queryByRole('button', { name: /remover consumo de água/i })
    ).not.toBeInTheDocument();

    await user.click(screen.getByPlaceholderText(/buscar ou criar indicador/i));
    expect(await screen.findByText('Consumo de Água')).toBeInTheDocument();
  });

  it('discards a newly created custom indicator when the company form is cancelled', async () => {
    vi.mocked(esgMetricsApi.createEsgMetric).mockResolvedValueOnce({
      id: 'metric-custom',
      name: 'Indicador Personalizado',
      unit: 'un',
    });
    const user = userEvent.setup();
    const { onClose } = renderModal();

    await user.click(
      screen.getByRole('button', { name: /\+ nova métrica customizada/i })
    );
    const metricDialog = screen.getByRole('dialog', {
      name: /nova métrica customizada/i,
    });
    await user.type(
      within(metricDialog).getByLabelText(/^nome$/i),
      'Indicador Personalizado'
    );
    await user.type(
      within(metricDialog).getByLabelText(/unidade de medida/i),
      'un'
    );
    await user.selectOptions(
      within(metricDialog).getByLabelText(/pilar/i),
      'SOCIAL'
    );
    await user.click(
      within(metricDialog).getByRole('button', { name: /^salvar$/i })
    );

    expect(
      await screen.findByRole('button', {
        name: /remover indicador personalizado/i,
      })
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /cancelar/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByText('Indicador Personalizado')
    ).not.toBeInTheDocument();

    await user.click(screen.getByPlaceholderText(/buscar ou criar indicador/i));
    expect(
      screen.queryByText('Indicador Personalizado')
    ).not.toBeInTheDocument();
  });

  it('also closes the still-open quick-action metric modal when the company form is cancelled', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(
      screen.getByRole('button', { name: /\+ nova métrica customizada/i })
    );
    expect(
      screen.getByRole('dialog', { name: /nova métrica customizada/i })
    ).toBeInTheDocument();

    // Two "Cancelar" buttons exist while the metric modal is open (its own
    // and the company form's); the company form's is first in DOM order.
    const [companyCancelButton] = screen.getAllByRole('button', {
      name: /cancelar/i,
    });
    await user.click(companyCancelButton);

    expect(
      screen.queryByRole('dialog', { name: /nova métrica customizada/i })
    ).not.toBeInTheDocument();
  });

  it('closes the indicator dropdown as part of the cancel reset, not just from losing focus', async () => {
    const user = userEvent.setup();
    renderModal();
    const search = screen.getByPlaceholderText(/buscar ou criar indicador/i);

    await user.click(search);
    expect(await screen.findByText('Consumo de Água')).toBeInTheDocument();

    // Use a raw fireEvent (not user.click) so the search input keeps DOM
    // focus and never blurs — isolating handleCancel's own explicit
    // setIsIndicatorMenuOpen(false) from the dropdown's onBlur handler.
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));

    expect(screen.queryByText('Consumo de Água')).not.toBeInTheDocument();
  });
});

describe('CreateCompanyModal submit', () => {
  it('prevents the default form submission even when the form is invalid', () => {
    const { container } = renderModal();
    const form = container.querySelector('form');
    if (!form) throw new Error('form not found');

    expect(fireEvent.submit(form)).toBe(false);
  });

  it('does not call onSubmit when the form is submitted directly while invalid', () => {
    const { container, onSubmit } = renderModal();
    const form = container.querySelector('form');
    if (!form) throw new Error('form not found');

    fireEvent.submit(form);

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits a trimmed, correctly-shaped payload and resets the form', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderModal();

    await fillForm(user, {
      name: '  Empresa Teste  ',
      state: '  RS  ',
      city: '  Porto Alegre  ',
      responsibleName: '  Maria Silva  ',
    });

    const search = screen.getByPlaceholderText(/buscar ou criar indicador/i);
    await user.click(search);
    await user.click(await screen.findByText('Consumo de Água'));

    await user.click(
      screen.getByRole('button', { name: /cadastrar empresa/i })
    );

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Empresa Teste',
      document: '12345678000199',
      document_type: 'cnpj',
      sector_id: 'uuid-siderurgia',
      address: { type: 'billing', state: 'RS', city: 'Porto Alegre' },
      responsible_name: 'Maria Silva',
      responsible_email: 'maria@empresa.com',
      esg_indicator_ids: ['uuid-agua'],
    });
    expect(screen.getByLabelText(/nome da empresa/i)).toHaveValue('');
  });
});
