# Trigger.dev Integration for AI Chatflows

## Overview

We've integrated Trigger.dev v4 into the Company OS project to enable agentic AI and advanced chatflow capabilities. This replaces the simple chat API with a more powerful, scalable solution.

## What's Been Set Up

### 1. Trigger.dev MCP Server

- ✅ Installed and configured for Cursor
- ✅ Located at `.cursor/mcp.json`
- ✅ Configured for dev environment only

### 2. Trigger.dev v4 Project

- ✅ Initialized with project ID: `proj_oqmifvryosgmasgpkyqi`
- ✅ Configuration file: `trigger.config.ts`
- ✅ Tasks directory: `src/trigger/`

### 3. AI Chatflow Task

- ✅ Created `src/trigger/ai-chatflow.ts` - Background task for AI processing
- ✅ Supports authentication, logging, and error handling
- ✅ Can be used for complex agentic workflows

### 4. New API Route

- ✅ Created `src/app/api/ai/chatflow/route.ts`
- ✅ Supports real-time streaming for chat
- ✅ Can optionally trigger Trigger.dev tasks for analytics/logging
- ✅ Maintains backward compatibility with existing frontend

### 5. Frontend Integration

- ✅ Updated `useAiChat` hook to use `/api/ai/chatflow` endpoint
- ✅ No changes needed to UI components

## Architecture

### Current Implementation (Hybrid Approach)

```
Frontend (useAiChat)
    ↓
API Route (/api/ai/chatflow)
    ├─→ Direct Streaming (real-time chat)
    └─→ Trigger.dev Task (optional background processing)
```

**Why Hybrid?**

- **Real-time streaming**: Direct API for immediate chat responses
- **Background processing**: Trigger.dev for complex workflows, analytics, logging
- **Best of both worlds**: Fast responses + powerful background capabilities

### Future: Full Agentic AI

For more complex agentic workflows, you can:

1. **Use Trigger.dev tasks for multi-step workflows**
   - Chain multiple AI calls
   - Integrate with external APIs
   - Handle complex business logic

2. **Use Trigger.dev for scheduled tasks**
   - Periodic AI analysis
   - Batch processing
   - Data aggregation

3. **Use Trigger.dev for event-driven workflows**
   - React to database changes
   - Process webhooks
   - Handle async operations

## Development

### Running Trigger.dev Dev Server

```bash
npm run dev:trigger
```

This starts the Trigger.dev development server which:

- Watches for task changes
- Provides local development environment
- Syncs with Trigger.dev cloud

### Running Both Servers

For full development, run both:

**Terminal 1:**

```bash
npm run dev
```

**Terminal 2:**

```bash
npm run dev:trigger
```

## Configuration

### Environment Variables

Make sure you have these in `.env.local`:

```env
# OpenRouter (for AI)
OPENROUTER_API_KEY=sk-or-v1-...

# Trigger.dev (auto-configured during init)
TRIGGER_SECRET_KEY=tr_dev_...
```

### Trigger.dev Config

See `trigger.config.ts` for:

- Project ID
- Runtime settings
- Retry policies
- Max duration

## Usage

### Basic Chat (Current)

The frontend automatically uses the new endpoint. No changes needed!

### Using Trigger.dev Task Directly

If you want to trigger the background task:

```typescript
import { tasks } from '@trigger.dev/sdk/v3'
import { aiChatflowTask } from '@/trigger/ai-chatflow'

// Trigger task
const handle = await tasks.trigger(aiChatflowTask, {
  userId: 'user-id',
  messages: [{ role: 'user', content: 'Hello!' }],
  sessionId: 'session-123',
})

// Wait for completion
const run = await handle.jobRun.waitForCompletion()
console.log(run.output)
```

### Creating New Agentic Workflows

Create new tasks in `src/trigger/`:

```typescript
import { logger, tasks } from '@trigger.dev/sdk/v3'

export const myAgenticTask = tasks.create({
  id: 'my-agentic-task',
  run: async (payload, { ctx }) => {
    // Your agentic AI logic here
    // - Multiple AI calls
    // - External API integrations
    // - Complex workflows
  },
})
```

## Monitoring

### Trigger.dev Dashboard

Visit: https://cloud.trigger.dev/projects/v3/proj_oqmifvryosgmasgpkyqi

View:

- Task runs
- Logs
- Errors
- Performance metrics

### Local Logs

Check console for:

- `🚀 [API Chatflow]` - API route logs
- `🤖 [Trigger]` - Trigger.dev task logs

## Next Steps

1. **Test the chatflow**: Send a message and verify it works
2. **Monitor Trigger.dev dashboard**: Check task runs
3. **Build agentic workflows**: Create complex multi-step AI tasks
4. **Add scheduled tasks**: Set up periodic AI processing
5. **Integrate with other systems**: Connect to CRM, ATS, Ops modules

## Troubleshooting

### Task Not Running

1. Check Trigger.dev dev server is running: `npm run dev:trigger`
2. Verify project ID in `trigger.config.ts`
3. Check authentication in Trigger.dev dashboard

### API Errors

1. Check OpenRouter API key is set
2. Verify Supabase authentication
3. Check console logs for detailed errors

### MCP Server Not Working

1. Restart Cursor
2. Check `.cursor/mcp.json` exists
3. Verify MCP server shows "trigger" in Cursor

## Resources

- [Trigger.dev Docs](https://trigger.dev/docs)
- [Trigger.dev MCP Docs](https://trigger.dev/docs/mcp)
- [Trigger.dev Discord](https://trigger.dev/discord)
