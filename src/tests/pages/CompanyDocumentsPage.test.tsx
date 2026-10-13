import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CompanyDocument } from '../../features/documents/types';
import { CompanyDocumentsPage } from '../../pages/company/Documents/CompanyDocumentsPage';
import * as documentsApi from '../../services/api/documentsApi';
import { ApiError } from '../../services/api/apiError';
import { renderWithAuth } from '../mocks/renderWithAuth';

vi.mock('../../services/api/documentsApi', () => ({
  createDocument: vi.fn(),
  listDocuments: vi.fn(),
}));

const COMPANY_ID = 'customer-1';

const DOCUMENTS: CompanyDocument[] = [
  {
    id: 'document-old',
    title: 'Contrato social',
    type: 'CONTRATO',
    documentDate: '2025-01-10',
    fileUrl: null,
    fileName: 'contrato.docx',
    mimeType: null,
    sizeBytes: 200,
    uploadedBy: { id: 'user-1', name: 'Ana Souza' },
    createdAt: '2026-01-10T12:00:00.000Z',
  },
  {
    id: 'document-new',
    title: 'Laudo de Ruído 2026',
    type: 'LAUDO',
    documentDate: '2026-08-15',
    fileUrl: null,
    fileName: 'laudo.pdf',
    mimeType: null,
    sizeBytes: 300,
    uploadedBy: { id: 'user-2', name: 'Consultoria X' },
    createdAt: '2026-10-04T14:00:00.000Z',
  },
];

function renderPage() {
  return renderWithAuth(
    <Routes>
      <Route
        element={<CompanyDocumentsPage />}
        path="/companies/:companyId/documents"
      />
    </Routes>,
    { initialRoute: `/companies/${COMPANY_ID}/documents` }
  );
}

function pdfFile(name: string) {
  return new File(['%PDF-1.4'], name, { type: 'application/pdf' });
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(documentsApi.listDocuments).mockResolvedValue(DOCUMENTS);
});

describe('CompanyDocumentsPage', () => {
  it('loads the current company documents and renders the required columns', async () => {
    renderPage();

    expect(
      await screen.findByRole('heading', { name: 'Repositório de Documentos' })
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(documentsApi.listDocuments).toHaveBeenCalledWith(COMPANY_ID)
    );

    const table = screen.getByRole('table');
    for (const heading of [
      'Título',
      'Tipo',
      'Data do documento',
      'Enviado por',
      'Enviado em',
    ]) {
      expect(
        within(table).getByRole('columnheader', { name: heading })
      ).toBeInTheDocument();
    }
    expect(within(table).getAllByRole('row')[1]).toHaveTextContent(
      'Laudo de Ruído 2026'
    );
    expect(screen.queryByText(/download/i)).not.toBeInTheDocument();
  });

  it('shows the empty state and opens the upload modal', async () => {
    const user = userEvent.setup();
    vi.mocked(documentsApi.listDocuments).mockResolvedValue([]);
    renderPage();

    expect(
      await screen.findByText('Nenhum documento enviado')
    ).toBeInTheDocument();
    await user.click(
      screen.getAllByRole('button', { name: /enviar documentos/i })[0]!
    );
    expect(
      screen.getByRole('heading', { name: /^enviar documentos$/i })
    ).toBeInTheDocument();
  });

  it('shows an API error and allows retrying the listing', async () => {
    const user = userEvent.setup();
    vi.mocked(documentsApi.listDocuments)
      .mockRejectedValueOnce(new ApiError(500, 'Falha ao carregar documentos.'))
      .mockResolvedValueOnce([]);
    renderPage();

    expect(
      await screen.findByText('Falha ao carregar documentos.')
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(
      await screen.findByText('Nenhum documento enviado')
    ).toBeInTheDocument();
    expect(documentsApi.listDocuments).toHaveBeenCalledTimes(2);
  });

  it('rejects an executable before calling the upload API', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Laudo de Ruído 2026');
    await user.click(
      screen.getByRole('button', { name: /enviar documentos/i })
    );

    const fileInput = screen.getByLabelText(/selecionar arquivos/i);
    fireEvent.change(fileInput, {
      target: {
        files: [
          new File(['invalid'], 'programa.exe', {
            type: 'application/x-msdownload',
          }),
        ],
      },
    });

    expect(
      await screen.findByText(/programa\.exe: formato não permitido/i)
    ).toBeInTheDocument();
    expect(documentsApi.createDocument).not.toHaveBeenCalled();
  });

  it('uploads three files sequentially and refreshes the listing', async () => {
    const user = userEvent.setup();
    const resolvers: Array<(document: CompanyDocument) => void> = [];
    vi.mocked(documentsApi.createDocument).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvers.push(resolve);
        })
    );
    renderPage();
    await screen.findByText('Laudo de Ruído 2026');
    await user.click(
      screen.getByRole('button', { name: /enviar documentos/i })
    );

    await user.upload(screen.getByLabelText(/selecionar arquivos/i), [
      pdfFile('um.pdf'),
      pdfFile('dois.pdf'),
      pdfFile('tres.pdf'),
    ]);

    const titleInputs = screen.getAllByLabelText('Título');
    const dateInputs = screen.getAllByLabelText('Data');
    for (let index = 0; index < 3; index += 1) {
      await user.type(titleInputs[index]!, `Documento ${index + 1}`);
      await user.type(
        dateInputs[index]!,
        `2026-10-${String(index + 1).padStart(2, '0')}`
      );
      const typeSelects = screen.getAllByRole('combobox');
      await user.click(typeSelects[index]!);
      await user.click(await screen.findByRole('option', { name: 'Laudo' }));
    }

    await user.click(
      screen.getByRole('button', { name: /^enviar documentos$/i })
    );
    await waitFor(() =>
      expect(documentsApi.createDocument).toHaveBeenCalledTimes(1)
    );

    resolvers[0]!(DOCUMENTS[1]!);
    await waitFor(() =>
      expect(documentsApi.createDocument).toHaveBeenCalledTimes(2)
    );
    resolvers[1]!(DOCUMENTS[1]!);
    await waitFor(() =>
      expect(documentsApi.createDocument).toHaveBeenCalledTimes(3)
    );
    resolvers[2]!(DOCUMENTS[1]!);

    expect(
      await screen.findByText('3 documentos enviados com sucesso.')
    ).toBeInTheDocument();
    expect(documentsApi.listDocuments).toHaveBeenCalledTimes(2);
    expect(
      screen.queryByRole('heading', { name: /^enviar documentos$/i })
    ).not.toBeInTheDocument();
  }, 20_000);
});
