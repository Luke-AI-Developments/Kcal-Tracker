const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = process.env.GROQ_MODEL || "llama-3.1-8b-instant";

const SYSTEM_PROMPT = `You are a nutrition estimation assistant. Given a plain-English description of a food or meal (which may include quantity), estimate its total calories, protein, carbs, and fat.

Respond with ONLY a JSON object in this exact shape, with numbers (not strings):
{"calories": number, "protein_g": number, "carbs_g": number, "fat_g": number}

Use reasonable real-world nutrition estimates. If a quantity isn't specified, assume a typical single serving. Do not include any explanation, only the JSON object.`;

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
