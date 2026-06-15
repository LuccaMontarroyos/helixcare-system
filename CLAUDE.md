# Helixcare - Sistema de Prontuário Médico

## Visão geral
Sistema fullstack de gestão clínica. Backend em NestJS/TypeScript com PostgreSQL.
Frontend em AngularJS 1.3.7 com Tailwind CSS.

## Estrutura do repositório
- `backend/` — API REST (NestJS, Sequelize, PostgreSQL)
- `frontend/` — SPA (AngularJS 1.3.7, Tailwind CSS)

## Regras absolutas (nunca violar)
- Dados de pacientes são sensíveis — nunca logar CPF, dados clínicos ou financeiros
- Toda alteração em schema de banco deve ter migration correspondente
- Nunca fazer rollback de migrations em produção sem aprovação explícita

## Padrão de branches
- `feature/nome-da-feature` — novas funcionalidades
- `refactor/nome-do-refactor` — refatorações
- `fix/nome-do-fix` — correções de bug
Sempre em inglês, kebab-case.

## Roles do sistema
ADMIN | RECEPTIONIST | DOCTOR | NURSE | LAB_TECHNICIAN

## Contexto de negócio
Clínica médica privada. Fluxo principal:
SCHEDULED → CONFIRMED → WAITING → IN_PROGRESS → COMPLETED

## Comandos

Todos os comandos rodam através do diretório `backend/`.

```bash
# Development
npm run start:dev       # watch mode
npm run start           # single run
npm run build           # compile TypeScript

# Testing
npm run test            # all unit tests
npm run test:watch      # watch mode
npm run test:cov        # with coverage
npm run test:e2e        # e2e tests

# Code quality
npm run lint            # ESLint with autofix
npm run format          # Prettier

# Database (Sequelize CLI, run from backend/)
npx sequelize-cli db:migrate
npx sequelize-cli db:migrate:undo
npx sequelize-cli db:seed:all
```