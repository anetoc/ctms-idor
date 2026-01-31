# CTMS IDOR - Research Operations Control Tower

[![FastAPI](https://img.shields.io/badge/FastAPI-0.109+-green.svg)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-blue.svg)](https://nextjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-blue.svg)](https://postgresql.org)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Sistema de gerenciamento de estudos clínicos para o Centro de Hematologia do IDOR, transformando cartas de monitoria em Action Items rastreáveis com SLA.

![Dashboard Preview](docs/assets/dashboard-preview.png)

## 🎯 Objetivo

Resolver o problema crítico de cartas de monitoria e follow-ups que se perdem ou envelhecem sem resolução, criando um **Research Operations Control Tower** que:

1. Transforma cartas de monitoria em Action Items rastreáveis com SLA
2. Integra dados regulatórios, data entry, amostras, imaging e finance
3. Gera KPIs executivos em tempo real
4. Permite triagem diária e governança institucional

## 📊 Contexto

- **33 estudos ativos** no centro de hematologia
- **Distribuição por fase:** 22 Fase III, 5 Fase II, 8 Fase I/II
- **SCs responsáveis:** Anataly (11), Eduarda (9), Nanci (9), Ariane (7)
- **Sponsors principais:** BeiGene, AbbVie, GSK, Janssen

## 🛠️ Stack Técnico

| Componente | Tecnologia | Descrição |
|------------|------------|-----------|
| **Backend** | FastAPI (Python 3.11+) | API REST com async/await |
| **Frontend** | Next.js 14 + shadcn/ui | App Router, Server Components |
| **Database** | PostgreSQL 17 | Com extensões uuid-ossp e pgcrypto |
| **State** | Zustand + React Query | Estado global e cache de dados |
| **UI** | Tailwind CSS + shadcn/ui | Componentes acessíveis |
| **Drag & Drop** | @dnd-kit | Kanban interativo |
| **Charts** | Recharts | Visualizações de dashboard |
| **Auth** | JWT (python-jose) | Tokens de acesso e refresh |
| **LLM** | Ollama (llama3.1:8b) | 100% local, PHI compliance |

## 📁 Estrutura do Projeto

```
ctms-idor/
├── backend/                    # FastAPI API
│   ├── app/
│   │   ├── api/v1/            # Endpoints (auth, studies, action_items, dashboard)
│   │   ├── config/            # Settings e database
│   │   ├── models/            # SQLAlchemy models
│   │   ├── schemas/           # Pydantic schemas
│   │   ├── services/          # SLA Engine, Auth Service
│   │   └── repositories/      # Data access layer
│   ├── requirements.txt
│   └── pyproject.toml
├── frontend/                   # Next.js 14 UI
│   ├── src/
│   │   ├── app/               # App Router pages
│   │   ├── components/        # UI components
│   │   ├── lib/               # API client, utils
│   │   ├── stores/            # Zustand stores
│   │   └── types/             # TypeScript types
│   ├── package.json
│   └── tailwind.config.ts
├── database/                   # SQL Migrations
│   └── migrations/            # 11 migration files
├── scripts/                    # Setup scripts
│   ├── setup-postgres.sh
│   └── run-migrations.sh
└── docs/                       # Documentação
    └── IMPLEMENTATION_PLAN.md
```

## 🚀 Quick Start

### Pré-requisitos

- Python 3.11+
- Node.js 18+
- PostgreSQL 14+ (recomendado 17)
- Git

### 1. Clone o Repositório

```bash
git clone https://github.com/anetoc/ctms-idor.git
cd ctms-idor
```

### 2. Configure o Banco de Dados

```bash
# Criar usuário e database
psql -d postgres -c "CREATE ROLE ctms_user WITH LOGIN PASSWORD 'ctms_password' CREATEDB;"
psql -d postgres -c "CREATE DATABASE ctms_idor OWNER ctms_user;"
psql -d ctms_idor -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\"; CREATE EXTENSION IF NOT EXISTS \"pgcrypto\";"

# Rodar migrations
./scripts/run-migrations.sh
```

### 3. Configure o Backend

```bash
cd backend

# Criar ambiente virtual (opcional mas recomendado)
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
# .venv\Scripts\activate   # Windows

# Instalar dependências
pip install -r requirements.txt

# Configurar variáveis de ambiente
cp .env.example .env
# Edite .env conforme necessário

# Iniciar servidor
uvicorn app.main:app --reload --port 8001
```

API disponível em: http://localhost:8001
Documentação Swagger: http://localhost:8001/docs

### 4. Configure o Frontend

```bash
cd frontend

# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

UI disponível em: http://localhost:3000

### 5. Credenciais de Teste

| Email | Senha | Role |
|-------|-------|------|
| admin@idor.org | admin123 | Admin |

## 📋 Funcionalidades

### Autenticação
- Login com JWT (access + refresh tokens)
- Proteção de rotas por role
- 8 roles: admin, ops_manager, sc_lead, study_coordinator, data_manager, quality, finance, readonly

### Studies (Estudos Clínicos)
- CRUD completo de estudos
- Filtros por status, sponsor, fase
- Contagem de enrollment e percentual
- Relacionamento com action items

### Action Items (Core MVP)
- CRUD com validação
- 11 categorias: regulatory, consent_icf, data_entry, queries, safety_reporting, samples, imaging, pharmacy_ip, training, contracts_budget, other
- 4 níveis de severidade: critical, major, minor, info
- 5 status: new, in_progress, waiting_external, done, verified
- **SLA automático** calculado na criação
- Audit trail de todas as mudanças

### Kanban Board
- Drag-and-drop entre colunas (@dnd-kit)
- Cards com badge de severidade
- Countdown de SLA em tempo real
- Filtros por categoria, severidade, estudo, assignee

### Dashboard (Command Center)
- 4 KPIs principais:
  - Overdue Count (vermelho se > 0)
  - Aging P90 (amarelo se > 5 dias)
  - Total Items Abertos
  - SLA Compliance % (verde se > 90%)
- Burndown chart semanal
- Pareto de categorias (top 5)

## ⏱️ SLA Engine

### Regras por Severidade

| Severidade | Horas | Dias Úteis | Escalation |
|------------|-------|------------|------------|
| Critical | 48h | 2 dias | 24h → Admin |
| Major | 40h | 5 dias | 20h → SC Lead |
| Minor | 80h | 10 dias | 40h → SC Lead |
| Info | 120h | 15 dias | 80h → SC Lead |

### Regras Especiais por Categoria

| Categoria | Severidade | Horas | Escalation |
|-----------|------------|-------|------------|
| safety_reporting | critical | 24h | 8h → Admin |
| safety_reporting | major | 24h | 12h → Admin |
| regulatory | critical | 24h | 12h → Admin |

### Feriados Brasileiros (2024-2026)

O SLA Engine considera automaticamente:
- Feriados fixos: Ano Novo, Tiradentes, Trabalho, Independência, Aparecida, Finados, República, Natal
- Feriados móveis: Carnaval, Paixão de Cristo, Corpus Christi (calculados baseados na Páscoa)

## 🔌 API Endpoints

### Auth
```
POST /api/v1/auth/login          # Login com email/senha
POST /api/v1/auth/refresh        # Renovar token
GET  /api/v1/auth/me             # Usuário atual
```

### Studies
```
GET    /api/v1/studies           # Listar estudos
GET    /api/v1/studies/{id}      # Detalhes do estudo
POST   /api/v1/studies           # Criar estudo
PUT    /api/v1/studies/{id}      # Atualizar estudo
DELETE /api/v1/studies/{id}      # Remover estudo
```

### Action Items
```
GET    /api/v1/action-items              # Listar com filtros
GET    /api/v1/action-items/{id}         # Detalhes com histórico
POST   /api/v1/action-items              # Criar (SLA calculado automaticamente)
PUT    /api/v1/action-items/{id}         # Atualizar (audit trail)
PATCH  /api/v1/action-items/{id}/status  # Atualização rápida de status
GET    /api/v1/action-items/stats        # Estatísticas
DELETE /api/v1/action-items/{id}         # Remover (apenas status NEW)
```

### Dashboard
```
GET /api/v1/dashboard/kpis       # 4 KPIs principais
GET /api/v1/dashboard/burndown   # Dados do burndown chart
GET /api/v1/dashboard/pareto     # Top 5 categorias
```

## 🗄️ Database Schema

### Tabelas Principais

| Tabela | Descrição |
|--------|-----------|
| users | Usuários do sistema |
| studies | Estudos clínicos |
| study_team | Associação usuário-estudo |
| action_items | Action items (core) |
| action_item_updates | Audit trail |
| sla_rules | Regras de SLA |
| monitor_letters | Cartas de monitoria |
| regulatory_events | Eventos regulatórios |
| safety_cases | Casos SUSAR/SAE |
| agent_runs | Log de execução RPA |

### ENUMs

- `user_role`: admin, ops_manager, sc_lead, study_coordinator, data_manager, quality, finance, readonly
- `study_status`: active, closed, suspended, in_startup
- `action_item_status`: new, in_progress, waiting_external, done, verified
- `action_item_category`: 11 categorias
- `severity_level`: critical, major, minor, info

## 🔒 Segurança e Compliance

- **PHI Compliance**: LLM 100% local via Ollama
- **Audit Trail**: Todas as mudanças em action items são registradas
- **JWT**: Tokens com expiração configurável
- **CORS**: Configurado para origens específicas
- **Passwords**: Hash com bcrypt
- **Environment**: Secrets em variáveis de ambiente

## 📈 Roadmap

### MVP (Semanas 1-2) ✅
- [x] Setup monorepo (backend, frontend, database)
- [x] Migrations SQL (11 tabelas)
- [x] Autenticação JWT
- [x] CRUD Studies e Action Items
- [x] SLA Engine com feriados BR
- [x] Kanban board com drag-drop
- [x] Dashboard com 4 KPIs

### Fase 2 (Semanas 3-4)
- [ ] Webhook para email ingestion
- [ ] Integração Ollama para extração de action items
- [ ] PHI redaction com Presidio
- [ ] Burndown chart interativo
- [ ] Pareto de causas

### Fase 3 (Pós-MVP)
- [ ] Study 360 page
- [ ] Regulatory pipeline view
- [ ] Heatmap estudos × overdue
- [ ] n8n workflows (alertas, reports)
- [ ] Moltbolt RPA para portais SUSAR

## 🧪 Testes

```bash
# Backend
cd backend
pytest

# Frontend
cd frontend
npm run test
```

## 📝 Contribuindo

1. Fork o projeto
2. Crie sua branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Autor

**Abel Costa**
Clinical Research & Software Development

---

**Versão:** 0.1.0
**Última atualização:** Janeiro 2026
