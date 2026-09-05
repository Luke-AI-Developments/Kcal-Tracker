/**
 * Step 2 — Generate embeddings for the cleaned food log.
 *
 * Reads recipes-personal-log-cleaned.json, calls Google's embedding API once
 * per entry, and writes out a new file with the vector attached to each one.
 *
 * SETUP:
 * 1. Get a Gemini API key from Google AI Studio (same account as your other Gemini use).
 * 2. Set it as an environment variable: GEMINI_API_KEY
 * 3. Run with: node generate-embeddings.js
 *
 * Uses task_type: "RETRIEVAL_DOCUMENT" — this tells the model these are things
 * to be *found*, not things doing the searching. When you write the retrieve()
 * function in Step 3, embed the user's query with task_type: "RETRIEVAL_QUERY"
 * instead — using the matching tag on each side is what actually improves
 * retrieval quality, not just a formality.
 */

const fs = require("fs");

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-embedding-001";
const OUTPUT_DIMENSIONALITY = 768; // smaller = faster/cheaper cosine similarity later; plenty for this scale
const INPUT_FILE = "./recipes-personal-log-cleaned.json";
const OUTPUT_FILE = "./recipes-embedded.json";
const DELAY_MS = 200; // small pause between calls to stay well within free-tier rate limits

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function embedText(text) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:embedContent?key=${API_KEY}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: { parts: [{ text }] },
      taskType: "RETRIEVAL_DOCUMENT",
      outputDimensionality: OUTPUT_DIMENSIONALITY,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Embedding request failed (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return data.embedding.values;
}

async function main() {
  if (!API_KEY) {
    console.error("Set GEMINI_API_KEY before running this script.");
    process.exit(1);
  }

  const foods = JSON.parse(fs.readFileSync(INPUT_FILE, "utf8"));

  // Resumability: if this file already exists (e.g. from a partial previous run),
  // skip anything already embedded rather than starting over and re-spending quota.
  let existing = [];
  if (fs.existsSync(OUTPUT_FILE)) {
    existing = JSON.parse(fs.readFileSync(OUTPUT_FILE, "utf8"));
    console.log(`Found ${existing.length} already-embedded entries, resuming...`);
  }
  const alreadyDone = new Set(existing.map((e) => e.id));

  const results = [...existing];

  for (const food of foods) {
    if (alreadyDone.has(food.id)) continue;

    try {
      const vector = await embedText(food.name);
      results.push({ ...food, embedding: vector });
      console.log(`✓ ${food.id} — ${food.name}`);
    } catch (err) {
      console.error(`✗ ${food.id} — ${food.name}: ${err.message}`);
      // Save progress so far before stopping, so a failure doesn't lose earlier work
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));
      console.error("Progress saved. Fix the issue and re-run to resume.");
      process.exit(1);
    }

    await sleep(DELAY_MS);
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));
  console.log(`\nDone. Embedded ${results.length} entries into ${OUTPUT_FILE}`);

  // Sanity check, per the build plan — confirm the vector actually looks right
  console.log(`\nSanity check — first entry's vector length: ${results[0].embedding.length}`);
}

main();
