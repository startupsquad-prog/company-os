# Trigger.dev Troubleshooting Guide

## Issue: Tasks Show as Queued/Running but Never Complete

### Symptoms
- Tasks appear in Trigger.dev dashboard as "Queued" or "Running"
- Logs show task completing in 0 milliseconds
- No actual execution happening

### Root Causes

#### 1. Trigger.dev Dev Server Not Running
**Most Common Issue**

The Trigger.dev dev server must be running for tasks to execute in development.

**Solution:**
```bash
# Terminal 1: Run Next.js dev server
npm run dev

# Terminal 2: Run Trigger.dev dev server
npm run dev:trigger
```

**Verify it's running:**
- You should see: `✓ Trigger.dev dev server is running`
- Check the dashboard: https://cloud.trigger.dev

#### 2. Task Not Properly Exported
**Check:**
- Task is exported: `export const aiChatAgent = task({...})`
- Task ID matches: `id: "ai-chat-agent"`
- File is in `src/trigger/` directory (as configured in `trigger.config.ts`)

#### 3. Environment Variables Missing
**Check:**
- `OPENROUTER_API_KEY` is set in `.env.local`
- `TRIGGER_SECRET_KEY` is set (auto-configured during init)

**Verify:**
```bash
# Check if env vars are loaded
node -e "console.log(process.env.OPENROUTER_API_KEY ? 'Set' : 'Missing')"
```

#### 4. Authentication Issues in Task
**Problem:** Tasks run in a different context than API routes. Supabase auth might fail.

**Solution:** 
- Authentication should be verified in the API route (before triggering task)
- Tasks should trust the `userId` from payload
- Don't re-authenticate in the task unless necessary

#### 5. Task Failing Silently
**Check logs:**
- Trigger.dev dashboard → Runs → View logs
- Look for error messages
- Check console output from `npm run dev:trigger`

### Debugging Steps

1. **Check Trigger.dev Dev Server Status**
   ```bash
   npm run dev:trigger
   ```
   Should show: `✓ Trigger.dev dev server is running`

2. **Verify Task Registration**
   - Check Trigger.dev dashboard → Tasks
   - Should see `ai-chat-agent` listed
   - If not, restart dev server

3. **Test Task Manually**
   ```typescript
   // In API route or test script
   const handle = await tasks.trigger("ai-chat-agent", {
     userId: "test-user-id",
     messages: [{ role: "user", content: "Hello" }],
     sessionId: "test-session",
   });
   console.log("Task triggered:", handle.id);
   ```

4. **Check Logs**
   - Trigger.dev dashboard → Runs → Click on run → View logs
   - Look for logger.log() output
   - Check for errors

5. **Simplify Task**
   - Remove complex logic temporarily
   - Add simple logger.log() at start
   - Return simple object
   - Gradually add complexity back

### Quick Fix: Simplified Task

If tasks are stuck, try this minimal version:

```typescript
export const aiChatAgent = task({
  id: "ai-chat-agent",
  run: async (payload: ChatAgentInput, { ctx }) => {
    logger.log("Task started", { runId: ctx.run.id });
    
    // Simple return - no AI calls
    return {
      success: true,
      message: "Task executed",
      runId: ctx.run.id,
    };
  },
});
```

If this works, gradually add back:
1. Environment variable checks
2. AI SDK calls
3. Complex logic

### Common Errors

#### "Task not found"
- Task ID mismatch
- Task not exported
- Dev server not running

#### "Authentication failed"
- Supabase client not working in task context
- Solution: Verify auth in API route, pass userId to task

#### "OPENROUTER_API_KEY not set"
- Environment variable not loaded
- Check `.env.local` exists
- Restart dev server after adding env vars

### Best Practices

1. **Always run both servers in development:**
   - `npm run dev` (Next.js)
   - `npm run dev:trigger` (Trigger.dev)

2. **Use logger.log() extensively:**
   - Helps debug what's happening
   - Visible in Trigger.dev dashboard

3. **Handle errors gracefully:**
   - Don't let tasks fail silently
   - Return meaningful error messages

4. **Test incrementally:**
   - Start with simple task
   - Add complexity gradually
   - Verify each step works

### Still Stuck?

1. Check Trigger.dev Discord: https://trigger.dev/discord
2. Review Trigger.dev docs: https://trigger.dev/docs
3. Check dashboard for detailed error messages
4. Review run logs in Trigger.dev dashboard


