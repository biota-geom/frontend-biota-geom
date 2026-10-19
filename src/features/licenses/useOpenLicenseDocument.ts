import { useCallback, useRef, useState } from 'react';
import { ApiError } from '../../services/api/apiError';
import { getLicenseDocumentUrl } from '../../services/api/licensesApi';

export const LICENSE_DOCUMENT_MESSAGES = {
  NOT_FOUND: 'Documento da licença não encontrado.',
  FORBIDDEN: 'Você não tem permissão para acessar este documento.',
  GENERIC: 'Não foi possível abrir o PDF da licença. Tente novamente.',
} as const;

function toErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 404) return LICENSE_DOCUMENT_MESSAGES.NOT_FOUND;
    if (error.status === 403) return LICENSE_DOCUMENT_MESSAGES.FORBIDDEN;
  }

  return LICENSE_DOCUMENT_MESSAGES.GENERIC;
}

/**
 * Opens a license PDF in a new tab. The bucket is private, so every click
 * asks the backend for a fresh pre-signed URL instead of linking to the
 * stored document_url, which the bucket answers with 403.
 */
export function useOpenLicenseDocument() {
  const [openingLicenseId, setOpeningLicenseId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Ref, not state: a second click in the same render must already see it.
  const inFlight = useRef(false);

  // Stryker disable ArrayDeclaration: any constant deps array keeps these
  // callbacks stable, so `[]` -> `["Stryker was here"]` is equivalent.
  const openDocument = useCallback(async (licenseId: string) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setOpeningLicenseId(licenseId);
    setErrorMessage(null);

    try {
      const { url } = await getLicenseDocumentUrl(licenseId);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      setErrorMessage(toErrorMessage(error));
    } finally {
      inFlight.current = false;
      setOpeningLicenseId(null);
    }
  }, []);

  const dismissError = useCallback(() => setErrorMessage(null), []);
  // Stryker restore ArrayDeclaration

  return { openDocument, openingLicenseId, errorMessage, dismissError };
}
