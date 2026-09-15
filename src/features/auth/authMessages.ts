/*
 * Centralized PT-BR copy for the auth feature. Server error messages are
 * already PT-BR and rendered verbatim — these constants cover client-side
 * validation, the notice shown when the app itself ended the session, and the
 * generic fallback when an error carries no message at all.
 */
export const AUTH_MESSAGES = {
  PASSWORD_WEAK: 'A senha não atende aos requisitos mínimos de segurança.',
  PASSWORD_CONFIRMATION_MISMATCH: 'A confirmação de senha não confere.',
  /*
   * Deliberately NOT the generic credentials copy: the user did nothing wrong
   * and needs to understand why they were sent back to the login screen.
   */
  SESSION_EXPIRED_BY_INACTIVITY:
    'Sua sessão expirou por inatividade. Faça login novamente para continuar.',
  GENERIC_ERROR:
    'Não foi possível concluir a operação. Tente novamente mais tarde.',
} as const;
