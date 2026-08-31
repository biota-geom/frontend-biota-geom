# frontend-biota-geom

[![Quality](https://github.com/biota-geom/frontend-biota-geom/actions/workflows/quality.yml/badge.svg)](https://github.com/biota-geom/frontend-biota-geom/actions/workflows/quality.yml)

Base do frontend da plataforma **BiotaGeom**, construída com React, TypeScript,
Vite e Tailwind CSS.

## Escopo atual

O projeto ainda é um esqueleto de navegação e identidade visual. Nesta etapa:

- o login apenas redireciona para a área administrativa;
- a listagem de empresas usa dados explicitamente mockados;
- as demais páginas exibem cabeçalho, navegação, breadcrumbs e placeholders;
- ações de criação e edição ainda não possuem comportamento;
- não existem autenticação real, integração com API, persistência ou regras de
  autorização.

## Tecnologias

- React 19
- TypeScript com modo estrito
- Vite
- Tailwind CSS 4 pelo plugin oficial para Vite
- React Router DOM
- Vitest, Testing Library e jsdom
- ESLint e Prettier
- Husky, lint-staged e Commitlint

## Instalação

```bash
npm install
```

## Desenvolvimento

```bash
npm run dev
```

O Vite inicia o servidor local e abre a aplicação automaticamente no navegador,
normalmente em `http://localhost:5173`.

## Scripts

```bash
npm run dev             # inicia o ambiente de desenvolvimento
npm run build           # valida os tipos e gera o build de produção
npm run typecheck       # valida apenas os tipos
npm run lint            # executa o ESLint
npm run format          # formata os arquivos com Prettier
npm run format:check    # verifica a formatação sem alterar arquivos
npm test                # executa os testes uma vez
npm run test:coverage   # executa os testes com cobertura
npm run preview         # serve localmente o build de produção
```

## Tailwind CSS

Tailwind é o padrão exclusivo para estilos de componentes e páginas. As classes
utilitárias ficam diretamente no JSX/TSX.

O arquivo `src/styles/global.css` é a única folha global da aplicação e contém:

- `@import 'tailwindcss'`;
- tokens compartilhados definidos com `@theme`;
- somente os estilos base necessários para `html`, `body` e `#root`.

O projeto usa a configuração CSS-first do Tailwind 4, portanto não precisa de um
arquivo `tailwind.config.js`. Não devem ser criados CSS Modules nem folhas CSS por
componente.

## Rotas preparadas

- `/login`
- `/admin/companies`
- `/admin/legislation`
- `/admin/indicators`
- `/companies/:companyId/dashboard`
- `/companies/:companyId/licenses`
- `/companies/:companyId/licenses/:licenseId`
- `/companies/:companyId/obligations`
- `/companies/:companyId/legislation`
- `/companies/:companyId/indicators`
- `/companies/:companyId/documents`

Fluxos de criação serão modais abertos nas páginas de contexto. Não existem rotas
`/new` nesta base.

## Dados mockados

Dados temporários usados apenas para navegação e composição visual devem ser
identificados por `.mock.ts` no nome do arquivo e `MOCK_` no nome da exportação.
Isso evita que sejam confundidos com integração real de backend.

## Estrutura principal

```text
src/
├── app/          # configuração global e rotas
├── assets/       # imagens, ícones e logos
├── components/   # componentes compartilhados
├── features/     # código organizado por domínio
├── pages/        # páginas associadas às rotas
├── services/     # estrutura reservada para integrações futuras
├── styles/       # entrada global e tema do Tailwind
└── tests/        # testes da aplicação
```

## Commits

Use Conventional Commits, em inglês, com mensagens curtas e objetivas:

```text
feat: add login page
refactor: migrate styles to tailwind
docs: update frontend guidelines
```

Consulte `AGENTS.md` para as regras de arquitetura e implementação.
