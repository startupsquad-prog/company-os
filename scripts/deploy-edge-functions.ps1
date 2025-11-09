# Deploy Edge Functions to Supabase
# Run this script after linking your project

Write-Host "🚀 Deploying Edge Functions to Supabase..." -ForegroundColor Cyan

# Deploy process-notification
Write-Host "`n📦 Deploying process-notification..." -ForegroundColor Yellow
npx supabase functions deploy process-notification

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ process-notification deployed successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to deploy process-notification" -ForegroundColor Red
    exit 1
}

# Deploy task-reminders
Write-Host "`n📦 Deploying task-reminders..." -ForegroundColor Yellow
npx supabase functions deploy task-reminders

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ task-reminders deployed successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to deploy task-reminders" -ForegroundColor Red
    exit 1
}

Write-Host "`n🎉 All Edge Functions deployed successfully!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Verify functions in Supabase Dashboard → Edge Functions" -ForegroundColor White
Write-Host "2. Check that SUPABASE_SERVICE_ROLE_KEY secret is set" -ForegroundColor White
Write-Host "3. Test notifications by creating/updating a task" -ForegroundColor White


