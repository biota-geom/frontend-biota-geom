import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateCompanyModal } from '../../pages/admin/Companies/components/CreateCompanyModal';
import { ApiError } from '../../services/api/apiError';

/*
 * AdminCompaniesPage.test.tsx already covers the modal end to end (open,
 * cancel, incremental field validation, creating an indicator via a real
 * POST). This file stays on the pieces that are CreateCompanyModal's own
 * responsibility and are hard to exercise meaningfully through the full
 * page: every branch of the validation guard, CNPJ/indicator-search
 * trimming and casing, the indicator-creation loading state, and exactly
 * what gets reset on cancel/submit.
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

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
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

describe('CreateCompanyModal indicator creation', () => {
  it('does not render an indicator-creation error message before any attempt', () => {
    const { container } = renderModal();

    expect(container.querySelector('.text-red-500')).not.toBeInTheDocument();
  });

  it('keeps "Criar" disabled while the new indicator name is only whitespace', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(
      screen.getByPlaceholderText(/nome do novo indicador/i),
      '   '
    );
    await user.type(screen.getByPlaceholderText(/unidade/i), 'kg');
    await user.selectOptions(screen.getByDisplayValue(/pilar/i), 'AMBIENTAL');

    expect(screen.getByRole('button', { name: /^criar$/i })).toBeDisabled();
  });

  it('keeps "Criar" disabled while the new indicator unit is only whitespace', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(
      screen.getByPlaceholderText(/nome do novo indicador/i),
      'Consumo de Gás'
    );
    await user.type(screen.getByPlaceholderText(/unidade/i), '   ');
    await user.selectOptions(screen.getByDisplayValue(/pilar/i), 'AMBIENTAL');

    expect(screen.getByRole('button', { name: /^criar$/i })).toBeDisabled();
  });

  it('switches the pillar select from muted placeholder styling to primary once a value is chosen', async () => {
    const user = userEvent.setup();
    renderModal();
    const pillarSelect = screen.getByDisplayValue(/pilar/i);

    expect(pillarSelect.className).toContain('text-text-muted');
    expect(pillarSelect.className).not.toContain('text-text-primary');

    await user.selectOptions(pillarSelect, 'AMBIENTAL');

    expect(pillarSelect.className).toContain('text-text-primary');
    expect(pillarSelect.className).not.toContain('text-text-muted');
  });

  it('shows a loading state while creating, trims the payload, then resets and selects the new indicator', async () => {
    const deferred = createDeferred<{
      id: string;
      name: string;
      unit: string;
    }>();
    vi.mocked(esgMetricsApi.createEsgMetric).mockReturnValue(deferred.promise);
    const user = userEvent.setup();
    renderModal();

    await user.type(
      screen.getByPlaceholderText(/nome do novo indicador/i),
      '  Consumo de Gás  '
    );
    await user.type(screen.getByPlaceholderText(/unidade/i), '  m³  ');
    await user.selectOptions(screen.getByDisplayValue(/pilar/i), 'AMBIENTAL');
    await user.click(screen.getByRole('button', { name: /^criar$/i }));

    expect(esgMetricsApi.createEsgMetric).toHaveBeenCalledWith({
      name: 'Consumo de Gás',
      unit: 'm³',
      pillar: 'AMBIENTAL',
    });
    expect(screen.getByRole('button', { name: /criando/i })).toBeDisabled();

    deferred.resolve({ id: 'metric-gas', name: 'Consumo de Gás', unit: 'm³' });

    // Fields are cleared on success, so the button goes back to its default
    // label but stays disabled (now because the inputs are empty again, not
    // because of the loading state).
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /^criar$/i })
      ).toBeInTheDocument();
    });
    expect(screen.getByText('Consumo de Gás')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/nome do novo indicador/i)).toHaveValue(
      ''
    );
    expect(screen.getByPlaceholderText(/unidade/i)).toHaveValue('');
    expect(screen.getByDisplayValue(/^pilar\.\.\.$/i)).toBeInTheDocument();
  });

  it('shows a loading state, then a generic error, when creation fails without an ApiError', async () => {
    const deferred = createDeferred<{
      id: string;
      name: string;
      unit: string;
    }>();
    vi.mocked(esgMetricsApi.createEsgMetric).mockReturnValue(deferred.promise);
    const user = userEvent.setup();
    renderModal();

    await user.type(
      screen.getByPlaceholderText(/nome do novo indicador/i),
      'Consumo de Gás'
    );
    await user.type(screen.getByPlaceholderText(/unidade/i), 'm³');
    await user.selectOptions(screen.getByDisplayValue(/pilar/i), 'AMBIENTAL');
    await user.click(screen.getByRole('button', { name: /^criar$/i }));

    expect(screen.getByRole('button', { name: /criando/i })).toBeDisabled();

    deferred.reject(new Error('network down'));

    expect(
      await screen.findByText(/não foi possível criar o indicador\./i)
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^criar$/i })).toBeEnabled();
    });
  });

  it('clears a previous indicator error after a successful retry', async () => {
    vi.mocked(esgMetricsApi.createEsgMetric).mockRejectedValueOnce(
      new ApiError(400, 'Não foi possível criar o indicador.')
    );
    const user = userEvent.setup();
    renderModal();

    await user.type(
      screen.getByPlaceholderText(/nome do novo indicador/i),
      'Consumo de Gás'
    );
    await user.type(screen.getByPlaceholderText(/unidade/i), 'm³');
    await user.selectOptions(screen.getByDisplayValue(/pilar/i), 'AMBIENTAL');
    await user.click(screen.getByRole('button', { name: /^criar$/i }));

    expect(
      await screen.findByText(/não foi possível criar o indicador\./i)
    ).toBeInTheDocument();

    vi.mocked(esgMetricsApi.createEsgMetric).mockResolvedValueOnce({
      id: 'metric-gas',
      name: 'Consumo de Gás',
      unit: 'm³',
    });
    await user.click(screen.getByRole('button', { name: /^criar$/i }));

    await waitFor(() => {
      expect(
        screen.queryByText(/não foi possível criar o indicador\./i)
      ).not.toBeInTheDocument();
    });
  });
});

describe('CreateCompanyModal cancel', () => {
  it('resets every field, the indicator catalog, and any error when cancelled', async () => {
    const user = userEvent.setup();
    const { onClose } = renderModal();

    vi.mocked(esgMetricsApi.createEsgMetric).mockResolvedValueOnce({
      id: 'metric-custom',
      name: 'Indicador Personalizado',
      unit: 'un',
    });
    await user.type(
      screen.getByPlaceholderText(/nome do novo indicador/i),
      'Indicador Personalizado'
    );
    await user.type(screen.getByPlaceholderText(/unidade/i), 'un');
    await user.selectOptions(screen.getByDisplayValue(/pilar/i), 'SOCIAL');
    await user.click(screen.getByRole('button', { name: /^criar$/i }));
    expect(
      await screen.findByText('Indicador Personalizado')
    ).toBeInTheDocument();

    await user.type(
      screen.getByLabelText(/nome da empresa/i),
      'Empresa Descartada'
    );
    const search = screen.getByPlaceholderText(/buscar ou criar indicador/i);
    await user.click(search);
    await user.type(search, 'água');

    vi.mocked(esgMetricsApi.createEsgMetric).mockRejectedValueOnce(
      new ApiError(400, 'Não foi possível criar o indicador.')
    );
    await user.type(
      screen.getByPlaceholderText(/nome do novo indicador/i),
      'Rascunho'
    );
    await user.type(screen.getByPlaceholderText(/unidade/i), 'kg');
    await user.selectOptions(screen.getByDisplayValue(/pilar/i), 'AMBIENTAL');
    await user.click(screen.getByRole('button', { name: /^criar$/i }));
    expect(
      await screen.findByText(/não foi possível criar o indicador\./i)
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /cancelar/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText(/nome da empresa/i)).toHaveValue('');
    expect(
      screen.getByPlaceholderText(/buscar ou criar indicador/i)
    ).toHaveValue('');
    expect(screen.getByPlaceholderText(/nome do novo indicador/i)).toHaveValue(
      ''
    );
    expect(screen.getByPlaceholderText(/unidade/i)).toHaveValue('');
    expect(screen.getByDisplayValue(/^pilar\.\.\.$/i)).toBeInTheDocument();
    expect(
      screen.queryByText(/não foi possível criar o indicador\./i)
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('Indicador Personalizado')
    ).not.toBeInTheDocument();

    await user.click(screen.getByPlaceholderText(/buscar ou criar indicador/i));
    expect(
      screen.queryByText('Indicador Personalizado')
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
