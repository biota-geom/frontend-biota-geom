import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { PageScaffold } from '../../components/layout/PageScaffold';

describe('PageScaffold', () => {
  it('does not render a breadcrumb bar when none is given', () => {
    render(
      <PageScaffold subtitle="Subtítulo" title="Título">
        <p>Conteúdo</p>
      </PageScaffold>
    );

    expect(
      screen.queryByRole('navigation', { name: /breadcrumb/i })
    ).not.toBeInTheDocument();
    expect(screen.getByRole('main').className).toContain(
      'min-h-[calc(100svh-72px)]'
    );
  });

  it('renders a breadcrumb bar when items are given', () => {
    render(
      <MemoryRouter>
        <PageScaffold
          breadcrumbs={[{ label: 'Empresas' }]}
          subtitle="Subtítulo"
          title="Título"
        >
          <p>Conteúdo</p>
        </PageScaffold>
      </MemoryRouter>
    );

    expect(
      screen.getByRole('navigation', { name: /breadcrumb/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('main').className).toContain(
      'min-h-[calc(100svh-121px)]'
    );
  });

  it('renders no action button when no actions are given', () => {
    render(
      <PageScaffold subtitle="Subtítulo" title="Título">
        <p>Conteúdo</p>
      </PageScaffold>
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders a plus icon on an action by default', () => {
    render(
      <PageScaffold
        actions={[{ label: 'Nova Empresa' }]}
        subtitle="Subtítulo"
        title="Título"
      >
        <p>Conteúdo</p>
      </PageScaffold>
    );

    const button = screen.getByRole('button', { name: /nova empresa/i });

    expect(button.querySelector('svg')).toBeInTheDocument();
  });

  it('omits the icon on an action when icon is set to "none"', () => {
    render(
      <PageScaffold
        actions={[{ icon: 'none', label: 'Nova Empresa' }]}
        subtitle="Subtítulo"
        title="Título"
      >
        <p>Conteúdo</p>
      </PageScaffold>
    );

    const button = screen.getByRole('button', { name: /nova empresa/i });

    expect(button.querySelector('svg')).not.toBeInTheDocument();
  });
});
