# Contribuindo

Obrigado por considerar contribuir com o **Pandeiro de Bamba**.

## Antes de começar

1. Leia o [README](./README.md) para entender o escopo do projeto.
2. Verifique se já existe uma issue ou discussão sobre o que pretende alterar.
3. Mudanças grandes devem ser alinhadas antes, para evitar retrabalho.

## Ambiente local

Requisitos:

- Node.js 24+
- pnpm 10.28+ (o repositório fixa a versão em `packageManager`)

```sh
pnpm install
pnpm dev
```

## Validação obrigatória

Antes de abrir um pull request, execute:

```sh
pnpm run validate
```

Isso roda formatação (Prettier), lint (ESLint), checagem de tipos, testes unitários e build.

Para incluir os testes E2E:

```sh
pnpm run test:e2e:install
pnpm run test:e2e
```

Ou tudo de uma vez:

```sh
pnpm run validate:all
```

## Padrões de código

- TypeScript com `strict` habilitado.
- Svelte 5 com runes (`$state`, `$derived`, etc.).
- Formatação via Prettier (`pnpm run format`).
- Lint via ESLint (`pnpm exec eslint . --fix` após alterações).
- Lógica de domínio (notação, playback, persistência) em módulos `.ts` testáveis, fora dos componentes quando possível.
- Comentários apenas quando a intenção não for óbvia pelo código.

## Testes

- Testes unitários de domínio e serviços: `tests/*.test.mjs` (Node test runner).
- Testes E2E: `e2e/` (Playwright).
- Ao corrigir bugs, prefira incluir um teste que reproduza o problema.

## Commits e pull requests

- Commits em português ou inglês, com mensagens claras no imperativo.
- PRs devem descrever o **porquê** da mudança e incluir um plano de teste manual quando aplicável.
- Atualize o [CHANGELOG](./CHANGELOG.md) na seção `[Unreleased]` para mudanças visíveis ao usuário.

## Licença

Ao contribuir, você concorda que suas contribuições serão licenciadas sob a [AGPL-3.0](./LICENSE).
