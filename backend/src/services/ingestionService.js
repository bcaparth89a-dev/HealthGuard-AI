import fs from 'fs';
import path from 'path';
import supabase from '../config/supabase.js';
import embeddingService from './embeddingService.js';
import logger from '../utils/logger.js';

export const ingestionService = {
  /**
   * Splits a large block of text into chunks of specified size and overlap.
   * @param {string} text Raw text to split.
   * @param {number} chunkSize Maximum characters per chunk.
   * @param {number} overlap Characters to overlap between adjacent chunks.
   * @returns {string[]} An array of text chunks.
   */
  chunkText: (text, chunkSize = 500, overlap = 100) => {
    if (!text) return [];
    
    // Normalize newlines and excess whitespace
    const cleanText = text.replace(/\r\n/g, '\n').trim();
    const chunks = [];
    const stride = chunkSize - overlap;
    
    if (cleanText.length <= chunkSize) {
      return [cleanText];
    }

    let start = 0;
    while (start < cleanText.length) {
      const end = Math.min(start + chunkSize, cleanText.length);
      const chunk = cleanText.substring(start, end).trim();
      
      if (chunk.length > 0) {
        chunks.push(chunk);
      }
      
      if (end === cleanText.length) {
        break;
      }
      
      start += stride;
    }
    
    return chunks;
  },

  /**
   * Reads a text file, chunks it, generates embeddings, and saves it to Supabase.
   * @param {string} filePath Absolute or relative path to the knowledge base file.
   * @param {object} options Custom settings (chunkSize, overlap).
   */
  ingestFile: async (filePath, options = { chunkSize: 500, overlap: 100 }) => {
    logger.info(`Starting ingestion for file: ${filePath}`);
    
    // 1. Read file
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found at path: ${filePath}`);
    }
    const rawText = fs.readFileSync(filePath, 'utf8');
    
    // 2. Split into chunks
    const allChunks = ingestionService.chunkText(rawText, options.chunkSize, options.overlap);
    logger.info(`Successfully parsed file into ${allChunks.length} chunks.`);
    
    if (allChunks.length === 0) {
      logger.warn('No chunks found to ingest.');
      return { inserted: 0, skipped: 0 };
    }

    // 3. Remove in-memory duplicates from chunk list
    const uniqueInputChunks = [...new Set(allChunks)];
    const duplicateInputCount = allChunks.length - uniqueInputChunks.length;
    if (duplicateInputCount > 0) {
      logger.info(`Filtered out ${duplicateInputCount} duplicate chunks from in-memory processing list.`);
    }

    // 4. Fetch already stored chunks to prevent duplicate embedding calls & DB errors
    logger.info('Fetching existing chunks from Supabase to skip duplicates...');
    const { data: existingRecords, error: selectError } = await supabase
      .from('knowledge_base')
      .select('content');

    if (selectError) {
      // If table does not exist, log warning and let insert fail with a descriptive message
      logger.error('Error fetching existing chunks (verify table structure exists):', selectError.message);
      throw new Error(`Supabase select failed: ${selectError.message}`);
    }

    const existingContents = new Set(existingRecords?.map(r => r.content) || []);
    
    // Filter down to chunks that do not exist in the database
    const newChunks = uniqueInputChunks.filter(chunk => !existingContents.has(chunk));
    const skippedDbDuplicates = uniqueInputChunks.length - newChunks.length;
    
    logger.info(`Database duplicates: skipped ${skippedDbDuplicates} chunks. ${newChunks.length} new chunks to ingest.`);
    
    if (newChunks.length === 0) {
      logger.info('All parsed chunks already exist in the database. Ingestion completed.');
      return { inserted: 0, skipped: skippedDbDuplicates + duplicateInputCount };
    }

    // 5. Generate embeddings in batches of 50 to avoid Gemini API limits
    const batchSize = 50;
    const recordsToInsert = [];

    logger.info('Generating vector embeddings in batches...');
    for (let i = 0; i < newChunks.length; i += batchSize) {
      const batchChunks = newChunks.slice(i, i + batchSize);
      logger.info(`Processing embedding batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(newChunks.length / batchSize)}...`);
      
      const batchEmbeddings = await embeddingService.generateBatchEmbeddings(batchChunks);
      
      for (let j = 0; j < batchChunks.length; j++) {
        recordsToInsert.push({
          content: batchChunks[j],
          embedding: batchEmbeddings[j]
        });
      }
    }

    // 6. Bulk insert new records into public.knowledge_base
    logger.info(`Bulk inserting ${recordsToInsert.length} vector records into Supabase 'knowledge_base'...`);
    const { data: insertedRecords, error: insertError } = await supabase
      .from('knowledge_base')
      .insert(recordsToInsert)
      .select();

    if (insertError) {
      logger.error('Failed to insert vector records:', insertError.message);
      throw new Error(`Supabase insert failed: ${insertError.message}`);
    }

    const insertedCount = insertedRecords?.length || recordsToInsert.length;
    logger.info(`Successfully ingested ${insertedCount} chunks into public.knowledge_base.`);
    
    return {
      inserted: insertedCount,
      skipped: skippedDbDuplicates + duplicateInputCount
    };
  }
};

export default ingestionService;
