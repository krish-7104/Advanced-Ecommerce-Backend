# Database Setup Guide

Follow these steps when connecting the application to a new database instance.

## 1. Update Environment Variables

Open `Ecommerce-Backend/.env` and update the `DATABASE_URL` variable with your new connection string.

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE_NAME?schema=public"
```

> [!NOTE]
> Ensure your database user has sufficient privileges to create tables and manage schema.

## 2. Apply Migrations

Run the following command to apply the specific migration history to the new database. This will create all necessary tables, enums, and indexes.

```bash
# In Ecommerce-Backend directory
npx prisma migrate deploy
```

> [!IMPORTANT]
> Use `migrate deploy` for production/staging environments. Use `migrate dev` only for local development when you might be changing the schema.

## 3. Seed the Database

Populate the database with initial required data (Super Admin, Roles, Permissions, Categories, etc.).

```bash
# In Ecommerce-Backend directory
npm run prisma:seed
```

This will run the seed scripts located in `prisma/seeds/`, which includes:

- Creating default Roles (SuperAdmin, Manager)
- Creating Permissions
- Creating Departments
- Creating the Super Admin user (defined by `NEXT_SUPER_ADMIN_EMAIL` in `.env`)
- Seeding initial Products and Categories

## 4. Verification

You can verify the setup by checking the database contents or logging in as the Super Admin.

```bash
# Optional: Open Prisma Studio to view data
npx prisma studio
```
