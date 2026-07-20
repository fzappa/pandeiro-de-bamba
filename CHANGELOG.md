# Changelog

Todas as mudanças relevantes deste projeto são documentadas neste arquivo.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o versionamento segue [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [Unreleased]

## [1.0.0] - 2026-05-22

### Added

- Editor de partitura em SVG com notação própria de pandeiro.
- Pandeiro interativo, reprodução em loop com Web Audio API, biblioteca local e presets.
- ESLint com regras para Svelte, imports não utilizados e acessibilidade.
- Testes de persistência, áudio e telemetria.
- Testes E2E com Playwright.
- `CONTRIBUTING.md`, `CHANGELOG.md`, `Dockerfile`, `compose.yaml` e documentação de deploy.
- CI com validação completa, auditoria de dependências e imagem Docker endurecida.

### Changed

- `pnpm lint` agora executa Prettier e ESLint.
- Validação de scores importados sem `as any` em `persistence.ts`.

### Fixed

- Formatação Prettier em arquivos JSON da biblioteca.
- `.gitignore` ajustado para não ignorar `src/lib/` do SvelteKit.

## [0.9.3] - 2026-05-18

Versão interna de desenvolvimento; funcionalidades principais incorporadas em [1.0.0].

[Unreleased]: https://github.com/fzappa/pandeiro-de-bamba/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/fzappa/pandeiro-de-bamba/releases/tag/v1.0.0
[0.9.3]: https://github.com/fzappa/pandeiro-de-bamba/releases/tag/v0.9.3
