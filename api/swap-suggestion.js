const { retrieve } = require("../rag/retrieve.js");
const { generateSwap } = require("../rag/generate.js");

module.exports = async (req, res) => {
  const food = (req.query?.food || "").toString().trim();

  if (!food) {
    res.status(400).json({ error: "Missing 'food' query parameter." });
    return;
  }

  if (!process.env.GEMINI_API_KEY) {
    res.status(500).json({ error: "Server is missing GEMINI_API_KEY." });
    return;
  }
  if (!process.env.GROQ_API_KEY) {
    res.status(500).json({ error: "Server is missing GROQ_API_KEY." });
    return;
  }

  try {
    const results = await retrieve(food, 5);
    const answer = await generateSwap(food, results);
    res.status(200).json({ answer });
  } catch (err) {
    console.error("Swap suggestion error:", err);
    res.status(502).json({ error: "Couldn't generate a suggestion. Try again." });
  }
};
