import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { LicenseExtraction } from '../../features/licenses/types';
import { NewLicenseModal } from '../../pages/company/Licenses/components/NewLicenseModal';
import { ApiError } from '../../services/api/apiError';

vi.mock('../../services/api/licensesApi', () => ({
  createLicense: vi.fn(),
  extractLicenseData: vi.fn(),
}));
vi.mock('../../services/api/licenseConditionsApi', () => ({
  createLicenseConditions: vi.fn(),
}));

const licensesApi = await import('../../services/api/licensesApi');
const licenseConditionsApi =
  await import('../../services/api/licenseConditionsApi');

const COMPANY_ID = 'customer-1';

const EXTRACTION: LicenseExtraction = {
  extractedData: {
    type: 'LO',
    processNumber: 'LU Nº 00865/2022',
    issuingAgency: 'FEPAM',
    issueDate: '2022-04-28',
    expirationDate: '2027-04-29',
  },
  suggestedConditions: [
    {
      environmentalDescriptor: 'Resíduos Perigosos',
      description: 'O transporte deverá ser acompanhado do MTR.',
      conditionType: 'INFORMATIVE',
      periodicity: null,
      dueDate: null,
    },
    {
      environmentalDescriptor: 'Empreendimento',
      description: 'Apresentar relatório anual de frota.',
      conditionType: 'PERIODIC',
      periodicity: 'ANNUAL',
      dueDate: '2026-12-31',
    },
  ],
};

const CREATED_LICENSE = {
  id: 'license-9',
  customerId: COMPANY_ID,
  type: 'LO',
  processNumber: 'LU Nº 00865/2022',
  issuingAgency: 'FEPAM',
  issueDate: '2022-04-28T00:00:00.000Z',
  expirationDate: '2027-04-29T00:00:00.000Z',
  status: 'Regular',
  documentUrl: 'https://bucket.aws.com/licenses/lu.pdf',
  createdAt: '2026-10-25T00:00:00.000Z',
};

function pdfFile() {
  return new File(['%PDF-1.4'], 'licenca.pdf', { type: 'application/pdf' });
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function renderModal() {
  const onOpenChange = vi.fn();
  render(
    <NewLicenseModal companyId={COMPANY_ID} onOpenChange={onOpenChange} open />
  );
  return { onOpenChange };
}

async function uploadPdf(user: ReturnType<typeof userEvent.setup>) {
  await user.upload(screen.getByLabelText(/upload de arquivo/i), pdfFile());
}

describe('NewLicenseModal — AI pre-fill', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('reads the PDF on upload, shows "Lendo documento…" and pre-fills the recognized fields', async () => {
    const user = userEvent.setup();
    const reading = deferred<LicenseExtraction>();
    vi.mocked(licensesApi.extractLicenseData).mockReturnValue(reading.promise);
    renderModal();

    await uploadPdf(user);

    expect(await screen.findByText('Lendo documento…')).toBeInTheDocument();
    expect(licensesApi.extractLicenseData).toHaveBeenCalledWith(
      expect.any(File)
    );

    reading.resolve(EXTRACTION);

    expect(
      await screen.findByText('Revise os dados sugeridos pela IA')
    ).toBeInTheDocument();
    expect(screen.queryByText('Lendo documento…')).not.toBeInTheDocument();
    expect(screen.getByLabelText(/nº do processo/i)).toHaveValue(
      'LU Nº 00865/2022'
    );
    expect(screen.getByLabelText(/data de emissão/i)).toHaveValue('2022-04-28');
    expect(screen.getByLabelText(/data de validade/i)).toHaveValue(
      '2027-04-29'
    );
    expect(screen.getByLabelText(/tipo de licença/i)).toHaveValue('LO');
    expect(screen.getByLabelText(/órgão emissor/i)).toHaveValue('FEPAM');
    // Nothing is saved by the extraction itself.
    expect(licensesApi.createLicense).not.toHaveBeenCalled();
    expect(licenseConditionsApi.createLicenseConditions).not.toHaveBeenCalled();
  });

  it('does not overwrite a field the user already filled', async () => {
    const user = userEvent.setup();
    vi.mocked(licensesApi.extractLicenseData).mockResolvedValue(EXTRACTION);
    renderModal();

    await user.type(screen.getByLabelText(/nº do processo/i), 'Meu número');
    await uploadPdf(user);

    expect(
      await screen.findByText('Revise os dados sugeridos pela IA')
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/nº do processo/i)).toHaveValue('Meu número');
    expect(screen.getByLabelText(/data de emissão/i)).toHaveValue('2022-04-28');
  });

  it('fills type and issuing agency as printed in the document, since both are free text', async () => {
    const user = userEvent.setup();
    vi.mocked(licensesApi.extractLicenseData).mockResolvedValue({
      ...EXTRACTION,
      extractedData: {
        ...EXTRACTION.extractedData,
        type: 'LAO',
        issuingAgency: 'Secretaria Municipal do Meio Ambiente',
      },
    });
    renderModal();

    await uploadPdf(user);

    expect(
      await screen.findByText('Revise os dados sugeridos pela IA')
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/tipo de licença/i)).toHaveValue('LAO');
    expect(screen.getByLabelText(/órgão emissor/i)).toHaveValue(
      'Secretaria Municipal do Meio Ambiente'
    );
  });

  it('adds the suggested conditions to the conditions table, flagging missing data', async () => {
    const user = userEvent.setup();
    vi.mocked(licensesApi.extractLicenseData).mockResolvedValue(EXTRACTION);
    renderModal();

    await uploadPdf(user);

    // Same table as manual conditions: grouped and numbered by descriptor.
    expect(await screen.findByText('Resíduos Perigosos')).toBeInTheDocument();
    expect(screen.getByText('Empreendimento')).toBeInTheDocument();
    expect(
      screen.getByText('O transporte deverá ser acompanhado do MTR.')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Editar condicionante 1.1' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Remover condicionante 2.1' })
    ).toBeInTheDocument();

    // No responsible (both) and no deadline (first) in the document.
    expect(screen.getAllByText('Preencher')).toHaveLength(3);
    expect(
      screen.getByText(/2 condicionantes estão com dados pendentes/i)
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /salvar licença/i })
      ).toBeDisabled()
    );
  });

  it('completes a suggestion with the edit button, removes another with the trash and saves through the existing routes', async () => {
    const user = userEvent.setup();
    vi.mocked(licensesApi.extractLicenseData).mockResolvedValue(EXTRACTION);
    vi.mocked(licensesApi.createLicense).mockResolvedValue(CREATED_LICENSE);
    vi.mocked(licenseConditionsApi.createLicenseConditions).mockResolvedValue(
      undefined
    );
    const { onOpenChange } = renderModal();

    await uploadPdf(user);
    expect(
      await screen.findByText('Revise os dados sugeridos pela IA')
    ).toBeInTheDocument();

    await user.click(
      await screen.findByRole('button', { name: 'Remover condicionante 1.1' })
    );

    await user.click(
      screen.getByRole('button', { name: 'Editar condicionante 1.1' })
    );
    const dialog = screen.getByRole('dialog', {
      name: 'Editar Condicionante',
    });
    expect(within(dialog).getByLabelText('Descritor ambiental')).toHaveValue(
      'Empreendimento'
    );
    expect(within(dialog).getByLabelText('Descrição')).toHaveValue(
      'Apresentar relatório anual de frota.'
    );
    expect(within(dialog).getByLabelText('Prazo')).toHaveValue('2026-12-31');
    await user.type(within(dialog).getByLabelText('Responsável'), 'Ana Souza');
    await user.click(
      within(dialog).getByRole('button', { name: 'Salvar Alterações' })
    );

    expect(screen.queryByText('Preencher')).not.toBeInTheDocument();
    expect(screen.getByText('Ana Souza')).toBeInTheDocument();

    const saveButton = screen.getByRole('button', { name: /salvar licença/i });
    await waitFor(() => expect(saveButton).toBeEnabled());
    await user.click(saveButton);

    await waitFor(() =>
      expect(licenseConditionsApi.createLicenseConditions).toHaveBeenCalledWith(
        COMPANY_ID,
        'license-9',
        [
          {
            environmentalDescriptor: 'Empreendimento',
            description: 'Apresentar relatório anual de frota.',
            conditionType: 'PERIODIC',
            periodicity: 'ANNUAL',
            deadline: '2026-12-31T00:00:00.000Z',
            responsibleName: 'Ana Souza',
            hasDelivery: true,
          },
        ]
      )
    );
    expect(licensesApi.createLicense).toHaveBeenCalledWith(COMPANY_ID, {
      type: 'LO',
      processNumber: 'LU Nº 00865/2022',
      issuingAgency: 'FEPAM',
      issueDate: '2022-04-28',
      expirationDate: '2027-04-29',
      documentFile: expect.any(File),
    });
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  }, 20_000);

  it('keeps the edit dialog open with errors when a required field is still empty', async () => {
    const user = userEvent.setup();
    vi.mocked(licensesApi.extractLicenseData).mockResolvedValue(EXTRACTION);
    renderModal();

    await uploadPdf(user);
    await user.click(
      await screen.findByRole('button', { name: 'Editar condicionante 1.1' })
    );
    const dialog = screen.getByRole('dialog', {
      name: 'Editar Condicionante',
    });
    await user.click(
      within(dialog).getByRole('button', { name: 'Salvar Alterações' })
    );

    expect(within(dialog).getByText('Informe o prazo.')).toBeInTheDocument();
    expect(
      within(dialog).getByText('Informe o responsável.')
    ).toBeInTheDocument();
  });

  it('groups a suggestion without descriptor until the user sets one', async () => {
    const user = userEvent.setup();
    vi.mocked(licensesApi.extractLicenseData).mockResolvedValue({
      ...EXTRACTION,
      suggestedConditions: [
        { ...EXTRACTION.suggestedConditions[1], environmentalDescriptor: null },
      ],
    });
    renderModal();

    await uploadPdf(user);
    expect(
      await screen.findByText('Sem descritor ambiental')
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'Editar condicionante 1.1' })
    );
    const dialog = screen.getByRole('dialog', {
      name: 'Editar Condicionante',
    });
    await user.type(
      within(dialog).getByLabelText('Descritor ambiental'),
      'Frota'
    );
    await user.type(within(dialog).getByLabelText('Responsável'), 'Ana');
    await user.click(
      within(dialog).getByRole('button', { name: 'Salvar Alterações' })
    );

    expect(screen.getByText('Frota')).toBeInTheDocument();
    expect(
      screen.queryByText('Sem descritor ambiental')
    ).not.toBeInTheDocument();
  });

  it('does not duplicate conditions when the same PDF is selected again', async () => {
    const user = userEvent.setup();
    vi.mocked(licensesApi.extractLicenseData).mockResolvedValue(EXTRACTION);
    renderModal();

    await uploadPdf(user);
    await screen.findByText('Resíduos Perigosos');
    await uploadPdf(user);
    await waitFor(() =>
      expect(licensesApi.extractLicenseData).toHaveBeenCalledTimes(2)
    );

    expect(
      screen.getAllByText('O transporte deverá ser acompanhado do MTR.')
    ).toHaveLength(1);
  });

  it('shows the error and keeps manual filling available when the document cannot be read (422)', async () => {
    const user = userEvent.setup();
    vi.mocked(licensesApi.extractLicenseData).mockRejectedValue(
      new ApiError(
        422,
        'Não foi possível ler os dados deste documento. Preencha os campos manualmente.'
      )
    );
    vi.mocked(licensesApi.createLicense).mockResolvedValue(CREATED_LICENSE);
    renderModal();

    await uploadPdf(user);

    expect(
      await screen.findByText(
        'Não foi possível ler os dados deste documento. Preencha os campos manualmente.'
      )
    ).toBeInTheDocument();
    expect(screen.queryByText('Lendo documento…')).not.toBeInTheDocument();
    expect(
      screen.queryByText('Revise os dados sugeridos pela IA')
    ).not.toBeInTheDocument();

    await user.type(screen.getByLabelText(/tipo de licença/i), 'LO');
    await user.type(screen.getByLabelText(/nº do processo/i), 'LO nº 1/2024');
    await user.type(screen.getByLabelText(/órgão emissor/i), 'FEPAM');
    await user.type(screen.getByLabelText(/data de emissão/i), '2024-01-10');
    await user.type(screen.getByLabelText(/data de validade/i), '2028-01-10');
    await user.click(screen.getByRole('button', { name: /salvar licença/i }));

    await waitFor(() =>
      expect(licensesApi.createLicense).toHaveBeenCalledTimes(1)
    );
  }, 20_000);

  it('falls back to a generic message for an unexpected failure', async () => {
    const user = userEvent.setup();
    vi.mocked(licensesApi.extractLicenseData).mockRejectedValue(
      new Error('boom')
    );
    renderModal();

    await uploadPdf(user);

    expect(
      await screen.findByText(
        'Não foi possível ler o documento automaticamente. Preencha os campos manualmente.'
      )
    ).toBeInTheDocument();
  });

  it('does not send a non-PDF file for reading', async () => {
    renderModal();

    fireEvent.change(screen.getByLabelText(/upload de arquivo/i), {
      target: {
        files: [new File(['x'], 'foto.jpg', { type: 'image/jpeg' })],
      },
    });

    expect(
      await screen.findByText('O arquivo deve estar no formato PDF.')
    ).toBeInTheDocument();
    expect(licensesApi.extractLicenseData).not.toHaveBeenCalled();
  });
});
