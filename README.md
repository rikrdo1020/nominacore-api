# Valentini Backend

Backend API para Valentini Assistant construido con **NestJS** + **Prisma** + **PostgreSQL**.

## Requisitos

- Node.js 18+
- PostgreSQL 14+

## Variables de Entorno

Crea un archivo `.env` con:

```env
DATABASE_URL="postgresql://usuario:password@host:5432/nombre_db?schema=public"
PORT=3000
```

## Instalación

```bash
npm install
npx prisma migrate dev --name init
npm run start:dev
```

## Deploy en Render

1. Crea un nuevo **Web Service** en Render.
2. Conecta tu repositorio.
3. Configura las variables de entorno:
   - `DATABASE_URL`: la internal connection string de tu PostgreSQL en Render.
   - `PORT`: 10000 (Render asigna puertos dinámicos, pero usa `process.env.PORT` en `main.ts`).
4. Build Command:
   ```bash
   npm install && npx prisma generate && npx prisma migrate deploy && npm run build
   ```
5. Start Command:
   ```bash
   npm run start:prod
   ```

## Endpoints

| Recurso | Métodos |
|---------|---------|
| `/api/employees` | GET, POST |
| `/api/employees/all` | GET |
| `/api/employees/:id` | PUT, DELETE |
| `/api/rate-rules` | GET |
| `/api/rate-rules/:id` | PUT |
| `/api/work-records` | GET, POST |
| `/api/work-records/:id` | PUT, DELETE |
| `/api/deductions` | GET, POST |
| `/api/deductions/:id` | DELETE |
| `/api/payroll/calculate` | GET |
| `/api/payroll/calculate-all` | GET |
| `/api/payroll/save` | POST |
| `/api/payroll/history` | GET |
| `/api/health` | GET |
