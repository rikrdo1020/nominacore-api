#!/bin/bash
set -e

# Script para migrar datos de producción a base de datos local
# El schema de producción es el viejo (sin employee_rates)
# El schema local es el nuevo (con employee_rates)

# Variables requeridas:
#   PROD_DATABASE_URL - URL de conexión a PostgreSQL de producción
#   LOCAL_DATABASE_URL - URL de conexión a PostgreSQL local
#
# Ejemplo:
#   export PROD_DATABASE_URL="postgresql://user:pass@prod-host:5432/dbname?schema=public"
#   export LOCAL_DATABASE_URL="postgresql://postgres:password@localhost:5432/valentini?schema=public"
#   ./scripts/migrate-from-prod.sh

if [ -z "$PROD_DATABASE_URL" ]; then
  echo "❌ ERROR: Debes definir la variable PROD_DATABASE_URL"
  echo "   export PROD_DATABASE_URL=postgresql://user:pass@host:5432/dbname?schema=public"
  exit 1
fi

if [ -z "$LOCAL_DATABASE_URL" ]; then
  echo "❌ ERROR: Debes definir la variable LOCAL_DATABASE_URL"
  echo "   export LOCAL_DATABASE_URL=postgresql://postgres:password@localhost:5432/valentini?schema=public"
  exit 1
fi

# Extraer componentes de la URL local para psql
# Format: postgresql://user:password@host:port/database?schema=public
LOCAL_DB=$(echo "$LOCAL_DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')
LOCAL_HOST=$(echo "$LOCAL_DATABASE_URL" | sed -n 's/.*@\([^:]*\).*/\1/p')
LOCAL_PORT=$(echo "$LOCAL_DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
LOCAL_USER=$(echo "$LOCAL_DATABASE_URL" | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
LOCAL_PASS=$(echo "$LOCAL_DATABASE_URL" | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')

# Valores por defecto
LOCAL_HOST=${LOCAL_HOST:-localhost}
LOCAL_PORT=${LOCAL_PORT:-5432}

# Detectar pg_dump compatible (v18 para servidor v18)
PG_DUMP=$(which pg_dump)
if [ -x "/opt/homebrew/opt/postgresql@18/bin/pg_dump" ]; then
  PG_DUMP="/opt/homebrew/opt/postgresql@18/bin/pg_dump"
  echo "📦 Usando pg_dump de PostgreSQL 18: $PG_DUMP"
elif [ -x "/usr/lib/postgresql/18/bin/pg_dump" ]; then
  PG_DUMP="/usr/lib/postgresql/18/bin/pg_dump"
  echo "📦 Usando pg_dump de PostgreSQL 18: $PG_DUMP"
else
  echo "⚠️  Usando pg_dump del PATH: $PG_DUMP"
fi

# Tablas que existen en ambos schemas (viejo y nuevo)
TABLES="employees rate_rules work_records deductions payroll"

echo "🚀 Iniciando migración de producción a local..."
echo "   Tablas a migrar: $TABLES"
echo ""

# 1. Crear archivo temporal para el dump
DUMP_FILE=$(mktemp /tmp/prod_dump.XXXXXX.sql)
trap "rm -f $DUMP_FILE" EXIT

# 2. Dump de producción (solo datos, tablas específicas)
echo "📥 Exportando datos de producción..."
"$PG_DUMP" "$PROD_DATABASE_URL" \
  --data-only \
  --no-owner \
  --no-privileges \
  --disable-triggers \
  --inserts \
  --table="employees" \
  --table="rate_rules" \
  --table="work_records" \
  --table="deductions" \
  --table="payroll" \
  > "$DUMP_FILE"

# Filtrar comandos que psql 17 no entiende (generados por pg_dump 18)
grep -vE '^\\(restrict|unrestrict)' "$DUMP_FILE" > "${DUMP_FILE}.filtered" || true
mv "${DUMP_FILE}.filtered" "$DUMP_FILE"

echo "   ✅ Dump guardado en: $DUMP_FILE"

# 3. Limpiar tablas locales (sin tocar employee_rates que es nueva)
echo ""
echo "🧹 Limpiando tablas locales..."
PGPASSWORD="$LOCAL_PASS" psql \
  -h "$LOCAL_HOST" \
  -p "$LOCAL_PORT" \
  -U "$LOCAL_USER" \
  -d "$LOCAL_DB" \
  -c "
    SET session_replication_role = 'replica';
    TRUNCATE TABLE payroll, deductions, work_records, rate_rules, employees RESTART IDENTITY CASCADE;
    SET session_replication_role = 'origin';
  "

echo "   ✅ Tablas locales limpiadas"

# 4. Restaurar datos en local
echo ""
echo "📤 Importando datos a base local..."
PGPASSWORD="$LOCAL_PASS" psql \
  -h "$LOCAL_HOST" \
  -p "$LOCAL_PORT" \
  -U "$LOCAL_USER" \
  -d "$LOCAL_DB" \
  --set ON_ERROR_STOP=on \
  -f "$DUMP_FILE"

echo "   ✅ Datos importados correctamente"

# 5. Verificar conteos
echo ""
echo "📊 Verificando datos importados:"
PGPASSWORD="$LOCAL_PASS" psql \
  -h "$LOCAL_HOST" \
  -p "$LOCAL_PORT" \
  -U "$LOCAL_USER" \
  -d "$LOCAL_DB" \
  -c "
    SELECT 'employees' as tabla, COUNT(*) as registros FROM employees
    UNION ALL
    SELECT 'rate_rules', COUNT(*) FROM rate_rules
    UNION ALL
    SELECT 'work_records', COUNT(*) FROM work_records
    UNION ALL
    SELECT 'deductions', COUNT(*) FROM deductions
    UNION ALL
    SELECT 'payroll', COUNT(*) FROM payroll
    UNION ALL
    SELECT 'employee_rates', COUNT(*) FROM employee_rates;
  "

echo ""
echo "✅ Migración completada exitosamente!"
echo "   Nota: La tabla 'employee_rates' se mantiene vacía porque no existía en producción."
echo "   Puedes poblarla manualmente con las tarifas personalizadas que necesites."
