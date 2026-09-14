import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateEsgMetricModal } from '../../pages/admin/Companies/components/CreateEsgMetricModal';
import { ApiError } from '../../services/api/apiError';

/*
 * CreateCompanyModal.test.tsx and AdminCompaniesPage.test.tsx already cover
 * this modal's integration with the company form (opening it from the
 * quick-action button, selecting the created metric as a chip, discarding it
 * on cancel). This file unit-tests CreateEsgMetricModal in isolation: every
 * branch of the validation guard, the trimmed payload, the loading state,
 * both error paths, and exactly what gets reset on cancel/submit.
 */

vi.mock('../../services/api/esgMetricsApi', () => ({
  createEsgMetric: vi.fn(),
}));

const esgMetricsApi = await import('../../services/api/esgMetricsApi');

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function renderModal(isOpen = true) {
  const onClose = vi.fn();
  const onCreated = vi.fn();
  const utils = render(
    <CreateEsgMetricModal
      isOpen={isOpen}
      onClose={onClose}
      onCreated={onCreated}
    />
  );
  return { ...utils, onClose, onCreated };
}

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/^nome$/i), 'Consumo de Gás');
  await user.type(screen.getByLabelText(/unidade de medida/i), 'm³');
  await user.selectOptions(screen.getByLabelText(/pilar/i), 'AMBIENTAL');
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe('CreateEsgMetricModal visibility', () => {
  it('renders nothing when isOpen is false', () => {
    const { container } = renderModal(false);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the dialog with its title when open', () => {
    renderModal();

    expect(
      screen.getByRole('dialog', { name: /nova métrica customizada/i })
    ).toBeInTheDocument();
  });

  it('does not render an error message before any attempt', () => {
    const { container } = renderModal();

    expect(container.querySelector('.text-red-500')).not.toBeInTheDocument();
  });
});

describe('CreateEsgMetricModal validation', () => {
  it('keeps "Salvar" disabled while every field is empty', () => {
    renderModal();

    expect(screen.getByRole('button', { name: /^salvar$/i })).toBeDisabled();
  });

  it('keeps "Salvar" disabled while the name is only whitespace', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(screen.getByLabelText(/^nome$/i), '   ');
    await user.type(screen.getByLabelText(/unidade de medida/i), 'kg');
    await user.selectOptions(screen.getByLabelText(/pilar/i), 'AMBIENTAL');

    expect(screen.getByRole('button', { name: /^salvar$/i })).toBeDisabled();
  });

  it('keeps "Salvar" disabled while the unit is only whitespace', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(screen.getByLabelText(/^nome$/i), 'Consumo de Gás');
    await user.type(screen.getByLabelText(/unidade de medida/i), '   ');
    await user.selectOptions(screen.getByLabelText(/pilar/i), 'AMBIENTAL');

    expect(screen.getByRole('button', { name: /^salvar$/i })).toBeDisabled();
  });

  it('keeps "Salvar" disabled while no pillar is selected', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(screen.getByLabelText(/^nome$/i), 'Consumo de Gás');
    await user.type(screen.getByLabelText(/unidade de medida/i), 'kg');

    expect(screen.getByRole('button', { name: /^salvar$/i })).toBeDisabled();
  });

  it('enables "Salvar" once every field is valid', async () => {
    const user = userEvent.setup();
    renderModal();

    await fillValidForm(user);

    expect(screen.getByRole('button', { name: /^salvar$/i })).toBeEnabled();
  });

  it('switches the pillar select from muted placeholder styling to primary once a value is chosen', async () => {
    const user = userEvent.setup();
    renderModal();
    const pillarSelect = screen.getByLabelText(/pilar/i);

    expect(pillarSelect.className).toContain('text-text-muted');
    expect(pillarSelect.className).not.toContain('text-text-primary');

    await user.selectOptions(pillarSelect, 'AMBIENTAL');

    expect(pillarSelect.className).toContain('text-text-primary');
    expect(pillarSelect.className).not.toContain('text-text-muted');
  });
});

describe('CreateEsgMetricModal submit', () => {
  it('prevents the default form submission even when the form is invalid', () => {
    const { container } = renderModal();
    const form = container.querySelector('form');
    if (!form) throw new Error('form not found');

    expect(fireEvent.submit(form)).toBe(false);
  });

  it('does not call createEsgMetric when submitted directly while invalid', () => {
    const { container } = renderModal();
    const form = container.querySelector('form');
    if (!form) throw new Error('form not found');

    form.requestSubmit();

    expect(esgMetricsApi.createEsgMetric).not.toHaveBeenCalled();
  });

  it('trims the payload, shows a loading state, then resets the form and calls onCreated', async () => {
    const deferred = createDeferred<{
      id: string;
      name: string;
      unit: string;
    }>();
    vi.mocked(esgMetricsApi.createEsgMetric).mockReturnValue(deferred.promise);
    const user = userEvent.setup();
    const { onCreated } = renderModal();

    await user.type(screen.getByLabelText(/^nome$/i), '  Consumo de Gás  ');
    await user.type(screen.getByLabelText(/unidade de medida/i), '  m³  ');
    await user.selectOptions(screen.getByLabelText(/pilar/i), 'AMBIENTAL');
    await user.click(screen.getByRole('button', { name: /^salvar$/i }));

    expect(esgMetricsApi.createEsgMetric).toHaveBeenCalledWith({
      name: 'Consumo de Gás',
      unit: 'm³',
      pillar: 'AMBIENTAL',
    });
    expect(screen.getByRole('button', { name: /salvando/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeDisabled();

    const created = { id: 'metric-gas', name: 'Consumo de Gás', unit: 'm³' };
    deferred.resolve(created);

    await waitFor(() => {
      expect(onCreated).toHaveBeenCalledWith(created);
    });
    // Fields are cleared on success, so the button goes back to its default
    // label but stays disabled again (now because the inputs are empty, not
    // because of the loading state).
    expect(screen.getByRole('button', { name: /^salvar$/i })).toBeDisabled();
    expect(screen.getByLabelText(/^nome$/i)).toHaveValue('');
    expect(screen.getByLabelText(/unidade de medida/i)).toHaveValue('');
    expect(screen.getByLabelText(/pilar/i)).toHaveValue('');
  });

  it('shows the ApiError message when creation fails with an ApiError', async () => {
    vi.mocked(esgMetricsApi.createEsgMetric).mockRejectedValueOnce(
      new ApiError(400, 'Já existe uma métrica com esse nome.')
    );
    const user = userEvent.setup();
    const { onCreated } = renderModal();

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: /^salvar$/i }));

    expect(
      await screen.findByText(/já existe uma métrica com esse nome\./i)
    ).toBeInTheDocument();
    expect(onCreated).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^salvar$/i })).toBeEnabled();
    });
  });

  it('shows a generic error message when creation fails without an ApiError', async () => {
    vi.mocked(esgMetricsApi.createEsgMetric).mockRejectedValueOnce(
      new Error('network down')
    );
    const user = userEvent.setup();
    renderModal();

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: /^salvar$/i }));

    expect(
      await screen.findByText(/não foi possível criar a métrica\./i)
    ).toBeInTheDocument();
  });

  it('clears a previous error after a successful retry', async () => {
    vi.mocked(esgMetricsApi.createEsgMetric).mockRejectedValueOnce(
      new ApiError(400, 'Não foi possível criar a métrica.')
    );
    const user = userEvent.setup();
    renderModal();

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: /^salvar$/i }));

    expect(
      await screen.findByText(/não foi possível criar a métrica\./i)
    ).toBeInTheDocument();

    vi.mocked(esgMetricsApi.createEsgMetric).mockResolvedValueOnce({
      id: 'metric-gas',
      name: 'Consumo de Gás',
      unit: 'm³',
    });
    await user.click(screen.getByRole('button', { name: /^salvar$/i }));

    await waitFor(() => {
      expect(
        screen.queryByText(/não foi possível criar a métrica\./i)
      ).not.toBeInTheDocument();
    });
  });
});

describe('CreateEsgMetricModal cancel', () => {
  it('resets the form and any error, then calls onClose', async () => {
    vi.mocked(esgMetricsApi.createEsgMetric).mockRejectedValueOnce(
      new ApiError(400, 'Não foi possível criar a métrica.')
    );
    const user = userEvent.setup();
    const { onClose } = renderModal();

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: /^salvar$/i }));
    expect(
      await screen.findByText(/não foi possível criar a métrica\./i)
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /cancelar/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText(/^nome$/i)).toHaveValue('');
    expect(screen.getByLabelText(/unidade de medida/i)).toHaveValue('');
    expect(screen.getByLabelText(/pilar/i)).toHaveValue('');
    expect(
      screen.queryByText(/não foi possível criar a métrica\./i)
    ).not.toBeInTheDocument();
  });

  it('ignores an overlay click while a save is in flight', async () => {
    const deferred = createDeferred<{
      id: string;
      name: string;
      unit: string;
    }>();
    vi.mocked(esgMetricsApi.createEsgMetric).mockReturnValue(deferred.promise);
    const user = userEvent.setup();
    const { onClose } = renderModal();

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: /^salvar$/i }));
    expect(screen.getByRole('button', { name: /salvando/i })).toBeDisabled();

    // The Cancel button is disabled while saving, so exercise handleCancel's
    // own isSaving guard directly through the overlay, which has no such
    // disabled state and would otherwise let a stale cancel through mid-save.
    fireEvent.click(screen.getByRole('dialog'));

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/^nome$/i)).toHaveValue('Consumo de Gás');

    deferred.resolve({ id: 'metric-gas', name: 'Consumo de Gás', unit: 'm³' });
    await waitFor(() => {
      expect(screen.getByLabelText(/^nome$/i)).toHaveValue('');
    });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls onClose when clicking the close ("x") button', async () => {
    const user = userEvent.setup();
    const { onClose } = renderModal();

    await user.click(screen.getByRole('button', { name: /fechar/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when clicking the overlay', async () => {
    const user = userEvent.setup();
    const { onClose } = renderModal();

    await user.click(screen.getByRole('dialog'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when clicking inside the dialog panel', async () => {
    const user = userEvent.setup();
    const { onClose } = renderModal();

    await user.click(
      screen.getByRole('heading', { name: /nova métrica customizada/i })
    );

    expect(onClose).not.toHaveBeenCalled();
  });
});
