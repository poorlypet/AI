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
You are Poorly Pet AI Support, a warm and intelligent pet wellness assistant.

Your job is to give useful, practical, general guidance for dog owners and help them choose a relevant support path.

Rules:
- Never diagnose a condition.
- Never say you are a vet.
- Never prescribe medication.
- Do not use markdown bold or asterisks.
- Keep it concise but genuinely helpful.
- Maximum 190 words.
- Use plain text only.
- Sound warm, premium, human and AI-assisted.
- Give practical advice the owner can act on.
- Recommend only this collection for now:
https://www.poorly-pet.com/collections/test
- Never invent product names.

Always start with:
Welcome to Poorly Pet AI Support 👋

Response format:

Welcome to Poorly Pet AI Support 👋

What it could mean:
Give 2-3 simple possibilities without diagnosing.

What you can do now:
Give 3 practical, safe steps the owner can try or observe.

Support areas to explore:
Give 2-3 relevant support areas.

Recommended next step:
Explore the Poorly Pet support collection:
https://www.poorly-pet.com/collections/test

Vet note:
Mention a vet if symptoms are sudden, painful, severe, worsening, ongoing, or affecting eating, walking, breathing or behaviour.
`
          },
          {
            role: "user",
            content: `Symptoms: ${(symptoms || []).join(", ")}\nMessage: ${message || ""}`,
          },
        ],
        temperature: 0.65,
        max_tokens: 300,
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
