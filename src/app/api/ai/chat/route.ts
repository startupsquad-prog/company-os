import { NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { streamText } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

// Route segment config
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Initialize OpenRouter provider
const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

// Log API key status on startup
if (!process.env.OPENROUTER_API_KEY) {
  console.error("❌ [API] OPENROUTER_API_KEY is not set");
} else {
  console.log("✅ [API] OPENROUTER_API_KEY is set (length:", process.env.OPENROUTER_API_KEY.length, ")");
}

/**
 * AI Chat API Route - Pure Vercel AI SDK Implementation
 * 
 * This endpoint uses Vercel AI SDK for streaming chat responses.
 * - Authenticates users via Supabase
 * - Streams AI responses in real-time
 * - Uses OpenRouter as the model provider
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  console.log("🚀 [API] ===== POST REQUEST RECEIVED =====");
  console.log("🚀 [API] Request URL:", req.url);
  console.log("🚀 [API] Request method:", req.method);

  try {
    // Verify authentication
    console.log("🔐 [API] Verifying authentication...");
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("❌ [API] Unauthorized request", { authError: authError?.message, hasUser: !!user });
      return new Response("Unauthorized", { status: 401 });
    }

    console.log("✅ [API] User authenticated:", user.id);

    // Get agentId from query parameters
    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get('agentId');
    console.log("🤖 [API] Agent ID from query:", agentId || 'none (using default)');

    // Parse request body
    console.log("📨 [API] Parsing request body...");
    const body = await req.json();
    const { messages } = body;

    console.log("📨 [API] Received request body:", {
      hasMessages: !!messages,
      messagesCount: messages?.length || 0,
      messagesPreview: messages?.slice(0, 2).map((m: any) => ({
        role: m.role,
        hasParts: !!(m.parts),
        hasContent: !!(m.content),
        partsCount: m.parts?.length || 0,
      })),
    });

    if (!messages || !Array.isArray(messages)) {
      console.error("❌ [API] Invalid request - messages array required");
      return new Response("Invalid request: messages array required", { status: 400 });
    }

    // Check OpenRouter API key
    if (!process.env.OPENROUTER_API_KEY) {
      console.error("❌ [API] OPENROUTER_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "OpenRouter API key is not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Convert messages from UI format (with parts) to model format (with content)
    console.log("🔄 [API] Converting messages format...");
    const modelMessages = messages.map((m: any) => {
      let content = '';
      
      // Handle new AI SDK v5 format with parts array
      if (m.parts && Array.isArray(m.parts)) {
        content = m.parts
          .map((part: any) => {
            if (part.type === 'text' && part.text) return part.text;
            if (typeof part === 'string') return part;
            return part.text || part.content || '';
          })
          .filter(Boolean)
          .join('');
      }
      // Handle legacy format with content string
      else if (typeof m.content === 'string') {
        content = m.content;
      }
      // Handle array format
      else if (Array.isArray(m.content)) {
        content = m.content
          .map((part: any) => typeof part === 'string' ? part : part.text || part.content || '')
          .filter(Boolean)
          .join('');
      }
      // Fallback
      else {
        content = String(m.content || '');
      }

      return {
        role: m.role,
        content: content,
      };
    });

    console.log("📤 [API] Converted messages:", {
      count: modelMessages.length,
      messages: modelMessages.map((m: any) => ({
        role: m.role,
        contentLength: m.content?.length || 0,
        contentPreview: m.content?.substring(0, 50) || '',
      })),
    });

    // Fetch the AI agent (specific agent or default)
    let agentQuery = supabase
      .schema('core')
      .from('ai_agents')
      .select('*')
      .eq('is_active', true)
      .is('deleted_at', null);

    if (agentId) {
      console.log("🤖 [API] Fetching specific agent:", agentId);
      agentQuery = agentQuery.eq('id', agentId);
    } else {
      console.log("🤖 [API] Fetching default AI agent...");
      agentQuery = agentQuery.eq('is_default', true);
    }

    const { data: agentData, error: agentError } = await agentQuery.single();

    type Agent = {
      name: string;
      system_prompt: string;
      model?: string | null;
      max_tokens?: number | null;
      temperature?: number | null;
    };

    const agent = agentData as Agent | null;

    if (agentError || !agent) {
      console.warn("⚠️ [API] No default agent found, using fallback:", agentError?.message);
    } else {
      console.log("✅ [API] Using agent:", agent.name);
    }

    // Prepare messages with system prompt
    const finalMessages = agent?.system_prompt
      ? [
          { role: 'system' as const, content: agent.system_prompt },
          ...modelMessages,
        ]
      : modelMessages;

    // Determine model and settings from agent or use defaults
    const modelName = agent?.model || "openai/chatgpt-4o-latest";
    const maxTokens = agent?.max_tokens || 2000;
    const temperature = agent?.temperature ?? 0.7;

    // Stream AI response using Vercel AI SDK
    console.log("🤖 [API] Calling OpenRouter with model:", modelName);
    console.log("🤖 [API] Settings:", { maxTokens, temperature });
    console.log("🤖 [API] Starting streamText...");
    
    const result = await streamText({
      model: openrouter(modelName),
      messages: finalMessages,
      maxOutputTokens: maxTokens,
      temperature: temperature,
    });

    console.log("✅ [API] Stream created successfully");
    
    // Use toUIMessageStreamResponse() for DefaultChatTransport compatibility
    // This returns the correct format with parts array that DefaultChatTransport expects
    const response = result.toUIMessageStreamResponse();
    
    // Log response details for debugging
    console.log("✅ [API] Response created");
    console.log("✅ [API] Response headers:", Object.fromEntries(response.headers.entries()));
    console.log("✅ [API] Response status:", response.status);
    
    const duration = Date.now() - startTime;
    console.log(`✅ [API] Response created in ${duration}ms`);
    
    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error("❌ [API] ===== ERROR =====");
    console.error("❌ [API] Error after", duration, "ms");
    console.error("❌ [API] Error:", error);
    if (error instanceof Error) {
      console.error("❌ [API] Error message:", error.message);
      console.error("❌ [API] Error stack:", error.stack);
    }
    
    return new Response(
      JSON.stringify({
        error: "Failed to process chat request",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
