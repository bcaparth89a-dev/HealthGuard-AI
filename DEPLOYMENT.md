# HealthGuard AI - Deployment Guide

This document provides step-by-step instructions to deploy the HealthGuard AI preventive healthcare application across your target cloud hosting platforms (Supabase, Render, Vercel).

---

## Architecture Overview

```
                        +----------------------------+
                        |      React Frontend        |
                        |      (Vercel SPA)          |
                        +--------------+-------------+
                                       |
                                       | HTTP / REST
                                       v
                        +--------------+-------------+
                        |    Node.js API Gateway     |
                        |      (Render Web App)      |
                        +-------+--------------+-----+
                                |              |
                     Supabase   |              | HTTP / REST
                     REST API   v              v
                 +--------------+--+     +-----+---------------+
                 |  Supabase DB    |     |   FastAPI ML API    |
                 |  & Auth System  |     |   (Render / Docker) |
                 +-----------------+     +---------------------+
```

---

## Prerequisites

Before starting, prepare the following API keys and accounts:
1. **Supabase Account**: A database project and Auth client setup.
2. **Google AI Studio Account**: A Gemini 1.5 Flash API Key.
3. **Render Account**: Hosting for the Express backend and FastAPI.
4. **Vercel Account**: Hosting for the React frontend client.

---

## Deployment Steps

### Step 1: Database Setup (Supabase)

1. **Create Project**: Sign in to the [Supabase Console](https://supabase.com/) and create a new project.
2. **Database Schema**:
   - In your local project, find SQL migrations inside the `supabase/migrations/` folder.
   - Copy the SQL content and run it in the **SQL Editor** on the Supabase dashboard to create the tables (`users`, `health_records`, `risk_predictions`, `ai_reports`, `chat_history`).
3. **Authentication Setup**:
   - Ensure Supabase Auth is enabled under the Authentication settings.
   - Verify that row-level security (RLS) policies are active and align with your schemas.

---

### Step 2: FastAPI Machine Learning Service Deployment (Render)

The FastAPI server loads the trained models and runs inference.

1. **Deploy Web Service**:
   - Create a new **Web Service** on Render.
   - Link your GitHub repository.
   - Configure the root directory to `ml-api/` or configure the build parameters as follows:
2. **Build Settings**:
   - **Environment**: `Python`
   - **Build Command**: `pip install -r ml-api/requirements.txt && python ml-api/train/train_diabetes.py && python ml-api/train/train_heart.py && python ml-api/train/train_stroke.py && python ml-api/train/train_bmi.py`
   - **Start Command**: `uvicorn ml-api.main:app --host 0.0.0.0 --port $PORT`
3. **Environment Variables**:
   - `PORT`: `8000` (Render overrides this dynamically)
   - `ALLOWED_ORIGINS`: `*` (or your client domain URL)

---

### Step 3: Node.js API Gateway Deployment (Render)

The Node Express backend processes API gateway requests and manages database interactions.

1. **Deploy Web Service**:
   - Create another **Web Service** on Render.
   - Link your GitHub repository.
2. **Build Settings**:
   - **Environment**: `Node`
   - **Build Command**: `npm install --prefix backend`
   - **Start Command**: `npm start --prefix backend`
3. **Environment Variables**:
   - `PORT`: `5000`
   - `NODE_ENV`: `production`
   - `SUPABASE_URL`: (Your Supabase project URL)
   - `SUPABASE_ANON_KEY`: (Your Supabase anon public key)
   - `GOOGLE_API_KEY`: (Your Gemini API Key)
   - `CLIENT_URL`: (Your deployed Vercel frontend URL, e.g. `https://healthguard.vercel.app`)

---

### Step 4: React Client Deployment (Vercel)

The React client compiles as a static site and communicates only with the Express gateway.

1. **Import Project**:
   - Connect Vercel to your GitHub repository and import the project.
   - Set the root directory of the deployment to `frontend/`.
2. **Build Settings**:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. **Environment Variables**:
   - `VITE_SUPABASE_URL`: (Your Supabase project URL)
   - `VITE_SUPABASE_ANON_KEY`: (Your Supabase anon public key)
   - `VITE_API_URL`: (Your Express gateway base URL, e.g. `https://healthguard-backend.onrender.com/api`)
