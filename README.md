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

## Testes

Testes ficam em `src/tests/`, espelhando a pasta de origem (`pages/`, `components/`, `routes/`). Usam Vitest + Testing Library, priorizando queries por role/texto (o que o usuário vê) em vez de detalhes de implementação.

```bash
npm test                 # roda os testes uma vez
npm run test:coverage    # roda com relatório de cobertura de linha
npm run coverage:changed # valida a cobertura das linhas alteradas (>= 80%)
```

### Testes de mutação

Além da cobertura de linha, o projeto usa [StrykerJS](https://stryker-mutator.io/) para medir se os testes realmente verificam comportamento, não só executam código. Mesma ideia do backend: ele altera pequenos trechos (ex: troca `>` por `>=`, esvazia uma string) e roda a suíte pra ver se algum teste percebe.

```bash
npm run test:mutation
```

Requer Node.js 22+. Configuração em `stryker.conf.json`:

- Ícones SVG decorativos ficam centralizados em `src/components/ui/icons.tsx`, excluído da mutação — são só marcação fixa, sem comportamento; mutar coordenadas de `path` só gera ruído.
- Dados mockados (`*.mock.ts`) também são excluídos — são fixtures, não lógica.
- Páginas ainda não implementadas (`RoutePlaceholder`) são excluídas até terem lógica de verdade.
- `concurrency: 1`: mutação roda muitos processos filhos em paralelo por padrão, e em ambientes com CPU disputada isso gera falsos "timeout" que o Stryker credita como se o mutante tivesse sido pego — mascarando testes fracos. Rodar sequencial é mais lento, mas dá o número certo.
- `thresholds.break: 90`: o job `Mutation Tests` do CI falha se o score cair abaixo disso.

Alguns mutantes sobrevivem por design e não são falhas de teste (marcados com comentário `// Stryker disable next-line ...` no código quando o comentário funciona, ou só uma nota "untested on purpose" quando o Stryker não reconhece o comentário no meio de uma chain como `.filter().join()`):

- Valor de prop `key` do React (não é observável no DOM).
- Classes CSS "base" que não mudam entre estados (ex: espaçamento comum a um componente ativo e inativo), e o separador `' '` de `.join(' ')` ao concatenar classes — sobrescrever qualquer um dos dois com `""` não muda nada que um teste de comportamento devesse verificar.
- Fallbacks defensivos para uma rota com parâmetro obrigatório (`:companyId`) vir vazia — o React Router nunca casa a rota nesse estado, então o branch é inalcançável por navegação real.
- Re-padding do segmento base64url em `authTokens.ts`: o `atob` do Node/jsdom segue o _forgiving base64_ do WHATWG e aceita padding faltando, então mutantes que só encurtam o alvo do `padEnd` decodificam igual. O que de fato quebra o decode (padding a mais) é coberto por um token com segmento de tamanho `% 4 === 3`.
- `password.length > 0` em `RegisterForm.tsx`: `passwordsMatch` só é lido depois de `isPasswordStrongEnough`, que já exige 8 caracteres — a guarda de string vazia é inalcançável por esse caminho.
- `actions.length > 0` em `PageScaffold.tsx`: com a lista vazia, o `<div>` wrapper vazio e o `null` renderizam a mesma coisa — nada visível.
- `/\s+/` → `/\s/` em `getInitials` (`AppHeader.tsx`): só muda o resultado com espaços internos consecutivos, e a função usa apenas o primeiro e o último pedaço do nome.
- Mutantes de `http.ts` que devolvem exatamente o mesmo valor: `JSON.parse('')` já cai no `catch`, que também devolve `undefined`, e `JSON.stringify(undefined)` é `undefined`.
- Array de dependências do `useEffect` de bootstrap em `AppRouter.tsx`: `bootstrap` é uma action estável do zustand, então `[]` se comporta igual.

Hoje o mutation score geral é 94,5% (381 mutantes mortos, 22 sobreviventes). `PageScaffold.tsx` (76,5%), `AppHeader.tsx` (79,2%), `authTokens.ts` (83,3%) e `BiotaLogo.tsx` (86,4%) puxam a média pra baixo — os três primeiros por terem mais classes CSS "base" do que os outros arquivos, e `authTokens.ts` pelo re-padding base64url. Todos os sobreviventes já foram checados e caem nas categorias acima.

### Referências de teste

- `src/tests/pages/AdminCompaniesPage.test.tsx` + `src/pages/admin/Companies/companyCardFormatting.ts`: lógica de negócio (limiares de conformidade, rótulo de status) extraída para funções puras e testada diretamente, sem precisar renderizar a página inteira.
- `src/tests/pages/LoginForm.test.tsx`: interação isolada do componente (clique, toggle de senha). O fluxo de submit vive em `LoginPage.test.tsx`, que mocka a `authApi` — inclusive o cuidado de garantir que `preventDefault` realmente impede o comportamento padrão do navegador (`fireEvent.submit(form)` retorna `false` quando algum handler chama `preventDefault`).
- `src/tests/routes/RootRedirect.test.tsx`: componente montado sozinho, fora de `<AppRoutes/>`. Dentro da árvore completa, `PublicOnlyRoute`/`ProtectedRoute` derivam a mesma decisão do mesmo `status` e corrigem em silêncio um redirect errado — o teste integrado passa mesmo com o `RootRedirect` quebrado.
- `src/tests/components/useCompanyBreadcrumbs.test.tsx`: como testar um hook que depende de rota (`useParams`) com `renderHook` + `MemoryRouter`.

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
