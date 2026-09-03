import { BiotaLogo } from '../../components/ui/BiotaLogo';
import { RegisterForm } from './components/RegisterForm';

export function RegisterPage() {
  return (
    <main className="grid min-h-svh place-items-center bg-[radial-gradient(circle_at_0%_0%,rgba(16,185,129,0.16),transparent_30%),linear-gradient(135deg,#f7fafc_0%,#f4f8fb_48%,#e8ecff_100%)] px-5 py-10 max-[520px]:px-4 max-[520px]:py-6">
      <section className="rounded-panel min-h-[500px] w-full max-w-[440px] border border-border bg-surface px-[47px] py-[46px] shadow-card max-[520px]:min-h-0 max-[520px]:px-6 max-[520px]:py-8">
        <BiotaLogo
          className="w-full"
          nameAs="h1"
          tagline="Criar Conta"
          variant="stacked"
        />
        <RegisterForm />
      </section>
    </main>
  );
}
