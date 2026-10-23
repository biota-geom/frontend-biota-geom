export const MAX_DOCUMENT_FILE_SIZE_BYTES = 20 * 1024 * 1024;

export const DOCUMENT_FILE_ACCEPT =
  '.pdf,.jpg,.jpeg,.png,.docx,application/pdf,image/jpeg,image/png,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export const INVALID_DOCUMENT_FILE_TYPE_MESSAGE =
  'Formato não permitido. Envie um arquivo PDF, JPG, PNG ou DOCX.';
export const DOCUMENT_FILE_TOO_LARGE_MESSAGE =
  'O arquivo não pode ultrapassar 20 MB.';

const ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'docx'];
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export type DocumentDraftValues = {
  title: string;
  documentDate: string;
};

export type DocumentDraftErrors = Partial<
  Record<keyof DocumentDraftValues, string>
>;

export function validateDocumentFile(file: File): string | null {
  if (file.size > MAX_DOCUMENT_FILE_SIZE_BYTES) {
    return DOCUMENT_FILE_TOO_LARGE_MESSAGE;
  }

  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  const hasAllowedExtension = ALLOWED_EXTENSIONS.includes(extension);
  const hasAllowedMimeType =
    file.type === '' || ALLOWED_MIME_TYPES.includes(file.type.toLowerCase());

  return hasAllowedExtension && hasAllowedMimeType
    ? null
    : INVALID_DOCUMENT_FILE_TYPE_MESSAGE;
}

export function validateDocumentDraft(
  values: DocumentDraftValues
): DocumentDraftErrors {
  const errors: DocumentDraftErrors = {};

  if (!values.title.trim()) {
    errors.title = 'Informe o título do documento.';
  }
  if (!values.documentDate) {
    errors.documentDate = 'Informe a data do documento.';
  }

  return errors;
}
