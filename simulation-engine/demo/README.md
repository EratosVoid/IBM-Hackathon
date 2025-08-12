# Demo Scenarios

This directory contains demo scenarios for the Simulation Engine.

## Overview

The demo scenarios showcase different use cases of the Simulation Engine, including:

1. Basic zoning changes
2. Infrastructure additions
3. Comprehensive urban planning projects
4. Edge cases and error conditions

Each demo scenario includes:
- Input data in JSON format
- Expected output/results
- Instructions for running the demo

## Running Demos

To run any demo scenario:

1. Start the Simulation Engine server:
   ```bash
   uvicorn src.main:app --reload
   ```

2. Use curl or another HTTP client to send the demo request:
   ```bash
   curl -X POST http://localhost:8000/simulate \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer YOUR_JWT_TOKEN" \
        -d @demo/scenario_name/input.json
   ```

Or use the provided Python scripts:
   ```bash
   python demo/scenario_name/run_demo.py
   ```

## Demo Scenarios

### 1. Basic Zoning Change

**Directory:** `basic_zoning_change`

**Description:** Add a residential zone and simulate its impact on traffic, cost, and pollution.

**Files:**
- `input.json` - Input data for the simulation
- `expected_output.json` - Expected output from the simulation
- `run_demo.py` - Python script to run the demo

### 2. Infrastructure Addition

**Directory:** `infrastructure_addition`

**Description:** Add a new road and analyze traffic improvement.

**Files:**
- `input.json` - Input data for the simulation
- `expected_output.json` - Expected output from the simulation
- `run_demo.py` - Python script to run the demo

### 3. Comprehensive Plan

**Directory:** `comprehensive_plan`

**Description:** Multi-zone development with full simulation.

**Files:**
- `input.json` - Input data for the simulation
- `expected_output.json` - Expected output from the simulation
- `run_demo.py` - Python script to run the demo

### 4. Edge Cases

**Directory:** `edge_cases`

**Description:** Invalid inputs, error conditions, and boundary scenarios.

**Files:**
- `input.json` - Input data for the simulation
- `expected_output.json` - Expected output from the simulation
- `run_demo.py` - Python script to run the demo