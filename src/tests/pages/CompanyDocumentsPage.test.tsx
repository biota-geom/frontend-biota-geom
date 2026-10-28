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
  deleteDocument: vi.fn(),
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

const OBJECT_URL = 'blob:document';

/*
 * jsdom does not implement the object-URL API, and the anchor the component
 * builds is never attached to the document, so the only way to inspect it is
 * to capture it as it is created.
 */
function spyOnAnchorCreation() {
  const anchors: HTMLAnchorElement[] = [];
  const click = vi.fn();
  const createElement = window.document.createElement.bind(window.document);

  vi.spyOn(window.document, 'createElement').mockImplementation(
    (tagName: string, options?: ElementCreationOptions) => {
      const element = createElement(tagName, options);
      if (tagName === 'a') {
        element.click = click;
        anchors.push(element as HTMLAnchorElement);
      }
      return element;
    }
  );

  return { anchors, click };
}

beforeEach(() => {
  vi.resetAllMocks();
  URL.createObjectURL = vi.fn().mockReturnValue(OBJECT_URL);
  URL.revokeObjectURL = vi.fn();
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
      within(table).getAllByRole('button', { name: /^visualizar /i })
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
      name: /^visualizar /i,
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

  it('asks for confirmation before deleting and keeps the document on cancel', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(
      (await screen.findAllByRole('button', { name: /^excluir /i }))[0]!
    );

    expect(
      screen.getByText(
        'Excluir este documento? Ele deixará de aparecer na lista.'
      )
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /cancelar/i }));

    await waitFor(() =>
      expect(documentsApi.deleteDocument).not.toHaveBeenCalled()
    );
  });

  it('deletes the document and reloads the listing after confirmation', async () => {
    const user = userEvent.setup();
    vi.mocked(documentsApi.deleteDocument).mockResolvedValue(undefined);
    renderPage();

    await user.click(
      (await screen.findAllByRole('button', { name: /^excluir /i }))[0]!
    );
    await user.click(screen.getByRole('button', { name: /^excluir$/i }));

    await waitFor(() =>
      expect(documentsApi.deleteDocument).toHaveBeenCalledWith(
        COMPANY_ID,
        'document-new'
      )
    );
    // A listagem é recarregada para o contador de arquivos acompanhar.
    await waitFor(() =>
      expect(documentsApi.listDocuments).toHaveBeenCalledTimes(2)
    );
    expect(
      await screen.findByText('Documento excluído com sucesso.')
    ).toBeInTheDocument();
  });

  it('keeps the dialog open and shows the API message when deletion fails', async () => {
    const user = userEvent.setup();
    vi.mocked(documentsApi.deleteDocument).mockRejectedValue(
      new ApiError(404, 'Documento não encontrado.')
    );
    renderPage();

    await user.click(
      (await screen.findAllByRole('button', { name: /^excluir /i }))[0]!
    );
    await user.click(screen.getByRole('button', { name: /^excluir$/i }));

    expect(
      await screen.findByText('Documento não encontrado.')
    ).toBeInTheDocument();
    expect(documentsApi.listDocuments).toHaveBeenCalledTimes(1);
  });

  it('shows the API message when opening a document fails', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'open').mockReturnValue({
      close: vi.fn(),
      location: { replace: vi.fn() },
      opener: window,
    } as unknown as Window);
    vi.mocked(documentsApi.getDocumentAccessUrl).mockRejectedValue(
      new ApiError(404, 'Documento não encontrado.')
    );
    renderPage();

    await user.click(
      (await screen.findAllByRole('button', { name: /^visualizar /i }))[0]!
    );

    expect(
      await screen.findByText('Documento não encontrado.')
    ).toBeInTheDocument();
  });

  it('warns when the browser blocks the popup used to view a document', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'open').mockReturnValue(null);
    vi.mocked(documentsApi.getDocumentAccessUrl).mockResolvedValue(
      'https://signed.example/document.pdf'
    );
    renderPage();

    await user.click(
      (await screen.findAllByRole('button', { name: /^visualizar /i }))[0]!
    );

    expect(
      await screen.findByText(
        'Permita a abertura de pop-ups para visualizar o documento.'
      )
    ).toBeInTheDocument();
  });

  it('downloads the file bytes and saves them under the original name', async () => {
    const user = userEvent.setup();
    vi.mocked(documentsApi.getDocumentAccessUrl).mockResolvedValue(
      'https://signed.example/document.pdf'
    );
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(new Blob(['%PDF-1.4'])),
    } as unknown as Response);

    const { anchors, click } = spyOnAnchorCreation();
    renderPage();

    await user.click(
      (await screen.findAllByRole('button', { name: /^baixar /i }))[0]!
    );

    await waitFor(() => expect(click).toHaveBeenCalledTimes(1));
    expect(documentsApi.getDocumentAccessUrl).toHaveBeenCalledWith(
      COMPANY_ID,
      'document-new'
    );
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://signed.example/document.pdf'
    );
    // Salva com o nome do arquivo original, não com o do blob.
    expect(anchors.at(-1)?.download).toBe('laudo.pdf');
    expect(anchors.at(-1)?.href).toBe(OBJECT_URL);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(OBJECT_URL);
  });

  it('shows an error when the download request fails', async () => {
    const user = userEvent.setup();
    vi.mocked(documentsApi.getDocumentAccessUrl).mockResolvedValue(
      'https://signed.example/document.pdf'
    );
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
    } as unknown as Response);
    renderPage();

    await user.click(
      (await screen.findAllByRole('button', { name: /^baixar /i }))[0]!
    );

    expect(
      await screen.findByText('Não foi possível baixar o documento.')
    ).toBeInTheDocument();
  });

  it('shows the API message when the access URL fails before downloading', async () => {
    const user = userEvent.setup();
    vi.mocked(documentsApi.getDocumentAccessUrl).mockRejectedValue(
      new ApiError(404, 'Documento não encontrado.')
    );
    renderPage();

    await user.click(
      (await screen.findAllByRole('button', { name: /^baixar /i }))[0]!
    );

    expect(
      await screen.findByText('Documento não encontrado.')
    ).toBeInTheDocument();
  });
});
