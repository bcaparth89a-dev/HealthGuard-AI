import path from 'path';
import { fileURLToPath } from 'url';
import ingestionService from '../services/ingestionService.js';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to baseline knowledge base file
const knowledgebasePath = path.join(__dirname, '../../knowledge/knowledgebase.txt');

async function runIngestion() {
  console.log("\n==========================================");
  console.log("HealthGuard AI - Vector Ingestion Pipeline");
  console.log("==========================================\n");

  try {
    const result = await ingestionService.ingestFile(knowledgebasePath, {
      chunkSize: 500,
      overlap: 100
    });
    
    console.log("\nIngestion completed successfully!");
    console.log("---------------------------------");
    console.log(`Inserted Chunks : ${result.inserted}`);
    console.log(`Skipped Chunks  : ${result.skipped}`);
    console.log("==========================================\n");
    process.exit(0);
  } catch (error) {
    logger.error("Ingestion process failed:", error.message || error);
    console.error("\n❌ Ingestion failed:", error.message);
    console.log("==========================================\n");
    process.exit(1);
  }
}

runIngestion();
