@echo off
REM Script to build and push Docker images to IBM Container Registry

REM Check if namespace is provided
if "%1"=="" (
  echo Usage: %0 ^<ibm-cloud-namespace^>
  echo Please provide your IBM Cloud Container Registry namespace
  exit /b 1
)

set NAMESPACE=%1
set REGION=us-south

echo Building and pushing images to namespace: %NAMESPACE%

REM Build and push auth service
echo Building auth service...
docker build -t %REGION%.icr.io/%NAMESPACE%/cityplanner-auth ../auth
echo Pushing auth service...
docker push %REGION%.icr.io/%NAMESPACE%/cityplanner-auth

REM Build and push planner agent
echo Building planner agent...
docker build -t %REGION%.icr.io/%NAMESPACE%/cityplanner-planner ../planner-agent
echo Pushing planner agent...
docker push %REGION%.icr.io/%NAMESPACE%/cityplanner-planner

REM Build and push simulation engine
echo Building simulation engine...
docker build -t %REGION%.icr.io/%NAMESPACE%/cityplanner-simulation ../simulation-engine
echo Pushing simulation engine...
docker push %REGION%.icr.io/%NAMESPACE%/cityplanner-simulation

REM Build and push document processor
echo Building document processor...
docker build -t %REGION%.icr.io/%NAMESPACE%/cityplanner-document ../document-processor
echo Pushing document processor...
docker push %REGION%.icr.io/%NAMESPACE%/cityplanner-document

REM Build and push parser
echo Building parser...
docker build -t %REGION%.icr.io/%NAMESPACE%/cityplanner-parser ../parser
echo Pushing parser...
docker push %REGION%.icr.io/%NAMESPACE%/cityplanner-parser

REM Build and push API gateway
echo Building API gateway...
docker build -t %REGION%.icr.io/%NAMESPACE%/cityplanner-api ..
echo Pushing API gateway...
docker push %REGION%.icr.io/%NAMESPACE%/cityplanner-api

echo All images built and pushed successfully!
echo You can now deploy using the deployment.yaml file