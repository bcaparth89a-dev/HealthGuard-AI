# HealthGuard AI

HealthGuard AI is a production-ready, scalable, and modular full-stack preventive healthcare platform. It predicts disease risks using machine learning models trained on real medical datasets and generates AI-driven recommendations.

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
- **`src/components/`**: Shared components reusable across features.
- **`src/features/`**: Feature-oriented domain modules (Dashboard, Assessment, Chatbot).
- **`src/services/`**: API boundary service layer functions mapping backend requests.

### 2. Backend (`/backend`)
Node.js + Express.js API server coordinating the database connection, GenAI integration (Gemini), and predictions routing.

- **`src/config/`**: Setup for environment validation and db pool.
- **`src/controllers/`**: Endpoint request orchestrators.
- **`src/routes/`**: REST API endpoints version-controlled.
- **`src/services/`**: Central services layer (Gemini analysis, database syncs).

### 3. Machine Learning API (`/ml-api`)
FastAPI service exposing predictive scikit-learn models.

- **`app/schemas/`**: Pydantic schemas validating client payloads.
- **`app/predictor.py`**: Model loading and inference routines.
- **`models/`**: Storage for pickled/joblib model state files.
- **`train/`**: Custom python scripts for model training.

### 4. Database (`/supabase`)
Supabase schema, migration history, and localized edge functions.

- **`migrations/`**: SQL files mapping database structures, security policies, and sync triggers.

---

## Deployment Guide

This guide details the step-by-step instructions to deploy each component of the HealthGuard AI platform.

### 1. Database Setup (Supabase)
1. Initialize a new project on [Supabase Console](https://supabase.com/).
2. Navigate to the SQL Editor and apply the migration files located in `supabase/migrations/` to construct the tables (`users`, `health_records`, `risk_predictions`, `ai_reports`, `chat_history`).
3. Ensure that the database level trigger synchronizes `auth.users` additions into `public.users` using the correct UUID layout.

### 2. Machine Learning API Deployment (Render / Docker)
The ML API can be deployed on Render as a Python Web Service.

- **Build Command**: `pip install -r ml-api/requirements.txt && python ml-api/train/train_diabetes.py && python ml-api/train/train_heart.py && python ml-api/train/train_stroke.py && python ml-api/train/train_bmi.py`
- **Start Command**: `uvicorn ml-api.main:app --host 0.0.0.0 --port $PORT`
- **Environment Variables**:
  - `PORT`: `8000` (Render will set this dynamically)
  - `ALLOWED_ORIGINS`: `*` (or your backend/frontend service URLs)

#### Docker Option:
You can build and deploy the container using the provided `ml-api/Dockerfile`:
```bash
docker build -t healthguard-ml-api ./ml-api
docker run -p 8000:8000 healthguard-ml-api
```

### 3. Node.js Backend Gateway Deployment (Render)
The Node.js backend acts as the secure API Gateway communicating with Supabase and FastAPI.

- **Build Command**: `npm install --prefix backend`
- **Start Command**: `npm start --prefix backend`
- **Environment Variables**:
  - `PORT`: `5000`
  - `NODE_ENV`: `production`
  - `SUPABASE_URL`: (Your Supabase project URL)
  - `SUPABASE_ANON_KEY`: (Your Supabase anon public key)
  - `GOOGLE_API_KEY`: (Your Gemini API Key)
  - `CLIENT_URL`: (Your deployed Vercel frontend URL)

### 4. React Frontend Deployment (Vercel)
The frontend UI compiles as a static SPA and is best deployed on Vercel.

- **Framework Preset**: `Vite`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variables**:
  - `VITE_SUPABASE_URL`: (Your Supabase project URL)
  - `VITE_SUPABASE_ANON_KEY`: (Your Supabase anon key)
  - `VITE_API_URL`: (Your deployed Express backend URL, e.g., `https://your-backend.onrender.com/api`)
