const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const VISION_MODEL = process.env.GROQ_VISION_MODEL || "meta-llama/llama-4-scout-17b-16e-instruct";

const SYSTEM_PROMPT = `You are a nutrition estimation assistant. You are shown a photo of packaged food (label, packaging, or the food itself) and told the quantity being eaten. Identify the product from the image, then estimate its TOTAL calories, protein, carbs, and fat scaled to EXACTLY the quantity described — not a default serving.

If the image shows a nutrition facts label, read the per-serving or per-100g values directly off the label and scale them to the quantity given. If no label is visible, estimate from your knowledge of the product and standard packaging sizes.

Respond with ONLY a JSON object in this exact shape, with numbers (not strings) except "description":
{"description": string, "calories": number, "protein_g": number, "carbs_g": number, "fat_g": number}

"description" should be a short human-readable name for what you identified, including the quantity, e.g. "Nutella (30g)". Do not include any explanation beyond the JSON object.`;

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  const body = req.body || {};
  const image = (body.image || "").toString();
  const quantity = (body.quantity || "").toString().trim();

  if (!image.startsWith("data:image/")) {
    res.status(400).json({ error: "Missing or invalid 'image'." });
    return;
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "Server is missing GROQ_API_KEY." });
    return;
  }

  const quantityText = quantity || "one typical serving";

  try {
    const groqRes = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: VISION_MODEL,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: `Quantity: ${quantityText}` },
              { type: "image_url", image_url: { url: image } },
            ],
          },
        ],
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error("Groq vision API error:", groqRes.status, errText);
      res.status(502).json({ error: "Vision lookup service failed." });
      return;
    }

    const data = await groqRes.json();
    const content = data?.choices?.[0]?.message?.content;

    if (!content) {
      res.status(502).json({ error: "No response from vision lookup." });
      return;
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      res.status(502).json({ error: "Could not parse vision lookup result." });
      return;
    }

    res.status(200).json({
      description: (parsed.description || "Food from photo").toString(),
      calories: Number(parsed.calories) || 0,
      protein_g: Number(parsed.protein_g) || 0,
      carbs_g: Number(parsed.carbs_g) || 0,
      fat_g: Number(parsed.fat_g) || 0,
    });
  } catch (err) {
    console.error("Vision lookup handler error:", err);
    res.status(500).json({ error: "Unexpected server error." });
  }
};
