# IDOR CTMS - Plano de Implementação

## Visão Geral

Sistema de gerenciamento de estudos clínicos para o Centro de Hematologia do IDOR, transformando cartas de monitoria em Action Items rastreáveis com SLA.

## Timeline MVP (4 Semanas)

### Semana 1: Foundation ✅ COMPLETO
- [x] Setup monorepo (backend, frontend, database)
- [x] Criar migrations SQL (11 migrations)
- [x] Setup FastAPI com estrutura
- [x] Setup Next.js com shadcn/ui
- [x] Conectar banco de dados (PostgreSQL 17 na porta 5432)
- [x] Implementar autenticação JWT

### Semana 2: Core MVP ✅ COMPLETO
- [x] CRUD de Studies completo
- [x] CRUD de Action Items
- [x] SLA Engine (dias úteis BR com feriados 2024-2026)
- [x] Kanban board com drag-drop (@dnd-kit)
- [x] Cards com countdown SLA

### Semana 3: Ingestion + Dashboard
- [ ] Webhook para email ingestion
- [ ] Integração Ollama para extração
- [ ] PHI redaction com Presidio
- [ ] Command Center (4 KPIs)
- [ ] Burndown chart
- [ ] Pareto de causas

### Semana 4: Polish + Regulatory
- [ ] Study 360 page
- [ ] Regulatory pipeline view
- [ ] Heatmap estudos × overdue
- [ ] Testes unitários
- [ ] Deploy (opcional)

## Arquitetura

```
┌─────────────────┐     ┌─────────────────┐
│   Frontend      │     │   Backend       │
│   Next.js 14    │◄───►│   FastAPI       │
│   shadcn/ui     │     │   Python        │
└─────────────────┘     └────────┬────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
              ┌─────▼─────┐           ┌───────▼───────┐
              │ PostgreSQL│           │    Ollama     │
              │  (5432)   │           │   (11434)     │
              └───────────┘           └───────────────┘
```

## Endpoints API (MVP)

### Auth
- `POST /api/v1/auth/login` - JWT login
- `POST /api/v1/auth/refresh` - Refresh token
- `GET /api/v1/auth/me` - Current user

### Studies
- `GET /api/v1/studies` - List studies
- `GET /api/v1/studies/{id}` - Get study
- `POST /api/v1/studies` - Create study
- `PUT /api/v1/studies/{id}` - Update study

### Action Items
- `GET /api/v1/action-items` - List with filters
- `GET /api/v1/action-items/{id}` - Get with history
- `POST /api/v1/action-items` - Create
- `PUT /api/v1/action-items/{id}` - Update
- `PATCH /api/v1/action-items/{id}/status` - Quick status update
- `GET /api/v1/action-items/stats` - Dashboard stats

### Dashboard
- `GET /api/v1/dashboard/kpis` - Main KPIs
- `GET /api/v1/dashboard/burndown` - Burndown data
- `GET /api/v1/dashboard/pareto` - Top categories

## SLA Rules

| Severity | Horas | Dias Úteis | Escalation |
|----------|-------|------------|------------|
| Critical | 48h | 2 dias | 24h → Admin |
| Major | 40h | 5 dias | 24h → Ops Lead |
| Minor | 80h | 10 dias | - |
| Info | 120h | 15 dias | - |

## Feriados BR (2024-2026)

Implementados no SLA Engine:
- Confraternização Universal (1 jan)
- Carnaval (variável)
- Paixão de Cristo (variável)
- Tiradentes (21 abr)
- Dia do Trabalho (1 mai)
- Corpus Christi (variável)
- Independência (7 set)
- Nossa Senhora Aparecida (12 out)
- Finados (2 nov)
- Proclamação da República (15 nov)
- Natal (25 dez)

## Categorias de Action Items

1. `regulatory` - CEP, ANVISA, emendas
2. `consent_icf` - Termos de consentimento
3. `data_entry` - Preenchimento de eCRF
4. `queries` - Queries de dados
5. `safety_reporting` - SAE, SUSAR
6. `samples` - Amostras biológicas
7. `imaging` - Imagens médicas
8. `pharmacy_ip` - Farmácia, IP
9. `training` - Treinamentos
10. `contracts_budget` - Contratos, pagamentos
11. `other` - Outros

## Decisões Arquiteturais

### Frontend separado do Backend
**Rationale:** Escalabilidade, deploy independente, equipes podem trabalhar em paralelo.

### PostgreSQL local (não Docker)
**Rationale:** Performance no MVP, evitar overhead do Docker durante desenvolvimento.

### Ollama para LLM
**Rationale:** 100% local, sem custo, PHI compliance garantido.

### shadcn/ui
**Rationale:** Componentes de alta qualidade, customizáveis, sem lock-in.

## Próximos Passos (Pós-MVP)

1. **Fase 5:** Módulos complementares (Data Ops, Samples, Imaging, Finance)
2. **Fase 6:** n8n workflows (alertas, reports)
3. **Fase 7:** Moltbolt RPA para portais SUSAR
4. **Fase 8:** Deploy produção

---

*Documento vivo - atualizar conforme progresso*
