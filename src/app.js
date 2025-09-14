import * as fs from "fs";
import * as dotenv from "dotenv";
dotenv.config();

import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";
import { RetrievalQAChain } from "langchain/chains";

const DB_PATH = "./db/faiss_index";

// Step 1: Initialize embeddings
const embeddings = new OpenAIEmbeddings({
  apiKey: process.env.OPENAI_API_KEY,
});

// Step 2: Function to create and save vector store
async function createAndSaveVectorStore() {
  console.log("⏳ Creating FAISS index...");

  const texts = [
    "Node.js is a JavaScript runtime built on Chrome's V8 engine.",
    "LangChain is a framework for building applications powered by LLMs.",
    "FAISS is a library for efficient similarity search and clustering of dense vectors.",
  ];

  const metadatas = [{ id: 1 }, { id: 2 }, { id: 3 }];

  const vectorStore = await FaissStore.fromTexts(texts, metadatas, embeddings);

  // Save index to disk
  await vectorStore.save(DB_PATH);
  console.log("✅ FAISS index created and saved to disk!");

  return vectorStore;
}

// Step 3: Load or create vector store
async function loadOrCreateVectorStore() {
  if (fs.existsSync(DB_PATH)) {
    console.log("📂 Loading FAISS index from disk...");
    return await FaissStore.load(DB_PATH, embeddings);
  } else {
    return await createAndSaveVectorStore();
  }
}

// Step 4: RAG pipeline
async function runRAG(query) {
  const vectorStore = await loadOrCreateVectorStore();

  // Retriever
  const retriever = vectorStore.asRetriever();

  // LLM
  const model = new ChatOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    model: "gpt-4o-mini", // or "gpt-3.5-turbo"
  });

  // Chain
  const chain = RetrievalQAChain.fromLLM(model, retriever);

  // Query
  const response = await chain.call({ query });

  console.log("\n🔎 Query:", query);
  console.log("💡 Answer:", response.text);
}

// Run example query
await runRAG("What is LangChain?");
