import { type FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/shadcn/button';
import { Input } from '@/components/ui/shadcn/input';
import {
  InputGroup,
  InputGroupAddon,
} from '@/components/ui/shadcn/input-group';
import { Label } from '@/components/ui/shadcn/label';
import { APP_ROUTES } from '../../../app/router/routes';
import { AUTH_MESSAGES } from '../../../features/auth/authMessages';
import {
  PASSWORD_RULES,
  isPasswordStrongEnough,
} from '../../../features/auth/passwordPolicy';
import { useAuth } from '../../../features/auth/useAuth';
import { ApiError } from '../../../services/api/apiError';

function UserIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="20"
      viewBox="0 0 24 24"
      width="20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 12.25C14.0711 12.25 15.75 10.5711 15.75 8.5C15.75 6.42893 14.0711 4.75 12 4.75C9.92893 4.75 8.25 6.42893 8.25 8.5C8.25 10.5711 9.92893 12.25 12 12.25Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M4.75 19.25C4.75 15.9363 8.0233 13.75 12 13.75C15.9767 13.75 19.25 15.9363 19.25 19.25"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="20"
      viewBox="0 0 24 24"
      width="20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4.75 6.75H19.25V17.25H4.75V6.75Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M5.5 7.5L12 12.25L18.5 7.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="20"
      viewBox="0 0 24 24"
      width="20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M7.75 10.25V8.5C7.75 6.15 9.35 4.75 12 4.75C14.65 4.75 16.25 6.15 16.25 8.5V10.25"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M6.75 10.25H17.25V18.25H6.75V10.25Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="20"
      viewBox="0 0 24 24"
      width="20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4.75 12C6.2 8.95 8.65 7.25 12 7.25C15.35 7.25 17.8 8.95 19.25 12C17.8 15.05 15.35 16.75 12 16.75C8.65 16.75 6.2 15.05 4.75 12Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M12 14.25C13.24 14.25 14.25 13.24 14.25 12C14.25 10.76 13.24 9.75 12 9.75C10.76 9.75 9.75 10.76 9.75 12C9.75 13.24 10.76 14.25 12 14.25Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

export function RegisterForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const register = useAuth((state) => state.register);

  const passwordsMatch =
    password.length > 0 && password === passwordConfirmation;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!isPasswordStrongEnough(password)) {
      setFormError(AUTH_MESSAGES.PASSWORD_WEAK);
      return;
    }

    if (!passwordsMatch) {
      setFormError(AUTH_MESSAGES.PASSWORD_CONFIRMATION_MISMATCH);
      return;
    }

    setIsSubmitting(true);

    try {
      await register({ name, email, password, passwordConfirmation });
      /*
       * No navigation here on purpose — PublicOnlyRoute redirects the moment
       * status flips to 'authenticated'.
       */
    } catch (error) {
      setFormError(
        error instanceof ApiError ? error.message : AUTH_MESSAGES.GENERIC_ERROR
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      className="mt-[30px] flex flex-col gap-5"
      onSubmit={(event) => void handleSubmit(event)}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Nome completo</Label>
        <InputGroup variant="field">
          <InputGroupAddon>
            <UserIcon />
          </InputGroupAddon>
          <Input
            autoComplete="name"
            id="name"
            name="name"
            onChange={(event) => setName(event.target.value)}
            placeholder="Maria Silva"
            required
            type="text"
            value={name}
          />
        </InputGroup>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">E-mail corporativo</Label>
        <InputGroup variant="field">
          <InputGroupAddon>
            <MailIcon />
          </InputGroupAddon>
          <Input
            autoComplete="email"
            id="email"
            name="email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="seuemail@empresa.com"
            required
            type="email"
            value={email}
          />
        </InputGroup>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Senha de acesso</Label>
        <InputGroup variant="field">
          <InputGroupAddon>
            <LockIcon />
          </InputGroupAddon>
          <Input
            autoComplete="new-password"
            id="password"
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••••••"
            required
            type={isPasswordVisible ? 'text' : 'password'}
            value={password}
          />
          <Button
            aria-label={isPasswordVisible ? 'Ocultar senha' : 'Exibir senha'}
            aria-pressed={isPasswordVisible}
            onClick={() => setIsPasswordVisible((current) => !current)}
            type="button"
            variant="iconGhost"
          >
            <EyeIcon />
          </Button>
        </InputGroup>
        <ul className="m-0 mt-1 flex list-none flex-col gap-0.5 p-0 text-xs text-text-muted">
          {PASSWORD_RULES.map((rule) => (
            <li
              className={
                rule.test(password) ? 'text-primary-strong' : undefined
              }
              key={rule.id}
            >
              {rule.label}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password_confirmation">Confirmar senha</Label>
        <InputGroup variant="field">
          <InputGroupAddon>
            <LockIcon />
          </InputGroupAddon>
          <Input
            autoComplete="new-password"
            id="password_confirmation"
            name="password_confirmation"
            onChange={(event) => setPasswordConfirmation(event.target.value)}
            placeholder="••••••••••••"
            required
            type={isPasswordVisible ? 'text' : 'password'}
            value={passwordConfirmation}
          />
        </InputGroup>
      </div>

      {formError ? (
        <p
          aria-live="polite"
          className="m-0 rounded-sm border border-[#fda29b] bg-[#fef3f2] px-3 py-2.5 text-[13px] font-semibold text-[#b42318]"
          role="alert"
        >
          {formError}
        </p>
      ) : null}

      {/* `mt-3` is layout, not part of the variant: it spaces the call to
       * action off the fields above it. */}
      <Button
        className="mt-3"
        disabled={isSubmitting}
        type="submit"
        variant="primary"
      >
        {isSubmitting ? 'Criando conta...' : 'Criar conta'}
      </Button>

      <p className="m-0 text-center text-[13px] text-text-muted">
        Já possui uma conta?{' '}
        <Link
          className="text-link text-xs font-medium no-underline hover:underline"
          to={APP_ROUTES.login}
        >
          Entrar
        </Link>
      </p>
    </form>
  );
}
