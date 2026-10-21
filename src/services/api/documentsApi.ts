import type {
  CompanyDocument,
  DocumentFolder,
} from '../../features/documents/types';
import { request } from './http';
import type {
  DocumentFolderWire,
  DocumentWire,
  FileAccessUrlWire,
} from './types';

export interface CreateDocumentInput {
  file: File;
  title: string;
  /** Date-only value in `YYYY-MM-DD` format. */
  documentDate: string;
  folderId: string | null;
}

function toCompanyDocument(wire: DocumentWire): CompanyDocument {
  return {
    id: wire.id,
    title: wire.title,
    documentDate: wire.document_date,
    fileName: wire.file_name,
    sizeBytes: wire.size_bytes,
    uploadedBy: {
      id: wire.uploaded_by.id,
      name: wire.uploaded_by.name,
    },
    createdAt: wire.created_at,
    folderId: wire.folder_id,
  };
}

function toDocumentFolder(wire: DocumentFolderWire): DocumentFolder {
  return {
    id: wire.id,
    name: wire.name,
    parentId: wire.parent_id,
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
  formData.append('document_date', input.documentDate);
  if (input.folderId) formData.append('folder_id', input.folderId);

  const wire = await request<DocumentWire>(
    `/api/customers/${customerId}/documents`,
    { method: 'POST', body: formData }
  );

  return toCompanyDocument(wire);
}

export async function listDocumentFolders(
  customerId: string
): Promise<DocumentFolder[]> {
  const wire = await request<DocumentFolderWire[]>(
    `/api/customers/${customerId}/documents/folders`
  );

  return wire.map(toDocumentFolder);
}

export async function createDocumentFolder(
  customerId: string,
  input: { name: string; parentId: string | null }
): Promise<DocumentFolder> {
  const wire = await request<DocumentFolderWire>(
    `/api/customers/${customerId}/documents/folders`,
    {
      method: 'POST',
      body: {
        name: input.name.trim(),
        parent_id: input.parentId,
      },
    }
  );

  return toDocumentFolder(wire);
}

export async function getDocumentAccessUrl(
  customerId: string,
  documentId: string
): Promise<string> {
  const wire = await request<FileAccessUrlWire>(
    `/api/customers/${customerId}/documents/${documentId}/url`
  );

  return wire.document_url;
}
