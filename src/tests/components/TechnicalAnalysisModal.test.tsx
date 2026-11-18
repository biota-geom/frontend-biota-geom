import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MOCK_LICENSE_LEGISLATIONS } from '../../features/legislation/legislations.mock';
import { ApiError } from '../../services/api/apiError';

vi.mock('../../services/api/legislationsApi', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('../../services/api/legislationsApi')
  >()),
  updateLicenseLegislation: vi.fn(),
}));

const legislationsApi = await import('../../services/api/legislationsApi');
const { TechnicalAnalysisModal } =
  await import('../../pages/company/LicenseDetails/components/TechnicalAnalysisModal');

const EMPTY = legislationsApi.toLicenseLegislation({
  ...MOCK_LICENSE_LEGISLATIONS[0],
  technical_analysis: null,
});
const WITH_ANALYSIS = legislationsApi.toLicenseLegislation({
  ...MOCK_LICENSE_LEGISLATIONS[0],
  technical_analysis: 'Exige novo plano de resíduos.',
});

function renderModal(
  item: typeof EMPTY | null = EMPTY,
  canEdit: boolean | undefined = undefined
) {
  const onOpenChange = vi.fn();
  const onSaved = vi.fn();
  render(
    <TechnicalAnalysisModal
      canEdit={canEdit}
      item={item}
      licenseId="license-1"
      onOpenChange={onOpenChange}
      onSaved={onSaved}
    />
  );

  return { onOpenChange, onSaved };
}

describe('TechnicalAnalysisModal', () => {
  beforeEach(() => vi.resetAllMocks());

  it('renders nothing without an item', () => {
    const { container } = render(
      <TechnicalAnalysisModal
        item={null}
        licenseId="license-1"
        onOpenChange={vi.fn()}
        onSaved={vi.fn()}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('shows the empty state and a button to write the analysis', () => {
    renderModal(EMPTY);

    expect(
      screen.getByText('Nenhuma análise técnica registrada')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Escrever análise' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Editar' })
    ).not.toBeInTheDocument();
  });

  it('shows the saved text with an edit button', () => {
    renderModal(WITH_ANALYSIS);

    expect(
      screen.getByText('Exige novo plano de resíduos.')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument();
    expect(
      screen.queryByText('Nenhuma análise técnica registrada')
    ).not.toBeInTheDocument();
  });

  it('hides the edit actions when the license is archived', () => {
    renderModal(WITH_ANALYSIS, false);

    expect(
      screen.queryByRole('button', { name: 'Editar' })
    ).not.toBeInTheDocument();
    renderModal(EMPTY, false);
    expect(
      screen.queryByRole('button', { name: 'Escrever análise' })
    ).not.toBeInTheDocument();
  });

  it('writes a new analysis and reports it as saved', async () => {
    vi.mocked(legislationsApi.updateLicenseLegislation).mockResolvedValue({
      ...EMPTY,
      technicalAnalysis: 'Nova análise.',
    });
    const user = userEvent.setup();
    const { onSaved } = renderModal(EMPTY);

    await user.click(screen.getByRole('button', { name: 'Escrever análise' }));
    await user.type(
      screen.getByLabelText('Texto da análise'),
      '  Nova análise. '
    );
    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() =>
      expect(legislationsApi.updateLicenseLegislation).toHaveBeenCalledWith(
        'license-1',
        EMPTY.id,
        { technicalAnalysis: 'Nova análise.' }
      )
    );
    expect(onSaved).toHaveBeenCalledWith(EMPTY, 'Nova análise.');
  });

  it('edits starting from the saved text', async () => {
    const user = userEvent.setup();
    renderModal(WITH_ANALYSIS);

    await user.click(screen.getByRole('button', { name: 'Editar' }));

    expect(screen.getByLabelText('Texto da análise')).toHaveValue(
      'Exige novo plano de resíduos.'
    );
  });

  it('saves a blank text as null to clear the analysis', async () => {
    vi.mocked(legislationsApi.updateLicenseLegislation).mockResolvedValue({
      ...WITH_ANALYSIS,
      technicalAnalysis: null,
    });
    const user = userEvent.setup();
    const { onSaved } = renderModal(WITH_ANALYSIS);

    await user.click(screen.getByRole('button', { name: 'Editar' }));
    await user.clear(screen.getByLabelText('Texto da análise'));
    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() =>
      expect(legislationsApi.updateLicenseLegislation).toHaveBeenCalledWith(
        'license-1',
        WITH_ANALYSIS.id,
        { technicalAnalysis: null }
      )
    );
    expect(onSaved).toHaveBeenCalledWith(WITH_ANALYSIS, null);
  });

  it('caps the text at 10.000 characters and shows the counter', async () => {
    const user = userEvent.setup();
    renderModal(EMPTY);

    await user.click(screen.getByRole('button', { name: 'Escrever análise' }));

    expect(screen.getByLabelText('Texto da análise')).toHaveAttribute(
      'maxlength',
      '10000'
    );
    expect(screen.getByText('0/10.000')).toBeInTheDocument();
  });

  it('cancels the edit without saving', async () => {
    const user = userEvent.setup();
    renderModal(WITH_ANALYSIS);

    await user.click(screen.getByRole('button', { name: 'Editar' }));
    await user.type(screen.getByLabelText('Texto da análise'), ' extra');
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(legislationsApi.updateLicenseLegislation).not.toHaveBeenCalled();
    expect(
      screen.getByText('Exige novo plano de resíduos.')
    ).toBeInTheDocument();
  });

  it('shows the API error and stays in edit mode when saving fails', async () => {
    vi.mocked(legislationsApi.updateLicenseLegislation).mockRejectedValue(
      new ApiError(404, 'Licença não encontrada.')
    );
    const user = userEvent.setup();
    const { onSaved } = renderModal(EMPTY);

    await user.click(screen.getByRole('button', { name: 'Escrever análise' }));
    await user.type(screen.getByLabelText('Texto da análise'), 'Texto');
    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Licença não encontrada.'
    );
    expect(screen.getByLabelText('Texto da análise')).toHaveValue('Texto');
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('shows a generic error for unexpected failures', async () => {
    vi.mocked(legislationsApi.updateLicenseLegislation).mockRejectedValue(
      new Error('boom')
    );
    const user = userEvent.setup();
    renderModal(EMPTY);

    await user.click(screen.getByRole('button', { name: 'Escrever análise' }));
    await user.type(screen.getByLabelText('Texto da análise'), 'Texto');
    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível salvar a análise técnica.'
    );
  });
});
