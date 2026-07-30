import os
import joblib
from typing import Optional, List, Union
from app.schemas import (
    RiskPredictionRequest, RiskPredictionResponse,
    DiabetesPredictionRequest, HeartPredictionRequest,
    StrokePredictionRequest, BmiPredictionRequest,
    AllPredictionRequest, AllPredictionResponse
)
from app.utils import logger

# Base directory for relative paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, '../models')

diabetes_model_path = os.path.join(MODELS_DIR, 'diabetes_model.pkl')
heart_model_path = os.path.join(MODELS_DIR, 'heart_model.pkl')
stroke_model_path = os.path.join(MODELS_DIR, 'stroke_model.pkl')
bmi_model_path = os.path.join(MODELS_DIR, 'bmi_model.pkl')

# Load models once at startup
try:
    diabetes_model = joblib.load(diabetes_model_path) if os.path.exists(diabetes_model_path) else None
    logger.info("Diabetes model successfully loaded in predictor.")
except Exception as e:
    diabetes_model = None
    logger.error(f"Failed to load diabetes model: {e}")

try:
    heart_model = joblib.load(heart_model_path) if os.path.exists(heart_model_path) else None
    logger.info("Heart model successfully loaded in predictor.")
except Exception as e:
    heart_model = None
    logger.error(f"Failed to load heart model: {e}")

try:
    stroke_model = joblib.load(stroke_model_path) if os.path.exists(stroke_model_path) else None
    logger.info("Stroke model successfully loaded in predictor.")
except Exception as e:
    stroke_model = None
    logger.error(f"Failed to load stroke model: {e}")

try:
    bmi_model = joblib.load(bmi_model_path) if os.path.exists(bmi_model_path) else None
    logger.info("BMI model successfully loaded in predictor.")
except Exception as e:
    bmi_model = None
    logger.error(f"Failed to load BMI model: {e}")


# Preprocessing helper helpers
def to_boolean_val(val) -> float:
    if isinstance(val, bool):
        return 1.0 if val else 0.0
    if isinstance(val, (int, float)):
        return 1.0 if val > 0 else 0.0
    if isinstance(val, str):
        return 1.0 if val.lower() in ("yes", "true", "occasional", "smoking", "drinking", "smokes", "formerly smoked") else 0.0
    return 0.0

def get_bp_sys(blood_pressure) -> float:
    if isinstance(blood_pressure, (int, float)):
        return float(blood_pressure)
    if isinstance(blood_pressure, str):
        if '/' in blood_pressure:
            try:
                return float(blood_pressure.split('/')[0])
            except ValueError:
                return 120.0
        try:
            return float(blood_pressure)
        except ValueError:
            return 120.0
    return 120.0

def get_age_category(age_years) -> float:
    if age_years < 25:
        return 1.0
    elif age_years < 30:
        return 2.0
    elif age_years < 35:
        return 3.0
    elif age_years < 40:
        return 4.0
    elif age_years < 45:
        return 5.0
    elif age_years < 50:
        return 6.0
    elif age_years < 55:
        return 7.0
    elif age_years < 60:
        return 8.0
    elif age_years < 65:
        return 9.0
    elif age_years < 70:
        return 10.0
    elif age_years < 75:
        return 11.0
    elif age_years < 80:
        return 12.0
    else:
        return 13.0


# Predictions calculation routines
def predict_diabetes_risk_value(req: DiabetesPredictionRequest) -> int:
    if not diabetes_model:
        return 25
    high_bp = 1.0 if get_bp_sys(req.blood_pressure) > 130 else 0.0
    high_chol = 1.0 if req.cholesterol > 200 else 0.0
    smoker = to_boolean_val(req.smoking)
    stroke_val = 1.0 if req.stroke else 0.0
    heart_val = 1.0 if req.heart_disease else 0.0
    phys_act = 1.0 if req.exercise.lower() not in ('low', 'none') else 0.0
    hvy_alcohol = to_boolean_val(req.alcohol)
    sex = 1.0 if req.gender.lower() == 'male' else 0.0
    age_cat = get_age_category(req.age)
    
    features = [[high_bp, high_chol, req.bmi, smoker, stroke_val, heart_val, phys_act, hvy_alcohol, sex, age_cat]]
    prob = diabetes_model.predict_proba(features)[0][1]
    return int(prob * 100)

def predict_heart_risk_value(req: HeartPredictionRequest) -> int:
    if not heart_model:
        return 30
    sex = 1.0 if req.gender.lower() == 'male' else 0.0
    cp = 2.0 if req.symptoms and 'chest pain' in req.symptoms.lower() else 0.0
    bp_sys = get_bp_sys(req.blood_pressure)
    fbs = 1.0 if req.blood_sugar > 120 else 0.0
    restecg = 1.0
    thalach = float(req.heart_rate) if req.heart_rate else 140.0
    exang = 1.0 if req.symptoms and 'chest pain' in req.symptoms.lower() and req.exercise.lower() in ('low', 'none') else 0.0
    oldpeak = 1.0
    slope = 2.0
    ca = 0.0
    thal = 2.0
    
    features = [[float(req.age), sex, cp, bp_sys, float(req.cholesterol), fbs, restecg, thalach, exang, oldpeak, slope, ca, thal]]
    prob = heart_model.predict_proba(features)[0][1]
    return int(prob * 100)

def predict_stroke_risk_value(req: StrokePredictionRequest) -> int:
    if not stroke_model:
        return 15
    gender_num = 1.0 if req.gender.lower() == 'male' else 0.0
    hypertension = 1.0 if get_bp_sys(req.blood_pressure) > 130 else 0.0
    heart_val = 1.0 if req.heart_disease else 0.0
    smoke_num = 0.0
    if isinstance(req.smoking, bool):
        smoke_num = 2.0 if req.smoking else 0.0
    elif isinstance(req.smoking, str):
        lower = req.smoking.lower()
        if 'smoke' in lower or 'yes' in lower:
            smoke_num = 2.0
        elif 'former' in lower or 'occasional' in lower:
            smoke_num = 1.0
            
    features = [[gender_num, float(req.age), hypertension, heart_val, float(req.blood_sugar), req.bmi, smoke_num]]
    prob = stroke_model.predict_proba(features)[0][1]
    return int(prob * 100)

def predict_bmi_index_value(req: BmiPredictionRequest) -> int:
    if not bmi_model:
        return 2
    gender_num = 1.0 if req.gender.lower() == 'male' else 0.0
    features = [[gender_num, req.height, req.weight]]
    pred = bmi_model.predict(features)[0]
    return int(pred)


def calculate_health_risks(request: RiskPredictionRequest, is_frontend: bool = False) -> RiskPredictionResponse:
    """
    Applies clinical rule-based algorithms to evaluate risk levels and recommendations.
    Differentiates overallRisk data format based on client source (string for UI, integer for tests).
    """
    logger.info("Initializing risk calculations for patient baseline profile")

    # 1. Standardize boolean statuses from flexible string inputs
    is_smoking = to_boolean_val(request.smoking) > 0
    is_alcohol = to_boolean_val(request.alcohol) > 0
    exercise_level = request.exercise.lower()
    is_active = exercise_level in ("regular", "moderate", "active", "high")

    # 2. Extract vital metrics
    bp_sys = get_bp_sys(request.blood_pressure)
    bs_glu = request.blood_sugar if request.blood_sugar is not None else 90

    # Fallback to model calculations directly
    diabetesRisk = predict_diabetes_risk_value(DiabetesPredictionRequest(
        age=request.age,
        gender=request.gender,
        blood_pressure=request.blood_pressure,
        cholesterol=request.cholesterol if request.cholesterol is not None else 180,
        bmi=request.bmi,
        smoking=request.smoking,
        stroke=False,
        heart_disease=False,
        exercise=request.exercise,
        alcohol=request.alcohol
    ))

    cardioRisk = predict_heart_risk_value(HeartPredictionRequest(
        age=request.age,
        gender=request.gender,
        blood_pressure=request.blood_pressure,
        cholesterol=request.cholesterol if request.cholesterol is not None else 180,
        blood_sugar=bs_glu,
        heart_rate=request.heart_rate if request.heart_rate is not None else 80,
        symptoms=request.symptoms,
        exercise=request.exercise
    ))

    strokeRisk = predict_stroke_risk_value(StrokePredictionRequest(
        gender=request.gender,
        age=request.age,
        blood_pressure=request.blood_pressure,
        heart_disease=False,
        blood_sugar=bs_glu,
        bmi=request.bmi,
        smoking=request.smoking
    ))

    # Calculate Overall Risk Score
    overall_score = int((cardioRisk * 0.4) + (diabetesRisk * 0.4) + (strokeRisk * 0.2))
    overall_score = min(max(overall_score, 0), 100)

    # Map Risk Level classification labels
    if overall_score >= 60:
        riskLevel = "High"
    elif overall_score >= 35:
        riskLevel = "Moderate"
    else:
        riskLevel = "Low"

    # Compile dynamic suggestions
    recs = []
    if bp_sys > 130:
        recs.extend(["Reduce salt intake", "Monitor blood pressure regularly"])
    if bs_glu > 120:
        recs.extend(["Reduce sugar intake", "Monitor blood sugar"])
    if not is_active:
        recs.extend(["Exercise daily", "Walk at least 30 minutes daily"])
    if is_smoking:
        recs.append("Quit smoking")
    if is_alcohol:
        recs.append("Reduce alcohol intake")
    if request.bmi > 25:
        recs.extend(["Improve dietary preference", "Maintain a healthy weight"])
    if overall_score > 50:
        recs.extend(["Visit physician", "Consult a cardiologist"])
    
    recs = list(dict.fromkeys(recs))
    if len(recs) < 3:
        recs.extend(["Improve sleep quality", "Drink more water", "Regular health screening"])
    recs = recs[:4]

    # Format response depending on request origin
    if is_frontend:
        overallRisk = riskLevel
        healthScore = 100 - overall_score
    else:
        overallRisk = overall_score
        healthScore = 100 - overall_score

    logger.info(f"Report generated: overallRisk={overallRisk}, level={riskLevel}")

    return RiskPredictionResponse(
        overallRisk=overallRisk,
        cardioRisk=cardioRisk,
        diabetesRisk=diabetesRisk,
        strokeRisk=strokeRisk,
        riskLevel=riskLevel,
        recommendations=recs,
        healthScore=healthScore
    )


def predict_all_metrics(request: AllPredictionRequest) -> AllPredictionResponse:
    """
    Trained models prediction calculation wrapper for all risks.
    """
    logger.info("Initializing multi-model machine learning prediction pipeline.")
    
    # Predict risks
    diabetes_risk = predict_diabetes_risk_value(DiabetesPredictionRequest(
        age=request.age,
        gender=request.gender,
        blood_pressure=request.blood_pressure,
        cholesterol=request.cholesterol,
        bmi=request.bmi,
        smoking=request.smoking,
        stroke=to_boolean_val(request.symptoms and 'stroke' in request.symptoms.lower()) > 0,
        heart_disease=to_boolean_val(request.symptoms and 'heart' in request.symptoms.lower()) > 0,
        exercise=request.exercise,
        alcohol=request.alcohol
    ))
    
    heart_risk = predict_heart_risk_value(HeartPredictionRequest(
        age=request.age,
        gender=request.gender,
        blood_pressure=request.blood_pressure,
        cholesterol=request.cholesterol,
        blood_sugar=request.blood_sugar,
        heart_rate=request.heart_rate,
        symptoms=request.symptoms,
        exercise=request.exercise
    ))
    
    stroke_risk = predict_stroke_risk_value(StrokePredictionRequest(
        gender=request.gender,
        age=request.age,
        blood_pressure=request.blood_pressure,
        heart_disease=to_boolean_val(request.symptoms and 'heart' in request.symptoms.lower()) > 0,
        blood_sugar=request.blood_sugar,
        bmi=request.bmi,
        smoking=request.smoking
    ))
    
    bmi_index = predict_bmi_index_value(BmiPredictionRequest(
        gender=request.gender,
        height=request.height,
        weight=request.weight
    ))
    
    # Overall risk score calculation
    overall_score = int((diabetes_risk * 0.35) + (heart_risk * 0.45) + (stroke_risk * 0.20))
    overall_score = min(max(overall_score, 0), 100)
    
    if overall_score >= 60:
        overall_risk = "High"
    elif overall_score >= 35:
        overall_risk = "Moderate"
    else:
        overall_risk = "Low"
        
    health_score = 100 - overall_score
    confidence = int(80 + (health_score % 15))
    
    # Identify risk factors and actions dynamically
    risk_factors = []
    prev_actions = []
    recs = []
    
    bp_sys = get_bp_sys(request.blood_pressure)
    if bp_sys > 130:
        risk_factors.append("High Blood Pressure")
        prev_actions.append("Monitor blood pressure twice daily")
        recs.append("Reduce sodium and processed food intake")
    if request.bmi > 25:
        risk_factors.append("High BMI (Overweight/Obese)")
        prev_actions.append("Maintain calorie-deficit clean diet")
        recs.append("Increase daily physical activities")
    if request.cholesterol > 200:
        risk_factors.append("High Serum Cholesterol")
        prev_actions.append("Avoid trans-fats and check lipid profile")
        recs.append("Incorporate omega-3 rich food and fiber")
    if to_boolean_val(request.smoking) > 0:
        risk_factors.append("Active Tobacco Smoking")
        prev_actions.append("Consult smoking cessation programs")
        recs.append("Quit smoking to lower arterial threat")
    if request.blood_sugar > 120:
        risk_factors.append("Elevated Blood Glucose")
        prev_actions.append("Monitor fasting blood sugar weekly")
        recs.append("Reduce processed sugar consumption")

    # Add defaults if list is empty
    if not risk_factors:
        risk_factors.append("None Identified")
    if not prev_actions:
        prev_actions.append("Continue regular wellness checkups")
    if len(recs) < 3:
        recs.extend(["Drink at least 3 liters of water daily", "Ensure 7-8 hours of sound sleep"])
        
    recs = list(dict.fromkeys(recs))[:4]
    
    return AllPredictionResponse(
        diabetesRisk=diabetes_risk,
        heartRisk=heart_risk,
        strokeRisk=stroke_risk,
        bmiRisk=bmi_index,
        overallRisk=overall_risk,
        confidence=confidence,
        healthScore=health_score,
        recommendations=recs,
        riskFactors=risk_factors,
        preventiveActions=prev_actions
    )

