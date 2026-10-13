export const DOCUMENT_TYPES = [
  'CONTRATO',
  'LAUDO',
  'CERTIDAO',
  'OUTROS',
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  CONTRATO: 'Contrato',
  LAUDO: 'Laudo',
  CERTIDAO: 'Certidão',
  OUTROS: 'Outros',
};

export interface DocumentUploader {
  id: string;
  name: string;
}

export interface CompanyDocument {
  id: string;
  title: string;
  type: DocumentType;
  documentDate: string;
  fileUrl: string | null;
  fileName: string;
  mimeType: string | null;
  sizeBytes: number;
  uploadedBy: DocumentUploader;
  createdAt: string;
}
