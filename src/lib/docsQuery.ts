import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { Document } from "@langchain/core/documents";
import { OpenAIEmbeddings } from "@langchain/openai";

const vectorStoreCache: Record<string, MemoryVectorStore> = {};

// Enhanced text processing for all subjects
function enhanceText(text: string): string {
  // Add spaces around English words mixed with Thai
  text = text.replace(/([ก-๙])([A-Za-z])/g, '$1 $2');
  text = text.replace(/([A-Za-z])([ก-๙])/g, '$1 $2');
  
  // Add spaces around numbers mixed with Thai/English
  text = text.replace(/([ก-๙A-Za-z])(\d)/g, '$1 $2');
  text = text.replace(/(\d)([ก-๙A-Za-z])/g, '$1 $2');
  
  // Normalize whitespace and punctuation
  text = text.replace(/\s+/g, ' ').trim();
  
  // Handle common CSV delimiters and make them searchable
  text = text.replace(/,/g, ' ');
  text = text.replace(/;/g, ' ');
  text = text.replace(/\|/g, ' ');
  
  return text;
}

// Standard docsQuery with similarity search only
export async function docsQuery(csvPath: string) {
  const cacheKey = csvPath;
  if (vectorStoreCache[cacheKey]) {
    return vectorStoreCache[cacheKey];
  }

  // Load CSV and parse into structured data
  const loader = new CSVLoader(csvPath);
  const docs = await loader.load();

  // Enhanced document processing with better text handling for all subjects
  const taggedDocs = docs.map((doc) => {
    // Extract all text from the CSV row, combining all columns
    let combinedContent = doc.pageContent;
    
    // Add metadata fields to searchable content if they exist
    if (doc.metadata) {
      Object.values(doc.metadata).forEach((value: any) => {
        if (typeof value === 'string' && value.trim()) {
          combinedContent += ' ' + value;
        }
      });
    }
    
    return new Document({
      pageContent: enhanceText(combinedContent),
      metadata: { source: csvPath, ...doc.metadata },
    });
  });

  console.log(`📄 Loaded ${taggedDocs.length} documents from ${csvPath}`);
  
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
    separators: ['\n\n', '\n', ' ', ''],
  });
  const splitDocs = await splitter.splitDocuments(taggedDocs);

  const embeddings = new OpenAIEmbeddings();
  const vectorstore = await MemoryVectorStore.fromDocuments(splitDocs, embeddings);

  console.log(`🔍 Vector store created with ${splitDocs.length} document chunks`);
  
  vectorStoreCache[cacheKey] = vectorstore;
  return vectorstore;
}