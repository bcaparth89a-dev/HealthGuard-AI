import supabase from '../config/supabase.js';
import embeddingService from './embeddingService.js';
import logger from '../utils/logger.js';

export const retrievalService = {
  /**
   * Retrieves the top 5 most relevant context chunks from the knowledge base.
   * @param {Object} params Parameters for retrieval
   * @param {Object} params.assessment User assessment data (age, gender, BMI, habits, etc.)
   * @param {string|Array} params.symptoms Patient symptoms (string or array)
   * @param {Object} params.prediction ML prediction output (risk scores, categories, etc.)
   * @param {Object} [options] Optional configuration options
   * @param {number} [options.matchThreshold=0.0] Minimum similarity threshold (default 0.0 to retrieve best top 5)
   * @param {number} [options.matchCount=5] Number of chunks to retrieve (default 5)
   * @returns {Promise<Array<{content: string, similarity: number}>>} Array of retrieved chunks and their scores.
   */
  retrieveRelevantContext: async ({ assessment, symptoms, prediction }, options = {}) => {
    const matchThreshold = options.matchThreshold !== undefined ? options.matchThreshold : 0.0;
    const matchCount = options.matchCount || 5;

    // Validate inputs
    if (!assessment) {
      throw new Error('Assessment object is required for retrieval context.');
    }
    if (!prediction) {
      throw new Error('Prediction object is required for retrieval context.');
    }

    // 1. Combine patient information into a semantic query text
    const age = assessment.age || 'unknown age';
    const gender = assessment.gender || 'unknown gender';
    const bmi = assessment.bmi || 'unknown BMI';
    const bp = assessment.blood_pressure || assessment.bloodPressure || 'unknown BP';
    
    // Normalize symptoms
    let symptomsStr = 'None';
    if (symptoms) {
      symptomsStr = Array.isArray(symptoms) ? symptoms.join(', ') : symptoms;
    } else if (assessment.symptoms) {
      symptomsStr = Array.isArray(assessment.symptoms) ? assessment.symptoms.join(', ') : assessment.symptoms;
    }

    const cardioRisk = prediction.cardio_risk !== undefined ? prediction.cardio_risk : (prediction.cardioRisk || 0);
    const diabetesRisk = prediction.diabetes_risk !== undefined ? prediction.diabetes_risk : (prediction.diabetesRisk || 0);
    const strokeRisk = prediction.stroke_risk !== undefined ? prediction.stroke_risk : (prediction.strokeRisk || 0);
    const overallRisk = prediction.overall_risk || prediction.overallRisk || 'Unknown';

    const queryText = `Patient is a ${gender}, ${age} years old, BMI: ${bmi}, Blood Pressure: ${bp}. Symptoms: ${symptomsStr}. ML Risk scores: Cardiovascular: ${cardioRisk}%, Diabetes: ${diabetesRisk}%, Stroke: ${strokeRisk}%. Overall risk status: ${overallRisk}.`;

    logger.info(`[Retrieval Service] Generated query text for embedding: "${queryText}"`);

    try {
      // 2. Generate embedding vector for the combined query using the unified service
      logger.info('[Retrieval Service] Generating query embedding...');
      const queryEmbedding = await embeddingService.generateEmbedding(queryText);

      // 3. Call the Supabase match_documents() RPC function
      logger.info(`[Retrieval Service] Invoking match_documents RPC with threshold=${matchThreshold}, count=${matchCount}...`);
      const { data, error } = await supabase.rpc('match_documents', {
        query_embedding: queryEmbedding,
        match_threshold: matchThreshold,
        match_count: matchCount
      });

      if (error) {
        logger.error('[Retrieval Service] Supabase RPC match_documents failed:', error.message);
        throw new Error(`match_documents RPC error: ${error.message}`);
      }

      const results = (data || []).map(row => ({
        content: row.content,
        similarity: row.similarity
      }));

      // 4. Log retrieved chunks and similarity scores
      logger.info(`[Retrieval Service] Successfully retrieved ${results.length} chunks from knowledge_base.`);
      results.forEach((chunk, index) => {
        logger.info(`[Retrieval Service] Chunk #${index + 1} (Similarity: ${chunk.similarity.toFixed(4)}):`);
        logger.info(`  Content: "${chunk.content.substring(0, 150)}..."`);
      });

      return results;
    } catch (err) {
      logger.error('[Retrieval Service] Error retrieving relevant context:', err.message || err);
      throw err;
    }
  }
};

export default retrievalService;
