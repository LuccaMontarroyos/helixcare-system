# Frontend — HelixCare

## Stack
- AngularJS 1.3.7 (não é Angular 2+)
- Tailwind CSS (utility-first)
- ui-router para roteamento
- Material Symbols para ícones

## IMPORTANTE — AngularJS 1.3.7 não é o Angular moderno
- Sem componentes, sem decorators, sem TypeScript
- Controllers, Services, Directives, Filters — padrão MVC clássico
- Two-way data binding com `ng-model`
- Promises com `$q.defer()`, nunca async/await

## Estrutura de pastas

```
frontend/
  index.html              # Entry point: carrega todos os scripts na ordem correta
  app.module.js           # Declara o módulo raiz 'helixcare' e suas dependências
  app.config.js           # Router ($stateProvider), JwtInterceptor, constantes globais
  app.run.js              # Guard de autenticação/autorização via $stateChangeStart
  assets/css/style.css    # Estilos globais complementares ao Tailwind
  shared/
    controllers/
      main.controller.js  # Layout principal: sidebar, header, busca global, logout
    services/
      toast.service.js    # ToastService (factory): success/error/warning/info
      search.service.js   # SearchService: busca global
    components/
      hc-toast.directive.js      # Renderiza fila de toasts
      hc-has-role.directive.js   # Remove elemento do DOM se role não autorizada
      hc-file-model.directive.js # ng-model para inputs file
    filters/
      cpf.filter.js       # Formata CPF (000.000.000-00)
  modules/
    auth/                 # Login, AuthService, estratégia JWT
    patients/             # Lista e detalhe de pacientes
    appointments/         # Agenda semanal com filtros
    medical-records/      # Prontuários e hub de registros
    exams/                # Board do laboratório
    billing/              # Faturamento e faturas
    analytics/            # Dashboard com métricas
    settings/             # Configurações do usuário
```

## Padrões obrigatórios

### JavaScript
- **ES5 estrito**: usar `var`, funções normais (sem arrow functions, sem `let`/`const`).
- **Array DI sempre**: toda injeção de dependência deve usar a sintax de array para suportar minificação:
  ```js
  .controller('MeuController', ['$scope', 'MeuService', function($scope, MeuService) { ... }]);
  ```
- **Promises via `$q`**: usar `$q.defer()` / `$q.when()` — nunca Promise nativa.
- **`$http` para requisições**: nunca `fetch`.

## Convenções de HTML (templates)
- `ng-if` para elementos que não devem existir no DOM
- `ng-show`/`ng-hide` para elementos que alternam visibilidade
- `ng-cloak` em elementos que aparecem depois de carregamento
- Diretiva `hc-has-role` para controle de acesso visual

### Módulos
- Cada feature tem seu próprio sub-módulo: `helixcare.<feature>`.
- Declaração do módulo: `angular.module('helixcare.auth', [])` (com dependências).
- Uso posterior: `angular.module('helixcare.auth')` (sem array).
- Todo novo script deve ser adicionado ao `index.html` na ordem correta (módulo antes do serviço, serviço antes do controller).

### Roteamento (UI-Router)
- Rotas declaradas em `app.config.js` via `$stateProvider`.
- Toda rota protegida deve ter `data: { requireAuth: true, allowedRoles: [...] }`.
- `allowedRoles: []` (array vazio) = acessível a qualquer role autenticada.
- Navegação em templates: `ui-sref="nome-do-estado"`.

### Autenticação e autorização
- Token JWT armazenado em `localStorage` como `hc_token`.
- Usuário serializado em `localStorage` como `hc_user` (JSON).
- `JwtInterceptor` injeta `Authorization: Bearer <token>` em todas as requisições `$http`.
- Resposta 401 → limpa storage e redireciona para `login`.
- Para ocultar elementos na view por role: `hc-has-role="['ADMIN', 'DOCTOR']"` (remove o elemento do DOM).
- Para verificar role em controller: `AuthService.hasAnyRole(['ADMIN'])`.

### Feedback ao usuário
- **Sempre** usar `ToastService` para feedback de ações. Nunca `alert()`.
  ```js
  ToastService.success('Paciente cadastrado com sucesso.');
  ToastService.error('Não foi possível salvar. Tente novamente.');
  ```

### Estilo (Tailwind)
- Tailwind carregado via CDN com plugins `forms` e `container-queries`.
- Cores customizadas:
  - `primary`: `#24aceb`
  - `background-light`: `#f6f7f8`
  - `background-dark`: `#111c21`
- Dark mode via estratégia `class` — usar variantes `dark:` junto com as classes light.
- Ícones: **Material Symbols Outlined** (`<span class="material-symbols-outlined">icon_name</span>`).
- Fonte: **Inter** (`font-display`).
- Não adicionar estilos inline nem classes CSS ad hoc — usar utilitários Tailwind.

## URL da API
`http://localhost:3000/api/v1` — definida individualmente em cada service.

## Rotas registradas

| State                    | URL                                          | Roles permitidas                                |
|--------------------------|----------------------------------------------|-------------------------------------------------|
| `login`                  | `/login`                                     | Pública                                         |
| `dashboard`              | `/dashboard`                                 | ADMIN                                           |
| `patients`               | `/patients`                                  | ADMIN, RECEPTIONIST, DOCTOR, NURSE              |
| `patient-detail`         | `/patients/:id`                              | ADMIN, RECEPTIONIST, DOCTOR, NURSE, LAB_TECHNICIAN |
| `appointments`           | `/appointments`                              | Todos                                           |
| `patient-medical-records`| `/patients/:patientId/medical-records`       | ADMIN, DOCTOR, NURSE                            |
| `medical-records-hub`    | `/medical-records`                           | ADMIN, DOCTOR, NURSE                            |
| `exams-laboratory`       | `/exams/lab`                                 | ADMIN, LAB_TECHNICIAN                           |
| `billing`                | `/billing`                                   | ADMIN, RECEPTIONIST                             |
| `settings`               | `/settings`                                  | Todos                                           |

## O que NUNCA fazer
- Manipular DOM diretamente (usar diretivas Angular)
- `setTimeout` sem `$scope.$apply()` para atualizar o scope
- Esquecer `$event.stopPropagation()` em elementos clicáveis dentro de outros clicáveis