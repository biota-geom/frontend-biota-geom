import { describe, expect, it } from 'vitest';
import {
  DOCUMENT_FILE_TOO_LARGE_MESSAGE,
  INVALID_DOCUMENT_FILE_TYPE_MESSAGE,
  MAX_DOCUMENT_FILE_SIZE_BYTES,
  validateDocumentDraft,
  validateDocumentFile,
} from '../../features/documents/documentValidation';

describe('document validation', () => {
  it.each([
    ['arquivo.pdf', 'application/pdf'],
    ['foto.jpg', 'image/jpeg'],
    ['foto.jpeg', 'image/jpeg'],
    ['foto.png', 'image/png'],
    [
      'contrato.docx',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
  ])('accepts %s', (name, type) => {
    expect(
      validateDocumentFile(new File(['valid'], name, { type }))
    ).toBeNull();
  });

  it('rejects an executable with a friendly message', () => {
    const file = new File(['invalid'], 'programa.exe', {
      type: 'application/x-msdownload',
    });
    expect(validateDocumentFile(file)).toBe(INVALID_DOCUMENT_FILE_TYPE_MESSAGE);
  });

  it('rejects a file larger than 20 MB', () => {
    const file = new File(
      [new Uint8Array(MAX_DOCUMENT_FILE_SIZE_BYTES + 1)],
      'grande.pdf',
      { type: 'application/pdf' }
    );
    expect(validateDocumentFile(file)).toBe(DOCUMENT_FILE_TOO_LARGE_MESSAGE);
  });

  it('requires title and document date', () => {
    expect(validateDocumentDraft({ title: ' ', documentDate: '' })).toEqual({
      title: 'Informe o título do documento.',
      documentDate: 'Informe a data do documento.',
    });
  });
});
