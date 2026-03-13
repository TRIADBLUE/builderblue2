# BuilderBlue²

> `builderblue2` is the repo name due to GitHub character limitations — the platform name is **BuilderBlue².com**.

Build, deploy, and scale your projects with AI-powered compute. Part of the TRIADBLUE ecosystem.

## Tech Stack

- **Frontend:** React + TypeScript + Tailwind CSS v4 + shadcn/ui + wouter + Framer Motion
- **Backend:** Node.js + Express + TypeScript
- **Database:** PostgreSQL + Drizzle ORM
- **Email:** Resend
- **Build:** Vite
- **Package Manager:** npm

## Setup

```bash
# Clone
git clone https://github.com/TRIADBLUE/builderblue2.git
cd builderblue2

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Fill in all values in .env

# Push database schema
npm run db:push

# Start development server
npm run dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (Express + Vite) |
| `npm run build` | Build for production |
| `npm start` | Run production build |
| `npm run db:push` | Push schema to database |
| `npm run db:generate` | Generate migration files |
| `npm run db:migrate` | Run migrations |
| `npm run db:studio` | Open Drizzle Studio |
| `npm run check` | TypeScript type check |
