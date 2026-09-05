/**
 * Step 4 — grounded generation. Takes a food the user is considering, the
 * top-k retrieved candidates from their own log (via retrieve()), and asks
 * Groq to suggest a healthier swap using ONLY those candidates as source
 * material — never the model's own general nutrition knowledge.
 *
 * See rag/README.md (Step 4) for why the specific wording of the system
 * prompt matters, not just its general intent. Short version: instruct-
 * tuned models default to being maximally "helpful," which means blending
 * in outside knowledge and refusing to say "I don't know" unless both are
 * explicitly overridden — a soft instruction like "try to use the context"
 * is not enough to stop that.
 */

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

const SYSTEM_PROMPT = `You are a "healthier swap" assistant for a personal food-tracking app. The user will name a food they're considering eating. You are given a CONTEXT list of foods pulled from that user's own food log, with real calorie and macro data.

Suggest a healthier alternative to the user's food, chosen ONLY from the items in CONTEXT below.

Hard rules:
- You must select your suggestion, and every calorie/macro number in your answer, EXCLUSIVELY from the CONTEXT list. Do not use any food, brand, or nutrition fact from your own general knowledge, even if you are confident it is correct — CONTEXT is the only source of truth here.
- If none of the items in CONTEXT are actually a healthier option for what was asked, say so directly instead of forcing a recommendation from a bad match.
- Justify your suggestion by citing specific numbers from CONTEXT (e.g. "X has 200 fewer calories and 10g more protein than [original food]").
- You were NOT given verified calorie/macro data for the food the user is replacing — only its name. Do not state, estimate, or characterize ITS (the replaced food's) nutrition profile in any way — numerically, qualitatively, or even loosely/comparatively (e.g. do not say it is "typically high in carbs," "usually has more fat," "far fewer than a typical X," or "lighter than most X-based meals"), even if you're confident that's generally true. This restriction applies ONLY to the food being replaced. You SHOULD still compare your suggestion's numbers against other items in CONTEXT when that's informative (e.g. "140 kcal vs the 284 kcal in the Banana Pancakes also in your log") — both sides of that kind of comparison are real, verified data, and comparisons like that are encouraged, not restricted.

Respond in plain text only — no markdown (no **, no tables, no headings). Keep it short: 2-4 sentences, suitable for display on a small mobile screen.`;

function renderContext(items) {
  return items
    .map(
      (item) =>
        `- ${item.name}: ${Math.round(item.calories)} kcal, ${item.protein_g}g protein, ${item.carbs_g}g carbs, ${item.fat_g}g fat`
    )
    .join("\n");
}

/**
 * @param {string} originalFood - the food the user is considering eating
 * @param {Array} retrievedItems - top-k results from retrieve()
 * @returns {Promise<string>} the model's grounded answer
 */
async function generateSwap(originalFood, retrievedItems) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("Set GROQ_API_KEY before calling generateSwap().");
  }

  const userMessage = `The food I'm considering: ${originalFood}\n\nCONTEXT:\n${renderContext(retrievedItems)}`;

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.2,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Generation request failed (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("No response from generation model.");
  }

  return content.trim();
}

module.exports = { generateSwap, SYSTEM_PROMPT };
