import { describe, expect, it } from 'vitest';
import {
  PASSWORD_RULES,
  isPasswordStrongEnough,
} from '../../features/auth/passwordPolicy';

/*
 * Pins the exact rule set this file claims to mirror from the backend
 * (src/modules/auth/domain/password-policy.ts). If this test needs editing,
 * the backend policy changed too and both sides must be updated together.
 */
describe('PASSWORD_RULES', () => {
  it('has exactly the 5 rules mirrored from the backend, in order', () => {
    expect(PASSWORD_RULES.map((rule) => rule.id)).toEqual([
      'length',
      'lowercase',
      'uppercase',
      'digit',
      'special',
    ]);
  });
});

describe('isPasswordStrongEnough', () => {
  it('accepts a password satisfying every rule', () => {
    expect(isPasswordStrongEnough('Sup3r$ecret!')).toBe(true);
  });

  it.each([
    ['shorter than 8 characters', 'Ab3!'],
    ['no lowercase letter', 'SUP3R$ECRET!'],
    ['no uppercase letter', 'sup3r$ecret!'],
    ['no digit', 'Super$ecretz!'],
    ['no special character', 'Sup3rSecretz'],
  ])('rejects a password with %s', (_label, password) => {
    expect(isPasswordStrongEnough(password)).toBe(false);
  });

  it('rejects a password longer than 128 characters', () => {
    const tooLong = `Sup3r$ecret!${'a'.repeat(120)}`;
    expect(tooLong.length).toBeGreaterThan(128);

    expect(isPasswordStrongEnough(tooLong)).toBe(false);
  });

  it('accepts a password right at the 128 character boundary', () => {
    const atBoundary = `Sup3r$ecret!${'a'.repeat(116)}`;
    expect(atBoundary.length).toBe(128);

    expect(isPasswordStrongEnough(atBoundary)).toBe(true);
  });
});
