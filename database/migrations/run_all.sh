#!/bin/bash
# Run all CTMS IDOR migrations in order
# Usage: ./run_all.sh [database_name] [host] [port] [user]
#
# Example: ./run_all.sh ctms_idor localhost 5432 postgres

set -euo pipefail

DB_NAME="${1:-ctms_idor}"
DB_HOST="${2:-localhost}"
DB_PORT="${3:-5432}"
DB_USER="${4:-postgres}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=== CTMS IDOR Database Migration ==="
echo "Database: $DB_NAME"
echo "Host: $DB_HOST:$DB_PORT"
echo "User: $DB_USER"
echo ""

# Migration files in order
MIGRATIONS=(
    "001_enums.sql"
    "002_users.sql"
    "003_studies.sql"
    "004_study_team.sql"
    "005_action_items.sql"
    "006_action_item_updates.sql"
    "007_sla_rules.sql"
    "008_monitor_letters.sql"
    "009_regulatory_events.sql"
    "010_safety_cases.sql"
    "011_agent_runs.sql"
)

for migration in "${MIGRATIONS[@]}"; do
    echo "Running: $migration"
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$SCRIPT_DIR/$migration"
    echo "  Done."
done

echo ""
echo "=== All migrations completed successfully ==="
