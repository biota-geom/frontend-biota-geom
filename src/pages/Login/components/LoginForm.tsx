import { type FormEvent, type MouseEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/shadcn/button';
import { Input } from '@/components/ui/shadcn/input';
import {
  InputGroup,
  InputGroupAddon,
} from '@/components/ui/shadcn/input-group';
import { Label } from '@/components/ui/shadcn/label';
import { APP_ROUTES } from '../../../app/router/routes';
import { EyeIcon, LockIcon, MailIcon } from '../../../components/ui/icons';
import { AUTH_MESSAGES } from '../../../features/auth/authMessages';
import { useAuth } from '../../../features/auth/useAuth';
import { ApiError } from '../../../services/api/apiError';

export function LoginForm() {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const login = useAuth((state) => state.login);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      await login({ email, password });
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

  function handleForgotPasswordClick(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
  }

  return (
    <form
      className="mt-[30px] flex flex-col gap-5"
      onSubmit={(event) => void handleSubmit(event)}
    >
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
        <div className="flex items-center justify-between gap-4 max-[520px]:flex-col max-[520px]:items-start max-[520px]:gap-1.5">
          <Label htmlFor="password">Senha de acesso</Label>
          <a
            className="text-xs font-medium text-link no-underline hover:underline"
            href="#"
            onClick={handleForgotPasswordClick}
          >
            Esqueceu a senha?
          </a>
        </div>
        <InputGroup variant="field">
          <InputGroupAddon>
            <LockIcon />
          </InputGroupAddon>
          <Input
            autoComplete="current-password"
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
        {isSubmitting ? 'Entrando...' : 'Entrar na plataforma'}
      </Button>

      <p className="mx-auto my-0 max-w-[310px] text-center text-xs leading-[1.35] text-text-muted">
        Segurança em conformidade com as normas ISO 27001 e LGPD.
      </p>

      <p className="m-0 text-center text-[13px] text-text-muted">
        Não possui conta?{' '}
        <Link
          className="text-link text-xs font-medium no-underline hover:underline"
          to={APP_ROUTES.register}
        >
          Cadastre-se
        </Link>
      </p>
    </form>
  );
}
