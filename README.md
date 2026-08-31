# frontend-biota-geom

[![Quality](https://github.com/biota-geom/frontend-biota-geom/actions/workflows/quality.yml/badge.svg)](https://github.com/biota-geom/frontend-biota-geom/actions/workflows/quality.yml)

Base do frontend da plataforma **BiotaGeom**, construída com React, TypeScript,
Vite e Tailwind CSS.

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

Clone o repositório:

```bash
git clone <URL_DO_REPOSITORIO>
```

Entre na pasta do frontend:

```bash
cd frontend-biota-geom
```

Instale as dependências:

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
npm run dev              # inicia o ambiente de desenvolvimento
npm run build            # valida os tipos e gera o build de produção
npm run typecheck        # valida apenas os tipos
npm run lint             # executa o ESLint
npm run format           # formata os arquivos com Prettier
npm run format:check     # verifica a formatação sem alterar arquivos
npm test                 # executa os testes uma vez
npm run test:coverage    # executa os testes com cobertura
npm run coverage:changed # valida a cobertura dos arquivos alterados
npm run preview          # serve localmente o build de produção
```

O script `prepare` configura os hooks do Husky automaticamente durante o
`npm install`.

## Formatação de código

O projeto utiliza **Prettier** para padronizar a formatação. A configuração atual
do arquivo `.prettierrc` é:

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

Antes de enviar alterações, use `npm run format:check`. Para corrigir a
formatação automaticamente, use `npm run format`.

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

O projeto utiliza **React Router DOM** para a navegação entre as áreas
administrativa e de empresa. Os caminhos ficam centralizados em
`src/app/router/routes.ts`.

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

O projeto foi inicializado com o template **React + TypeScript** do Vite. A
organização principal é:

```text
frontend-biota-geom/
├── .github/       # workflows e template de pull request
├── public/        # arquivos públicos e favicon
├── scripts/       # scripts auxiliares de qualidade
├── src/
│   ├── app/       # configuração global e rotas
│   ├── assets/    # imagens, ícones e logos
│   ├── components/ # componentes compartilhados
│   ├── features/  # código organizado por domínio
│   ├── pages/     # páginas associadas às rotas
│   ├── services/  # estrutura para integrações futuras
│   ├── styles/    # entrada global e tema do Tailwind
│   └── tests/     # testes da aplicação
├── .gitignore
├── .prettierrc
├── AGENTS.md
├── commitlint.config.js
├── eslint.config.js
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Convenção de commits

Os commits devem seguir **Conventional Commits**, com mensagens curtas,
objetivas e escritas em inglês:

```text
tipo: descrição da alteração
```

Tipos principais:

```text
feat: nova funcionalidade
fix: correção de bug
chore: configuração ou manutenção do projeto
docs: alteração de documentação
refactor: refatoração sem alteração de comportamento
style: alteração de formatação ou estilo
test: criação ou alteração de testes
```

Exemplos:

```text
feat: add login page
refactor: migrate styles to tailwind
docs: update frontend guidelines
```

Consulte `AGENTS.md` para as regras de arquitetura e implementação.

## Status

Projeto em fase inicial. A arquitetura, a navegação e a identidade visual estão
preparadas, mas as funcionalidades de negócio e a integração com o backend ainda
serão implementadas.
