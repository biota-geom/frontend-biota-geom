// Centralized PT-BR copy for the auth feature. Server error messages are
// already PT-BR and rendered verbatim — these constants cover client-side
// validation and the generic fallback when an error carries no message at all.
export const AUTH_MESSAGES = {
  NAME_REQUIRED: 'Informe seu nome completo.',
  EMAIL_REQUIRED: 'Informe um e-mail válido.',
  PASSWORD_WEAK: 'A senha não atende aos requisitos mínimos de segurança.',
  PASSWORD_CONFIRMATION_MISMATCH: 'A confirmação de senha não confere.',
  GENERIC_ERROR:
    'Não foi possível concluir a operação. Tente novamente mais tarde.',
} as const;
