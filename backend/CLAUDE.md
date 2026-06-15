# Backend — HelixCare API

NestJS 11 + TypeScript + Sequelize + PostgreSQL.

## Estrutura de pastas

```
src/
  app.module.ts           # Raiz: registra todos os módulos
  main.ts                 # Bootstrap, Swagger, prefixo global api/v1
  core/
    decorators/           # @CurrentUser, @Roles
    guards/               # JwtAuthGuard, RolesGuard, LoginRateLimitGuard
    pipes/                # YupValidationPipe
    redis/                # RedisModule, RedisService, RedisLockService
    cloud/                # CloudService (UploadThing)
  modules/
    auth/                 # JWT + Passport, login/register
    users/                # Usuários internos da clínica
    roles/                # Entidade Role, enum de papéis
    patients/             # Cadastro de pacientes
    medical-records/      # Prontuários + histórico de edições
    appointments/         # Agendamentos + cron de no-show
    exams/                # Exames laboratoriais
    billing/              # Faturas, catálogo de preços, gateway de pagamento
    analytics/            # Relatórios e métricas
  search/                 # Busca global entre entidades
  database/
    migrations/           # Sequelize CLI (.js)
    seeders/              # Seeds iniciais (.js)
```

## Padrões obrigatórios

### Validação
- **Yup** para todos os schemas de entrada — nunca `class-validator`.
- Cada rota usa `YupValidationPipe` com o schema correspondente:
  ```ts
  @UsePipes(new YupValidationPipe(createPatientSchema))
  ```
- Schemas ficam em `schemas/`, DTOs (tipos TypeScript) em `dto/` ou `dtos/`.

### Entidades (Sequelize-Typescript)
- UUID como PK: `@Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })`
- Nomes de coluna em snake_case (`underscored: true` global).
- Soft delete em todas as entidades (`paranoid: true` global).
- Declare campos com `declare` (não atribuição direta).
- Timestamps: `created_at`, `updated_at`, `deleted_at`.

### Migrations
- Toda mudança de schema exige migration em `src/database/migrations/`.
- Nome: `YYYYMMDDHHMMSS-descricao-kebab-case.js`.
- Executar: `npx sequelize-cli db:migrate` (a partir de `backend/`).

### Autenticação e autorização
- Todas as rotas protegidas usam `@UseGuards(JwtAuthGuard, RolesGuard)`.
- Papéis declarados com `@Roles(RolesEnum.ADMIN, ...)`.
- Usuário autenticado injetado via `@CurrentUser()`.

### Eventos de domínio
- Usar `@nestjs/event-emitter` para comunicação entre módulos.
- Emitir com `EventEmitter2.emit('modulo.evento', payload)`.
- Ouvir com `@OnEvent('modulo.evento', { async: true })`.
- Classes de evento em `domain-events/` do módulo emissor.
- Padrão atual: `appointment.arrived`, `exam.completed` → geram faturas automaticamente.

### Módulos
- Cada módulo tem: `*.module.ts`, `controllers/`, `services/`, `entities/`, `dto/` ou `dtos/`, `schemas/`.
- Exportar apenas o necessário (serviços e `SequelizeModule` quando outro módulo precisar da entidade).

## Segurança
- Nunca logar CPF, dados clínicos ou financeiros.
- Senhas hasheadas com **argon2**.
- Rate limiting no login via `LoginRateLimitGuard` + Redis.
- Distributed locking via `RedisLockService`.

## Swagger
- Disponível em `http://localhost:3000/api/docs`.
- Autenticação: Bearer JWT (`JWT-auth`).
- Anotar controllers e DTOs com decorators `@ApiTags`, `@ApiBearerAuth`, `@ApiOperation`.

## Variáveis de ambiente necessárias
```
DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
JWT_SECRET
REDIS_HOST, REDIS_PORT
NODE_ENV
PORT (padrão 3000)
```
