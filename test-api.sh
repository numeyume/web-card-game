#!/bin/bash

echo "🧪 API Integration Test"
echo "======================"
echo ""

echo "1. Health Check..."
curl -s http://localhost:3001/health
echo -e "\n"

echo "2. Cards API..."
curl -s http://localhost:3001/api/cards
echo -e "\n"

echo "3. Rooms API..."
curl -s http://localhost:3001/api/rooms
echo -e "\n"

echo "4. Card filtering (Treasure)..."
curl -s "http://localhost:3001/api/cards?type=Treasure"
echo -e "\n"

echo "5. Card filtering (Victory)..."
curl -s "http://localhost:3001/api/cards?type=Victory"
echo -e "\n"

echo "6. Non-existent card (should return 503)..."
curl -s -w "HTTP Status: %{http_code}\n" http://localhost:3001/api/cards/nonexistent
echo -e "\n"

echo "✅ API Test Complete!"