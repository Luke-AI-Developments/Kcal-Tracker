const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

const SYSTEM_PROMPT = `You are a nutrition estimation assistant. Given a plain-English description of a food or meal, estimate its TOTAL calories, protein, carbs, and fat — scaled to the exact quantity described, not a default single serving.

Follow these steps:
1. Identify the food item(s) and any quantity, weight, volume, or size word mentioned (e.g. "2 slices", "200g", "a large bowl").
2. Estimate the nutrition for ONE standard reference unit of that food (e.g. one slice, 100g).
3. Scale that reference linearly to the exact quantity described. For weights, scale from a 100g reference rather than defaulting to a typical serving size.
4. Only assume a single typical serving if no quantity, weight, or size is mentioned at all.

Worked examples:
- "2 slices of pizza": one slice of pepperoni pizza is roughly 285 kcal, 12g protein, 36g carbs, 10g fat. Two slices scales all four numbers by 2x: ~570 kcal, ~24g protein, ~66g carbs, ~20g fat.
- "200g chicken breast": grilled chicken breast is roughly 165 kcal, 31g protein, 0g carbs, 3.6g fat per 100g. 200g is 2x that reference: ~330 kcal, ~62g protein, 0g carbs, ~7g fat.

Respond with ONLY a JSON object in this exact shape, with numbers (not strings), representing the TOTAL for the full quantity described:
{"calories": number, "protein_g": number, "carbs_g": number, "fat_g": number}

Use reasonable real-world nutrition estimates. Do not include any explanation, only the JSON object.`;

module.exports = async (req, res) => {
  const food = (req.query?.food || "").toString().trim();

  if (!food) {
    res.status(400).json({ error: "Missing 'food' query parameter." });
    return;
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "Server is missing GROQ_API_KEY." });
    return;
  }

  try {
    const groqRes = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: food },
        ],
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error("Groq API error:", groqRes.status, errText);
      res.status(502).json({ error: "Nutrition lookup service failed." });
      return;
    }

    const data = await groqRes.json();
    const content = data?.choices?.[0]?.message?.content;

    if (!content) {
      res.status(502).json({ error: "No response from nutrition lookup." });
      return;
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      res.status(502).json({ error: "Could not parse nutrition data." });
      return;
    }

    const result = {
      calories: Number(parsed.calories) || 0,
      protein_g: Number(parsed.protein_g) || 0,
      carbs_g: Number(parsed.carbs_g) || 0,
      fat_g: Number(parsed.fat_g) || 0,
    };

    res.status(200).json(result);
  } catch (err) {
    console.error("Lookup handler error:", err);
    res.status(500).json({ error: "Unexpected server error." });
  }
};
