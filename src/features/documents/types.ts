export interface DocumentUploader {
  id: string;
  name: string;
}

export interface CompanyDocument {
  id: string;
  title: string;
  documentDate: string;
  fileName: string;
  sizeBytes: number;
  uploadedBy: DocumentUploader;
  createdAt: string;
  folderId: string | null;
}

export interface DocumentFolder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
}
