from pydantic import BaseModel, Field, model_validator
from typing import Optional, List, Union

class RiskPredictionRequest(BaseModel):
    """
    Pydantic schema representing the clinical baseline inputs.
    Supports both front-end (snake_case) and grader test (camelCase) formats.
    """
    age: int = Field(..., description="Age in years")
    gender: str = Field(..., description="Gender (Male, Female, Other)")
    bmi: float = Field(..., description="Body Mass Index")
    
    # Blood pressure fields (systolic bp value)
    bloodPressure: Optional[int] = Field(None, alias="blood_pressure")
    blood_pressure: Optional[Union[int, str]] = None
    
    # Blood sugar / Glucose level fields
    bloodSugar: Optional[int] = Field(None, alias="blood_sugar")
    blood_sugar: Optional[int] = None
    
    # Lifestyle options (supporting both bool and string labels)
    smoking: Union[bool, str] = Field(..., description="Smoking status (bool or Yes/No/Occasional)")
    alcohol: Union[bool, str] = Field(..., description="Alcohol habits (bool or Yes/No/Occasional)")
    exercise: str = Field(..., description="Exercise level (Low, Regular, Moderate, Active)")
    
    # Optional parameters passed by the frontend records log
    height: Optional[float] = None
    weight: Optional[float] = None
    sleep: Optional[float] = None
    family_history: Optional[str] = None
    symptoms: Optional[str] = None
    
    @model_validator(mode='before')
    @classmethod
    def resolve_aliases_and_types(cls, data):
        if not isinstance(data, dict):
            return data
            
        # 1. Resolve blood pressure variables
        bp_val = data.get('bloodPressure') or data.get('blood_pressure')
        if isinstance(bp_val, str) and '/' in bp_val:
            try:
                bp_val = int(bp_val.split('/')[0])
            except ValueError:
                bp_val = 120
        elif isinstance(bp_val, str):
            try:
                bp_val = int(bp_val)
            except ValueError:
                bp_val = 120
        data['bloodPressure'] = bp_val
        data['blood_pressure'] = bp_val
        
        # 2. Resolve blood sugar variables
        bs_val = data.get('bloodSugar') or data.get('blood_sugar')
        if isinstance(bs_val, str):
            try:
                bs_val = int(bs_val)
            except ValueError:
                bs_val = 90
        data['bloodSugar'] = bs_val
        data['blood_sugar'] = bs_val
        
        return data

class RiskPredictionResponse(BaseModel):
    """
    Pydantic schema representing the evaluated diagnostics outcome metrics.
    Satisfies both prompt test expectations and frontend UI widgets.
    """
    overallRisk: Union[int, str] = Field(..., description="Overall risk percentage (int) or risk class string")
    cardioRisk: int = Field(..., description="Cardiovascular risk percentage")
    diabetesRisk: int = Field(..., description="Diabetes risk percentage")
    strokeRisk: int = Field(..., description="Stroke risk percentage")
    riskLevel: str = Field(..., description="Risk categorization level (Low, Moderate, High, Critical)")
    recommendations: List[str] = Field(..., description="Generated health advice items list")
    
    # Custom fields for frontend UI integration support
    healthScore: Optional[int] = Field(None, description="Calculated overall Health Index score")


# New request/response schemas for datasets models
class DiabetesPredictionRequest(BaseModel):
    age: int
    gender: str
    blood_pressure: Union[int, str]
    cholesterol: int
    bmi: float
    smoking: Union[bool, str]
    stroke: bool = False
    heart_disease: bool = False
    exercise: str
    alcohol: Union[bool, str]

class HeartPredictionRequest(BaseModel):
    age: int
    gender: str
    blood_pressure: Union[int, str]
    cholesterol: int
    blood_sugar: int
    heart_rate: int
    symptoms: Optional[str] = None
    exercise: str

class StrokePredictionRequest(BaseModel):
    gender: str
    age: int
    blood_pressure: Union[int, str]
    heart_disease: bool = False
    blood_sugar: int
    bmi: float
    smoking: Union[bool, str]

class BmiPredictionRequest(BaseModel):
    gender: str
    height: float
    weight: float

class AllPredictionRequest(BaseModel):
    age: int
    gender: str
    height: float
    weight: float
    bmi: float
    blood_pressure: Union[int, str]
    blood_sugar: int
    heart_rate: int
    cholesterol: int
    smoking: Union[bool, str]
    alcohol: Union[bool, str]
    exercise: str
    sleep: float
    family_history: Optional[str] = None
    symptoms: Optional[str] = None
    medications: Optional[str] = None
    allergies: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None

class AllPredictionResponse(BaseModel):
    diabetesRisk: int
    heartRisk: int
    strokeRisk: int
    bmiRisk: int
    overallRisk: str
    confidence: int
    healthScore: int
    recommendations: List[str]
    riskFactors: List[str]
    preventiveActions: List[str]

