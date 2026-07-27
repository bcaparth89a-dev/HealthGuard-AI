# HealthGuard AI

HealthGuard AI is a production-ready, scalable, and modular full-stack hackathon project.

## Project Structure Overview

This project follows a monorepo structure. Below is the directory tree and the explanation for each folder's role in the architecture.

```
.
├── backend/           # Node.js + Express.js Backend API
├── frontend/          # React (Vite) Frontend Client
├── ml-api/            # FastAPI ML API
└── supabase/          # Supabase CLI Config & Database Migrations
```

---

## Folder Details

### 1. Frontend (`/frontend`)
React UI client initialized with Vite. Contains the component library, UI layouts, and state management.

- **`public/`**: Static assets that are served directly.
- **`src/assets/`**: Uncompiled assets (images, custom SVGs, global logos).
- **`src/components/`**: Shared components reusable across features:
  - **`ui/`**: Base design system components (buttons, input fields, checkboxes, modals).
  - **`common/`**: Shell components like Header, Sidebar, and layouts.
  - **`feedback/`**: Status/loading components (skeletons, toast system, loading spinners).
- **`src/context/`**: React context providers (e.g., Authentication state, global application state).
- **`src/features/`**: Feature-oriented domain modules containing page layouts, specialized hooks, and routing components:
  - **`auth/`**: Authentication forms and authorization checks.
  - **`dashboard/`**: User dashboard cards, statistics panels, and overview layouts.
  - **`symptom-checker/`**: Questionnaire wizard and AI chatbot UI.
  - **`ml-predictor/`**: Predictive forms and SHAP visualization interfaces.
  - **`medical-records/`**: Records scanning/upload and document viewing.
- **`src/hooks/`**: Global custom utility hooks (e.g., `useDebounce`, `useLocalStorage`).
- **`src/lib/`**: Initialization of external libraries (Axios client config, React Query clients, Supabase JS clients).
- **`src/routes/`**: Client routing configurations (e.g., protected routes, login redirections).
- **`src/services/`**: API boundary service layer functions mapping backend requests to Query hooks.
- **`src/styles/`**: Custom Tailwind directives, color themes, and global font definitions.
- **`src/utils/`**: Helper methods, date formats, math calculations, and validators.

---

### 2. Backend (`/backend`)
Node.js + Express.js API server coordinating the database connection, GenAI integration (Gemini), and the main application business logic.

- **`src/config/`**: Setup for environment validation, db pool, and API clients.
- **`src/controllers/`**: Endpoint request orchestrators separating raw HTTP parsing from backend actions.
- **`src/middleware/`**: Routing interceptors (token verification, schema validations, rate limiters, global error-catch blocks).
- **`src/models/`**: Domain model mappings (types/schemas indicating DB structures).
- **`src/routes/`**: REST API endpoints version-controlled under `/api/v1/`.
- **`src/services/`**: Central services layer implementing actual workflows (e.g., PDF text extraction, Gemini LLM prompts).
- **`src/utils/`**: General helpers (custom API error classes, logging formats).
- **`tests/`**: Integration and unit testing files.

---

### 3. Machine Learning API (`/ml-api`)
FastAPI service exposing predictive scikit-learn models and explaining predictions using SHAP.

- **`app/api/v1/`**: FastAPI routers mapping API paths to model inference handlers.
- **`app/core/`**: Central FastAPI system configuration, logging settings, and global middleware definitions.
- **`app/models/`**: Python class wrapper logic to load and run serialized machine learning classifiers.
- **`app/schemas/`**: Pydantic schemas validating client payloads and output structures.
- **`app/services/`**: Logical functions processing predictions and generating SHAP values.
- **`app/utils/`**: Utilities for mathematical conversions, array manipulations, or features alignment.
- **`data/`**: Raw dataset files used during model tuning (gitignored).
- **`models/`**: Storage for pickled/joblib model state files.
- **`notebooks/`**: Storage for Jupyter notebooks covering initial model training, SHAP feature assessment, and EDA.
- **`tests/`**: Testing routines validating ML output ranges and prediction response times.

---

### 4. Database (`/supabase`)
Supabase schema, migration history, and localized edge functions.

- **`migrations/`**: Raw SQL migration tables defining database columns, constraints, and enabling extensions (e.g., `pgvector`).
- **`functions/`**: Deno-based Edge Functions triggered by database actions.
- **`seed.sql`**: Test dataset scripts to pre-fill database states locally.
