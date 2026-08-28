export interface PasswordRule {
  id: string;
  label: string;
  test: (password: string) => boolean;
}

/*
 * Mirrors backend-biota-geom's src/modules/auth/domain/password-policy.ts —
 * the backend is the source of truth and the final arbiter (this only gates
 * the UI early). Current contract: min 8 / max 128 chars, at least one
 * lowercase, one uppercase, one digit, one special character. If either side
 * changes, update both — see passwordPolicy.test.ts, which pins this exact
 * rule set so a one-sided change fails loudly here instead of silently
 * diverging from what the server actually accepts.
 */
export const PASSWORD_RULES: PasswordRule[] = [
  {
    id: 'length',
    label: 'Pelo menos 8 caracteres',
    test: (password) => password.length >= 8,
  },
  {
    id: 'lowercase',
    label: 'Uma letra minúscula',
    test: (password) => /[a-z]/.test(password),
  },
  {
    id: 'uppercase',
    label: 'Uma letra maiúscula',
    test: (password) => /[A-Z]/.test(password),
  },
  {
    id: 'digit',
    label: 'Um número',
    test: (password) => /\d/.test(password),
  },
  {
    id: 'special',
    label: 'Um caractere especial',
    test: (password) => /[^A-Za-z0-9]/.test(password),
  },
];

export function isPasswordStrongEnough(password: string): boolean {
  return (
    password.length <= 128 &&
    PASSWORD_RULES.every((rule) => rule.test(password))
  );
}
