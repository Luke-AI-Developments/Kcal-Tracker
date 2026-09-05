/**
 * One-off cleanup — removes generic macro-only log entries that have no
 * identifiable food name (e.g. "300 calories and 29 grams of protein").
 * These were quantified in Step 5's eval as the direct cause of the worst
 * two precision scores ("protein shake" 0.60, "low calorie breakfast"
 * 0.40) — they act as a magnet for any protein/calorie-flavored query
 * regardless of what the query is actually about.
 *
 * IDs were chosen by manual review of the full corpus, not a regex, to
 * avoid catching legitimate entries that happen to mention macros in a
 * real food name (e.g. "Yogurt with 25g of protein and 150 calories" is
 * kept — it names an actual food).
 *
 * Fixes both the source file and the already-embedded file directly,
 * rather than re-running generate-embeddings.js — removing entries
 * doesn't invalidate the embeddings of the ones that remain, so this
 * avoids spending more Gemini quota.
 */

const fs = require("fs");
const path = require("path");

const PLACEHOLDER_IDS = new Set(["log-059", "log-060", "log-164", "log-179"]);

for (const file of ["recipes-personal-log-cleaned.json", "recipes-embedded.json"]) {
  const filePath = path.join(__dirname, file);
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

  const removed = data.filter((e) => PLACEHOLDER_IDS.has(e.id));
  const kept = data.filter((e) => !PLACEHOLDER_IDS.has(e.id));

  fs.writeFileSync(filePath, JSON.stringify(kept, null, 2));
  console.log(`${file}: ${data.length} -> ${kept.length} entries`);
  removed.forEach((e) => console.log(`  removed ${e.id}: "${e.name}"`));
}
