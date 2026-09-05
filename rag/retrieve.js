/**
 * Step 3 — retrieve() : find the top-k most relevant logged foods for a
 * natural-language query, using vector similarity against the pre-computed
 * embeddings in recipes-embedded.json.
 *
 * Critically, the query is embedded with task_type "RETRIEVAL_QUERY", not
 * "RETRIEVAL_DOCUMENT" (which is what generate-embeddings.js used for the
 * stored corpus). These are asymmetric roles to the embedding model — a
 * short search query and a descriptive document aren't the same *kind* of
 * text, and the API computes a different vector for the same string
 * depending on which role you declare. Matching the tag to the role is
 * what keeps retrieval accurate; using the same tag on both sides quietly
 * degrades ranking without erroring. See rag/README.md (Step 2) for the
 * full reasoning.
 */

const fs = require("fs");
const path = require("path");
const { cosineSimilarity } = require("./similarity.js");

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-embedding-001";
const OUTPUT_DIMENSIONALITY = 768; // must match generate-embeddings.js exactly
const EMBEDDED_FILE = path.join(__dirname, "recipes-embedded.json");

let cachedCorpus = null;

function loadCorpus() {
  if (!cachedCorpus) {
    cachedCorpus = JSON.parse(fs.readFileSync(EMBEDDED_FILE, "utf8"));
  }
  return cachedCorpus;
}

async function embedQuery(text) {
  if (!API_KEY) {
    throw new Error("Set GEMINI_API_KEY before calling retrieve().");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:embedContent?key=${API_KEY}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: { parts: [{ text }] },
      taskType: "RETRIEVAL_QUERY",
      outputDimensionality: OUTPUT_DIMENSIONALITY,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Query embedding failed (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return data.embedding.values;
}

/**
 * Returns the top-k corpus entries most similar to `query`, sorted by
 * descending cosine similarity. Each result carries a `score` field;
 * the raw 768-value embedding is stripped out since callers only need it
 * for ranking, not for display or generation.
 */
async function retrieve(query, topK = 5) {
  const corpus = loadCorpus();
  const queryVector = await embedQuery(query);

  const scored = corpus.map((entry) => {
    const { embedding, ...rest } = entry;
    return { ...rest, score: cosineSimilarity(queryVector, embedding) };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, topK);
}

module.exports = { retrieve, embedQuery, loadCorpus };
