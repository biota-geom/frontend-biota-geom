import { useCallback, useRef, useState } from 'react';
import { ApiError } from '../../services/api/apiError';
import { listDocuments } from '../../services/api/documentsApi';
import type { CompanyDocument } from './types';

type DocumentsStatus = 'idle' | 'loading' | 'success' | 'error';

const DOCUMENTS_LOAD_ERROR =
  'Não foi possível carregar os documentos da empresa.';

export function useDocuments() {
  const [documents, setDocuments] = useState<CompanyDocument[]>([]);
  const [status, setStatus] = useState<DocumentsStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const requestSequence = useRef(0);

  const loadDocuments = useCallback(async (customerId: string) => {
    const requestId = ++requestSequence.current;
    setStatus('loading');
    setError(null);

    try {
      const result = await listDocuments(customerId);
      if (requestId !== requestSequence.current) return;

      setDocuments(
        [...result].sort(
          (left, right) =>
            new Date(right.createdAt).getTime() -
            new Date(left.createdAt).getTime()
        )
      );
      setStatus('success');
    } catch (caughtError) {
      if (requestId !== requestSequence.current) return;
      setError(
        caughtError instanceof ApiError
          ? caughtError.message
          : DOCUMENTS_LOAD_ERROR
      );
      setStatus('error');
    }
  }, []);

  return { documents, error, loadDocuments, status };
}
