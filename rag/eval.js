/**
 * Step 5 — retrieval eval. Hand-labeled ground truth against the real
 * corpus (not synthetic data), scored with precision@5:
 *
 *   precision@5 = (correct entries in the top 5) / 5
 *
 * "Correct" here means precision, not recall — of what retrieve() actually
 * handed back, how much of it was right. Recall (did we miss a relevant
 * item elsewhere in the corpus) isn't scored here on purpose: an item that
 * never made the top-5 can't influence generation, so it can't hurt us the
 * way a wrong item *in* the top-5 can. See rag/README.md (Step 5).
 *
 * Note: for categories with fewer than 5 true positives in the whole
 * corpus, perfect retrieval still can't score 1.0 — that ceiling is
 * reported per-query rather than left to silently look like a failure.
 */

const { retrieve } = require("./retrieve.js");

const testCases = [
  {
    query: "eggs",
    expected: [
      "log-009", "log-011", "log-020", "log-026", "log-092", "log-121",
      "log-129", "log-142", "log-161", "log-231", "log-243", "log-245",
    ],
  },
  {
    query: "chicken breast",
    expected: ["log-012", "log-022", "log-058", "log-074", "log-094", "log-234", "log-240"],
  },
  {
    query: "yogurt",
    expected: [
      "log-004", "log-016", "log-044", "log-052", "log-077", "log-078",
      "log-101", "log-104", "log-147", "log-152", "log-175", "log-196",
    ],
  },
  {
    query: "coffee",
    expected: ["log-003", "log-025", "log-048", "log-056", "log-106", "log-145", "log-156"],
  },
  {
    query: "chocolate",
    expected: [
      "log-005", "log-039", "log-057", "log-063", "log-072", "log-113",
      "log-120", "log-127", "log-128", "log-176", "log-181", "log-191",
      "log-198", "log-207", "log-208", "log-210", "log-218", "log-226",
      "log-229", "log-239", "log-027",
    ],
  },
  {
    query: "sausages",
    expected: ["log-010", "log-144", "log-219", "log-244", "log-235"],
  },
  {
    query: "fish",
    expected: [
      "log-017", "log-036", "log-050", "log-061", "log-079", "log-090",
      "log-103", "log-199", "log-209",
    ],
  },
  {
    query: "beef jerky",
    expected: ["log-069", "log-083", "log-116", "log-137", "log-202"],
  },
  {
    query: "burger",
    expected: ["log-140", "log-125", "log-049", "log-193", "log-232"],
  },
  {
    query: "lentils",
    expected: ["log-038", "log-073", "log-117", "log-135", "log-173", "log-184", "log-217"],
  },
  {
    query: "kebab",
    expected: ["log-100", "log-141", "log-174", "log-228"], // only 4 exist — ceiling 4/5
  },
  {
    query: "energy drink",
    expected: ["log-028", "log-071", "log-108", "log-109"], // only 4 exist — ceiling 4/5
  },
  {
    query: "protein shake",
    // Deliberately excludes log-059/log-060 (generic "300 calories and 29
    // grams of protein" placeholder entries) even though Step 3 showed
    // retrieve() ranking them highly — this is the test that quantifies
    // that exact problem.
    expected: [
      "log-001", "log-015", "log-027", "log-070", "log-119", "log-166",
      "log-186", "log-237", "log-239",
    ],
  },
  {
    query: "low calorie breakfast",
    // Same deliberate exclusion — the generic macro-placeholder entries
    // (log-059, log-060, log-147, log-164, log-179) are NOT breakfast
    // foods regardless of their calorie counts.
    expected: [
      "log-020", "log-092", "log-121", "log-129", "log-142", "log-197",
      "log-201", "log-223", "log-106", "log-231", "log-044",
    ],
  },
];

async function main() {
  const perQuery = [];

  for (const { query, expected } of testCases) {
    const results = await retrieve(query, 5);
    const retrievedIds = results.map((r) => r.id);
    const correct = retrievedIds.filter((id) => expected.includes(id));
    const precision = correct.length / 5;
    const ceiling = Math.min(5, expected.length) / 5;

    perQuery.push({ query, precision, ceiling, results, correct, expected });
  }

  console.log("=== Per-query results ===\n");
  for (const q of perQuery) {
    const flag = q.precision < q.ceiling ? "  <-- below ceiling" : "";
    console.log(
      `"${q.query}": precision@5 = ${q.correct.length}/5 = ${q.precision.toFixed(2)}` +
        (q.ceiling < 1 ? ` (ceiling ${q.ceiling.toFixed(2)}, only ${q.expected.length} true positives exist)` : "") +
        flag
    );
    q.results.forEach((r) => {
      const mark = q.expected.includes(r.id) ? "✓" : "✗";
      console.log(`   ${mark} ${r.name}`);
    });
    console.log();
  }

  const mean = perQuery.reduce((sum, q) => sum + q.precision, 0) / perQuery.length;
  const meanCeiling = perQuery.reduce((sum, q) => sum + q.ceiling, 0) / perQuery.length;

  console.log("=== Summary ===");
  console.log(`Mean precision@5 across ${perQuery.length} queries: ${mean.toFixed(3)}`);
  console.log(`Mean achievable ceiling: ${meanCeiling.toFixed(3)}`);
  console.log(`Normalized (mean / ceiling): ${(mean / meanCeiling).toFixed(3)}`);
}

main();
