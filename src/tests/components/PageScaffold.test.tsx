import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
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

  it('renders the titleAside node beside the title, outside the heading', () => {
    render(
      <PageScaffold
        subtitle="Subtítulo"
        title="Título"
        titleAside={<span>3 empresas</span>}
      >
        <p>Conteúdo</p>
      </PageScaffold>
    );

    expect(screen.getByText('3 empresas')).toBeInTheDocument();
    // An exact accessible name fails if the aside is rendered inside the h1.
    expect(screen.getByRole('heading', { name: 'Título' })).toBeInTheDocument();
  });

  it('renders nothing beside the title when no titleAside is given', () => {
    render(
      <PageScaffold subtitle="Subtítulo" title="Título">
        <p>Conteúdo</p>
      </PageScaffold>
    );

    const heading = screen.getByRole('heading', { name: 'Título' });

    expect(heading.parentElement).toHaveTextContent('Título');
    expect(heading.parentElement?.childElementCount).toBe(1);
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

  it("calls an action's onClick handler when the button is pressed", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <PageScaffold
        actions={[{ label: 'Nova Licença', onClick }]}
        subtitle="Subtítulo"
        title="Título"
      >
        <p>Conteúdo</p>
      </PageScaffold>
    );

    await user.click(screen.getByRole('button', { name: /nova licença/i }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
