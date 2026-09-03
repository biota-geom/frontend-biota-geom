import { type FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
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
        <label
          className="text-[13px] font-bold text-text-primary"
          htmlFor="name"
        >
          Nome completo
        </label>
        <div className="rounded-control flex min-h-[42px] items-center gap-2.5 border border-border bg-surface px-2.5 text-text-muted shadow-control transition-[border-color,box-shadow] duration-[160ms] focus-within:border-focus focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.14)]">
          <span className="shrink-0 text-text-muted">
            <UserIcon />
          </span>
          <input
            autoComplete="name"
            className="w-full min-w-0 border-0 bg-transparent text-text-primary outline-0 placeholder:text-text-muted"
            id="name"
            name="name"
            onChange={(event) => setName(event.target.value)}
            placeholder="Maria Silva"
            required
            type="text"
            value={name}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label
          className="text-[13px] font-bold text-text-primary"
          htmlFor="email"
        >
          E-mail corporativo
        </label>
        <div className="rounded-control flex min-h-[42px] items-center gap-2.5 border border-border bg-surface px-2.5 text-text-muted shadow-control transition-[border-color,box-shadow] duration-[160ms] focus-within:border-focus focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.14)]">
          <span className="shrink-0 text-text-muted">
            <MailIcon />
          </span>
          <input
            autoComplete="email"
            className="w-full min-w-0 border-0 bg-transparent text-text-primary outline-0 placeholder:text-text-muted"
            id="email"
            name="email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="seuemail@empresa.com"
            required
            type="email"
            value={email}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label
          className="text-[13px] font-bold text-text-primary"
          htmlFor="password"
        >
          Senha de acesso
        </label>
        <div className="rounded-control flex min-h-[42px] items-center gap-2.5 border border-border bg-surface px-2.5 text-text-muted shadow-control transition-[border-color,box-shadow] duration-[160ms] focus-within:border-focus focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.14)]">
          <span className="shrink-0 text-text-muted">
            <LockIcon />
          </span>
          <input
            autoComplete="new-password"
            className="w-full min-w-0 border-0 bg-transparent text-text-primary outline-0 placeholder:text-text-muted"
            id="password"
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••••••"
            required
            type={isPasswordVisible ? 'text' : 'password'}
            value={password}
          />
          <button
            aria-label={isPasswordVisible ? 'Ocultar senha' : 'Exibir senha'}
            aria-pressed={isPasswordVisible}
            className="rounded-control grid size-8 shrink-0 place-items-center border-0 bg-transparent p-0 text-text-muted hover:bg-surface-muted hover:text-text-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            onClick={() => setIsPasswordVisible((current) => !current)}
            type="button"
          >
            <EyeIcon />
          </button>
        </div>
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
        <label
          className="text-[13px] font-bold text-text-primary"
          htmlFor="password_confirmation"
        >
          Confirmar senha
        </label>
        <div className="rounded-control flex min-h-[42px] items-center gap-2.5 border border-border bg-surface px-2.5 text-text-muted shadow-control transition-[border-color,box-shadow] duration-[160ms] focus-within:border-focus focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.14)]">
          <span className="shrink-0 text-text-muted">
            <LockIcon />
          </span>
          <input
            autoComplete="new-password"
            className="w-full min-w-0 border-0 bg-transparent text-text-primary outline-0 placeholder:text-text-muted"
            id="password_confirmation"
            name="password_confirmation"
            onChange={(event) => setPasswordConfirmation(event.target.value)}
            placeholder="••••••••••••"
            required
            type={isPasswordVisible ? 'text' : 'password'}
            value={passwordConfirmation}
          />
        </div>
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

      <button
        className="rounded-panel mt-3 min-h-[45px] border-0 bg-primary text-[15px] font-extrabold text-white shadow-control transition-[background-color,transform] duration-[160ms] hover:bg-primary-strong active:translate-y-px focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary/30 disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? 'Criando conta...' : 'Criar conta'}
      </button>

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
