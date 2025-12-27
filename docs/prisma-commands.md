# Prisma Commands Guide

This document explains all the Prisma commands available in this project.

## Available Scripts

| Command                         | Script                  | Description                                  |
| ------------------------------- | ----------------------- | -------------------------------------------- |
| `npm run prisma:generate`       | `prisma generate`       | Regenerates the Prisma client                |
| `npm run prisma:migrate`        | `prisma migrate dev`    | Creates and applies migrations (development) |
| `npm run prisma:migrate:deploy` | `prisma migrate deploy` | Applies pending migrations (production)      |
| `npm run prisma:studio`         | `prisma studio`         | Opens Prisma Studio GUI                      |

---

## Command Details

### `prisma generate`

Regenerates the Prisma client based on your schema.

**When to use:**

- After running any migration
- After manually editing `schema.prisma`
- To sync TypeScript types with your database schema

```bash
npm run prisma:generate
```

---

### `prisma migrate dev`

Creates a new migration and applies it to your development database.

**When to use:**

- During local development
- When you've made changes to `schema.prisma`

**What it does:**

1. Detects schema changes
2. Creates a new migration file in `prisma/migrations/`
3. Applies the migration to your database
4. Regenerates the Prisma client

```bash
npm run prisma:migrate
```

> **Note:** This command is interactive and may prompt for a migration name.

---

### `prisma migrate deploy`

Applies all pending migrations to your database without creating new ones.

**When to use:**

- In production environments
- In CI/CD pipelines
- When deploying to staging/production

**What it does:**

1. Checks for pending migrations
2. Applies them in order
3. Does NOT create new migrations
4. Does NOT regenerate the client

```bash
npm run prisma:migrate:deploy
```

> **Important:** This is safe for production as it never modifies your migration history.

---

### `prisma studio`

Opens a visual database browser in your web browser.

**When to use:**

- To view/edit data manually
- To debug database contents
- To quickly inspect relationships

```bash
npm run prisma:studio
```

---

## Common Workflows

### Making Schema Changes (Development)

```bash
# 1. Edit schema.prisma

# 2. Create and apply migration
npm run prisma:migrate

# 3. (Optional) Regenerate client if not auto-generated
npm run prisma:generate
```

### Quick Schema Push (No Migration)

For rapid prototyping without creating migration files:

```bash
npx prisma db push
npm run prisma:generate
```

### Deploying to Production

```bash
# Apply pending migrations
npm run prisma:migrate:deploy

# Regenerate client
npm run prisma:generate
```

---

## Troubleshooting

| Issue                   | Solution                                                |
| ----------------------- | ------------------------------------------------------- |
| Types not updating      | Run `npm run prisma:generate`                           |
| Module not found errors | Check import path matches output in `prisma.config.ts`  |
| Migration conflicts     | Reset with `npx prisma migrate reset` (⚠️ deletes data) |
