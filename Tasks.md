# Backend Task Plan — Agentic City Planner (Team of 5)

## 👥 Backend Component Ownership with System Roles

### 🔧 1. Planner Agent & Tool Orchestration

**Owner:** Dev A

- Acts as the central reasoning brain, deciding which tools to invoke based on user intent.
- Integrates with watsonx.ai and LangChain to support multi-step decisions.
- Connects to external tools for zoning evaluation, cost estimation, etc.
- Maintains short-term memory for multi-turn user sessions.

**Input:** User prompts ("Add green space"), context, feedback topics
**Output:** Tool invocations, rationale strings, layout change instructions

---

### 🔧 2. Simulation Engine

**Owner:** Dev B

- Computes quantitative outcomes for changes (traffic, cost, pollution).
- Modular simulation architecture to plug in future models (e.g. walkability).
- Returns interpretable summaries and spatial overlays.
- Exposes secure REST endpoints for triggering simulations.

**Input:** Zoning plan, infra edits, traffic flow inputs, tool outputs
**Output:** Simulated KPIs (cost, traffic), update diffs for map

---

### 🔧 3. Blueprint & Data Ingestion Layer

**Owner:** Dev C

- Parses uploaded GIS, JSON, or blueprint files into normalized format.
- Handles zoning metadata, road graphs, and service layers.
- Populates the simulation backend and agent context store.

**Input:** Uploaded blueprint files (GeoJSON, DXF, JSON, ZIP)
**Output:** Parsed normalized schema (zones, roads, services)

---

### 🔧 4. Document Retrieval & Feedback Processor

**Owner:** Dev D

- Uses LlamaIndex + RAG to answer agent queries from policy docs.
- Classifies feedback using sentiment and topic classifiers.
- Interfaces directly with agent via summary/action recommendations.

**Input:** Policy documents, public feedback forms
**Output:** Retrieved passages, sentiment summaries, update prompts

---

### 🔧 5. Backend Authentication & Frontend UI

**Owner:** Dev E

- Handles all authentication logic including login, access control, and session state.
- Oversees core frontend UI: layout rendering, map interactions, input panels.
- Ensures frontend-backend communication via clean APIs.
- Supports UX flows such as multi-step prompts, real-time layout updates, and feedback display.

**Input:** Auth forms, user commands, agent responses, system states
**Output:** Auth tokens, updated UI views, API-triggered layout updates

---

## 🔁 Shared Responsibilities

- Manage deployment workflow (Railway, Render, Docker) collaboratively as a shared task.
- All developers write concise endpoint contracts for internal services.
- Collaborate on test coverage and debugging interfaces.
- Log traceable actions for audit/debugging purposes.
- Align data schemas across agent, simulation, and frontend.
