# Password Manager - Frontend Implementation Guide

## What We're Building

A password manager page with three tabs: Passwords, Cards, and Documents. Users can view, create, edit, and delete their saved passwords and credit/debit cards. The Documents tab is a placeholder for now.

---

## Page Structure

**Main Page:** `src/app/Secrets Manager/page.tsx`
- 4 tabs at the top: "Passwords", "Cards", "Documents", "Bank Details"
- Each tab shows its own content area
- Clean header with title "Password Manager" and subtitle
- Follow the same layout pattern as the subscriptions page

---

## Passwords Tab

**What it looks like:**
- A data table showing all saved passwords
- Columns: Title, Username, Password (masked), URL, Company, Category, Created Date
- Search bar at the top
- Filter by category (Work, Personal, Banking, Social Media)
- "Add Password" button
- Pagination at the bottom

**Features:**
- Click eye icon to reveal/hide password
- Copy buttons for username and password
- Click URL to open in new tab
- Edit and delete actions in a dropdown menu
- Form dialog to create/edit passwords with all fields

**Files to create:**
- `src/app/password-manager/components/password-table.tsx` - Main table component
- `src/app/password-manager/components/password-columns.tsx` - Table column definitions
- `src/app/password-manager/components/password-form.tsx` - Create/edit form dialog

**How to fetch data:**
- Use Drizzle ORM to query `common_util.password_vault_passwords` table
- Filter by `created_by` (current user's Clerk ID) and `deleted_at IS NULL`
- Support pagination, search, filtering, and sorting
- Fetch related company data separately and attach to results

**Reference:** Look at `src/app/crm/products/page.tsx` for the exact pattern to follow

---

## Cards Tab

**What it looks like:**
- A beautiful grid of credit/debit cards (not a table)
- Each card shows: card type badge, masked card number, cardholder name, expiry date, bank name
- Cards have gradient backgrounds (rotate colors: violet, orange, blue)
- Search bar and filters at the top
- "Add Card" button
- Pagination at the bottom (12, 24, or 48 cards per page)

**Features:**
- Click eye icon to reveal full card number
- Copy card number when revealed
- Edit and delete from dropdown menu
- Form dialog to create/edit cards with all fields
- Cards look like real credit cards with nice styling

**Files to create:**
- `src/app/password-manager/components/card-table.tsx` - Main component with grid view
- `src/app/password-manager/components/card-grid-view.tsx` - The card grid display
- `src/app/password-manager/components/card-form.tsx` - Create/edit form dialog

**How to fetch data:**
- Use Drizzle ORM to query `common_util.password_vault_cards` table
- Same filtering and pagination as passwords
- Grid view shows cards in a responsive grid (1 column on mobile, 2 on tablet, 3-4 on desktop)

**Reference:** Look at how other pages use DataTable with custom views

---

## Documents Tab

**What it looks like:**
- Simple placeholder message: "Documents feature coming soon"
- Centered on the page with an icon
- No functionality needed yet

**Files to create:**
- `src/app/password-manager/components/document-table.tsx` - Simple placeholder component

---

## TypeScript Types

Create `src/lib/types/password-vault.ts` with:
- Types for password, card, and document data
- Types for form inputs (with plain text fields for sensitive data)
- Types that include company relationship data

---

## API Routes

Create three API route files using Drizzle ORM:
- `src/app/api/password-vault/passwords/route.ts` - GET, POST, PATCH, DELETE
- `src/app/api/password-vault/cards/route.ts` - GET, POST, PATCH, DELETE  
- `src/app/api/password-vault/documents/route.ts` - GET, POST, PATCH, DELETE

**For each route:**
- Use Drizzle ORM to query the database
- Only return items created by the current user
- Support pagination, search, filtering, and sorting
- Return data in format: `{ data: [], pageCount: number, totalCount: number }`

**Reference:** Look at existing API routes to see how Drizzle is used

---

## Key Things to Remember

**Layout:**
- Follow the layout rules in `.cursorrules` (sections 9-12)
- Use proper flex containers to prevent overflow
- Make sure everything is responsive

**Data Table:**
- Use the `DataTable` component from `@/components/data-table/data-table`
- Pass `page` and `pageSize` as controlled props
- Look at `src/app/crm/products/page.tsx` for the exact pattern

**Forms:**
- Use Dialog component from shadcn/ui
- Include all fields from the database
- Add validation
- Show loading states
- Use toast notifications for success/error

**Grid View:**
- Responsive grid: 1 column mobile, 2 tablet, 3-4 desktop
- Beautiful card design with gradients
- Mask sensitive data (show/hide toggle)
- Copy to clipboard functionality

**Security:**
- Never show passwords/card numbers by default
- Always mask sensitive data
- Only show data for the current user
- Use proper authentication checks

---

## What the Final Result Should Look Like

- Clean, modern interface matching the rest of the app
- Three working tabs
- Passwords show in a table with full CRUD
- Cards show in a beautiful grid with full CRUD
- Documents shows placeholder
- Everything is responsive and works on mobile
- Proper loading states and error handling
- No layout issues or overflow problems

**Study these files for patterns:**
- `src/app/crm/products/page.tsx` - Table implementation
- `src/app/tickets/page.tsx` - Complex filtering
- `src/app/subscriptions/page.tsx` - Tabbed interface
- `src/components/data-table/data-table.tsx` - Component API

---

## Sidebar Update

In `src/components/app-sidebar.tsx`:
- Add `/password-manager` to the EXISTING_PAGES Set so it shows as active (not "coming soon")
