import { GoogleGenAI } from '@google/genai';
import supabase from '../config/supabase.js';
import logger from '../utils/logger.js';

// Clean up conflicting env variables if GEMINI_API_KEY is set in .env
if (process.env.GEMINI_API_KEY && process.env.GOOGLE_API_KEY && process.env.GEMINI_API_KEY !== process.env.GOOGLE_API_KEY) {
  delete process.env.GOOGLE_API_KEY;
}

// Create a single reusable Gemini client instance
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const ai = new GoogleGenAI({ apiKey });

// Helper validator and normalizer for Gemini response
const validateAndFormatReport = (json) => {
  const normalized = {
    summary: json.summary || json.Summary || '',
    health_status: json.health_status || json.healthStatus || json.HealthStatus || '',
    diet: Array.isArray(json.diet) ? json.diet : (Array.isArray(json.Diet) ? json.Diet : []),
    exercise: Array.isArray(json.exercise) ? json.exercise : (Array.isArray(json.Exercise) ? json.Exercise : []),
    precautions: Array.isArray(json.precautions) ? json.precautions : (Array.isArray(json.Precautions) ? json.Precautions : []),
    doctor_advice: json.doctor_advice || json.doctorAdvice || json.DoctorAdvice || json.doctor_consultation_advice || '',
    emergency: Array.isArray(json.emergency) ? json.emergency : (Array.isArray(json.Emergency) ? json.Emergency : [])
  };

  // Check required fields
  if (!normalized.summary || !normalized.health_status || !normalized.doctor_advice) {
    throw new Error('Missing required textual fields in Gemini response.');
  }
  if (normalized.diet.length === 0 || normalized.exercise.length === 0 || normalized.precautions.length === 0 || normalized.emergency.length === 0) {
    throw new Error('Missing required list fields in Gemini response.');
  }

  return normalized;
};

export const generateAiReport = async (req, res, next) => {
  const { assessment_id, prediction_id, context } = req.body;
  const userId = req.user.id;

  if (!assessment_id || !prediction_id) {
    return res.status(400).json({ error: 'assessment_id and prediction_id are required' });
  }

  try {
    // 1. Fetch the assessment details
    const { data: assessment, error: assessmentError } = await supabase
      .from('health_records')
      .select('*')
      .eq('id', assessment_id)
      .eq('user_id', userId)
      .single();

    if (assessmentError || !assessment) {
      logger.error('Failed to retrieve assessment:', assessmentError);
      return res.status(404).json({ error: 'Assessment record not found' });
    }

    // 2. Fetch the prediction details
    const { data: prediction, error: predictionError } = await supabase
      .from('risk_predictions')
      .select('*')
      .eq('id', prediction_id)
      .eq('user_id', userId)
      .single();

    if (predictionError || !prediction) {
      logger.error('Failed to retrieve prediction:', predictionError);
      return res.status(404).json({ error: 'Prediction record not found' });
    }

    // 3. Formulate prompt for Gemini
    const formulatePrompt = (assessment, prediction, context) => {
      let prompt = `You are an expert physician analyzing a patient's health assessment and AI risk prediction metrics. 
Analyze the results and provide explanations, recommendations, and warning signs in a structured JSON format.

Patient Assessment:
- Age: ${assessment.age}
- Gender: ${assessment.gender}
- Dimensions: Height ${assessment.height} cm, Weight ${assessment.weight} kg, BMI ${assessment.bmi}
- Blood Pressure: ${assessment.blood_pressure || '120/80'}
- Blood Sugar: ${assessment.blood_sugar || 'Normal'}
- Cholesterol: ${assessment.cholesterol || 'Normal'}
- Heart Rate: ${assessment.heart_rate || 'Normal'}
- Habits: Smoking: ${assessment.smoking}, Alcohol: ${assessment.alcohol}, Exercise: ${assessment.exercise}, Sleep: ${assessment.sleep} hours
- Symptoms: ${assessment.symptoms || 'None'}
- Current Medications: ${assessment.medications || 'None'}
- Allergies: ${assessment.allergies || 'None'}
- Family History: ${assessment.family_history || 'None'}
- Known Diseases: ${assessment.known_diseases || 'None'}`;

      // Append optional vitals if present
      const vitalsKeys = {
        temperature: 'Body Temperature (°F)',
        spo2: 'Oxygen Saturation (SpO2 %)',
        respiratory_rate: 'Respiratory Rate (rpm)',
        waist_circumference: 'Waist Circumference (cm)',
        hip_circumference: 'Hip Circumference (cm)'
      };
      let hasVitals = false;
      for (const [k, label] of Object.entries(vitalsKeys)) {
        if (assessment[k] !== null && assessment[k] !== undefined) {
          if (!hasVitals) {
            prompt += `\n\nOptional Advanced Vitals:`;
            hasVitals = true;
          }
          prompt += `\n- ${label}: ${assessment[k]}`;
        }
      }

      // Append optional lab metrics if present
      const labKeys = {
        hba1c: 'HbA1c (%)',
        ldl: 'LDL Cholesterol (mg/dL)',
        hdl: 'HDL Cholesterol (mg/dL)',
        triglycerides: 'Triglycerides (mg/dL)',
        creatinine: 'Serum Creatinine (mg/dL)',
        egfr: 'eGFR (mL/min)',
        ast: 'Liver AST (U/L)',
        alt: 'Liver ALT (U/L)',
        uric_acid: 'Uric Acid (mg/dL)',
        hemoglobin: 'Hemoglobin (g/dL)',
        vitamin_d: 'Vitamin D3 (ng/mL)',
        vitamin_b12: 'Vitamin B12 (pg/mL)'
      };
      let hasLabs = false;
      for (const [k, label] of Object.entries(labKeys)) {
        if (assessment[k] !== null && assessment[k] !== undefined) {
          if (!hasLabs) {
            prompt += `\n\nOptional Laboratory Metrics:`;
            hasLabs = true;
          }
          prompt += `\n- ${label}: ${assessment[k]}`;
        }
      }

      prompt += `\n\nAI Risk Prediction (FastAPI Scikit-Learn Model Output):
- Cardiovascular Risk Score: ${prediction.cardio_risk}%
- Diabetes Risk Score: ${prediction.diabetes_risk}%
- Stroke Risk Score: ${prediction.stroke_risk}%
- Overall Health Index Score (out of 100): ${prediction.health_score}
- Overall Risk Category: ${prediction.overall_risk} (Risk Level: ${prediction.risk_level})
- Automated Model Recommendations: ${JSON.stringify(prediction.recommendations)}`;

      if (context) {
        prompt += `\n\nAdditional Medical Context (Retrieved Knowledge): \n${context}`;
      }

      prompt += `\n\nGuidelines:
1. If advanced laboratory values or vitals are missing, do not fabricate recommendations for them. Instead, explain in the summary/advice that additional laboratory investigations may improve the assessment.
2. Provide the analysis ONLY in the following JSON schema format:
{
  "summary": "Clear, concise paragraph explaining the patient's general health situation based on the risk scores and habits.",
  "health_status": "Brief classification or description of their current health status (e.g. Good, Needs Attention, High Risk).",
  "diet": ["Provide a list of 3-5 specific food/diet recommendations tailored to their risk metrics and profile."],
  "exercise": ["Provide a list of 3-5 specific physical activity/exercise guidelines based on their height, weight, and risk metrics."],
  "precautions": ["Provide a list of 3-5 daily precautions and lifestyle modifications they should undertake."],
  "doctor_advice": "A summary of medical next steps, when to consult a doctor, and what specialists to see if relevant.",
  "emergency": ["Provide a list of 3-5 specific warning signs, red flag symptoms, or emergency triggers to watch out for."]
}

Do not include any markdown wrappers (like \`\`\`json) in the response outside the raw JSON string. Make sure all values are properly escaped.`;
      return prompt;
    };

    const prompt = formulatePrompt(assessment, prediction, context);

    const callGemini = async () => {
      let response;
      try {
        logger.info('[AI Controller] Calling gemini-2.5-flash...');
        response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json'
          }
        });
      } catch (err) {
        logger.warn(`[AI Controller] gemini-2.5-flash failed (${err.message || err}). Falling back to gemini-2.5-flash-lite.`);
        response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-lite',
          contents: prompt,
          config: {
            responseMimeType: 'application/json'
          }
        });
      }

      const responseText = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!responseText) {
        throw new Error('Empty response received from Gemini API.');
      }

      const parsedJson = JSON.parse(responseText.trim());
      return validateAndFormatReport(parsedJson);
    };

    let validatedReport = null;
    try {
      logger.info('Calling Gemini API for clinical analysis...');
      validatedReport = await callGemini();
    } catch (firstErr) {
      logger.warn('First Gemini attempt failed. Error: ' + firstErr.message);
      try {
        logger.info('Retrying Gemini API call once...');
        validatedReport = await callGemini();
      } catch (retryErr) {
        logger.error('Second Gemini attempt failed. Error: ' + retryErr.message);
        return res.status(502).json({ error: 'AI analysis service failed after retry. Please try again.' });
      }
    }

    // 4. Save to Supabase ai_reports table
    const memberId = assessment.member_id || null;
    const { data: insertedReports, error: insertError } = await supabase
      .from('ai_reports')
      .insert([
        {
          user_id: userId,
          member_id: memberId,
          assessment_id: assessment_id,
          prediction_id: prediction_id,
          summary: validatedReport.summary,
          health_status: validatedReport.health_status,
          diet: validatedReport.diet,
          exercise: validatedReport.exercise,
          precautions: validatedReport.precautions,
          doctor_advice: validatedReport.doctor_advice,
          emergency: validatedReport.emergency
        }
      ])
      .select();

    if (insertError) {
      logger.error('Failed to store AI report in database:', insertError);
      return res.status(500).json({ error: 'Failed to save the generated AI report to database' });
    }

    // 5. Compile and insert EMR record into health_reports table
    try {
      const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      const reportId = `HG-${todayStr}-${randomSuffix}`;

      let patientName = assessment.full_name || 'Anonymous Patient';
      if (memberId) {
        try {
          const { data: memberProfile } = await supabase
            .from('family_members')
            .select('full_name')
            .eq('member_id', memberId)
            .maybeSingle();
          if (memberProfile?.full_name) {
            patientName = memberProfile.full_name;
          }
        } catch (memberErr) {
          logger.warn('Failed to fetch family member profile for EMR patient name:', memberErr.message);
        }
      } else {
        try {
          const { data: userProfile } = await supabase
            .from('users')
            .select('full_name')
            .eq('id', userId)
            .maybeSingle();
          if (userProfile?.full_name) {
            patientName = userProfile.full_name;
          }
        } catch (profileErr) {
          logger.warn('Failed to fetch userProfile for EMR patient name:', profileErr.message);
        }
      }

      const diseaseRisks = {
        cardioRisk: prediction.cardio_risk,
        diabetesRisk: prediction.diabetes_risk,
        strokeRisk: prediction.stroke_risk,
        kidneyRisk: Math.max(10, Math.min(95, Math.round((prediction.diabetes_risk + prediction.stroke_risk) / 2 - 5))),
        liverRisk: Math.max(12, Math.min(92, Math.round((prediction.diabetes_risk * 0.8) + ((assessment.alcohol === 'Yes' || assessment.alcohol === true) ? 25 : 0)))),
        hypertensionRisk: Math.max(15, Math.min(98, Math.round((prediction.cardio_risk + prediction.stroke_risk) / 2 + 10))),
        obesityRisk: Math.max(10, Math.min(99, Math.round(assessment.bmi > 25 ? (assessment.bmi - 20) * 8 : 15)))
      };

      const personalInfo = {
        age: assessment.age,
        gender: assessment.gender,
        height: assessment.height,
        weight: assessment.weight,
        bmi: assessment.bmi,
        blood_group: assessment.blood_group,
        occupation: assessment.occupation,
        city: assessment.city,
        state: assessment.state,
        blood_pressure: assessment.blood_pressure,
        blood_sugar: assessment.blood_sugar,
        heart_rate: assessment.heart_rate,
        cholesterol: assessment.cholesterol
      };

      const lifestyleInfo = {
        smoking: assessment.smoking,
        alcohol: assessment.alcohol,
        exercise: assessment.exercise || assessment.exercise_frequency,
        sleep: assessment.sleep_hours || assessment.sleep,
        water_intake: assessment.water_intake,
        food_preference: assessment.food_preference,
        diet: assessment.diet,
        fast_food: assessment.fast_food,
        sugary_drinks: assessment.sugary_drinks,
        stress: assessment.stress,
        screen_time: assessment.screen_time,
        fruit_intake: assessment.fruit_intake,
        vegetable_intake: assessment.vegetable_intake,
        physical_activity: assessment.physical_activity
      };

      const medicalHistory = {
        known_diseases: assessment.known_diseases,
        current_medicines: assessment.current_medicines || assessment.medications,
        allergies: assessment.allergies,
        family_history: assessment.family_history
      };

      const predictionResults = {
        health_score: prediction.health_score,
        overall_risk: prediction.overall_risk,
        risk_level: prediction.risk_level,
        cardio_risk: prediction.cardio_risk,
        diabetes_risk: prediction.diabetes_risk,
        stroke_risk: prediction.stroke_risk,
        recommendations: prediction.recommendations
      };

      const healthReportsPayload = {
        id: reportId,
        report_id: reportId,
        user_id: userId,
        member_id: memberId,
        assessment_id: assessment_id,
        prediction_id: prediction_id,
        patient_name: patientName,
        assessment_date: new Date().toISOString().split('T')[0],
        assessment_time: new Date().toTimeString().split(' ')[0],
        personal_info: personalInfo,
        personal_information: personalInfo,
        lifestyle_info: lifestyleInfo,
        lifestyle: lifestyleInfo,
        medical_history: medicalHistory,
        symptoms: assessment.symptoms,
        prediction_results: predictionResults,
        prediction: predictionResults,
        gemini_summary: validatedReport.summary,
        gemini_recommendations: {
          diet: validatedReport.diet,
          exercise: validatedReport.exercise,
          precautions: validatedReport.precautions,
          emergency: validatedReport.emergency,
          doctor_advice: validatedReport.doctor_advice
        },
        health_score: prediction.health_score,
        health_index: prediction.health_score,
        overall_health_score: prediction.health_score,
        overall_risk: prediction.overall_risk,
        disease_risks: diseaseRisks,
        pdf_path: null
      };

      logger.info('Inserting EMR report into health_reports:', reportId);
      const { error: reportsError } = await supabase
        .from('health_reports')
        .insert([healthReportsPayload]);

      if (reportsError) {
        logger.warn('Initial insert to health_reports table failed: ' + reportsError.message);
        
        // Self-healing fallback: If it's a missing column error (e.g. columns do not exist in DB yet),
        // remove the assessment_id and prediction_id columns and retry.
        if (reportsError.message?.includes('assessment_id') || reportsError.code === 'PGRST204' || reportsError.code === '42703') {
          logger.info('Retrying insert to health_reports without assessment_id and prediction_id (backward-compatibility fallback)...');
          
          const fallbackPayload = { ...healthReportsPayload };
          delete fallbackPayload.assessment_id;
          delete fallbackPayload.prediction_id;
          
          const { error: fallbackError } = await supabase
            .from('health_reports')
            .insert([fallbackPayload]);
            
          if (fallbackError) {
            logger.error('Fallback insert to health_reports table also failed: ' + fallbackError.message);
          } else {
            logger.info('✅ Fallback insert to health_reports succeeded!');
          }
        } else {
          logger.error('Failed to save to health_reports table: ' + reportsError.message);
        }
      } else {
        logger.info('✅ Insert to health_reports succeeded!');
      }
    } catch (emrErr) {
      logger.error('Exception writing EMR health_report row: ' + emrErr.message);
    }

    return res.status(201).json(insertedReports[0]);
  } catch (err) {
    logger.error('Unexpected error in generateAiReport:', err);
    next(err);
  }
};
