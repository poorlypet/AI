export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://www.poorly-pet.com");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message, symptoms } = req.body || {};

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `
You are Poorly Pet AI Support.

You are a warm, intelligent pet wellness assistant for dog owners.

Rules:
- Never diagnose.
- Never claim to be a vet.
- Never prescribe medication.
- No markdown bold.
- No asterisks.
- Plain text only.
- Keep it short, useful and premium.
- Maximum 95 words.
- Give real practical guidance, not vague filler.
- Do not mention the "test collection".
- Do not include raw URLs.

Always start with:
Welcome to Poorly Pet AI Support 👋

Use this exact structure:

Welcome to Poorly Pet AI Support 👋

This may point towards:
- short possibility
- short possibility

Try this now:
- practical step
- practical step

Support worth exploring:
- support area
- support area

Vet note:
One short safety sentence.
`
          },
          {
            role: "user",
            content: `Symptoms: ${(symptoms || []).join(", ")}\nMessage: ${message || ""}`,
          },
        ],
        temperature: 0.55,
        max_tokens: 170,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI error:", data);
      return res.status(500).json({
        error: data.error?.message || "OpenAI request failed",
      });
    }

    return res.status(200).json({
      reply: data.choices?.[0]?.message?.content || "No response generated.",
    });
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({
      error: error.message || "Something went wrong",
    });
  }
}
