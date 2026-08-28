export interface PasswordRule {
  id: string;
  label: string;
  test: (password: string) => boolean;
}

// Mirrors src/modules/auth/domain/password-policy.ts on the backend — keep
// both in sync if either changes.
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
