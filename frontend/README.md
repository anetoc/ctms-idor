# CTMS IDOR Frontend

Frontend do Sistema de Gestao de Estudos Clinicos do IDOR, construido com Next.js 14, TypeScript, Tailwind CSS e shadcn/ui.

## Requisitos

- Node.js 18.17 ou superior
- npm 9.x ou superior

## Instalacao

1. Navegue ate o diretorio do frontend:
```bash
cd /Users/abelcosta/projetos/ctms-idor/frontend
```

2. Instale as dependencias:
```bash
npm install
```

3. Configure as variaveis de ambiente:
```bash
cp .env.local.example .env.local
# Edite .env.local conforme necessario
```

4. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

5. Abra [http://localhost:3000](http://localhost:3000) no navegador.

## Estrutura do Projeto

```
frontend/
├── src/
│   ├── app/                    # App Router (Next.js 14)
│   │   ├── (auth)/            # Rotas de autenticacao
│   │   │   └── login/
│   │   ├── (dashboard)/       # Rotas do dashboard (protegidas)
│   │   │   ├── action-items/
│   │   │   └── page.tsx       # Dashboard principal
│   │   ├── globals.css        # Estilos globais
│   │   ├── layout.tsx         # Layout raiz
│   │   └── providers.tsx      # Providers (React Query, etc)
│   ├── components/
│   │   ├── ui/                # Componentes shadcn/ui
│   │   ├── layout/            # Sidebar, Header
│   │   ├── dashboard/         # KPI Cards, Stats
│   │   └── action-items/      # Kanban Board, Cards, Filters
│   ├── lib/
│   │   ├── api-client.ts      # Cliente Axios com interceptors
│   │   └── utils.ts           # Funcoes utilitarias
│   ├── stores/
│   │   ├── auth-store.ts      # Zustand store de autenticacao
│   │   └── action-items-store.ts  # Zustand store de action items
│   └── types/
│       └── index.ts           # TypeScript types
├── public/
├── tailwind.config.ts
├── next.config.mjs
└── package.json
```

## Principais Features

### Dashboard (Command Center)
- 4 KPIs principais: Itens em Atraso, Aging P90, Total de Items, SLA Compliance
- Graficos de distribuicao por severidade, status e categoria
- Traffic light indicators para cada KPI

### Action Items
- Kanban Board com drag-and-drop (@dnd-kit)
- 4 colunas: Novo, Em Progresso, Aguardando Externo, Concluido
- Filtros por categoria, severidade, estudo, responsavel
- Indicador de SLA com countdown
- Badges de severidade coloridos

### Autenticacao
- Login com email/senha
- JWT token storage com Zustand + persist
- Protecao de rotas automatica
- Logout com limpeza de estado

## Tecnologias

- **Framework**: Next.js 14 (App Router)
- **Linguagem**: TypeScript
- **Estilizacao**: Tailwind CSS
- **Componentes**: shadcn/ui (Radix primitives)
- **Estado**: Zustand
- **Data Fetching**: TanStack React Query
- **Graficos**: Recharts
- **Drag & Drop**: @dnd-kit
- **HTTP Client**: Axios

## Scripts

```bash
npm run dev      # Servidor de desenvolvimento
npm run build    # Build de producao
npm run start    # Iniciar build de producao
npm run lint     # Executar ESLint
```

## Customizacao de Cores

O projeto inclui cores customizadas para severidade e status no `tailwind.config.ts`:

- **Severity**: critical (red), major (orange), minor (yellow), info (blue)
- **Status**: new (blue), in-progress (violet), waiting (amber), done (green), overdue (red)

## API Integration

O cliente de API (`src/lib/api-client.ts`) inclui:
- Base URL configuravel via `NEXT_PUBLIC_API_URL`
- Interceptor automatico para JWT token
- Redirect automatico para login em 401
- Tratamento de erros centralizado

## Desenvolvimento

Para adicionar novos componentes shadcn/ui:
```bash
npx shadcn@latest add [component-name]
```

## Proximos Passos

- [ ] Implementar formulario de criacao de Action Item
- [ ] Adicionar modal de detalhes do Action Item
- [ ] Implementar pagina de Estudos
- [ ] Adicionar pagina de Regulatorio
- [ ] Implementar notificacoes em tempo real
- [ ] Adicionar testes E2E com Playwright
