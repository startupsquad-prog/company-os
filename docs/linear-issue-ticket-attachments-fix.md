# Linear Issue: Fixed Ticket Attachments API Route

## Title
Fix: Ticket Attachments API Route - Switched from Non-Existent Table to JSONB Storage

## Description

### Problem
The ticket attachments API route (`/api/unified/tickets/[id]/attachments`) was failing with "Failed to fetch attachments" error because it was trying to query a non-existent `ticket_attachments` table.

### Root Cause
- The API route was querying `common_util.ticket_attachments` table which doesn't exist in the database
- Ticket attachments are actually stored in `ticket_comments.attachments` as a JSONB array field
- The database schema uses `task_attachments` for tasks, but tickets store attachments differently

### Solution Implemented
1. **Updated API Route** (`src/app/api/unified/tickets/[id]/attachments/route.ts`):
   - Switched from querying non-existent `ticket_attachments` table
   - Now fetches all comments for the ticket using Drizzle query builder
   - Aggregates attachments from `ticket_comments.attachments` JSONB field
   - Returns all attachments from all comments, sorted by creation date

2. **Technical Changes**:
   - Replaced raw SQL with Drizzle ORM query builder
   - Uses `ticketCommentsInCommonUtil` schema table
   - Properly filters deleted comments using `isNull(deletedAt)`
   - Aggregates and sorts attachments from multiple comments

### Code Changes

**File**: `src/app/api/unified/tickets/[id]/attachments/route.ts`

**Before**:
```typescript
const attachments = await postgresClientRaw`
  SELECT id, ticket_id, file_name, file_path, file_size, mime_type, uploaded_by, created_at
  FROM common_util.ticket_attachments
  WHERE ticket_id = ${params.id} AND deleted_at IS NULL
  ORDER BY created_at DESC
`
```

**After**:
```typescript
// Fetch all comments for this ticket
const comments = await dbAdmin
  .select({
    id: ticketCommentsInCommonUtil.id,
    attachments: ticketCommentsInCommonUtil.attachments,
    createdAt: ticketCommentsInCommonUtil.createdAt,
  })
  .from(ticketCommentsInCommonUtil)
  .where(
    and(
      eq(ticketCommentsInCommonUtil.ticketId, params.id),
      isNull(ticketCommentsInCommonUtil.deletedAt)
    )
  )

// Aggregate attachments from all comments
const allAttachments: any[] = []
comments.forEach((comment) => {
  if (comment.attachments && Array.isArray(comment.attachments)) {
    comment.attachments.forEach((att: any) => {
      allAttachments.push({
        ...att,
        comment_id: comment.id,
        created_at: comment.createdAt,
      })
    })
  }
})
```

### Impact
- ✅ Fixed "Failed to fetch attachments" error in TicketDetailsModal
- ✅ Attachments now load correctly from ticket comments
- ✅ Uses Drizzle query builder (consistent with other CRUD operations)
- ✅ Properly handles the JSONB storage pattern used for ticket attachments

### Related Files
- `src/app/api/unified/tickets/[id]/attachments/route.ts` - Fixed API route
- `src/app/tickets/components/ticket-details-modal.tsx` - Client component that calls the API

### Testing
- Verify attachments load in ticket details modal
- Test with tickets that have attachments in comments
- Test with tickets that have no attachments
- Verify error handling for edge cases

### Notes
- Ticket attachments are stored differently than task attachments
- Tasks use `task_attachments` table, tickets use `ticket_comments.attachments` JSONB
- This aligns with the existing database schema design

## Labels
- `bug-fix`
- `tickets`
- `api`
- `drizzle-orm`

## Priority
Medium

## Status
✅ Completed

