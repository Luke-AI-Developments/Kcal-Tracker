/**
 * Manual test of the full retrieve() -> generateSwap() pipeline, including
 * a deliberately weak case (burger — Step 5 showed only 0.40 precision@5)
 * to see whether the grounding constraint holds up when retrieval hands
 * it bad context, not just when everything goes smoothly.
 */

const { retrieve } = require("./retrieve.js");
const { generateSwap } = require("./generate.js");

const testFoods = ["Big Mac", "chocolate bar", "burger"];

async function main() {
  for (const food of testFoods) {
    console.log(`\n=== "${food}" ===`);
    const results = await retrieve(food, 5);
    console.log("Retrieved context:");
    results.forEach((r) => console.log(`  - ${r.name} (${Math.round(r.calories)} kcal, P${r.protein_g}g)`));

    const answer = await generateSwap(food, results);
    console.log("\nGenerated answer:");
    console.log(answer);
  }
}

main();
