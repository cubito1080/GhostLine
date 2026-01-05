# Ghostline Backend - Health Check Script (PowerShell)
# Run this script to verify your installation

Write-Host "🔍 Ghostline Backend - Health Check Script" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "1️⃣ Checking if Docker is running..." -ForegroundColor Yellow
try {
    $dockerInfo = docker info 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Docker not running"
    }
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}
Write-Host ""

# Check if docker-compose.yml exists
Write-Host "2️⃣ Checking if docker-compose.yml exists..." -ForegroundColor Yellow
if (-not (Test-Path "docker-compose.yml")) {
    Write-Host "❌ docker-compose.yml not found. Are you in the right directory?" -ForegroundColor Red
    exit 1
}
Write-Host "✅ docker-compose.yml found" -ForegroundColor Green
Write-Host ""

# Check if .env exists
Write-Host "3️⃣ Checking if .env exists..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  .env file not found. Creating from .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "✅ .env file created. Please edit it and add your API keys!" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "✅ .env file exists" -ForegroundColor Green
}
Write-Host ""

# Check if services are running
Write-Host "4️⃣ Checking if services are running..." -ForegroundColor Yellow
$services = docker-compose ps
if ($services -match "Up") {
    Write-Host "✅ Services are running:" -ForegroundColor Green
    docker-compose ps
} else {
    Write-Host "⚠️  Services are not running. Starting them now..." -ForegroundColor Yellow
    docker-compose up -d
}
Write-Host ""

# Wait for backend to be ready
Write-Host "5️⃣ Waiting for backend to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Check backend health endpoint
Write-Host "6️⃣ Testing backend API..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/health" -Method Get -ErrorAction Stop
    if ($response.status -eq "ok") {
        Write-Host "✅ Backend is healthy!" -ForegroundColor Green
        Write-Host "Response: $($response | ConvertTo-Json -Compress)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Backend health check failed" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "📋 Backend logs:" -ForegroundColor Yellow
    docker-compose logs --tail=20 backend
}
Write-Host ""

# Check database connection
Write-Host "7️⃣ Testing database connection..." -ForegroundColor Yellow
try {
    $dbTest = docker-compose exec -T postgres psql -U ghostline -d ghostline_tattoo -c "SELECT 1;" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database is accessible" -ForegroundColor Green
        
        # Check pgvector extension
        $vectorCheck = docker-compose exec -T postgres psql -U ghostline -d ghostline_tattoo -c "SELECT * FROM pg_extension WHERE extname='vector';" 2>&1
        if ($vectorCheck -match "vector") {
            Write-Host "✅ pgvector extension is installed" -ForegroundColor Green
        } else {
            Write-Host "⚠️  pgvector extension not found" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "❌ Database connection failed" -ForegroundColor Red
}
Write-Host ""

# Summary
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "✨ Health Check Complete!" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 Backend URL: http://localhost:3000" -ForegroundColor White
Write-Host "🗄️  Database: localhost:5432" -ForegroundColor White
Write-Host "📊 Redis: localhost:6379" -ForegroundColor White
Write-Host ""
Write-Host "📖 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Edit .env and add your API keys"
Write-Host "   2. Read GETTING-STARTED.md"
Write-Host "   3. Check logs: docker-compose logs -f backend"
Write-Host "==========================================" -ForegroundColor Cyan
