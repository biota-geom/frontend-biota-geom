import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../services/api/http', () => ({ request: vi.fn() }));

const { request } = await import('../../services/api/http');
const { createDocument, listDocuments } =
  await import('../../services/api/documentsApi');

const DOCUMENT_WIRE = {
  id: 'document-1',
  title: 'Laudo de Ruído 2026',
  type: 'LAUDO' as const,
  document_date: '2026-08-15',
  file_url: 'https://storage.example/laudo.pdf',
  file_name: 'laudo-ruido.pdf',
  mime_type: 'application/pdf',
  size_bytes: 1_048_576,
  uploaded_by: { id: 'user-1', name: 'Consultoria X' },
  created_at: '2026-10-04T14:00:00.000Z',
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
        type: 'LAUDO',
        documentDate: '2026-08-15',
        fileUrl: 'https://storage.example/laudo.pdf',
        fileName: 'laudo-ruido.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 1_048_576,
        uploadedBy: { id: 'user-1', name: 'Consultoria X' },
        createdAt: '2026-10-04T14:00:00.000Z',
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
      type: 'LAUDO',
      documentDate: '2026-08-15',
    });

    const [path, options] = vi.mocked(request).mock.calls[0]!;
    expect(path).toBe('/api/customers/customer-1/documents');
    expect(options?.method).toBe('POST');

    const formData = options?.body as FormData;
    expect(formData.get('file')).toBe(file);
    expect(formData.get('title')).toBe('Laudo de Ruído 2026');
    expect(formData.get('type')).toBe('LAUDO');
    expect(formData.get('document_date')).toBe('2026-08-15');
  });
});
