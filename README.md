# Company OS

Internal platform for managing all departments: HR + Employee Management, Sales Exec + Manager, Client Ops/POC, LLC Handling, Creative (Video Editor), and Director/SuperAdmin.

## Tech Stack

- **Next.js 15** (App Router) + TypeScript
- **TailwindCSS** + **Shadcn/ui** (design system)
- **Supabase** (Postgres, Auth, RLS, Storage)
- **Trigger.dev** (for background jobs)
- **RBAC** implemented natively via Supabase policies

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase project

### Installation

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables:

```bash
cp .env.example .env.local
```

Add your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (dashboard)/       # Dashboard layout group
│   ├── api/               # API routes
│   └── page.tsx           # Home page
├── components/
│   ├── ui/                # Shadcn/ui components
│   └── layout/            # Layout components
└── lib/
    ├── db/                # Database helpers
    ├── supabase/          # Supabase clients
    └── types/             # TypeScript types
```

## Features

- ✅ Next.js 15 App Router
- ✅ TypeScript
- ✅ TailwindCSS with dark mode
- ✅ Shadcn/ui components
- ✅ Supabase integration
- ✅ RBAC & RLS policies
- ✅ Task Management API

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## License

Private - Company OS Internal Platform
