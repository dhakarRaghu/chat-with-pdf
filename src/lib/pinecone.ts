import { GoogleGenerativeAI } from '@google/generative-ai';
import { Pinecone, PineconeRecord } from "@pinecone-database/pinecone";
import dotenv from 'dotenv';
import md5 from 'md5';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

dotenv.config();

export const getPineconeClient = () => {
    return new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });
  };

const googleai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string).getGenerativeModel({
  model: "text-embedding-004",
});

// Main function to process text and upload embeddings to Pinecone
export async function processTextIntoPinecone(text: string, fileKey: string) {
  console.log("Splitting text into smaller chunks...");
  const documents = await splitTextIntoChunks(text);

  console.log("Generating embeddings...");
  const vectors = await generateEmbeddings(documents);

  console.log("Uploading embeddings to Pinecone...");
  await uploadToPinecone(vectors, fileKey);

  return documents[0]; // Return first processed doc
}

// Splits large text into smaller overlapping chunks
async function splitTextIntoChunks(text: string) {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 200, // Adjust chunk size based on Gemini limits
    chunkOverlap: 50, // Ensures context is preserved
  });

  const docs = await splitter.splitDocuments([
    {
      pageContent: text,
      metadata: {
        text: truncateStringByBytes(text, 36000),
      },
    },
  ]);

  return docs;
}

// Generates embeddings using Gemini
async function generateEmbeddings(docs: { pageContent: string; metadata: any }[]) {
  try {
    return await Promise.all(
      docs.map(async (doc) => ({
        id: md5(doc.pageContent),
        values: await generateEmbedding(doc.pageContent),
        metadata: doc.metadata,
      }))
    );
  } catch (error) {
    console.error("Error generating embeddings batch:", error);
    throw error;
  }
}

// Calls Google Gemini to generate embeddings
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const result = await googleai.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw error;
  }
}

// Uploads embeddings to Pinecone
async function uploadToPinecone(vectors: any[], fileKey: string) {
    const client = await getPineconeClient();
    const pineconeIndex = await client.index("chatpdf");
    const namespace = pineconeIndex.namespace(fileKey);
  
    console.log("Inserting vectors into Pinecone...");
  
    // Ensure metadata values are valid
    const sanitizedVectors = vectors.map(vector => ({
      id: vector.id,
      values: vector.values,
      metadata: sanitizeMetadata(vector.metadata),
    }));
  
    await namespace.upsert(sanitizedVectors);
  }
  
  // Helper function to sanitize metadata
  function sanitizeMetadata(metadata: Record<string, any>) {
    const sanitized: Record<string, string | number | boolean | string[]> = {};
    
    for (const key in metadata) {
      if (
        typeof metadata[key] === "string" ||
        typeof metadata[key] === "number" ||
        typeof metadata[key] === "boolean"
      ) {
        sanitized[key] = metadata[key]; // Keep valid values
      } else if (Array.isArray(metadata[key]) && metadata[key].every(v => typeof v === "string")) {
        sanitized[key] = metadata[key]; // Keep list of strings
      } else {
        sanitized[key] = JSON.stringify(metadata[key]); // Convert objects/arrays to strings
      }
    }
    
    return sanitized;
  }
  

// Ensures text does not exceed byte limit
export const truncateStringByBytes = (str: string, bytes: number) => {
  const enc = new TextEncoder();
  return new TextDecoder("utf-8").decode(enc.encode(str).slice(0, bytes));
};