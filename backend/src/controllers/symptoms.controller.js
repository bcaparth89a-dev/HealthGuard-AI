import supabase from '../config/supabase.js';
import logger from '../utils/logger.js';
import axios from 'axios';

export const checkSymptoms = async (req, res, next) => {
  const { symptoms, severity, duration } = req.body;
  const userId = req.user.id;

  if (!symptoms) {
    return res.status(400).json({ error: 'Symptoms description is required.' });
  }

  try {
    // 1. Fetch patient history for context awareness
    const { data: latestAssessment } = await supabase
      .from('health_records')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: latestPrediction } = await supabase
      .from('risk_predictions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: latestReport } = await supabase
      .from('ai_reports')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // 2. Build history context for LLM prompt
    let contextStr = "Patient has no recorded medical history.";
    if (latestAssessment) {
      contextStr = `Patient Profile:
- Age: ${latestAssessment.age}
- Gender: ${latestAssessment.gender}
- Height: ${latestAssessment.height} cm, Weight: ${latestAssessment.weight} kg, BMI: ${latestAssessment.bmi}
- Blood Pressure: ${latestAssessment.blood_pressure || 'Normal'}
- Blood Sugar: ${latestAssessment.blood_sugar || 'Normal'}
- Cholesterol: ${latestAssessment.cholesterol || 'Normal'}
- Smoking: ${latestAssessment.smoking}, Alcohol: ${latestAssessment.alcohol}, Exercise: ${latestAssessment.exercise || 'Moderate'}
- Existing Vitals Symptoms: ${latestAssessment.symptoms || 'None'}`;
    }

    if (latestPrediction) {
      contextStr += `\n\nML Risk Predictor scores:
- Diabetes Risk Score: ${latestPrediction.diabetes_risk}%
- Cardiovascular Risk Score: ${latestPrediction.cardio_risk}%
- Stroke Risk Score: ${latestPrediction.stroke_risk}%
- Health Index: ${latestPrediction.health_score}/100`;
    }

    if (latestReport) {
      contextStr += `\n\nLatest AI Clinical Report:
- General Summary: ${latestReport.summary}
- Clinical Status: ${latestReport.health_status}
- Prior Doctor Advice: ${latestReport.doctor_advice}`;
    }

    // 3. Formulate the triage prompt
    const prompt = `You are a clinical chatbot and virtual physician assistant. Analyze the user's new symptom report in the context of their saved medical history.

Medical History Context:
${contextStr}

New Symptom Query:
- Symptoms: ${symptoms}
- Severity Level: ${severity}/10
- Duration: ${duration} day(s)

Provide a medical triage evaluation. Respond ONLY in the following JSON format:
{
  "triagePriority": "One of: 'Immediate Action' (for critical, urgent, life-threatening symptoms), 'Clinical Visit' (for persistent issues requiring standard consultations), or 'Routine Checkup' (for minor, self-resolvable conditions)",
  "summary": "A detailed, compassionate paragraph answering the user's query, explaining how this relates to their medical history, and providing clinical analysis.",
  "confidence": 85,
  "domain": "Medical specialty classification (e.g. Cardiology, Neurology, Pulmonology, Gastroenterology, General Medicine)",
  "recommendations": ["Provide 2-4 concrete, actionable health recommendations or precautions."]
}

Do not include any markdown wrappers like \`\`\`json. Ensure the response is valid JSON.`;

    // 4. Query Gemini API
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Gemini API key is not configured.');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    let response;
    try {
      response = await axios.post(url, {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' }
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 25000
      });
    } catch (apiErr) {
      logger.error('Gemini API call failed in symptoms controller');
      const safeError = new Error('Triage symptom analysis failed due to an external model service issue.');
      safeError.status = 502;
      throw safeError;
    }

    const responseText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!responseText) {
      throw new Error('Received empty response from Gemini.');
    }

    const parsedJson = JSON.parse(responseText.trim());
    
    // Normalize and validate parsed JSON
    const normalized = {
      triagePriority: parsedJson.triagePriority || 'Routine Checkup',
      summary: parsedJson.summary || 'A clinical review is recommended.',
      confidence: intOrVal(parsedJson.confidence, 85),
      domain: parsedJson.domain || 'General Medicine',
      recommendations: Array.isArray(parsedJson.recommendations) ? parsedJson.recommendations : ['Ensure adequate hydration', 'Rest and monitor symptoms']
    };

    logger.info('Triage check successful: ' + JSON.stringify(normalized));
    return res.json(normalized);

  } catch (error) {
    logger.error('Error in checkSymptoms handler:', error);
    next(error);
  }
};

const intOrVal = (val, def) => {
  const parsed = parseInt(val, 10);
  return isNaN(parsed) ? def : parsed;
};
