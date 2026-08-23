# frontend-biota-geom

Frontend do projeto **Biota Geom**, desenvolvido com **React** e **TypeScript**.

## Tecnologias configuradas até o momento

- React
- TypeScript
- Vite
- ESLint
- Prettier
- React Router DOM

## Instalação

Clone o repositório:

```bash
git clone <URL_DO_REPOSITORIO>
```

Entre na pasta do projeto:

```bash
cd frontend-biota-geom
```

Instale as dependências:

```bash
npm install
```

## Executar o projeto

Para iniciar o ambiente de desenvolvimento:

```bash
npm run dev
```

O endereço local será informado pelo Vite no terminal, normalmente:

```text
http://localhost:5173
```

## Scripts disponíveis

```bash
npm run dev
```

Inicia o servidor de desenvolvimento.

```bash
npm run build
```

Gera a versão de produção do projeto.

```bash
npm run lint
```

Executa a verificação de lint no código.

```bash
npm run preview
```

Executa localmente uma prévia da versão gerada para produção.

## Formatação de código

O projeto utiliza **Prettier** para padronização da formatação do código.

Configuração atual do arquivo `.prettierrc`:

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5"
}
```

## Rotas

O projeto possui o **React Router DOM** instalado para gerenciamento das rotas e navegação entre as páginas da aplicação.

## Convenção de commits

Os commits devem seguir um padrão simples baseado em **Conventional Commits**:

```text
tipo: descrição da alteração
```

Principais tipos utilizados:

```text
feat: nova funcionalidade
fix: correção de bug
chore: configuração ou manutenção do projeto
docs: alteração de documentação
refactor: refatoração de código sem alteração de comportamento
style: alteração de formatação ou estilo
test: criação ou alteração de testes
```

Exemplos:

```bash
git commit -m "chore: configure prettier"
```

```bash
git commit -m "chore: install react router dom"
```

```bash
git commit -m "docs: add project readme"
```

```bash
git commit -m "feat: add login page"
```

As mensagens devem ser curtas, objetivas e escritas em inglês.

## Estrutura atual

O projeto foi inicializado com **Vite**, utilizando o template:

```text
React + TypeScript
```

Os principais arquivos de configuração incluem:

```text
frontend-biota-geom/
├── public/
├── src/
├── .gitignore
├── .prettierrc
├── eslint.config.js
├── index.html
├── package.json
├── package-lock.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
└── vite.config.ts
```

## Status

Projeto em fase inicial de configuração.
