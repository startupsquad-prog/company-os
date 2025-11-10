# Trigger.dev Quick Start - Fix "No Machine Yet" Issue

## Problem: Tasks Stuck in "Queued" with "No Machine Yet"

This means the **Trigger.dev dev server is not running** or not connected.

## Solution: Start Trigger.dev Dev Server

### Step 1: Open Two Terminals

**Terminal 1 - Next.js Dev Server:**

```bash
npm run dev
```

**Terminal 2 - Trigger.dev Dev Server (REQUIRED!):**

```bash
npm run dev:trigger
```

### Step 2: Verify It's Running

You should see in Terminal 2:

```
✓ Trigger.dev dev server is running
✓ Connected to Trigger.dev cloud
✓ Watching for changes in src/trigger/
```

### Step 3: Test the Task

```bash
npm run test:trigger
```

This will trigger a test task. Check the Trigger.dev dashboard to see if it executes.

## Verify in Dashboard

1. Go to: https://cloud.trigger.dev/projects/v3/proj_oqmifvryosgmasgpkyqi/runs
2. Look for the latest run
3. Status should change from "Queued" → "Running" → "Completed"
4. Machine should show "Small 1x" (not "No machine yet")

## Common Issues

### Issue 1: "No machine yet" Still Showing

**Cause:** Dev server not running or not connected

**Fix:**

1. Stop the dev server (Ctrl+C)
2. Restart: `npm run dev:trigger`
3. Wait for "✓ Connected" message
4. Try triggering a task again

### Issue 2: Task Not Found

**Cause:** Task not exported or file not in correct directory

**Fix:**

1. Check `src/trigger/ai-chat-agent.ts` exists
2. Verify it exports: `export const aiChatAgent = task({...})`
3. Check task ID matches: `id: "ai-chat-agent"`
4. Restart dev server

### Issue 3: Environment Variables Not Loaded

**Cause:** `.env.local` not loaded in Trigger.dev context

**Fix:**

1. Check `.env.local` has `OPENROUTER_API_KEY`
2. Restart Trigger.dev dev server after adding env vars
3. Verify in task logs: `hasOpenRouterKey: true`

## Payload Structure

The task expects this payload structure:

```typescript
{
  userId: string,           // Required: User ID from Supabase auth
  messages: Array<{         // Required: Array of messages
    role: "user" | "assistant" | "system",
    content: string
  }>,
  sessionId?: string        // Optional: Session identifier
}
```

The API route sends this exact structure, so payload should be fine.

## Debugging Checklist

- [ ] Trigger.dev dev server is running (`npm run dev:trigger`)
- [ ] See "✓ Connected" message in dev server output
- [ ] Task is exported in `src/trigger/ai-chat-agent.ts`
- [ ] Task ID matches: `"ai-chat-agent"`
- [ ] `.env.local` has `OPENROUTER_API_KEY`
- [ ] Restarted dev server after any changes
- [ ] Check dashboard for run status and logs

## Still Not Working?

1. **Check Trigger.dev Dashboard Logs:**
   - Go to Runs → Click on a run → View logs
   - Look for error messages
   - Check if task even started

2. **Check Console Output:**
   - Look at Terminal 2 (dev:trigger) output
   - Look for errors or warnings

3. **Test with Simple Task:**
   - Temporarily simplify the task to just return a simple object
   - If that works, gradually add complexity back

4. **Verify Connection:**
   - Check Trigger.dev dashboard shows your dev server connected
   - Look for green indicator in dashboard

## Next Steps

Once tasks are executing:

1. Check logs in Trigger.dev dashboard
2. Verify AI responses are being generated
3. Monitor task performance
4. Add more complex agentic workflows

