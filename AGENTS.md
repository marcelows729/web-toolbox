# AGENTS.md

## Project Overview

This repository contains a collection of small web tools for development and everyday work.

The primary goal is to make it easy to add new tools while keeping the application simple and maintainable.

## Technology Stack

Frontend:

- React
- TypeScript
- Vite

Hosting:

- Cloudflare Pages

Future backend:

- Java
- Spring Boot
- PostgreSQL
- AWS

Do not introduce backend infrastructure unless it is required by a feature.

## Development Principles

- Prefer simple implementations.
- Avoid premature abstraction.
- Reuse existing components when appropriate.
- Keep each tool independent where possible.
- Prefer browser-side processing when server-side processing is unnecessary.
- Do not send user input to an external server unless the feature explicitly requires it.
- Keep dependencies minimal.
- Do not add a new library when the functionality can reasonably be implemented using existing dependencies or standard browser APIs.

## Tool Development

Before implementing a new tool, read:

- `docs/requirements.md`
- `docs/architecture.md`
- `docs/tool-development-guide.md`
- `docs/decisions.md`

New tools should follow the existing UI and project structure.

When adding a tool:

1. Implement the tool.
2. Register its metadata so that it appears in the toolbox.
3. Add appropriate tests when practical.
4. Update documentation if the implementation introduces a new architectural decision.

## Scope Control

Do not implement features that were not requested.

If a requested change would require a significant architectural change, explain the impact before implementing it.

## Security and Privacy

Treat user-provided text and files as potentially sensitive.

If processing can be performed entirely in the browser, keep it in the browser.

Do not introduce analytics, tracking, external APIs, or data persistence unless explicitly required.