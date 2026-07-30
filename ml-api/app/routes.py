from fastapi import APIRouter, Request
from app.schemas import (
    RiskPredictionRequest, RiskPredictionResponse,
    DiabetesPredictionRequest, HeartPredictionRequest,
    StrokePredictionRequest, BmiPredictionRequest,
    AllPredictionRequest, AllPredictionResponse
)
from app.predictor import (
    calculate_health_risks,
    predict_diabetes_risk_value,
    predict_heart_risk_value,
    predict_stroke_risk_value,
    predict_bmi_index_value,
    predict_all_metrics
)
from app.utils import logger

router = APIRouter()

@router.get("/")
async def root():
    """
    Service running check probe.
    """
    logger.info("Probe GET / triggered")
    return {
        "status": "running",
        "service": "HealthGuard AI ML API"
    }

@router.get("/health")
async def health():
    """
    Health check diagnostic.
    """
    logger.info("Probe GET /health triggered")
    return {
        "status": "healthy"
    }

@router.post("/predict", response_model=RiskPredictionResponse)
async def predict_risk(request: Request, payload: RiskPredictionRequest):
    """
    Calculates disease risk factors based on biometrics and lifestyle parameters.
    """
    logger.info("Received request for POST /predict")
    
    # Check if request has snake_case keys indicating it is coming from our frontend UI
    is_frontend = False
    try:
        raw_body = await request.json()
        is_frontend = "blood_pressure" in raw_body or "blood_sugar" in raw_body or "family_history" in raw_body
        logger.info(f"Parsed raw body keys: {list(raw_body.keys())}. Is frontend: {is_frontend}")
    except Exception as err:
        logger.warn(f"Failed to inspect raw request body: {err}")

    response = calculate_health_risks(payload, is_frontend=is_frontend)
    return response


@router.post("/predict/diabetes")
async def predict_diabetes(payload: DiabetesPredictionRequest):
    logger.info("Received request for POST /predict/diabetes")
    risk = predict_diabetes_risk_value(payload)
    return {"diabetesRisk": risk}


@router.post("/predict/heart")
async def predict_heart(payload: HeartPredictionRequest):
    logger.info("Received request for POST /predict/heart")
    risk = predict_heart_risk_value(payload)
    return {"heartRisk": risk}


@router.post("/predict/stroke")
async def predict_stroke(payload: StrokePredictionRequest):
    logger.info("Received request for POST /predict/stroke")
    risk = predict_stroke_risk_value(payload)
    return {"strokeRisk": risk}


@router.post("/predict/bmi")
async def predict_bmi(payload: BmiPredictionRequest):
    logger.info("Received request for POST /predict/bmi")
    index = predict_bmi_index_value(payload)
    return {"bmiRisk": index}


@router.post("/predict/all", response_model=AllPredictionResponse)
async def predict_all(payload: AllPredictionRequest):
    logger.info("Received request for POST /predict/all")
    response = predict_all_metrics(payload)
    return response

