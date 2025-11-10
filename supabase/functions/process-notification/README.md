# Process Notification Edge Function

This Edge Function processes notification events and creates notifications in the database.

## Setup

1. **Set Environment Variables in Supabase Dashboard:**
   - Go to: Project Settings → Edge Functions → Secrets
   - Add: `SUPABASE_SERVICE_ROLE_KEY` (your service role key from Project Settings → API)

2. **Deploy the Function:**
   ```bash
   supabase functions deploy process-notification
   ```

## Usage

The function is called automatically when notifications are triggered via `triggerNotification()` helper.

## Error Handling

- Returns proper HTTP status codes (400, 500)
- Prevents duplicate notifications (5-minute window)
- Rate limiting prevents spam
- Errors are logged but don't cause retries
