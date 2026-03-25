# Ecommercely - Backend
Advanced E-commerce backend APIs powered by Node.js, Express, TypeScript, PostgreSQL, and Prisma ORM.

## Tech Stack
- **Runtime:** Node.js
- **Framework:** Express.js 
- **Language:** TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** JWT, bcrypt
- **Integrations:** Stripe (Payments), Cloudinary (Media Storage), Nodemailer (Emails)

## Prerequisites
- Node.js (v18 or above recommended)
- PostgreSQL database
- Stripe account (for payments)
- Cloudinary account (for media uploads)

## Setup Instructions

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Variables:**
   Create a `.env` file in the root directory based on the `.env.sample` provided:
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/ecommercely"
   PORT=4000
   JWT_SECRET_KEY="YOUR_SECRET_KEY"
   NODE_ENV="development"
   ALLOWED_ORIGINS="http://localhost:3000,http://localhost:3001"
   MEDIA_URL="http://localhost:4000"
   
   # Nodemailer
   NODEMAILER_EMAIL=your-email@example.com
   NODEMAILER_PASS=your-email-password
   
   FRONTEND_URL=http://localhost:3000
   
   # Cloudinary Check
   CLOUDINARY_CLOUD_NAME=
   CLOUDINARY_API_KEY=
   CLOUDINARY_API_SECRET=
   
   # Stripe
   STRIPE_PUBLISHABLE_KEY=
   STRIPE_SECRET_KEY=
   STRIPE_WEBHOOK_SECRET=
   ```

3. **Database Initialization:**
   Generate the Prisma client, apply migrations, and optionally seed the database.
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   npm run prisma:seed      # Seeds the initial data
   ```

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   The backend will run at `http://localhost:4000` by default.

## Available Commands
- `npm run dev`: Starts the development server using `tsx`.
- `npm run build`: Compiles the TypeScript code into the `dist` directory.
- `npm run start`: Runs the compiled production code.
- `npm run prisma:studio`: Opens the Prisma Studio GUI to browse your database.
