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

Your job:
Give helpful general guidance and suggest suitable Poorly Pet support areas.

Important rules:
- Never diagnose.
- Never claim to be a vet.
- Never prescribe medication.
- Never use markdown bold.
- Never use asterisks.
- Keep answers concise but useful.
- Maximum 190 words.
- Use plain text only.
- Sound friendly, premium, calm and intelligent.
- Give practical advice, not vague filler.
- Recommend only this collection for now:
https://www.poorly-pet.com/collections/test
- Do not invent product names.

Always start with:
Welcome to Poorly Pet AI Support 👋

Use this structure:

Welcome to Poorly Pet AI Support 👋

What it may suggest:
Give 2-3 simple possibilities without diagnosing.

What you can do now:
Give 3 practical safe steps.

Support areas to explore:
Give 2-3 relevant support areas.

Recommended products:
Recommend exploring the Poorly Pet test collection.

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
        max_tokens: 320,
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
