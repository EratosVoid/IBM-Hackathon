@echo off
echo Starting Agentic City Planner Demo...
echo ======================================

echo Starting API Service...
cd api
start "API Service" cmd /k "node server.js"
cd ..

timeout /t 5

echo Starting Planner Agent...
cd planner-agent
start "Planner Agent" cmd /k "uvicorn src.api:app --host 0.0.0.0 --port 8000"
cd ..

timeout /t 5

echo Starting Simulation Engine...
cd simulation-engine
start "Simulation Engine" cmd /k "uvicorn src.main:app --host 0.0.0.0 --port 8001"
cd ..

timeout /t 5

echo Starting Document Processor...
cd document-processor
start "Document Processor" cmd /k "uvicorn src.main:app --host 0.0.0.0 --port 8002"
cd ..

timeout /t 5

echo Starting API Gateway...
start "API Gateway" cmd /k "python api_gateway.py"

echo.
echo All services are starting up!
echo.
echo Once all services are running, you can access the application at:
echo    Frontend: http://localhost:8080
echo    API Service: http://localhost:5000
echo    Planner Agent: http://localhost:8000
echo    Simulation Engine: http://localhost:8001
echo    Document Processor: http://localhost:8002
echo.
echo Login credentials:
echo    Email: dev@hackathon.com
echo    Password: cityplanner123
echo.
echo Press any key to close this window...
pause >nul