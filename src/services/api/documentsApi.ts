import type {
  CompanyDocument,
  DocumentType,
} from '../../features/documents/types';
import { request } from './http';
import type { DocumentWire } from './types';

export interface CreateDocumentInput {
  file: File;
  title: string;
  type: DocumentType;
  /** Date-only value in `YYYY-MM-DD` format. */
  documentDate: string;
}

function toCompanyDocument(wire: DocumentWire): CompanyDocument {
  return {
    id: wire.id,
    title: wire.title,
    type: wire.type,
    documentDate: wire.document_date,
    fileUrl: wire.file_url ?? null,
    fileName: wire.file_name,
    mimeType: wire.mime_type ?? null,
    sizeBytes: wire.size_bytes,
    uploadedBy: {
      id: wire.uploaded_by.id,
      name: wire.uploaded_by.name,
    },
    createdAt: wire.created_at,
  };
}

export async function listDocuments(
  customerId: string
): Promise<CompanyDocument[]> {
  const wire = await request<DocumentWire[]>(
    `/api/customers/${customerId}/documents`
  );

  return wire.map(toCompanyDocument);
}

export async function createDocument(
  customerId: string,
  input: CreateDocumentInput
): Promise<CompanyDocument> {
  const formData = new FormData();
  formData.append('file', input.file);
  formData.append('title', input.title.trim());
  formData.append('type', input.type);
  formData.append('document_date', input.documentDate);

  const wire = await request<DocumentWire>(
    `/api/customers/${customerId}/documents`,
    { method: 'POST', body: formData }
  );

  return toCompanyDocument(wire);
}
