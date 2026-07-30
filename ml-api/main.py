import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.routes import router as api_router
from app.utils import logger

# Load environment variables
load_dotenv()

# Initialize FastAPI Application
app = FastAPI(
    title="HealthGuard AI ML API",
    description="Rule-based diagnostic risk engine and feature attribution SHAP estimations.",
    version="1.0.0"
)

# Parse allowed origins from environment config
allowed_origins_raw = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5000")
allowed_origins = [origin.strip() for origin in allowed_origins_raw.split(",")]

# Add CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Router endpoints
app.include_router(api_router)

logger.info("FastAPI ML application successfully initialized.")

if __name__ == "__main__":
    import uvicorn
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", 8000))
    debug_mode = os.getenv("DEBUG", "True").lower() == "true"
    
    logger.info(f"Starting uvicorn server on {host}:{port} with reload={debug_mode}")
    uvicorn.run("main:app", host=host, port=port, reload=debug_mode)
