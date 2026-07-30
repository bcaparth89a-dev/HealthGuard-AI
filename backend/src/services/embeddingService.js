import { GoogleGenAI } from '@google/genai';
import config from '../config/index.js';
import logger from '../utils/logger.js';

// Clean up conflicting env variables if GEMINI_API_KEY is set in .env
if (process.env.GEMINI_API_KEY && process.env.GOOGLE_API_KEY && process.env.GEMINI_API_KEY !== process.env.GOOGLE_API_KEY) {
  delete process.env.GOOGLE_API_KEY;
}

// Lazy client instantiation helper to ensure process.env.GEMINI_API_KEY is read correctly at runtime
let aiClient = null;
const getAiClient = () => {
  if (aiClient) return aiClient;

  // Prioritize GEMINI_API_KEY, then fall back to config or GOOGLE_API_KEY
  const apiKey = process.env.GEMINI_API_KEY || config.geminiApiKey || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key is not configured (GEMINI_API_KEY/GOOGLE_API_KEY is missing).');
  }

  aiClient = new GoogleGenAI({ apiKey });
  return aiClient;
};

/**
 * Service to generate vector embeddings using Google GenAI SDK.
 */
export const embeddingService = {
  /**
   * Generates a 768-dimensional float embedding vector for a single text chunk.
   * @param {string} text The text to embed.
   * @returns {Promise<number[]>} The vector embedding array.
   */
  generateEmbedding: async (text) => {
    if (!text || typeof text !== 'string') {
      throw new Error('Text input must be a non-empty string.');
    }

    try {
      const ai = getAiClient();

      try {
        const response = await ai.models.embedContent({
          model: 'text-embedding-004',
          contents: text,
        });

        // Handle both response.embeddings[0].values and response.embedding.values shapes
        const embeddingValues = response.embeddings?.[0]?.values || response.embedding?.values;
        if (embeddingValues && Array.isArray(embeddingValues)) {
          return embeddingValues;
        }
      } catch (err) {
        logger.warn(`text-embedding-004 is not available (${err.message || err}). Falling back to gemini-embedding-001 with 768 dimensions.`);
      }

      // Fallback to gemini-embedding-001 with outputDimensionality: 768 (same dimension)
      const response = await ai.models.embedContent({
        model: 'gemini-embedding-001',
        contents: text,
        config: {
          outputDimensionality: 768,
        },
      });

      const embeddingValues = response.embeddings?.[0]?.values || response.embedding?.values;
      if (!embeddingValues || !Array.isArray(embeddingValues)) {
        throw new Error('Failed to retrieve embedding values from Gemini SDK response.');
      }

      return embeddingValues;
    } catch (error) {
      logger.error('Error generating embedding in embeddingService:', error.message || error);
      throw error;
    }
  },

  /**
   * Generates embeddings in a single batch request for efficiency.
   * @param {string[]} texts List of text strings to embed.
   * @returns {Promise<number[][]>} Array of float vector embeddings.
   */
  generateBatchEmbeddings: async (texts) => {
    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      throw new Error('Texts input must be a non-empty array of strings.');
    }

    try {
      const ai = getAiClient();

      try {
        const response = await ai.models.embedContent({
          model: 'text-embedding-004',
          contents: texts,
        });

        const embeddings = response.embeddings;
        if (embeddings && Array.isArray(embeddings) && embeddings.length > 0) {
          return embeddings.map(emb => emb.values);
        }
      } catch (err) {
        logger.warn(`text-embedding-004 batch embedding is not available (${err.message || err}). Falling back to gemini-embedding-001 with 768 dimensions.`);
      }

      // Fallback to gemini-embedding-001 with outputDimensionality: 768
      const response = await ai.models.embedContent({
        model: 'gemini-embedding-001',
        contents: texts,
        config: {
          outputDimensionality: 768,
        },
      });

      const embeddings = response.embeddings;
      if (!embeddings || !Array.isArray(embeddings) || embeddings.length === 0) {
        throw new Error('Failed to retrieve batch embedding values from Gemini SDK response.');
      }

      return embeddings.map(emb => emb.values);
    } catch (error) {
      logger.error('Error in generateBatchEmbeddings:', error.message || error);
      throw error;
    }
  }
};

export default embeddingService;

