# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**TUNING: Tuning User–Agent Navigation through Inspectable and Normalized GUI**

This is an HCI research prototype for comparing rigid vs adaptive chatbot-GUI integration in a hospital appointment booking context. The system implements two agent types that share the same UI and backend infrastructure but differ in their interaction policies.

## Research Design

### Independent Variable: Agent Type

- **Baseline Agent**: Rigid, step-aligned chatbot that only accepts input matching the current GUI step. Treats all other input as fallback. Intentionally reproduces limitations of existing chatbot systems.
- **Adaptive Agent**: (To be implemented later) Flexible agent that can accept multi-step input, store future information, and infer missing data.

### Shared Infrastructure

The baseline and adaptive agents share:
- Frontend UI (React + TypeScript)
- Backend API structure (Node.js + Express + TypeScript)
- Database schema (SQLite3)
- Logging system for interaction analysis

Only the agent processing logic differs - this allows controlled comparison following HCI research methodology where a single independent variable is manipulated.

## System Architecture

### Monorepo Structure

```
tuning/
├── backend/          # Express API server
│   ├── src/
│   │   ├── agents/           # Agent implementations (baseline, adaptive)
│   │   ├── nlu/              # OpenAI-based natural language processing
│   │   ├── session/          # Session state management
│   │   ├── database/         # SQLite + Prisma (planned)
│   │   ├── validators/       # Step-based input validation
│   │   ├── logging/          # Research interaction logging
│   │   └── api/              # REST endpoints
│   └── package.json
├── frontend/         # React UI
│   ├── src/
│   │   ├── components/       # GUI + Chat interface
│   │   └── ...
│   └── package.json
└── package.json      # Root workspace manager
```

### Appointment Booking Flow

The system models a strictly ordered 7-step task:

1. **PATIENT_ID** - Patient identification
2. **VISIT_TYPE** - 초진/재진/검진 selection
3. **DEPARTMENT** - Medical department selection
4. **DOCTOR** - Doctor selection (filtered by department, visit type)
5. **DATE** - Appointment date
6. **TIME** - Time slot (validated against doctor schedule)
7. **CONFIRMATION** - Final confirmation

Each step has dependencies on previous steps. The baseline agent enforces strict sequential progression.

### Multi-turn Conversation Handling

- **Session Management**: Each user session maintains conversation history, current step, and collected appointment data
- **Conversation History**: Stored in session and passed to OpenAI API with each request for context
- **NLU Processing**: OpenAI API receives full conversation history to parse user input in context
- **State Persistence**: Sessions stored in-memory (development) or Redis (production)

### Natural Language Understanding

Uses OpenAI API (GPT-4) with structured output for parsing user input:
- Each step has a specific parsing schema
- Detects when user provides information for wrong/future steps
- Returns confidence scores and ambiguity flags
- Baseline agent uses this to reject out-of-step information

### Data Layer

**Planned: SQLite3 + Prisma ORM**

Database tables:
- `patients` - Patient records
- `departments` - Medical departments
- `doctors` - Doctor information with department relationships
- `schedules` - Doctor availability by day/time
- `appointments` - Booking records with availability constraints
- `interaction_logs` - Research data (utterances, acceptances, rejections, reasons)

Each step validation queries the database to check actual availability and constraints.

## Development Commands

```bash
# Install dependencies
npm install

# Run both backend and frontend in development mode
npm run dev

# Run backend only
npm run dev:backend

# Run frontend only
npm run dev:frontend

# Build all workspaces
npm run build

# Build specific workspace
npm run build:backend
npm run build:frontend
```

## Key Design Constraints

### Baseline Agent Behavior (Current Focus)

- **Step Alignment**: Only accepts input for current step
- **No Inference**: Never assumes or infers missing information
- **Explicit Fallback**: Clearly rejects wrong-step or ambiguous input
- **No Multi-step Input**: Cannot process "I want Dr. Kim tomorrow at 3pm" at PATIENT_ID step
- **Logging Required**: Every interaction must be logged with acceptance/rejection reason

### Intentional Rigidity

The baseline system is **purposely frustrating** to reproduce existing chatbot limitations. Do not:
- Add adaptive inference
- Optimize user experience
- Reduce fallback frequency
- Accept multi-step input
- Skip steps or merge flows

This rigidity is the research baseline for comparison.

## Implementation Philosophy

**Incremental Development**: Build features one at a time, not all at once. Example progression:
1. Basic Express server with health check
2. Session creation endpoint only
3. First step (PATIENT_ID) with hardcoded validation
4. Add OpenAI parsing to first step
5. Add second step, test two-step flow
6. Continue adding steps sequentially

**Understanding Over Speed**: Each component should be explainable and testable before moving to the next. The developer should be able to mentally model the entire system architecture.

## Research Data Collection

All user interactions must be logged with:
- User utterance (raw input)
- Current step
- Extracted data (from NLU)
- Accepted (boolean)
- Rejection reason (if rejected)
- System response
- Timestamp
- Session ID
- Agent type

This data will be used to analyze user frustration patterns and interaction breakdowns when comparing baseline vs adaptive agents.
