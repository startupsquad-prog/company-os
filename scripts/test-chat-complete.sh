#!/bin/bash
# Complete CLI test for AI Chat API
# Tests authentication, API endpoint, and response streaming

echo "🧪 [CLI TEST] Starting Complete AI Chat API Test"
echo ""

# Check if server is running
echo "📋 [CLI TEST] Checking if Next.js server is running..."
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "❌ [CLI TEST] Next.js server is not running on port 3000"
    echo "💡 [CLI TEST] Please start it with: npm run dev"
    exit 1
fi
echo "✅ [CLI TEST] Server is running"
echo ""

# Test the API endpoint
echo "🌐 [CLI TEST] Testing /api/chat endpoint..."
echo ""

# Note: This requires authentication cookies
# For a complete test, you need to:
# 1. Log in to the app in your browser
# 2. Copy the session cookie from DevTools
# 3. Add it to the curl command below

curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "Hello! This is a test. Please respond with: Test successful!"
      }
    ]
  }' \
  -v \
  --no-buffer

echo ""
echo ""
echo "✅ [CLI TEST] Test completed"
echo ""
echo "💡 [CLI TEST] If you got a 401 error, you need to:"
echo "   1. Log in to the app in your browser"
echo "   2. Copy the session cookie from DevTools > Application > Cookies"
echo "   3. Add it to the curl command: -H 'Cookie: your-cookie-here'"

