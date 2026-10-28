import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../services/api/http', () => ({ request: vi.fn() }));

const { request } = await import('../../services/api/http');
const {
  createDocument,
  createDocumentFolder,
  deleteDocument,
  getDocumentAccessUrl,
  listDocumentFolders,
  listDocuments,
} = await import('../../services/api/documentsApi');

const DOCUMENT_WIRE = {
  id: 'document-1',
  title: 'Laudo de Ruído 2026',
  document_date: '2026-08-15',
  file_name: 'laudo-ruido.pdf',
  size_bytes: 1_048_576,
  uploaded_by: { id: 'user-1', name: 'Consultoria X' },
  created_at: '2026-10-04T14:00:00.000Z',
  folder_id: null,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('documentsApi', () => {
  it('lists documents and maps the wire response to the domain shape', async () => {
    vi.mocked(request).mockResolvedValue([DOCUMENT_WIRE]);

    await expect(listDocuments('customer-1')).resolves.toEqual([
      {
        id: 'document-1',
        title: 'Laudo de Ruído 2026',
        documentDate: '2026-08-15',
        fileName: 'laudo-ruido.pdf',
        sizeBytes: 1_048_576,
        uploadedBy: { id: 'user-1', name: 'Consultoria X' },
        createdAt: '2026-10-04T14:00:00.000Z',
        folderId: null,
      },
    ]);
    expect(request).toHaveBeenCalledWith('/api/customers/customer-1/documents');
  });

  it('posts one document as multipart data using the API field names', async () => {
    vi.mocked(request).mockResolvedValue(DOCUMENT_WIRE);
    const file = new File(['document'], 'laudo-ruido.pdf', {
      type: 'application/pdf',
    });

    await createDocument('customer-1', {
      file,
      title: '  Laudo de Ruído 2026  ',
      documentDate: '2026-08-15',
      folderId: 'folder-1',
    });

    const [path, options] = vi.mocked(request).mock.calls[0]!;
    expect(path).toBe('/api/customers/customer-1/documents');
    expect(options?.method).toBe('POST');

    const formData = options?.body as FormData;
    expect(formData.get('file')).toBe(file);
    expect(formData.get('title')).toBe('Laudo de Ruído 2026');
    expect(formData.has('type')).toBe(false);
    expect(formData.get('document_date')).toBe('2026-08-15');
    expect(formData.get('folder_id')).toBe('folder-1');
  });

  it('omits the document date when it is not informed', async () => {
    vi.mocked(request).mockResolvedValue(DOCUMENT_WIRE);
    const file = new File(['document'], 'laudo-ruido.pdf', {
      type: 'application/pdf',
    });

    await createDocument('customer-1', {
      file,
      title: 'Laudo de Ruído 2026',
      folderId: null,
    });

    const [, options] = vi.mocked(request).mock.calls[0]!;
    const formData = options?.body as FormData;
    expect(formData.has('document_date')).toBe(false);
  });

  it('lists and creates nested folders', async () => {
    const folderWire = {
      id: 'folder-2',
      name: 'Licenças 2026',
      parent_id: 'folder-1',
      created_at: '2026-10-21T18:00:00.000Z',
    };
    vi.mocked(request).mockResolvedValueOnce([folderWire]);

    await expect(listDocumentFolders('customer-1')).resolves.toEqual([
      {
        id: 'folder-2',
        name: 'Licenças 2026',
        parentId: 'folder-1',
        createdAt: '2026-10-21T18:00:00.000Z',
      },
    ]);

    vi.mocked(request).mockResolvedValueOnce(folderWire);
    await createDocumentFolder('customer-1', {
      name: ' Licenças 2026 ',
      parentId: 'folder-1',
    });

    expect(request).toHaveBeenLastCalledWith(
      '/api/customers/customer-1/documents/folders',
      {
        method: 'POST',
        body: {
          name: 'Licenças 2026',
          parent_id: 'folder-1',
        },
      }
    );
  });

  it('requests a temporary access URL without exposing the stored URL', async () => {
    vi.mocked(request).mockResolvedValue({
      document_url: 'https://signed.example/document.pdf',
      expires_in: 900,
    });

    await expect(
      getDocumentAccessUrl('customer-1', 'document-1')
    ).resolves.toBe('https://signed.example/document.pdf');
    expect(request).toHaveBeenCalledWith(
      '/api/customers/customer-1/documents/document-1/url'
    );
  });

  it('deletes a document through the customer-scoped route', async () => {
    vi.mocked(request).mockResolvedValue(undefined);

    await expect(
      deleteDocument('customer-1', 'document-1')
    ).resolves.toBeUndefined();
    expect(request).toHaveBeenCalledWith(
      '/api/customers/customer-1/documents/document-1',
      { method: 'DELETE' }
    );
  });
});
