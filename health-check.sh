#!/bin/bash

echo "🔍 Ghostline Backend - Health Check Script"
echo "=========================================="
echo ""

# Check if Docker is running
echo "1️⃣ Checking if Docker is running..."
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop."
    exit 1
fi
echo "✅ Docker is running"
echo ""

# Check if docker-compose.yml exists
echo "2️⃣ Checking if docker-compose.yml exists..."
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ docker-compose.yml not found. Are you in the right directory?"
    exit 1
fi
echo "✅ docker-compose.yml found"
echo ""

# Check if .env exists
echo "3️⃣ Checking if .env exists..."
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    cp .env.example .env
    echo "✅ .env file created. Please edit it and add your API keys!"
    echo ""
fi
echo "✅ .env file exists"
echo ""

# Check if services are running
echo "4️⃣ Checking if services are running..."
if docker-compose ps | grep -q "Up"; then
    echo "✅ Services are running:"
    docker-compose ps
else
    echo "⚠️  Services are not running. Starting them now..."
    docker-compose up -d
fi
echo ""

# Wait for backend to be ready
echo "5️⃣ Waiting for backend to be ready..."
sleep 5

# Check backend health endpoint
echo "6️⃣ Testing backend API..."
HEALTH_CHECK=$(curl -s http://localhost:3000/health)
if echo "$HEALTH_CHECK" | grep -q "ok"; then
    echo "✅ Backend is healthy!"
    echo "Response: $HEALTH_CHECK"
else
    echo "❌ Backend health check failed"
    echo "Response: $HEALTH_CHECK"
    echo ""
    echo "📋 Backend logs:"
    docker-compose logs --tail=20 backend
fi
echo ""

# Check database connection
echo "7️⃣ Testing database connection..."
if docker-compose exec -T postgres psql -U ghostline -d ghostline_tattoo -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ Database is accessible"
    
    # Check pgvector extension
    if docker-compose exec -T postgres psql -U ghostline -d ghostline_tattoo -c "SELECT * FROM pg_extension WHERE extname='vector';" | grep -q "vector"; then
        echo "✅ pgvector extension is installed"
    else
        echo "⚠️  pgvector extension not found"
    fi
else
    echo "❌ Database connection failed"
fi
echo ""

# Summary
echo "=========================================="
echo "✨ Health Check Complete!"
echo ""
echo "🌐 Backend URL: http://localhost:3000"
echo "🗄️  Database: localhost:5432"
echo "📊 Redis: localhost:6379"
echo ""
echo "📖 Next steps:"
echo "   1. Edit .env and add your API keys"
echo "   2. Read GETTING-STARTED.md"
echo "   3. Check logs: docker-compose logs -f backend"
echo "=========================================="
