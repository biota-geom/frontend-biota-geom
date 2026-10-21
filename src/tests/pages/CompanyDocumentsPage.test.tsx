import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CompanyDocument } from '../../features/documents/types';
import { CompanyDocumentsPage } from '../../pages/company/Documents/CompanyDocumentsPage';
import * as documentsApi from '../../services/api/documentsApi';
import { ApiError } from '../../services/api/apiError';
import { renderWithAuth } from '../mocks/renderWithAuth';

vi.mock('../../services/api/documentsApi', () => ({
  createDocument: vi.fn(),
  getDocumentAccessUrl: vi.fn(),
  createDocumentFolder: vi.fn(),
  listDocumentFolders: vi.fn(),
  listDocuments: vi.fn(),
}));

const COMPANY_ID = 'customer-1';

const DOCUMENTS: CompanyDocument[] = [
  {
    id: 'document-old',
    title: 'Contrato social',
    documentDate: '2025-01-10',
    fileName: 'contrato.docx',
    sizeBytes: 200,
    uploadedBy: { id: 'user-1', name: 'Ana Souza' },
    createdAt: '2026-01-10T12:00:00.000Z',
    folderId: null,
  },
  {
    id: 'document-new',
    title: 'Laudo de Ruído 2026',
    documentDate: '2026-08-15',
    fileName: 'laudo.pdf',
    sizeBytes: 300,
    uploadedBy: { id: 'user-2', name: 'Consultoria X' },
    createdAt: '2026-10-04T14:00:00.000Z',
    folderId: null,
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
  vi.mocked(documentsApi.listDocumentFolders).mockResolvedValue([]);
});

afterEach(() => {
  vi.restoreAllMocks();
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
      'Data do documento',
      'Enviado em',
      'Ações',
    ]) {
      expect(
        within(table).getByRole('columnheader', { name: heading })
      ).toBeInTheDocument();
    }
    expect(within(table).getAllByRole('row')[1]).toHaveTextContent(
      'Laudo de Ruído 2026'
    );
    expect(
      within(table).getAllByRole('button', { name: /abrir arquivo/i })
    ).toHaveLength(2);
  });

  it('requests a protected URL before opening a document', async () => {
    const user = userEvent.setup();
    const replace = vi.fn();
    const tab = {
      close: vi.fn(),
      location: { replace },
      opener: window,
    } as unknown as Window;
    const open = vi.spyOn(window, 'open').mockReturnValue(tab);
    vi.mocked(documentsApi.getDocumentAccessUrl).mockResolvedValue(
      'https://signed.example/document.pdf'
    );
    renderPage();

    const buttons = await screen.findAllByRole('button', {
      name: /abrir arquivo/i,
    });
    await user.click(buttons[0]!);

    await waitFor(() =>
      expect(documentsApi.getDocumentAccessUrl).toHaveBeenCalledWith(
        COMPANY_ID,
        'document-new'
      )
    );
    expect(replace).toHaveBeenCalledWith('https://signed.example/document.pdf');
    open.mockRestore();
  });

  it('shows the empty state and opens the upload modal', async () => {
    const user = userEvent.setup();
    vi.mocked(documentsApi.listDocuments).mockResolvedValue([]);
    renderPage();

    expect(
      await screen.findByText('Esta pasta está vazia')
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
      await screen.findByText('Esta pasta está vazia')
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

  it('uses user-created folders and creates subfolders in the current folder', async () => {
    const user = userEvent.setup();
    vi.mocked(documentsApi.listDocumentFolders).mockResolvedValue([
      {
        id: 'folder-environmental',
        name: 'Ambiental',
        parentId: null,
        createdAt: '2026-10-21T18:00:00.000Z',
      },
    ]);
    vi.mocked(documentsApi.listDocuments).mockResolvedValue([
      DOCUMENTS[0]!,
      { ...DOCUMENTS[1]!, folderId: 'folder-environmental' },
    ]);
    vi.mocked(documentsApi.createDocumentFolder).mockResolvedValue({
      id: 'folder-licenses',
      name: 'Licenças',
      parentId: 'folder-environmental',
      createdAt: '2026-10-21T18:10:00.000Z',
    });
    renderPage();

    await user.click(await screen.findByRole('button', { name: /ambiental/i }));
    expect(await screen.findByText('Laudo de Ruído 2026')).toBeInTheDocument();
    expect(screen.queryByText('Contrato social')).not.toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: /enviar documentos/i })
    );
    expect(
      screen.getByRole('combobox', { name: 'Pasta de destino' })
    ).toHaveTextContent('Ambiental');
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    await user.click(screen.getByRole('button', { name: /criar pasta/i }));
    await user.type(screen.getByLabelText('Nome da pasta'), 'Licenças');
    await user.click(screen.getByRole('button', { name: 'Criar pasta' }));

    await waitFor(() =>
      expect(documentsApi.createDocumentFolder).toHaveBeenCalledWith(
        COMPANY_ID,
        { name: 'Licenças', parentId: 'folder-environmental' }
      )
    );
  });

  it('searches files across every folder', async () => {
    const user = userEvent.setup();
    vi.mocked(documentsApi.listDocumentFolders).mockResolvedValue([
      {
        id: 'folder-environmental',
        name: 'Ambiental',
        parentId: null,
        createdAt: '2026-10-21T18:00:00.000Z',
      },
    ]);
    vi.mocked(documentsApi.listDocuments).mockResolvedValue([
      DOCUMENTS[0]!,
      { ...DOCUMENTS[1]!, folderId: 'folder-environmental' },
    ]);
    renderPage();

    await user.click(await screen.findByRole('button', { name: /ambiental/i }));
    expect(screen.queryByText('Contrato social')).not.toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('Buscar arquivo'), 'contrato');

    expect(await screen.findByText('Contrato social')).toBeInTheDocument();
    expect(screen.queryByText('Laudo de Ruído 2026')).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Resultados da busca' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('1 arquivo em todas as pastas')
    ).toBeInTheDocument();
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
