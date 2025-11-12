# Company OS

**Company OS** is an internal platform for managing all departments: HR + Employee Management, Sales Exec + Manager, Client Ops/POC, LLC Handling, Creative (Video Editor), and Director/SuperAdmin.

## 🚀 Overview

Company OS is a comprehensive enterprise management system built with modern web technologies. It provides a unified platform for managing:

- **HR & Employee Management** - Attendance, leave requests, employee records
- **Sales & CRM** - Leads, opportunities, quotations, calls, products
- **Operations** - Orders, shipments, quotations (multi-type)
- **Recruitment (ATS)** - Candidates, applications, interviews, evaluations
- **Common Tools** - Tasks, tickets, documents, password vault, subscriptions, knowledge base
- **Project Management** - Projects, tasks, assignments

## 📋 Tech Stack

### Frontend
- **Next.js 15** (App Router) with TypeScript
- **TailwindCSS** + **Shadcn/ui** (design system)
- **TanStack Table v8** (data tables with server-side pagination)
- **React Hook Form** (form management)
- **Zustand** (state management)
- **React Query** (data fetching)

### Backend
- **Supabase** (PostgreSQL database, Auth, RLS, Storage)
- **Clerk** (authentication - migrated from Supabase Auth)
- **Trigger.dev** (background jobs)
- **Drizzle ORM** (database queries)
- **Edge Functions** (Supabase Edge Functions for notifications)

### Infrastructure
- **Vercel** (hosting and deployment)
- **Neon** (PostgreSQL database)
- **Supabase Storage** (file storage)

## ✨ Features Implemented

### 🔐 Authentication & Authorization
- ✅ Clerk authentication integration
- ✅ Role-Based Access Control (RBAC)
- ✅ Vertical/Group scoping for multi-tenant access
- ✅ Row Level Security (RLS) policies
- ✅ Permission-based UI rendering
- ✅ User management with role assignments

### 📊 Core Module (`core` schema)
- ✅ User profiles and employee management
- ✅ Contacts and companies (single source of truth)
- ✅ Departments and teams
- ✅ RBAC system (roles, permissions, role_permissions, user_role_bindings)
- ✅ Activity events (global audit log)
- ✅ Enum registry (dynamic enums)
- ✅ Announcements with views tracking
- ✅ Dynamic modules system (modules, module_fields, module_records)
- ✅ Verticals system for multi-tenant isolation
- ✅ User verticals and group scoping

### 📈 CRM Module (`crm` schema)
- ✅ **Leads Management**
  - Lead creation, editing, deletion
  - Lead status tracking with history
  - Lead kanban view (drag & drop)
  - Lead list view with filters
  - Lead details modal
  - Lead metrics and analytics
  - Lead closure workflow
  - Vertical scoping for leads
- ✅ **Opportunities** - Pipeline and stage management
- ✅ **Interactions** - Polymorphic entity tracking (calls, emails, meetings)
- ✅ **Products** - Product catalog with variants and collections
- ✅ **Quotations** - CRM quotations linked to leads with status history
- ✅ **Calls** - Call tracking and logging with notes
  - Call details modal
  - Call metrics and analytics
  - Call recording support
  - Scheduled calls
- ✅ **Marketing Assets** - Marketing materials management
- ✅ **Contacts & Companies** - Centralized contact management

### 👥 HR Module (`hr` schema)
- ✅ **Attendance Management**
  - Attendance sessions tracking
  - Check-in/check-out records
  - Break tracking
  - Attendance summary and reports
- ✅ **Leave Management**
  - Leave requests
  - Leave approval workflow
  - Leave types and tracking
- ✅ **Employee Management**
  - Employee profiles
  - Employee reports
  - Department assignments

### 🎯 Recruitment/ATS Module (`ats` schema)
- ✅ **Candidates** - Candidate management
- ✅ **Applications** - Job applications with sources
- ✅ **Interviews** - Scheduled interviews
- ✅ **Evaluations** - Interview assessments
- ✅ **Job Listings** - Job posting management
- ✅ **Job Roles** - Role definitions
- ✅ **Job Portals** - Portal integrations
- ✅ **Calls** - Recruitment calls tracking
- ✅ **HR Dashboard** - Recruitment metrics and analytics

### 📦 Operations Module (`ops` schema)
- ✅ **Orders** - Order management with vertical_key
- ✅ **Order Items** - Line items for orders
- ✅ **Quotations** - Multi-type normalized table
  - Factory quotations
  - Freight quotations
  - Client quotations
  - Warehouse quotations
- ✅ **Shipments** - Multi-type normalized table
  - Amazon India shipments
  - Website India shipments
  - Freight forwarding shipments
- ✅ **Payments & Payouts** - Financial tracking
- ✅ **Status History** - Order, quotation, and shipment status tracking

### 🛠️ Common Tools (`common_util` schema)
- ✅ **Tasks** - Task management with assignees
  - Task creation, editing, deletion
  - Task assignees and collaborators
  - Task status tracking
  - Task kanban view
  - Task list view with filters
  - Task urgency tags
  - Task attachments
  - Vertical scoping
- ✅ **Tickets** - Support ticket system
  - Ticket creation and management
  - Ticket comments
  - Ticket attachments
  - Ticket status history
  - Ticket assignments
  - AI-powered solutions generation
- ✅ **Documents** - Document management
  - Document storage and organization
  - Document assignments
  - Document categories
- ✅ **Password Vault** - Secure password management
  - Password storage with encryption
  - Password categories and tags
  - Document storage (passports, licenses, certificates)
  - Bank details and netbanking credentials
  - Company associations
  - Favorites and quick access
- ✅ **Subscriptions** - Subscription management
  - Subscription tracking
  - Subscription renewals
  - Subscription users
  - Vendor management
- ✅ **Knowledge Base** - Knowledge management
  - Knowledge articles
  - Knowledge categories
  - SOPs (Standard Operating Procedures)
  - Files and documents
- ✅ **Messages** - Messaging system
  - Message threads
  - Message participants
  - Message templates
- ✅ **Events** - Event management
  - Event creation and management
  - Event participants
  - Calendar integration
- ✅ **Projects** - Project management
  - Project creation and management
  - Project assignments
  - Project status tracking

### 🔔 Notifications
- ✅ Real-time notifications
- ✅ Notification preferences
- ✅ Notification views tracking
- ✅ Scheduled notification reminders
- ✅ Edge Functions for notification processing

### 📱 UI/UX Features
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Dark mode support
- ✅ Sidebar navigation with toggle
- ✅ Data tables with server-side pagination
- ✅ Kanban boards (drag & drop)
- ✅ Filters and search
- ✅ Modal dialogs for details
- ✅ Form validation
- ✅ Loading states and skeletons
- ✅ Error handling
- ✅ Toast notifications
- ✅ Confetti animations
- ✅ Oneko cat (easter egg)

## 🗄️ Database Schema

### Core Schema (`core`)
- `users` (Clerk auth) → `profiles` → `employees`
- `contacts` (people or organizations)
- `companies` + `company_contacts` (join)
- `roles`, `permissions`, `role_permissions`, `user_role_bindings` (RBAC)
- `departments`, `teams`
- `activity_events` (global audit log)
- `enum_registry` (dynamic enums)
- `announcements` ↔ `announcement_views`
- `modules` ↔ `module_fields` ↔ `module_records` ↔ `module_record_assignments`
- `verticals` (multi-tenant isolation)
- `user_verticals` (user vertical assignments)

### CRM Schema (`crm`)
- `leads` (links to contact_id, company_id, owner_id → profiles)
- `opportunities` (lead_id, pipeline_id, stage_id)
- `interactions` (entity_type, entity_id)
- `pipelines`, `stages`, `status_history`
- `products` (supplier_id → contacts, manufacturer_id → companies)
- `product_variants` (product_id)
- `collections` + `product_collections` (many-to-many)
- `quotations` (lead_id, quote_number, items JSONB, status history)
- `calls` (lead_id, contact_id, caller_id → profiles, call_type, duration)
- `call_notes` (call_id)
- `marketing_assets` (file_url, asset_type, is_public)

### HR Schema (`hr`)
- `attendance_sessions` (employee_id → profiles, date, check_in/out, status)
- `attendance_records` (session_id, record_type, timestamp)
- `leave_requests` (employee_id → profiles, leave_type, dates, status, approved_by)

### ATS Schema (`ats`)
- `applications` (contact_id, job_id, source)
- `candidates` (contact_id)
- `interviews` (application_id)
- `evaluations` (interview_id)

### Ops Schema (`ops`)
- `orders` (account_id, owner_id, vertical_key)
- `order_items` (order_id)
- `quotations` (multi-type: factory, freight, client, warehouse)
- `shipments` (multi-type: amazon_india, website_india, freight_forwarding)
- `order_quotations` (many-to-many join table)
- `payments`, `payouts`
- `quotation_status_history`, `shipment_status_history`, `order_status_history`

### Common Util Schema (`common_util`)
- `tasks` ↔ `task_assignees`
- `tickets` ↔ `ticket_comments` ↔ `ticket_assignments` ↔ `ticket_status_history`
- `documents` ↔ `document_assignments`
- `password_vault_passwords` (encrypted passwords)
- `password_vault_documents` (passports, licenses, certificates)
- `subscriptions` ↔ `subscription_users` ↔ `subscription_renewals`
- `knowledge_categories` ↔ `knowledge_articles`
- `message_threads` ↔ `message_thread_participants` ↔ `messages`
- `events` ↔ `event_participants`
- `projects` ↔ `project_assignments`

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase project
- Clerk account (for authentication)
- Neon database (PostgreSQL)

### Installation

1. **Clone the repository:**

```bash
git clone <repository-url>
cd os
```

2. **Install dependencies:**

```bash
npm install
```

3. **Set up environment variables:**

Create a `.env.local` file:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Database
DATABASE_URL=your_neon_database_url

# Trigger.dev (optional)
TRIGGER_SECRET_KEY=your_trigger_secret_key

# OpenAI (optional, for AI features)
OPENAI_API_KEY=your_openai_api_key
```

4. **Run database migrations:**

```bash
# Apply Supabase migrations
npx supabase migration up

# Or apply migrations directly to Neon
npm run db:migrate
```

5. **Run the development server:**

```bash
npm run dev
```

6. **Open [http://localhost:3000](http://localhost:3000) in your browser.**

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication routes
│   ├── api/               # API routes
│   │   ├── ai/            # AI chat and agents
│   │   ├── crm/           # CRM API endpoints
│   │   ├── hr/            # HR API endpoints
│   │   ├── recruitment/   # Recruitment API endpoints
│   │   ├── tasks/         # Tasks API endpoints
│   │   ├── tickets/       # Tickets API endpoints
│   │   ├── unified/       # Unified API endpoints
│   │   └── notifications/ # Notifications API
│   ├── crm/               # CRM pages
│   │   ├── leads/         # Leads management
│   │   ├── opportunities/ # Opportunities
│   │   ├── products/      # Products
│   │   ├── calls/         # Calls
│   │   └── ...
│   ├── hr/                # HR pages
│   │   ├── dashboard/     # HR dashboard
│   │   ├── candidates/    # Candidates
│   │   ├── interviews/    # Interviews
│   │   ├── attendance/    # Attendance
│   │   └── ...
│   ├── tasks/             # Tasks pages
│   ├── tickets/           # Tickets pages
│   ├── password-manager/  # Password vault
│   └── ...
├── components/            # React components
│   ├── ui/                # Shadcn/ui components
│   ├── data-table/        # Data table components
│   ├── layout/            # Layout components
│   └── ...
├── lib/                   # Library code
│   ├── db/                # Database helpers
│   ├── supabase/          # Supabase clients
│   ├── types/             # TypeScript types
│   ├── rbac/              # RBAC helpers
│   └── ...
└── styles/                # Global styles
```

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

### Database Scripts

- `npm run db:introspect` - Introspect database schema
- `npm run db:generate` - Generate Drizzle schema
- `npm run db:migrate` - Push schema changes to database
- `npm run db:studio` - Open Drizzle Studio

### Supabase Scripts

- `npm run supabase:link` - Link to Supabase project
- `npm run supabase:deploy:functions` - Deploy Edge Functions
- `npm run supabase:deploy:process-notification` - Deploy process-notification function
- `npm run supabase:deploy:task-reminders` - Deploy task-reminders function

## 🚢 Deployment

### Production Links

- **Production URL**: [https://os.suprans.in](https://os.suprans.in)
- **Alternative URL**: [https://team.suprans.in](https://team.suprans.in)

### Vercel

- **Vercel Dashboard**: [https://vercel.com/startup-squad/os](https://vercel.com/startup-squad/os)
- **Vercel Project**: Deployed automatically on push to `master` branch

### Environment Variables

The application is deployed on Vercel with the following environment variables configured:
- Clerk authentication keys
- Supabase credentials
- Database URL (Neon)
- Trigger.dev secret key (optional)
- OpenAI API key (optional)

## 📚 Documentation

### Key Documentation Files

- `docs/AUTH_SETUP.md` - Authentication setup guide
- `docs/CLERK_PRODUCTION_SETUP.md` - Clerk production setup
- `docs/DASHBOARD_PLAN.md` - Dashboard planning
- `docs/NEON_MIGRATION.md` - Neon database migration
- `docs/STORAGE_SETUP.md` - Supabase Storage setup
- `docs/TRIGGER_DEV_SETUP.md` - Trigger.dev setup
- `docs/TRIGGER_DEV_QUICK_START.md` - Trigger.dev quick start
- `docs/SUPABASE_TO_DRIZZLE_AUDIT.md` - Database audit
- `docs/schema-diagram.md` - Database schema diagram
- `docs/user-management-workflow.md` - User management workflow

## 🔒 Security

### Authentication
- Clerk authentication with email/password
- Session management
- Protected routes with middleware

### Authorization
- Role-Based Access Control (RBAC)
- Row Level Security (RLS) policies
- Vertical/Group scoping for multi-tenant access
- Permission-based UI rendering

### Data Protection
- Encrypted password storage
- Secure file storage (Supabase Storage)
- RLS policies for data isolation
- Audit logging (activity_events)

## 🎨 UI/UX Standards

### Design System
- **Shadcn/ui** components
- **TailwindCSS** for styling
- **Dark mode** support
- **Responsive design** (mobile, tablet, desktop)

### Data Tables
- **TanStack Table v8** with server-side pagination
- **Manual pagination, sorting, filtering**
- **Server-side search** with OR ilike queries
- **Faceted filters** for status, priority, etc.
- **Column sorting** with server-side ordering

### Layout
- **Sidebar navigation** with toggle
- **Topbar** with user menu and notifications
- **Modal dialogs** for details and forms
- **Toast notifications** for feedback
- **Loading states** and skeletons

## 🔄 API Patterns

### Unified API Endpoints

All API endpoints follow a consistent pattern:

- `GET /api/unified/{resource}` - List resources with pagination, filtering, sorting
- `GET /api/unified/{resource}/[id]` - Get single resource
- `POST /api/unified/{resource}` - Create resource
- `PATCH /api/unified/{resource}/[id]` - Update resource
- `DELETE /api/unified/{resource}/[id]` - Delete resource

### Server-Side Pagination

All list endpoints support:
- `page` - Page number (1-based)
- `pageSize` - Items per page
- `sortBy` - Column to sort by
- `sortOrder` - Sort order (asc/desc)
- `search` - Search query
- `filters` - Filter criteria (JSON)

### Response Format

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 100,
    "pageCount": 10
  }
}
```

## 🧪 Testing

### Manual Testing
- Test all CRUD operations
- Test authentication and authorization
- Test RLS policies
- Test vertical/group scoping
- Test responsive design
- Test error handling

### Database Testing
- Test migrations
- Test RLS policies
- Test triggers and functions
- Test data integrity

## 📝 Migration History

### Phase 0: Core Foundation
- Core schema setup
- RBAC system
- User management
- Contacts and companies

### Phase 1: CRM & Tasks
- CRM schema (leads, opportunities, products, quotations, calls)
- Tasks module
- Notifications system

### Phase 2: Messaging & Knowledge
- Messaging system
- Calendar and events
- Knowledge base
- Marketing assets

### Phase 3: HR & Tickets
- HR schema (attendance, leave requests)
- Tickets system
- Documents management

### Phase 4: Advanced Features
- Announcements
- Dynamic modules
- Subscriptions
- Password vault

### Phase 5: Projects & Enhancements
- Projects module
- Enhanced UI/UX
- Performance optimizations
- AI integrations

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📄 License

Private - Company OS Internal Platform

## 🙏 Acknowledgments

- **Next.js** - React framework
- **Supabase** - Backend as a service
- **Clerk** - Authentication
- **Shadcn/ui** - UI components
- **TanStack Table** - Data tables
- **Vercel** - Hosting and deployment

---

**Built with ❤️ by the Company OS Team**
