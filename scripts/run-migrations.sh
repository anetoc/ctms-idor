#!/bin/bash
# Run all SQL migrations for CTMS IDOR

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATIONS_DIR="$SCRIPT_DIR/../database/migrations"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-ctms_idor}"
DB_USER="${DB_USER:-ctms_user}"

echo "🔧 CTMS IDOR - Running Migrations"
echo "=================================="
echo "Database: $DB_NAME"
echo "Port: $DB_PORT"
echo ""

# Verificar conexão
if ! pg_isready -p $DB_PORT -d $DB_NAME -q 2>/dev/null; then
    echo "❌ Não foi possível conectar ao PostgreSQL"
    echo "   Verifique se o serviço está rodando na porta $DB_PORT"
    exit 1
fi

# Criar tabela de controle de migrations se não existir
psql -p $DB_PORT -d $DB_NAME -U $DB_USER -c "
CREATE TABLE IF NOT EXISTS _migrations (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) UNIQUE NOT NULL,
    executed_at TIMESTAMPTZ DEFAULT NOW()
);
" 2>/dev/null

# Executar migrations em ordem
for migration in $(ls -1 $MIGRATIONS_DIR/*.sql 2>/dev/null | sort); do
    filename=$(basename "$migration")

    # Verificar se já foi executada
    already_run=$(psql -p $DB_PORT -d $DB_NAME -U $DB_USER -t -c "
        SELECT COUNT(*) FROM _migrations WHERE filename = '$filename';
    " 2>/dev/null | xargs)

    if [ "$already_run" = "0" ]; then
        echo "▶️  Executando: $filename"

        if psql -p $DB_PORT -d $DB_NAME -U $DB_USER -f "$migration" 2>&1; then
            # Registrar migration
            psql -p $DB_PORT -d $DB_NAME -U $DB_USER -c "
                INSERT INTO _migrations (filename) VALUES ('$filename');
            " 2>/dev/null
            echo "   ✅ Sucesso"
        else
            echo "   ❌ Erro na migration: $filename"
            exit 1
        fi
    else
        echo "⏭️  Já executada: $filename"
    fi
done

echo ""
echo "✅ Todas as migrations executadas!"
echo ""
echo "📊 Status das migrations:"
psql -p $DB_PORT -d $DB_NAME -U $DB_USER -c "
    SELECT filename, executed_at
    FROM _migrations
    ORDER BY id;
"
