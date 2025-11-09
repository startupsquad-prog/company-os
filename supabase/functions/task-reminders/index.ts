/**
 * Task Reminders Edge Function
 * Company OS: Scheduled job for due date reminders and overdue notifications
 * 
 * This function replaces the Trigger.dev scheduled reminders.
 * It checks for tasks due soon and overdue, then calls process-notification for each.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || Deno.env.get("NEXT_PUBLIC_SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    // Initialize Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Parse query parameters to determine which check to run
    const url = new URL(req.url);
    const checkType = url.searchParams.get("type") || "due_soon"; // "due_soon" or "overdue"

    console.log(`⏰ [Edge Function] Task reminder check started: ${checkType}`);

    const now = new Date();
    let tasks: Array<{ id: string; title: string; due_date: string }> = [];
    let notificationType: "task_due_soon" | "task_overdue" = "task_due_soon";
    let action = "due_soon";

    if (checkType === "due_soon") {
      // Find tasks due in the next 24 hours
      const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const { data: tasksDueSoon, error } = await supabase
        .from("tasks")
        .select("id, title, due_date")
        .not("due_date", "is", null)
        .lte("due_date", in24Hours.toISOString())
        .gte("due_date", now.toISOString())
        .is("deleted_at", null)
        .in("status", ["pending", "in_progress"]);

      if (error) {
        console.error("❌ [Edge Function] Failed to fetch tasks due soon", { error });
        throw error;
      }

      tasks = tasksDueSoon || [];
      notificationType = "task_due_soon";
      action = "due_soon";
    } else if (checkType === "overdue") {
      // Find overdue tasks
      const { data: overdueTasks, error } = await supabase
        .from("tasks")
        .select("id, title, due_date")
        .not("due_date", "is", null)
        .lt("due_date", now.toISOString())
        .is("deleted_at", null)
        .in("status", ["pending", "in_progress"]);

      if (error) {
        console.error("❌ [Edge Function] Failed to fetch overdue tasks", { error });
        throw error;
      }

      tasks = overdueTasks || [];
      notificationType = "task_overdue";
      action = "overdue";
    }

    if (tasks.length === 0) {
      console.log(`✅ [Edge Function] No ${checkType} tasks found`);
      return new Response(
        JSON.stringify({ success: true, notifications_created: 0, tasks_processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    console.log(`📋 [Edge Function] Found ${tasks.length} ${checkType} tasks`);

    let totalNotifications = 0;
    const processNotificationUrl = `${supabaseUrl}/functions/v1/process-notification`;

    // Process each task
    for (const task of tasks) {
      try {
        // Get task assignees
        const { data: assignees } = await supabase
          .from("task_assignees")
          .select("profile_id")
          .eq("task_id", task.id);

        if (!assignees || assignees.length === 0) {
          continue;
        }

        // Get user IDs from profiles
        const profileIds = assignees.map((a) => a.profile_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id")
          .in("id", profileIds);

        const recipientUserIds = (profiles || [])
          .map((p) => p.user_id)
          .filter((id): id is string => !!id);

        if (recipientUserIds.length === 0) {
          continue;
        }

        // Build custom message based on time until due
        let customMessage = "";
        if (checkType === "due_soon") {
          const dueDate = new Date(task.due_date);
          const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
          customMessage = `Task "${task.title}" is due ${hoursUntilDue <= 2 ? "in 2 hours" : "soon"}`;
        } else {
          customMessage = `Task "${task.title}" is overdue`;
        }

        // Call process-notification Edge Function
        const response = await fetch(processNotificationUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            entity_type: "task",
            entity_id: task.id,
            action,
            notification_type: notificationType,
            recipients: recipientUserIds,
            metadata: {
              due_date: task.due_date,
            },
            custom_title: checkType === "due_soon" ? "Task Due Soon" : "Task Overdue",
            custom_message: customMessage,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(
            `❌ [Edge Function] Failed to create notification for task ${task.id}`,
            { error: errorText }
          );
          continue;
        }

        const result = await response.json();
        totalNotifications += result.notifications_created || recipientUserIds.length;
      } catch (error) {
        console.error(`❌ [Edge Function] Failed to process task ${task.id}`, { error });
      }
    }

    console.log(`✅ [Edge Function] Created ${totalNotifications} ${checkType} notifications`);

    return new Response(
      JSON.stringify({
        success: true,
        notifications_created: totalNotifications,
        tasks_processed: tasks.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("❌ [Edge Function] Task reminder failed", { error });
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});


