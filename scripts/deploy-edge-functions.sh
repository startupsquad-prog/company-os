#!/bin/bash
# Deploy Edge Functions to Supabase
# Run this script after linking your project

echo "🚀 Deploying Edge Functions to Supabase..."

# Deploy process-notification
echo ""
echo "📦 Deploying process-notification..."
npx supabase functions deploy process-notification

if [ $? -eq 0 ]; then
    echo "✅ process-notification deployed successfully!"
else
    echo "❌ Failed to deploy process-notification"
    exit 1
fi

# Deploy task-reminders
echo ""
echo "📦 Deploying task-reminders..."
npx supabase functions deploy task-reminders

if [ $? -eq 0 ]; then
    echo "✅ task-reminders deployed successfully!"
else
    echo "❌ Failed to deploy task-reminders"
    exit 1
fi

echo ""
echo "🎉 All Edge Functions deployed successfully!"
echo ""
echo "Next steps:"
echo "1. Verify functions in Supabase Dashboard → Edge Functions"
echo "2. Check that SUPABASE_SERVICE_ROLE_KEY secret is set"
echo "3. Test notifications by creating/updating a task"


