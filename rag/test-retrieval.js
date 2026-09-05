/**
 * Step 3 — manual retrieval test. Runs a handful of representative queries
 * through retrieve() and prints the actual results for manual inspection.
 * Not an automated pass/fail eval (that's Step 5) — this is a human sanity
 * check before we trust the pipeline enough to build generation on top of it.
 */

const { retrieve } = require("./retrieve.js");

const queries = [
  "high protein snack",
  "something with chicken",
  "low calorie breakfast",
  "sweet treat",
  "greek yogurt",
  "fast food burger",
  "protein shake",
  "eggs",
  "something salty and crunchy",
  "coffee drink",
];

async function main() {
  for (const query of queries) {
    console.log(`\n=== "${query}" ===`);
    const results = await retrieve(query, 5);
    results.forEach((r, i) => {
      console.log(
        `${i + 1}. [${r.score.toFixed(4)}] ${r.name} — ${r.calories} kcal, P${r.protein_g}g`
      );
    });
  }
}

main();
