#!/bin/bash
# Setup PostgreSQL local for CTMS IDOR
# Usando a instância existente do PostgreSQL

set -euo pipefail

echo "🔧 CTMS IDOR - PostgreSQL Setup"
echo "================================"

# Verificar se PostgreSQL 16 está instalado
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL não encontrado. Instalando via Homebrew..."
    brew install postgresql@16
fi

# Verificar versão
PG_VERSION=$(psql --version | grep -oE '[0-9]+\.[0-9]+')
echo "✅ PostgreSQL versão: $PG_VERSION"

# Verificar se o serviço está rodando na porta 5433
if ! pg_isready -p 5433 -q 2>/dev/null; then
    echo "⚠️  PostgreSQL não está rodando na porta 5433"
    echo ""
    echo "Para iniciar PostgreSQL na porta 5433, você pode:"
    echo ""
    echo "Opção 1 - Iniciar manualmente:"
    echo "  pg_ctl -D /opt/homebrew/var/postgresql@16 -o '-p 5433' start"
    echo ""
    echo "Opção 2 - Modificar postgresql.conf:"
    echo "  1. Editar /opt/homebrew/var/postgresql@16/postgresql.conf"
    echo "  2. Alterar 'port = 5432' para 'port = 5433'"
    echo "  3. Reiniciar: brew services restart postgresql@16"
    echo ""
    read -p "O PostgreSQL já está rodando na porta 5433? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Configure o PostgreSQL e execute novamente."
        exit 1
    fi
fi

echo "✅ PostgreSQL rodando na porta 5433"

# Criar usuário se não existir
echo "📦 Criando usuário ctms_user..."
psql -p 5433 -d postgres -c "
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'ctms_user') THEN
        CREATE ROLE ctms_user WITH LOGIN PASSWORD 'ctms_password' CREATEDB;
        RAISE NOTICE 'Usuário ctms_user criado';
    ELSE
        RAISE NOTICE 'Usuário ctms_user já existe';
    END IF;
END
\$\$;
" 2>/dev/null || echo "⚠️  Pode ser necessário ajustar permissões"

# Criar database se não existir
echo "📦 Criando database ctms_idor..."
psql -p 5433 -d postgres -c "
SELECT 'CREATE DATABASE ctms_idor OWNER ctms_user'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'ctms_idor')
\gexec
" 2>/dev/null || createdb -p 5433 -O ctms_user ctms_idor 2>/dev/null || echo "Database já existe"

# Habilitar extensões
echo "📦 Habilitando extensões..."
psql -p 5433 -d ctms_idor -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";" 2>/dev/null || true
psql -p 5433 -d ctms_idor -c "CREATE EXTENSION IF NOT EXISTS \"pgcrypto\";" 2>/dev/null || true

echo ""
echo "✅ Setup completo!"
echo ""
echo "📋 Conexão:"
echo "   Host: localhost"
echo "   Port: 5433"
echo "   Database: ctms_idor"
echo "   User: ctms_user"
echo "   Password: ctms_password"
echo ""
echo "🔗 Connection String:"
echo "   postgresql://ctms_user:ctms_password@localhost:5433/ctms_idor"
echo ""
echo "Próximo passo: Execute as migrations"
echo "   ./scripts/run-migrations.sh"
