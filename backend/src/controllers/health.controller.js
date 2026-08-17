import supabase from '../config/supabase.js';
import logger from '../utils/logger.js';
import axios from 'axios';
import { retrievalService } from '../services/retrievalService.js';

export const predictRisk = async (req, res, next) => {
  const { assessmentId } = req.body;
  const userId = req.user.id;

  logger.info(`\n======== Predict Request ========`);
  logger.info(`Received assessmentId: ${assessmentId} for userId: ${userId}`);

  if (!assessmentId) {
    logger.error('Error: assessmentId is missing in request body');
    return res.status(400).json({ error: 'assessmentId is required' });
  }

  try {
    // 1. Check if prediction already exists for this assessment
    logger.info('Checking if prediction already exists...');
    const { data: existing, error: selectError } = await supabase
      .from('risk_predictions')
      .select('*')
      .eq('assessment_id', assessmentId)
      .eq('user_id', userId)
      .maybeSingle();

    if (selectError) {
      logger.error('Database error checking existing prediction:', selectError);
    }

    if (existing) {
      logger.info(`Prediction already exists for assessment ${assessmentId}`);
      
      // Fetch assessment to retrieve context
      const { data: assessment, error: fetchError } = await supabase
        .from('health_records')
        .select('*')
        .eq('id', assessmentId)
        .eq('user_id', userId)
        .single();
        
      let retrievedContext = [];
      if (!fetchError && assessment) {
        try {
          retrievedContext = await retrievalService.retrieveRelevantContext({
            assessment,
            prediction: {
              cardioRisk: existing.cardio_risk,
              diabetesRisk: existing.diabetes_risk,
              strokeRisk: existing.stroke_risk,
              overallRisk: existing.overall_risk
            }
          });

          // Print to console as required
          const symptomsStr = Array.isArray(assessment.symptoms) ? assessment.symptoms.join(', ') : (assessment.symptoms || 'None');
          const queryText = `Patient is a ${assessment.gender}, ${assessment.age} years old, BMI: ${assessment.bmi}, Blood Pressure: ${assessment.blood_pressure || 'unknown BP'}. Symptoms: ${symptomsStr}. ML Risk scores: Cardiovascular: ${existing.cardio_risk}%, Diabetes: ${existing.diabetes_risk}%, Stroke: ${existing.stroke_risk}%. Overall risk status: ${existing.overall_risk}.`;

          console.log("\n================ RETRIEVAL DEBUG (EXISTING) ================");
          console.log(`Generated search query: "${queryText}"`);
          console.log(`Number of retrieved chunks: ${retrievedContext.length}`);
          retrievedContext.forEach((chunk, index) => {
            console.log(`\nChunk #${index + 1}:`);
            console.log(`- Similarity score: ${chunk.similarity.toFixed(4)}`);
            console.log(`- Retrieved chunk content:\n${chunk.content}`);
          });
          console.log("============================================================\n");
        } catch (retrievalErr) {
          logger.error('Failed to retrieve context chunks for existing prediction:', retrievalErr.message || retrievalErr);
        }
      }

      return res.json({
        id: existing.id,
        user_id: existing.user_id,
        assessment_id: existing.assessment_id,
        overallRisk: existing.overall_risk,
        cardioRisk: existing.cardio_risk,
        diabetesRisk: existing.diabetes_risk,
        strokeRisk: existing.stroke_risk,
        healthScore: existing.health_score,
        riskLevel: existing.risk_level,
        recommendations: existing.recommendations,
        created_at: existing.created_at,
        retrievedChunks: retrievedContext
      });
    }

    // 2. Fetch the health assessment record from Supabase

    const { data: assessment, error: fetchError } = await supabase
      .from('health_records')
      .select('*')
      .eq('id', assessmentId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !assessment) {
      logger.error(`Failed to retrieve assessment for ID ${assessmentId}:`, fetchError || 'Record not found');
      return res.status(404).json({ error: fetchError ? fetchError.message : 'Assessment record not found' });
    }

    logger.info('Assessment loaded successfully');

    // Helper to extract blood pressure systolic value
    const getBpSys = (bp) => {
      if (typeof bp === 'number') return bp;
      if (typeof bp === 'string') {
        if (bp.includes('/')) {
          return parseInt(bp.split('/')[0], 10) || 120;
        }
        return parseInt(bp, 10) || 120;
      }
      return 120;
    };

    // Helper to evaluate boolean values from form fields
    const toBoolVal = (val) => {
      if (typeof val === 'boolean') return val;
      if (!val) return false;
      const lower = String(val).toLowerCase().trim();
      return ['yes', 'true', 'occasional', '1', 'frequently'].includes(lower);
    };

    // 3. Map fully extracted variables to FastAPI AllPredictionRequest schema
    const fastApiPayload = {
      age: parseInt(assessment.age, 10),
      gender: assessment.gender,
      height: parseFloat(assessment.height),
      weight: parseFloat(assessment.weight),
      bmi: parseFloat(assessment.bmi),
      blood_pressure: getBpSys(assessment.blood_pressure),
      blood_sugar: parseInt(assessment.blood_sugar || 90, 10),
      heart_rate: parseInt(assessment.heart_rate || 72, 10),
      cholesterol: parseInt(assessment.cholesterol || 180, 10),
      smoking: toBoolVal(assessment.smoking),
      alcohol: toBoolVal(assessment.alcohol),
      exercise: assessment.exercise || 'Moderate',
      symptoms: assessment.symptoms || ''
    };

    logger.info('Calling FastAPI');
    logger.info(`FastAPI URL: ${config.mlApiUrl}/predict/all`);
    
    let mlResponse;
    try {
      mlResponse = await axios.post(`${config.mlApiUrl}/predict/all`, fastApiPayload, { timeout: 10000 });
    } catch (apiErr) {
      logger.error('ML API invocation failed:', apiErr.message || apiErr);
      const customErr = new Error('The machine learning prediction service is currently unavailable or timed out. Please try again later.');
      customErr.status = 503;
      throw customErr;
    }
    const prediction = mlResponse.data;

    // 4. Save model predictions results into risk_predictions
    logger.info('Saving prediction to Supabase...');
    const { data: inserted, error: insertError } = await supabase
      .from('risk_predictions')
      .insert([
        {
          user_id: userId,
          member_id: assessment.member_id || null,
          assessment_id: assessmentId,
          overall_risk: prediction.overallRisk,
          cardio_risk: prediction.heartRisk,
          diabetes_risk: prediction.diabetesRisk,
          stroke_risk: prediction.strokeRisk,
          health_score: prediction.healthScore,
          risk_level: prediction.overallRisk,
          recommendations: prediction.recommendations || []
        }
      ])
      .select();

    if (insertError) {
      logger.error('Failed to insert prediction inside risk_predictions:', insertError);
      throw insertError;
    }

    const savedPred = inserted[0];
    const camelCasedPrediction = {
      id: savedPred.id,
      user_id: savedPred.user_id,
      assessment_id: savedPred.assessment_id,
      overallRisk: savedPred.overall_risk,
      cardioRisk: savedPred.cardio_risk,
      diabetesRisk: savedPred.diabetes_risk,
      strokeRisk: savedPred.stroke_risk,
      healthScore: savedPred.health_score,
      riskLevel: savedPred.risk_level,
      recommendations: savedPred.recommendations,
      created_at: savedPred.created_at
    };

    logger.info(`Prediction saved: ${JSON.stringify(camelCasedPrediction)}`);

    // Call retrieval service for relevant context chunks
    logger.info('Calling retrievalService to fetch relevant context...');
    let retrievedContext = [];
    try {
      retrievedContext = await retrievalService.retrieveRelevantContext({
        assessment,
        prediction: camelCasedPrediction
      });

      // Console logging as required
      const symptomsStr = Array.isArray(assessment.symptoms) ? assessment.symptoms.join(', ') : (assessment.symptoms || 'None');
      const queryText = `Patient is a ${assessment.gender}, ${assessment.age} years old, BMI: ${assessment.bmi}, Blood Pressure: ${assessment.blood_pressure || 'unknown BP'}. Symptoms: ${symptomsStr}. ML Risk scores: Cardiovascular: ${camelCasedPrediction.cardioRisk}%, Diabetes: ${camelCasedPrediction.diabetesRisk}%, Stroke: ${camelCasedPrediction.strokeRisk}%. Overall risk status: ${camelCasedPrediction.overallRisk}.`;

      console.log("\n================ RETRIEVAL DEBUG (NEW) ================");
      console.log(`Generated search query: "${queryText}"`);
      console.log(`Number of retrieved chunks: ${retrievedContext.length}`);
      retrievedContext.forEach((chunk, index) => {
        console.log(`\nChunk #${index + 1}:`);
        console.log(`- Similarity score: ${chunk.similarity.toFixed(4)}`);
        console.log(`- Retrieved chunk content:\n${chunk.content}`);
      });
      console.log("=======================================================\n");
    } catch (retrievalErr) {
      logger.error('Failed to retrieve context chunks:', retrievalErr.message || retrievalErr);
    }

    logger.info('Returning response');
    return res.status(201).json({
      ...camelCasedPrediction,
      retrievedChunks: retrievedContext
    });
  } catch (error) {
    logger.error('Error in predictRisk API gateway:', error.message || error);
    next(error);
  }
};
